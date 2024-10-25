const { map } = require('lodash/fp');

const {
  logging: { getLogger },
  errors: { parseErrorToReadableJson }
} = require('polarity-integration-utils');

const { requestsInParallel } = require('../request');

const getFilesDetections = async (files, options) => {
  const Logger = getLogger();

  try {
    const filesDetectionsRequests = map(
      ({ resultId, result: file }) => ({
        resultId,
        route: `analyses/${file.analysis_id}/detect`,
        options
      }),
      files
    );

    const filesDetections = await requestsInParallel(filesDetectionsRequests, 'body.result');

    return filesDetections;
  } catch (error) {
    const err = parseErrorToReadableJson(error);
    Logger.error(
      {
        formattedError: err,
        error
      },
      'Getting Files Detections Failed'
    );
    throw error;
  }
};

module.exports = getFilesDetections;
