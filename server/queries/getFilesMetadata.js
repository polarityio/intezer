const { map } = require('lodash/fp');

const {
  logging: { getLogger },
  errors: { parseErrorToReadableJson }
} = require('polarity-integration-utils');

const { requestsInParallel } = require('../request');

const getFilesMetadata = async (files, options) => {
  const Logger = getLogger();

  try {
    const filesMetadataRequests = map(
      ({ resultId, result: file }) => ({
        resultId,
        route: `analyses/${file.analysis_id}/sub-analyses/root/metadata`,
        options
      }),
      files
    );

    const filesMetadata = await requestsInParallel(filesMetadataRequests, 'body')

    return filesMetadata;
  } catch (error) {
    const err = parseErrorToReadableJson(error);
    Logger.error(
      {
        formattedError: err,
        error
      },
      'Getting File Metadata Failed'
    );
    throw error;
  }
};

module.exports = getFilesMetadata;
