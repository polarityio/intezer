const { get } = require('lodash/fp');

const {
  logging: { getLogger },
  errors: { parseErrorToReadableJson }
} = require('polarity-integration-utils');

const { requestWithDefaults } = require('../request');

const getFileMetadata = async (file, options) => {
  const Logger = getLogger();

  try {
    const fileMetadata = get(
      'body',
      await requestWithDefaults({
        route: `analyses/${file.analysis_id}/sub-analyses/root/metadata`,
        options
      })
    );

    return fileMetadata;
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

module.exports = getFileMetadata;
