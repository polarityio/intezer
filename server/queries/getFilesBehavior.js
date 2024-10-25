const { map } = require('lodash/fp');

const {
  logging: { getLogger },
  errors: { parseErrorToReadableJson }
} = require('polarity-integration-utils');

const { requestsInParallel } = require('../request');

const getFilesBehavior = async (files, options) => {
  const Logger = getLogger();

  try {
    const filesBehaviorRequests = map(
      ({ resultId, result: file }) => ({
        resultId,
        route: `analyses/${file.analysis_id}/behavior`,
        options
      }),
      files
    );

    const filesBehavior = await requestsInParallel(filesBehaviorRequests, 'body.result');

    return filesBehavior;
  } catch (error) {
    const err = parseErrorToReadableJson(error);
    Logger.error(
      {
        formattedError: err,
        error
      },
      'Getting Files Behavior Failed'
    );
    throw error;
  }
};

module.exports = getFilesBehavior;
