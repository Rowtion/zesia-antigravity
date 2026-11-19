// Development/CI proof only. Installation uses the already-verified native asset.
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdtemp,mkdir,rm,realpath} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import { lock, platform, stageNativeSkill } from './verified-native.mjs';
import { writePlugin } from './build-plugin.mjs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
const temp=await mkdtemp(join(tmpdir(),'zesia-antigravity-native-'));
try{
 const source=join(temp,'source');
 await stageNativeSkill(temp,source);
 const plugin=join(temp,'plugin');
 await writePlugin(source,plugin);
 const manifest=JSON.parse(await readFile(join(plugin,'plugin.json'),'utf8'));
 assert.equal(manifest.name,'zesia-consult');
 assert.match(manifest.suggestedPrompts[0],/local draft for me to review and approve/u);
 const project=join(temp,'project'),emptyPath=join(temp,'empty-path');await mkdir(project);await mkdir(emptyPath);
 const executable=join(source,'scripts/zesia'+(process.platform==='win32'?'.exe':''));
 const env={...process.env,PATH:process.platform==='win32'?process.env.SystemRoot+'\\System32':emptyPath,ZESIA_CONFIG:join(temp,'private-config.json'),ZESIA_STATE_DIR:join(temp,'private-state')};
 const isolatedHome=join(temp,'new-user');await mkdir(isolatedHome);
 const userEnv={...env,HOME:isolatedHome,USERPROFILE:isolatedHome};
 const first=JSON.parse(execFileSync(executable,['install'],{env:userEnv,encoding:'utf8'}));
 assert.equal(first.destination,join(await realpath(isolatedHome),'.gemini/config/skills/zesia-consult'));
 assert.equal(JSON.parse(execFileSync(executable,['install'],{env:userEnv,encoding:'utf8'})).reused,true);
 const installed=JSON.parse(execFileSync(executable,['install',project],{env,encoding:'utf8'}));assert.equal(installed.ok,true);
 assert.equal(installed.destination,join(await realpath(project),'.agents/skills/zesia-consult'));
 const marker=JSON.parse(await readFile(join(installed.destination,'zesia-install.json'),'utf8'));assert.equal(marker.host,'antigravity');assert.equal(marker.runtimeVersion,lock.version);
 const skill=await readFile(join(installed.destination,'SKILL.md'),'utf8');assert.match(skill,/shared zesia.dev window/);assert.doesNotMatch(skill,/node <skill/);
 const installedExe=join(installed.destination,'scripts/zesia'+(process.platform==='win32'?'.exe':''));
 const pluginExe=join(plugin,'skills','zesia-consult','scripts','zesia'+(process.platform==='win32'?'.exe':''));
 const pluginHelp=JSON.parse(execFileSync(pluginExe,['--help'],{env,encoding:'utf8'}));
 assert.ok(pluginHelp.commands.includes('review <draftId> [--no-open]'));
 const help=JSON.parse(execFileSync(installedExe,['--help'],{env,encoding:'utf8'}));assert.ok(help.commands.includes('review <draftId> [--no-open]'));
 assert.equal(JSON.parse(execFileSync(executable,['install',project],{env,encoding:'utf8'})).reused,true);
 console.log(JSON.stringify({platform,adapterVersion:marker.adapterVersion,runtimeVersion:marker.runtimeVersion,nativeInstall:true,noNodePath:true,managedReuse:true}));
}finally{await rm(temp,{recursive:true,force:true,maxRetries:20,retryDelay:100});}
