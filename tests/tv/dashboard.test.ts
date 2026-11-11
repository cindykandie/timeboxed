import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { test } from 'node:test';

import { prepareHierarchyDump } from './hierarchy.ts';

const serial = process.env.ANDROID_SERIAL ?? 'emulator-5554';
const appId = 'com.timeboxed.app';
const items = ['Timer', 'Clock', 'Calculator', 'Countdown', 'World Clocks', 'Home'];
const ids = ['timer', 'clock', 'calculator', 'countdown', 'worldClocks', 'home'];
const adb = (...args: string[]) => execFileSync('adb', ['-s', serial, ...args], { encoding: 'utf8', timeout: 30_000 });
const key = (name: string) => adb('shell', 'input', 'keyevent', `KEYCODE_${name}`);
const decode = (value: string) => value.replaceAll('&amp;', '&').replaceAll('&quot;', '"')
  .replaceAll('&apos;', "'").replaceAll('&lt;', '<').replaceAll('&gt;', '>');
function snapshot(hover?: { x: number; y: number }) {
  const args = ['shell', 'uiautomator', 'runtest', 'timeboxed-hierarchy.jar', '-c', 'TimeBoxedHierarchyDump', '-s'];
  if (hover) args.push('-e', 'hoverX', String(hover.x), '-e', 'hoverY', String(hover.y));
  const result = adb(...args);
  if (!result.includes('OK (1 test)')) {
    if (result.includes('No accessibility root yet')) return [];
    throw new Error(`Native hierarchy helper failed: ${result.slice(-1800)}`);
  }
  return [...result.matchAll(/<node\b[^>]*>/g)].map(([node]) =>
    Object.fromEntries([...node.matchAll(/([\w-]+)="([^"]*)"/g)].map(([, name, value]) => [name, decode(value)])));
}
type Nodes = ReturnType<typeof snapshot>;
const byId = (nodes: Nodes, id: string) => nodes.find((node) => node['resource-id'] === id);
const focused = (nodes: Nodes) => nodes.find((node) => node.focused === 'true');
const focusTitle = (nodes: Nodes) => focused(nodes)?.['content-desc'];
const hasText = (nodes: Nodes, text: string) => nodes.some((node) => node.text === text);
const clockTime = (nodes: Nodes) => byId(nodes, 'clock-time')?.['content-desc'] ?? '';
function screenshot(name: string) {
  const directory = join(process.cwd(), process.env.TV_SCREENSHOT_DIR ?? 'artifacts/adaptive-rail');
  mkdirSync(directory, { recursive: true });
  writeFileSync(join(directory, `${name}.png`), execFileSync('adb', ['-s', serial, 'exec-out', 'screencap', '-p']));
}
function rectangle(node: Nodes[number] | undefined) {
  const values = node?.bounds.match(/\d+/g)?.map(Number);
  assert.ok(values?.length === 4, 'node must have native bounds');
  return { left: values[0], top: values[1], right: values[2], bottom: values[3] };
}
const bounds = (nodes: Nodes, id: string) => rectangle(byId(nodes, id));
function expectFocus(title: string) {
  let nodes = snapshot();
  // Android can briefly return no accessibility root during a screen transition.
  // Retry the read without sending input; a wrong focus target still fails.
  if (!focused(nodes)) nodes = snapshot();
  assert.equal(focusTitle(nodes), title, `Expected ${title}; native nodes: ${nodes.length}`);
  return nodes;
}
let railGeometry: ReturnType<typeof rectangle>[];
function expectRail(nodes: Nodes, label?: string | null) {
  const buttons = nodes.filter((node) => node['resource-id'].startsWith('navigation-button-'));
  assert.equal(buttons.length, 6, 'all six navigation buttons must remain visible');
  assert.deepEqual(buttons.map((node) => node['content-desc']), items);
  assert.ok(buttons.every((node) => node.focusable === 'true' && node.enabled === 'true'));
  const geometry = ids.map((id) => bounds(nodes, `navigation-button-${id}`));
  railGeometry ??= geometry;
  assert.deepEqual(geometry, railGeometry, 'rail position/hit targets must be identical across states and screens');
  geometry.forEach((button, index) => {
    assert.ok(button.left > 1600 && button.right < 1920 - 48 && button.top >= 48 && button.bottom < 1080 - 48);
    if (index) assert.ok(button.top > geometry[index - 1].bottom);
    const icon = bounds(nodes, `utility-icon-${ids[index]}`);
    assert.ok(icon.right > icon.left && icon.bottom > icon.top, 'every icon has visible native bounds');
    assert.ok(icon.left >= button.left && icon.right <= button.right);
  });
  const labels = nodes.filter((node) => node['resource-id'].startsWith('navigation-label-'));
  assert.ok(labels.length <= 1, 'at most one navigation label can be visible');
  if (label === null) assert.equal(labels.length, 0);
  else if (label) {
    assert.equal(labels.length, 1);
    assert.equal(labels[0].text, label);
    assert.equal(focusTitle(nodes), label, 'only the native focused navigation item may have a label');
    assert.ok(rectangle(labels[0]).right < geometry[0].left);
  }
  const content = byId(nodes, 'utility-content') ?? byId(nodes, 'ambient-clock');
  if (content) assert.ok(rectangle(content).right < bounds(nodes, 'navigation-rail').left,
    'utility controls must not overlap even the expanded label area');
  return nodes;
}
function focusRail(title: string) {
  let nodes = snapshot();
  for (let attempt = 0; attempt < 8 && !items.includes(focusTitle(nodes) ?? ''); attempt++) {
    key(focused(nodes)?.['resource-id'] === 'settings-button' ? 'DPAD_UP' : 'DPAD_RIGHT'); nodes = snapshot();
  }
  const from = items.indexOf(focusTitle(nodes) ?? '');
  const to = items.indexOf(title);
  assert.ok(from >= 0 && to >= 0, 'D-pad Right must reach the rail from main content');
  if (from !== to) adb('shell', 'input', 'keyevent', ...Array(Math.abs(from - to)).fill(`KEYCODE_DPAD_${from > to ? 'UP' : 'DOWN'}`));
  else {
    // Use two existing rail neighbours to wake the item. Android may leave the
    // rail for preferred content when Right has no candidate on a utility page.
    key(from === 0 ? 'DPAD_DOWN' : 'DPAD_UP');
    key(from === 0 ? 'DPAD_UP' : 'DPAD_DOWN');
  }
  nodes = expectFocus(title);
  expectRail(nodes, title);
  return nodes;
}
function focusControl(title: string) {
  for (let attempt = 0; attempt < 12; attempt++) {
    const nodes = snapshot();
    if (focusTitle(nodes) === title) return nodes;
    if (items.includes(focusTitle(nodes) ?? '')) { key('DPAD_LEFT'); continue; }
    const target = nodes.find((node) => node['content-desc'] === title && node.focusable === 'true');
    if (!target) { key('DPAD_DOWN'); continue; }
    const from = rectangle(focused(nodes)); const to = rectangle(target);
    const dx = (to.left + to.right - from.left - from.right) / 2;
    const dy = (to.top + to.bottom - from.top - from.bottom) / 2;
    key(Math.abs(dy) > (to.bottom - to.top) * 0.6 ? (dy > 0 ? 'DPAD_DOWN' : 'DPAD_UP')
      : dx > 0 ? 'DPAD_RIGHT' : 'DPAD_LEFT');
  }
  throw new Error(`D-pad could not reach main control ${title}`);
}
function home(expected: string) {
  focusRail('Home'); key('DPAD_CENTER');
  const nodes = expectFocus(expected);
  assert.ok(byId(nodes, 'dashboard-clock'));
  return expectRail(nodes, expected);
}
function remaining(nodes: Nodes) {
  const label = nodes.find((node) => /^(?:\d{2}:)?\d{2}:\d{2} remaining$/.test(node['content-desc']))?.['content-desc'];
  assert.ok(label);
  return label.split(' ')[0].split(':').map(Number).reduce((total, part) => total * 60 + part, 0);
}
async function launch() {
  adb('reverse', 'tcp:8081', 'tcp:8081'); key('WAKEUP');
  adb('shell', 'am', 'force-stop', appId);
  adb('shell', 'am', 'start', '-a', 'android.intent.action.MAIN', '-c',
    'android.intent.category.LEANBACK_LAUNCHER', '-n', `${appId}/.MainActivity`);
  for (let attempt = 0; attempt < 10; attempt++) {
    const nodes = snapshot();
    if (byId(nodes, 'navigation-rail')) return nodes;
    await delay(1000);
  }
  throw new Error('Dashboard did not launch');
}
function checkDeviceClock(nodes: Nodes, id = 'clock-time') {
  const label = byId(nodes, id)?.['content-desc'] ?? '';
  assert.match(label, /^Local time \d{1,2}:\d{2}:\d{2}(\s[AP]M)?$/);
  const zone = adb('shell', 'getprop', 'persist.sys.timezone').trim();
  const epoch = Number(adb('shell', 'date', '+%s').trim()) * 1000;
  const formatter = new Intl.DateTimeFormat('en-US', { timeZone: zone, hour: '2-digit', minute: '2-digit', second: '2-digit',
    hourCycle: /[AP]M$/.test(label) ? 'h12' : 'h23' });
  const normalize = (value: string) => value.replace(/^Local time /, '').replace(/\s+/g, ' ').replace(/^0(?=\d:)/, '');
  const expected = Array.from({ length: 10 }, (_, index) => normalize(formatter.format(epoch - index * 1000)));
  assert.ok(expected.includes(normalize(label)), 'display must follow current device wall time');
  return { zone, epoch };
}

test('shared adaptive rail and existing Timer/Clock regressions on Android TV', { timeout: 900_000 }, async (t) => {
  prepareHierarchyDump((local, remote) => adb('push', local, remote));
  let nodes = await launch();
  let originalFormat = '24h';

  await t.test('dashboard fills 1080p with local image, one bottom-left clock and six transparent navigation icons', () => {
    key('DPAD_UP'); nodes = expectFocus('Timer');
    expectRail(nodes, 'Timer');
    assert.deepEqual(bounds(nodes, 'dashboard-artwork'), { left: 0, top: 0, right: 1920, bottom: 1080 });
    assert.ok(!hasText(nodes, 'TimeBoxed') && !hasText(nodes, 'Make every minute count.'));
    for (const text of ['Your everyday tools', 'Available', 'Coming soon']) assert.ok(!hasText(nodes, text));
    const clock = bounds(nodes, 'dashboard-clock-block');
    assert.ok(clock.left >= 48 && clock.top > 700 && clock.bottom < 1080 - 32);
    assert.ok(clock.right < bounds(nodes, 'navigation-rail').left);
    assert.ok(byId(nodes, 'dashboard-date')?.text);
    checkDeviceClock(nodes, 'dashboard-clock');
    screenshot('dashboard-focused');
  });

  await t.test('Up/Down transfers exactly one label through all six items without shifting the rail', () => {
    for (const title of items.slice(1)) {
      key('DPAD_DOWN'); expectRail(expectFocus(title), title);
    }
    focusRail('Timer');
    adb('shell', 'input', 'keyevent', 'KEYCODE_DPAD_DOWN', 'KEYCODE_DPAD_DOWN', 'KEYCODE_DPAD_UP', 'KEYCODE_DPAD_UP');
    expectRail(expectFocus('Timer'), 'Timer');
  });

  await t.test('pointer focus transfers the single label instead of revealing a second hovered label', () => {
    snapshot({ x: 960, y: 700 });
    const clock = bounds(focusRail('Timer'), 'navigation-button-clock');
    nodes = snapshot({ x: (clock.left + clock.right) / 2, y: (clock.top + clock.bottom) / 2 });
    // A newly attached emulator automation bridge can miss its first hover.
    // Retry real mouse leave/enter once; never substitute a D-pad focus change.
    if (focusTitle(nodes) !== 'Clock') {
      snapshot({ x: 960, y: 700 });
      nodes = snapshot({ x: (clock.left + clock.right) / 2, y: (clock.top + clock.bottom) / 2 });
    }
    expectRail(nodes, 'Clock');
    snapshot({ x: 960, y: 700 });
    key('DPAD_UP'); expectRail(expectFocus('Timer'), 'Timer');
  });

  await t.test('10-second inactivity hides every label, shrinks icons and keeps all six focusable; boundary input wakes focus', async () => {
    const large = bounds(focusRail('Timer'), 'utility-icon-timer');
    await delay(10_400);
    nodes = expectFocus('Timer'); expectRail(nodes, null);
    const small = bounds(nodes, 'utility-icon-timer');
    assert.ok(small.right - small.left < large.right - large.left);
    assert.ok(small.right - small.left >= 48, 'idle icon must remain recognizable');
    assert.ok(byId(nodes, 'navigation-compact'));
    checkDeviceClock(nodes, 'dashboard-clock');
    screenshot('dashboard-compact');
    key('DPAD_UP'); expectRail(expectFocus('Timer'), 'Timer');
    screenshot('dashboard-focused');
  });

  await t.test('Calculator, Countdown and World Clocks have the same rail and predictable Back', () => {
    for (const title of ['Calculator', 'Countdown', 'World Clocks']) {
      focusRail(title); key('DPAD_CENTER');
      nodes = expectFocus(title === 'Calculator' ? '5' : title === 'Countdown' ? 'New countdown' : 'Add city');
      expectRail(nodes, null);
      if (title !== 'Calculator') assert.ok(hasText(nodes, title));
      else assert.ok(!hasText(nodes, 'Calculator'));
      if (title === 'Calculator') assert.ok(byId(nodes, 'calculator-result'));
      if (title === 'Countdown') assert.ok(byId(nodes, 'countdown-list'));
      else if (title === 'World Clocks') assert.ok(byId(nodes, 'world-clocks'));
      assert.ok(!byId(nodes, 'dashboard-clock'));
      key('BACK'); nodes = expectFocus(title); expectRail(nodes, title);
      assert.ok(byId(nodes, 'dashboard-clock'));
    }
    focusRail('Home'); key('DPAD_CENTER'); expectRail(expectFocus('Home'), 'Home');
  });

  await t.test('Timer retains three shortcuts plus Custom and compact/focused rail states without overlap', async () => {
    focusRail('Timer'); key('DPAD_CENTER');
    nodes = expectFocus('Start'); expectRail(nodes, null);
    for (const minutes of [10, 15, 45]) assert.ok(hasText(nodes, `${minutes} min`));
    assert.ok(hasText(nodes, 'Custom')); assert.equal(remaining(nodes), 10 * 60);
    for (const minutes of [10, 15, 45, 10]) {
      focusControl(`${minutes} minutes`); key('DPAD_CENTER'); nodes = expectFocus(`${minutes} minutes`);
      assert.equal(remaining(nodes), minutes * 60);
      assert.equal(nodes.find((node) => node['content-desc'] === `${minutes} minutes`)?.selected, 'true');
    }
    focusControl('Start');
    await delay(10_400); expectRail(snapshot(), null); screenshot('timer-compact');
    focusRail('Timer'); screenshot('timer-focused');
    key('DPAD_LEFT');
    assert.ok(!items.includes(focusTitle(snapshot()) ?? ''), 'Left must leave rail for the main controls');
    focusControl('Start');
  });

  await t.test('Home preserves a running Timer; reopening reconciles its deadline', async () => {
    key('DPAD_CENTER'); nodes = expectFocus('Pause');
    const before = remaining(nodes);
    home('Timer'); await delay(1100);
    key('DPAD_CENTER'); nodes = expectFocus('Pause');
    assert.ok(remaining(nodes) < before && remaining(nodes) > before - 90);
    assert.ok(!hasText(nodes, 'TIME TO FOCUS') && !hasText(nodes, 'MAKE ROOM FOR A MOMENT'));
  });

  await t.test('Back preserves a paused Timer; Resume/Reset controls remain reachable', () => {
    key('DPAD_CENTER'); nodes = expectFocus('Resume');
    const before = remaining(nodes);
    key('BACK'); expectRail(expectFocus('Timer'), 'Timer');
    key('DPAD_CENTER'); nodes = expectFocus('Resume'); assert.equal(remaining(nodes), before);
    assert.ok(hasText(nodes, 'Paused'));
    focusControl('Reset'); key('DPAD_CENTER'); assert.equal(remaining(snapshot()), 10 * 60);
  });

  await t.test('Clock retains local time/date/timezone and has non-overlapping compact/focused rail states', async () => {
    // Clock scenarios have their own launcher baseline. Timer-to-Clock state
    // preservation is exercised independently by the cross-utility regression.
    nodes = await launch();
    assert.ok(byId(nodes, 'dashboard-clock'));
    focusRail('Clock'); key('DPAD_CENTER');
    nodes = expectFocus('Enter ambient mode'); expectRail(nodes, null);
    originalFormat = nodes.find((node) => node['content-desc'] === '12-hour')?.selected === 'true' ? '12h' : '24h';
    const { zone, epoch } = checkDeviceClock(nodes);
    const locale = adb('shell', 'getprop', 'persist.sys.locale').trim() || 'en-US';
    assert.equal(byId(nodes, 'clock-timezone')?.text, zone);
    assert.ok(!hasText(nodes, 'Clock') && !hasText(nodes, 'Your format is saved on this TV. Home or Back returns to the dashboard.'));
    assert.ok(hasText(nodes, '12h') && hasText(nodes, '24h'));
    assert.equal(byId(nodes, 'clock-weekday')?.text, new Intl.DateTimeFormat(locale, { timeZone: zone, weekday: 'long' }).format(epoch));
    assert.equal(byId(nodes, 'clock-date')?.text, new Intl.DateTimeFormat(locale, { timeZone: zone, month: 'long', day: 'numeric', year: 'numeric' }).format(epoch));
    const before = clockTime(nodes);
    await delay(10_400); nodes = snapshot(); expectRail(nodes, null);
    assert.notEqual(clockTime(nodes), before); screenshot('clock-compact');
    focusRail('Clock'); screenshot('clock-focused');
    key('DPAD_LEFT'); assert.ok(!items.includes(focusTitle(snapshot()) ?? ''));
    key('BACK'); expectFocus('Clock'); key('DPAD_CENTER'); expectFocus('Enter ambient mode');
  });

  await t.test('remote 12/24-hour settings still select, format and save the chosen value', () => {
    key('DPAD_LEFT'); expectFocus('24-hour'); key('DPAD_LEFT'); expectFocus('12-hour'); key('DPAD_CENTER');
    nodes = expectFocus('12-hour'); assert.match(clockTime(nodes), /\s[AP]M$/);
    assert.equal(nodes.find((node) => node['content-desc'] === '12-hour')?.selected, 'true');
    key('DPAD_RIGHT'); key('DPAD_CENTER'); nodes = expectFocus('24-hour');
    assert.match(clockTime(nodes), /^Local time \d{2}:\d{2}:\d{2}$/);
  });

  await t.test('ambient keeps the complete rail visible, updates time, and Select restores Clock content focus', async () => {
    key('DPAD_RIGHT'); key('DPAD_CENTER'); nodes = expectFocus('Exit ambient mode'); expectRail(nodes, null);
    assert.ok(!byId(nodes, 'clock-controls') && !hasText(nodes, '12h') && !hasText(nodes, '24h'));
    const before = clockTime(nodes); await delay(1100); assert.notEqual(clockTime(snapshot()), before);
    screenshot('ambient-compact');
    focusRail('Home'); screenshot('ambient-focused'); key('DPAD_LEFT'); expectFocus('Exit ambient mode');
    key('DPAD_CENTER'); expectFocus('Enter ambient mode');
  });

  await t.test('Home and Back from ambient/Clock return to dashboard with Clock focus restored', () => {
    key('DPAD_CENTER'); expectFocus('Exit ambient mode'); home('Clock');
    key('DPAD_CENTER'); expectFocus('Enter ambient mode'); key('DPAD_CENTER'); expectFocus('Exit ambient mode');
    key('BACK'); expectFocus('Clock');
    key('DPAD_CENTER'); expectFocus('Enter ambient mode'); home('Clock');
    key('DPAD_CENTER'); expectFocus('Enter ambient mode');
  });

  await t.test('foreground recovery refreshes device time and the rail remains usable', async () => {
    key('DPAD_CENTER'); const before = clockTime(expectFocus('Exit ambient mode'));
    key('HOME'); await delay(1500);
    adb('shell', 'am', 'start', '-a', 'android.intent.action.MAIN', '-c', 'android.intent.category.LEANBACK_LAUNCHER', '-n', `${appId}/.MainActivity`);
    nodes = expectFocus('Exit ambient mode'); assert.notEqual(clockTime(nodes), before);
    checkDeviceClock(nodes); expectRail(nodes, null); home('Clock');
  });

  await t.test('format survives restart and dashboard/Clock share the same saved preference', async () => {
    key('DPAD_CENTER'); expectFocus('Enter ambient mode');
    key('DPAD_LEFT'); key('DPAD_LEFT'); key('DPAD_CENTER'); assert.match(clockTime(snapshot()), /\s[AP]M$/);
    nodes = await launch(); assert.match(byId(nodes, 'dashboard-clock')?.['content-desc'] ?? '', /\s[AP]M$/);
    focusRail('Clock'); key('DPAD_CENTER'); nodes = expectFocus('Enter ambient mode');
    assert.match(clockTime(nodes), /\s[AP]M$/);
    assert.equal(nodes.find((node) => node['content-desc'] === '12-hour')?.selected, 'true');
    assert.ok(!nodes.some((node) => node.text.includes('could not be saved')));
  });

  await t.test('reduced motion preserves single-label focus, compact timeout, Home and ambient controls', async () => {
    const previous = adb('shell', 'settings', 'get', 'global', 'transition_animation_scale').trim();
    try {
      adb('shell', 'settings', 'put', 'global', 'transition_animation_scale', '0');
      key('DPAD_CENTER'); expectFocus('Exit ambient mode');
      focusRail('Clock'); await delay(10_400); expectRail(expectFocus('Clock'), null);
      key('DPAD_UP'); expectRail(expectFocus('Timer'), 'Timer'); home('Clock');
      key('DPAD_CENTER'); expectFocus('Enter ambient mode');
      if (originalFormat === '24h') { key('DPAD_LEFT'); key('DPAD_CENTER'); }
      key('BACK'); expectFocus('Clock');
    } finally {
      if (previous === 'null') adb('shell', 'settings', 'delete', 'global', 'transition_animation_scale');
      else adb('shell', 'settings', 'put', 'global', 'transition_animation_scale', previous);
    }
  });
});

test('Custom Duration inherits the full rail; Home and Back discard its draft and restore Timer', { timeout: 240_000 }, async () => {
  prepareHierarchyDump((local, remote) => adb('push', local, remote)); await launch();
  async function openCustom() {
    focusRail('Timer'); key('DPAD_CENTER'); expectFocus('Start');
    focusControl('Custom'); key('DPAD_CENTER'); const nodes = expectFocus('Cancel'); expectRail(nodes, null);
  }
  await openCustom(); screenshot('custom-compact'); home('Timer');
  await openCustom(); key('BACK'); expectFocus('Timer');
  key('DPAD_CENTER'); assert.equal(remaining(expectFocus('Start')), 10 * 60);
  key('BACK'); expectFocus('Timer');
});

test('direct cross-utility rail navigation preserves the same running Timer session', { timeout: 360_000 }, async () => {
  prepareHierarchyDump((local, remote) => adb('push', local, remote)); await launch();
  key('DPAD_CENTER'); expectFocus('Start'); key('DPAD_CENTER'); const before = remaining(expectFocus('Pause'));
  focusRail('Clock'); key('DPAD_CENTER'); expectFocus('Enter ambient mode');
  key('DPAD_CENTER'); expectFocus('Exit ambient mode');
  focusRail('Timer'); key('DPAD_CENTER');
  let nodes = snapshot(); expectRail(nodes);
  assert.ok(remaining(nodes) < before && remaining(nodes) > before - 150);
  focusControl('Pause'); key('DPAD_CENTER'); const paused = remaining(expectFocus('Resume'));
  focusRail('Calculator'); key('DPAD_CENTER'); expectFocus('5');
  focusRail('Timer'); key('DPAD_CENTER'); nodes = snapshot(); assert.equal(remaining(nodes), paused);
  focusRail('Countdown'); key('DPAD_CENTER'); expectFocus('New countdown');
  focusRail('World Clocks'); key('DPAD_CENTER'); expectFocus('Add city');
  focusRail('Timer'); key('DPAD_CENTER'); nodes = snapshot(); assert.equal(remaining(nodes), paused);
  focusControl('Reset'); key('DPAD_CENTER'); assert.equal(remaining(snapshot()), 10 * 60);
  home('Timer');
});

test('bright/dark local image fixtures preserve single-label contrast, full rail and device clock', { timeout: 180_000 }, () => {
  for (const preview of ['bright', 'dark']) {
    adb('shell', 'am', 'start', '-a', 'android.intent.action.VIEW', '-d', `timeboxed:///?artworkPreview=${preview}`, '-n', `${appId}/.MainActivity`);
    assert.ok(byId(snapshot(), 'dashboard-artwork'));
    const nodes = expectRail(focusRail('Clock'), 'Clock'); checkDeviceClock(nodes, 'dashboard-clock');
    screenshot(`contrast-${preview}`);
  }
  adb('shell', 'am', 'start', '-a', 'android.intent.action.VIEW', '-d', 'timeboxed:///', '-n', `${appId}/.MainActivity`);
  expectRail(snapshot());
});
