const licenser = require('@wbmnky/license-report-generator');
const { getSPDXLicenseText } = require('./spdx');
const { checkBlacklist } = require('./blacklist');

/**
 *
 * @param licenseSources {Object}
 * @returns {string}
 */
const resolveLicenseText = (licenseSources) => {
  if (!licenseSources) return '';
  if (!licenseSources.license) return '';
  if (!licenseSources.license.sources) return '';
  if (!licenseSources.license.sources[0]) return '';
  return licenseSources.license.sources[0].text;
};

/**
 * @returns {Promise<Object[]>}
 */
const resolveLicenses = async () => {
  const report = await licenser.reporter.generate({});
  const plain = report.plain();

  // use Promise.allSettled to continue all checks even if some fail
  const packageLicenseResults = await Promise.allSettled(plain.licenses.map(async (license) => {
    const { name } = license;
    const licenseId = license.license;
    // attempt to get license text directly from package
    let licenseText = resolveLicenseText(license.licenseSources);
    let spdx = false;
    if (licenseId && !licenseText) {
      // no text, but license name detected -- get a stock license
      licenseText = await getSPDXLicenseText(licenseId);
      spdx = true; // flag that this is a stock license
    }
    if (!licenseText) {
      // could not determine license
      throw new Error(`Could not determine license for ${name}`);
    }
    licenseText = licenseText.replace(/\r\n|\r/g, '\n');
    return {
      name,
      licenseId,
      license: licenseText,
      spdx,
    };
  }));

  // if any licenses not found, log them as a warning
  const errors = packageLicenseResults
    .filter(result => result.status === 'rejected')
    .map(result => result.reason);
  if (errors.length > 0) {
    errors.forEach((error) => {
      console.warn(`WARNING: ${error.message}`);
    });
  }

  // no errors -- return results
  return packageLicenseResults
    .filter(result => result.status === 'fulfilled')
    .map(result => result.value);
};

/**
 * @param licenses {Object[]}
 * @returns {Promise<void>}
 */
const checkAllInBlacklist = async (licenses) => {
  const blacklistResults = await Promise.allSettled(licenses
    .filter(license => license.licenseId)
    .map(license => checkBlacklist(license.licenseId)));
  const errors = blacklistResults
    .filter(result => result.status === 'rejected')
    .map(result => result.reason);
  if (errors.length > 0) {
    errors.forEach((error) => {
      console.error(`ERROR: ${error.message}`);
    });
    throw new Error('Failed blacklist check');
  }
};

/**
 * @returns {Promise<Object[]>}
 */
const getLicenses = async () => {
  const licenses = (await resolveLicenses())
    .filter(license => !license.name.startsWith('@mosaic-canvas/') && !license.name.startsWith('@mosaicmfg/'));
  licenses.sort((a, b) => a.name.localeCompare(b.name));
  await checkAllInBlacklist(licenses);
  return licenses;
};

module.exports = getLicenses;
