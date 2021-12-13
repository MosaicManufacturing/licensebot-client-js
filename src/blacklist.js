const fs = require('fs/promises');
const path = require('path');

const blacklistPath = path.join(__dirname, '..', 'blacklist.txt');

let blacklist = null;

/**
 * @returns {Promise<void>}
 */
const loadBlacklist = async () => {
  if (blacklist) return;
  blacklist = [];
  const text = await fs.readFile(blacklistPath, 'utf-8');
  const lines = text.split(/\r\n|\r|\n/g);
  blacklist = lines
    .filter(line => line && !line.startsWith('#'))
    .map(line => line.toLowerCase());
};

/**
 * @param licenseId {string}
 * @returns {Promise<void>}
 */
const checkBlacklist = async (licenseId) => {
  await loadBlacklist();
  const lowercased = licenseId.toLowerCase();
  for (let i = 0; i < blacklist.length; i++) {
    if (lowercased.includes(blacklist[i])) {
      throw new Error(`License ${licenseId} is blacklisted`);
    }
  }
};

module.exports = {
  checkBlacklist,
};
