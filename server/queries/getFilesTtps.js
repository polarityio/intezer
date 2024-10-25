const { map } = require('lodash/fp');

const {
  logging: { getLogger },
  errors: { parseErrorToReadableJson }
} = require('polarity-integration-utils');

const { requestsInParallel } = require('../request');

const getFilesTtps = async (files, options) => {
  const Logger = getLogger();

  try {
    const filesTtpsRequests = map(
      ({ resultId, result: file }) => ({
        resultId,
        route: `analyses/${file.analysis_id}/dynamic-ttps`,
        options
      }),
      files
    );

    const filesTtps = await requestsInParallel(filesTtpsRequests, 'body.result');

    return filesTtps;
  } catch (error) {
    const err = parseErrorToReadableJson(error);
    Logger.error(
      {
        formattedError: err,
        error
      },
      'Getting Files TTPs Failed'
    );
    throw error;
  }
};

module.exports = getFilesTtps;
