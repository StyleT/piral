import { resolve } from 'path';
import { log } from '../log';
import { findFile } from '../io';
import { runCommand } from '../scripts';
import { MemoryStream } from '../MemoryStream';

// Helpers:

function runYarnProcess(args: Array<string>, target: string, output?: NodeJS.WritableStream) {
  log('generalDebug_0003', 'Starting the Yarn@1 process ...');
  const cwd = resolve(process.cwd(), target);
  return runCommand('yarn', args, cwd, output);
}

function convert(flags: Array<string>) {
  return flags.map((flag) => {
    switch (flag) {
      case '--save-exact':
        return '--exact';
      case '--save-dev':
        return '--dev';
      case '--no-save':
        // unfortunately no (https://github.com/yarnpkg/yarn/issues/1743)
        return '';
      default:
        return flag;
    }
  });
}

// Client interface functions:

export async function installDependencies(target = '.', ...flags: Array<string>) {
  const ms = new MemoryStream();
  await runYarnProcess(['install', ...convert(flags)], target, ms);
  log('generalDebug_0003', `Yarn@1 install dependencies result: ${ms.value}`);
  return ms.value;
}

export async function installPackage(packageRef: string, target = '.', ...flags: Array<string>) {
  const ms = new MemoryStream();
  await runYarnProcess(['add', packageRef, ...convert(flags)], target, ms);
  log('generalDebug_0003', `Yarn@1 install package result: ${ms.value}`);
  return ms.value;
}

export async function detectClient(root: string) {
  return !!(await findFile(root, 'yarn.lock'));
}
