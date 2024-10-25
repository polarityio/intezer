const { map } = require('lodash/fp');

const {
  logging: { getLogger },
  errors: { parseErrorToReadableJson }
} = require('polarity-integration-utils');

const { requestsInParallel } = require('../request');

const getFilesIocs = async (files, options) => {
  const Logger = getLogger();

  try {
    const filesIocsRequests = map(
      ({ resultId, result: file }) => ({
        resultId,
        route: `analyses/${file.analysis_id}/iocs`,
        options
      }),
      files
    );

    const filesIocs = await requestsInParallel(filesIocsRequests, 'body.result');

    return filesIocs;
  } catch (error) {
    const err = parseErrorToReadableJson(error);
    Logger.error(
      {
        formattedError: err,
        error
      },
      'Getting Files IOCs Failed'
    );
    throw error;
  }
};

module.exports = getFilesIocs;
