const fs = require('fs/promises');
const path = require('path');
const getLicenses = require('./get-licenses');

const licensesPath = path.join(__dirname, 'licenses.json');

/**
 * @returns {Promise<void>}
 */
const update = async () => {
  const licenses = await getLicenses();
  const serialized = JSON.stringify(licenses, null, 2);
  await fs.writeFile(licensesPath, serialized, 'utf-8');
};

/**
 * @returns {Promise<void>}
 */
const check = async () => {
  const licenses = await getLicenses();
  const serialized = JSON.stringify(licenses, null, 2);
  const fromDisk = await fs.readFile(licensesPath, 'utf-8');
  if (serialized !== fromDisk) {
    throw new Error('License bundle is out of date.\nRun `yarn licensebot update` and commit the changes.');
  }
};

const main = async () => {
  switch (process.argv[2]) {
    case 'update':
      return update();
    case 'check':
      return check();
    default:
      throw new Error('Expected command as argument');
  }
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
