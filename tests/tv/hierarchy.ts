import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readdirSync, rmSync } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { delimiter, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export function prepareHierarchyDump(push: (local: string, remote: string) => unknown) {
  const sdk = process.env.ANDROID_HOME ?? process.env.ANDROID_SDK_ROOT ?? join(homedir(), 'Library/Android/sdk');
  const newest = (folder: string) => readdirSync(folder).sort((a, b) => b.localeCompare(a, undefined, { numeric: true }));
  const platform = newest(join(sdk, 'platforms')).map((name) => join(sdk, 'platforms', name))
    .find((folder) => existsSync(join(folder, 'uiautomator.jar')));
  if (!platform) throw new Error('Install an Android SDK platform containing uiautomator.jar and set ANDROID_HOME.');
  const tools = join(sdk, 'build-tools', newest(join(sdk, 'build-tools'))[0]);
  const studioJava = '/Applications/Android Studio.app/Contents/jbr/Contents/Home';
  const javaHome = process.env.JAVA_HOME ?? (existsSync(studioJava) ? studioJava : undefined);
  const executable = (name: string) => javaHome ? join(javaHome, 'bin', name) : name;
  const work = mkdtempSync(join(tmpdir(), 'timeboxed-tv-test-'));
  try {
    const libraries = [join(platform, 'android.jar'), join(platform, 'uiautomator.jar'),
      join(platform, 'optional/android.test.base.jar')];
    execFileSync(executable('javac'), ['--release', '8', '-cp', libraries.join(delimiter), '-d', work,
      fileURLToPath(new URL('./TimeBoxedHierarchyDump.java', import.meta.url))], { stdio: 'pipe' });
    const artifact = join(work, 'hierarchy.zip');
    execFileSync(executable('java'), ['-cp', join(tools, 'lib/d8.jar'), 'com.android.tools.r8.D8',
      '--lib', libraries[0], '--min-api', '23', '--output', artifact, join(work, 'TimeBoxedHierarchyDump.class')],
    { stdio: 'pipe' });
    push(artifact, '/data/local/tmp/timeboxed-hierarchy.jar');
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
}
