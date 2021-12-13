const https = require('https');

/**
 * @return {Promise<string>}
 */
const requestText = async url => new Promise((fulfill, reject) => {
  const request = https.request(url, (response) => {
    const chunks = [];
    response.on('data', (chunk) => {
      chunks.push(chunk);
    });
    response.on('end', () => {
      const result = chunks.join('');
      if (response.statusCode < 200 || response.statusCode > 300) {
        reject(new Error(result));
      } else {
        fulfill(result);
      }
    });
  });
  request.on('error', reject);
  request.end();
});

/**
 * @param url {string}
 * @returns {Promise<Object>}
 */
const requestJson = async (url) => {
  const data = await requestText(url);
  return JSON.parse(data);
};

// cache of URL => license text, to avoid re-requesting the same URL
/**
 * @type {Map<string, string>}
 */
const licenseDetails = new Map();

/**
 * @param url {string}
 * @returns {Promise<string>}
 */
const getSPDXLicenseDetails = async (url) => {
  if (!licenseDetails.has(url)) {
    const details = await requestJson(url);
    licenseDetails.set(url, details.licenseText);
  }
  return licenseDetails.get(url);
};

/**
 * @param licenseId {string}
 * @returns {Promise<string>}
 */
const getSPDXLicenseText = async (licenseId) => {
  const detailsUrl = `https://spdx.org/licenses/${licenseId}.json`;
  return getSPDXLicenseDetails(detailsUrl);
};

module.exports = {
  getSPDXLicenseText,
};
