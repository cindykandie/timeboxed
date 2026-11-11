import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { appendFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { prepareHierarchyDump } from './hierarchy.ts';
export const serial = process.env.ANDROID_SERIAL ?? 'emulator-5554';
export const appId = 'com.timeboxed.app';
export const adb = (...args: string[]) => execFileSync('adb', ['-s', serial, ...args], { encoding: 'utf8', timeout: 30_000 });
export function keys(...names: string[]) {
  if (process.env.TV_KEY_TRACE) appendFileSync(process.env.TV_KEY_TRACE, JSON.stringify(names) + '\n');
  adb('shell', 'input', 'keyevent', ...names.map((name) => `KEYCODE_${name}`));
}
export function snapshot() {
  const raw = adb('shell', 'uiautomator', 'runtest', 'timeboxed-hierarchy.jar', '-c', 'TimeBoxedHierarchyDump', '-s');
  if (!raw.includes('OK (1 test)')) {
    if (raw.includes('No accessibility root yet')) return [];
    throw new Error(`Native hierarchy helper failed: ${raw.slice(-1800)}`);
  }
  const decode = (s: string) => s.replaceAll('&amp;', '&').replaceAll('&quot;', '"').replaceAll('&apos;', "'").replaceAll('&lt;', '<').replaceAll('&gt;', '>');
  return [...raw.matchAll(/<node\b[^>]*>/g)].map(([node]) => Object.fromEntries([...node.matchAll(/([\w-]+)="([^"]*)"/g)].map(([, k, v]) => [k, decode(v)])));
}
export type Nodes = ReturnType<typeof snapshot>;
export const byId = (nodes: Nodes, id: string) => nodes.find((node) => node['resource-id'] === id);
export const focused = (nodes: Nodes) => nodes.find((node) => node.focused === 'true');
export function expectFocus(title: string) {
  let nodes = snapshot();
  if (!focused(nodes)) nodes = snapshot();
  assert.equal(focused(nodes)?.['content-desc'], title, `Expected ${title}; native nodes: ${nodes.length}`);
  return nodes;
}
export function assertRail(nodes: Nodes) {
  assert.equal(nodes.filter((n) => n['resource-id'].startsWith('navigation-button-')).length, 6);
  assert.ok(nodes.filter((n) => n['resource-id'].startsWith('navigation-label-')).length <= 1);
}
export function focusRail(title: string) {
  const titles = ['Timer', 'Clock', 'Calculator', 'Countdown', 'World Clocks', 'Home'];
  let nodes = snapshot();
  for (let attempt = 0; attempt < 8 && !focused(nodes)?.['resource-id'].startsWith('navigation-button-'); attempt++) {
    keys(focused(nodes)?.['resource-id'] === 'settings-button' ? 'DPAD_UP' : 'DPAD_RIGHT'); nodes = snapshot();
  }
  const from = titles.indexOf(focused(nodes)?.['content-desc'] ?? ''); const to = titles.indexOf(title);
  assert.ok(from >= 0 && to >= 0, 'D-pad must reach the shared rail');
  if (from !== to) keys(...Array<string>(Math.abs(from - to)).fill(from > to ? 'DPAD_UP' : 'DPAD_DOWN'));
  else keys(from === 0 ? 'DPAD_DOWN' : 'DPAD_UP', from === 0 ? 'DPAD_UP' : 'DPAD_DOWN');
  nodes = expectFocus(title); assertRail(nodes);
  assert.equal(nodes.filter((node) => node['resource-id'].startsWith('navigation-label-')).length, 1);
  return nodes;
}
export async function launchUtility(index: number, screenId: string) {
  prepareHierarchyDump((local, remote) => adb('push', local, remote));
  adb('reverse', 'tcp:8081', 'tcp:8081');
  adb('shell', 'am', 'force-stop', appId);
  adb('shell', 'am', 'start', '-a', 'android.intent.action.MAIN', '-c', 'android.intent.category.LEANBACK_LAUNCHER', '-n', `${appId}/.MainActivity`);
  for (let attempt = 0; attempt < 10; attempt++) { if (byId(snapshot(), 'dashboard-clock')) break; await delay(1000); }
  keys(...Array(index).fill('DPAD_DOWN'), 'DPAD_CENTER');
  for (let attempt = 0; attempt < 5; attempt++) { const nodes = snapshot(); if (byId(nodes, screenId)) { assertRail(nodes); return nodes; } await delay(1000); }
  throw new Error(`Utility ${screenId} did not open`);
}
export function screenshot(name: string) {
  const directory = join(process.cwd(), process.env.TV_SCREENSHOT_DIR ?? 'artifacts/utilities'); mkdirSync(directory, { recursive: true });
  writeFileSync(join(directory, `${name}.png`), execFileSync('adb', ['-s', serial, 'exec-out', 'screencap', '-p']));
}
export function focusControl(title: string) {
  const rect = (node: Nodes[number]) => node.bounds.match(/\d+/g)!.map(Number);
  for (let attempt = 0; attempt < 16; attempt++) {
    const nodes = snapshot(); const current = focused(nodes);
    if (current?.['content-desc'] === title) return nodes;
    const target = nodes.find((n) => n['content-desc'] === title && n.focusable === 'true');
    if (current?.['resource-id'].startsWith('navigation-button-')) { keys('DPAD_LEFT'); continue; }
    if (!target || !current) { keys('DPAD_DOWN'); continue; }
    const a = rect(current); const b = rect(target);
    const dx = b[0] + b[2] - a[0] - a[2]; const dy = b[1] + b[3] - a[1] - a[3];
    keys(Math.abs(dy) > (b[3] - b[1]) * 1.2 ? (dy > 0 ? 'DPAD_DOWN' : 'DPAD_UP') : dx > 0 ? 'DPAD_RIGHT' : 'DPAD_LEFT');
  }
  throw new Error(`Cannot reach ${title} using D-pad`);
}
