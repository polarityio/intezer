const { validateStringOptions, validateUrlOption } = require('./utils');

const validateOptions = async (options, callback) => {
  const stringOptionsErrorMessages = {
    url: '* Required',
    apiKey: '* Required'
  };

  const stringValidationErrors = validateStringOptions(
    stringOptionsErrorMessages,
    options
  );

  const urlValidationError = validateUrlOption(options, 'url');

  const autoHashScanError =
    options.autoHashScan.value && !options.allowHashScan.value
      ? 'Allow Hash Scan must be enabled to use Auto Hash Scan'
      : [];

  const errors = stringValidationErrors.concat(urlValidationError).concat(autoHashScanError);

  callback(null, errors);
};

module.exports = validateOptions;
