import assert from 'node:assert/strict';
import { cp, readFile, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { join } from 'node:path';

export const platform = process.platform + '-' + process.arch;
export const lock = JSON.parse(await readFile('native.lock.json', 'utf8'));

export async function stageNativeSkill(temporary, destination) {
  const asset = lock.assets.find(item => item.platform === platform);
  assert.ok(asset, 'No verified native Runtime for this platform.');
  const response = await fetch(asset.url, { signal: AbortSignal.timeout(60_000) });
  assert.ok(response.ok);
  const bytes = Buffer.from(await response.arrayBuffer());
  assert.equal(bytes.length, asset.bytes);
  assert.equal(createHash('sha256').update(bytes).digest('hex'), asset.sha256);
  const archive = join(temporary, 'runtime.zip');
  await writeFile(archive, bytes);
  await cp('dist/skill', destination, { recursive: true });
  if (process.platform === 'win32') {
    const quote = value => "'" + value.replaceAll("'", "''") + "'";
    execFileSync('powershell.exe', ['-NoProfile', '-Command',
      'Expand-Archive -LiteralPath ' + quote(archive) + ' -DestinationPath ' + quote(destination) + ' -Force']);
  } else execFileSync('unzip', ['-oq', archive, '-d', destination]);
  const info = JSON.parse(await readFile(join(destination, 'runtime.json'), 'utf8'));
  assert.equal(info.version, lock.version);
  assert.equal(info.platform, platform);
  assert.equal(info.sourceSha, lock.sourceSha);
}
