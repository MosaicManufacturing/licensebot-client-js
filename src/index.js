#!/usr/bin/env node

const fs = require('fs/promises');
const path = require('path');
const getLicenses = require('./get-licenses');

const defaultBundlePath = path.join(process.cwd(), 'licenses.json');

// const licensesPath = path.join(__dirname, 'licenses.json');

const help = () => {
  console.log('licensebot <command> [bundlePath]');
  console.log('  command     command to run ("update" or "check")');
  console.log('  bundlePath  JSON file to update or compare against');
  console.log('                (defaults to $CWD/licenses.json)');
};

/**
 * @param bundlePath {string}
 * @returns {Promise<void>}
 */
const update = async (bundlePath) => {
  const licensesPath = bundlePath || defaultBundlePath;
  const licenses = await getLicenses();
  const serialized = JSON.stringify(licenses, null, 2);
  await fs.writeFile(licensesPath, serialized, 'utf-8');
};

/**
 * @param bundlePath {string}
 * @returns {Promise<void>}
 */
const check = async (bundlePath) => {
  const licensesPath = bundlePath || defaultBundlePath;
  const licenses = await getLicenses();
  const serialized = JSON.stringify(licenses, null, 2);
  const fromDisk = await fs.readFile(licensesPath, 'utf-8');
  if (serialized !== fromDisk) {
    throw new Error('License bundle is out of date.\nRun `yarn licensebot update` and commit the changes.');
  }
};

const main = async () => {
  const [command, bundlePath] = process.argv.slice(2);
  switch (command) {
    case 'help':
    case '--help':
    case '-h':
      return help();
    case 'update':
      return update(bundlePath);
    case 'check':
      return check(bundlePath);
    default:
      help();
      throw new Error('Expected command as argument');
  }
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
