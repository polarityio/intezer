const { get, size } = require('lodash/fp');

const {
  logging: { getLogger },
  errors: { parseErrorToReadableJson }
} = require('polarity-integration-utils');

const { requestWithDefaults } = require('../request');

const getFileIocs = async ({ file }, options, callback) => {
  const Logger = getLogger();

  try {
    const fileIocs = get(
      'body.result',
      await requestWithDefaults({
        route: `analyses/${file.analysis_id}/iocs`,
        options
      })
    );

    const filesIocSize = size(get('files', fileIocs)) || 0
    const networkIocSize = size(get('network', fileIocs)) || 0
    const summary =
      filesIocSize || networkIocSize ? `IOCs: ${filesIocSize + networkIocSize}` : [];

    callback(null, { result: fileIocs, summary });
  } catch (error) {
    const err = parseErrorToReadableJson(error);
    Logger.error(
      {
        formattedError: err,
        error
      },
      'Getting File IOCs Failed'
    );
    return callback({
      errors: [
        {
          err: error,
          detail: error.message || 'Getting File IOCs Failed'
        }
      ]
    });
  }
};

module.exports = getFileIocs;
