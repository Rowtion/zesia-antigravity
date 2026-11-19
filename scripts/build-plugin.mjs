import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { platform, stageNativeSkill } from './verified-native.mjs';

export async function writePlugin(source, destination) {
  const metadata = JSON.parse(await readFile(join(source, 'host.json'), 'utf8'));
  const skill = join(destination, 'skills', 'zesia-consult');
  await mkdir(destination);
  await mkdir(join(destination, 'skills'));
  await cp(source, skill, { recursive: true });
  const manifest = {
    $schema: 'https://antigravity.google/schemas/v1/plugin.json',
    name: 'zesia-consult',
    displayName: 'ZESIA Consult',
    description: 'Ask ZESIA for an independent expert review of your current task.',
    version: metadata.version,
    suggestedPrompts: [
      'Ask ZESIA to review my current task. Prepare a local draft for me to review and approve.',
    ],
    author: 'Zesia',
    homepage: 'https://zesia.dev',
    repository: 'https://github.com/Rowtion/zesia-antigravity',
  };
  await writeFile(join(destination, 'plugin.json'), JSON.stringify(manifest, null, 2) + '\n');
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const temporary = await mkdtemp(join(tmpdir(), 'zesia-antigravity-plugin-'));
  const source = join(temporary, 'skill');
  const destination = resolve('dist', 'antigravity-plugin-' + platform);
  try {
    await stageNativeSkill(temporary, source);
    await writePlugin(source, destination);
    console.log(destination);
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
}
