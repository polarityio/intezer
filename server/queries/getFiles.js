const { map } = require('lodash/fp');

const {
  logging: { getLogger },
  errors: { parseErrorToReadableJson }
} = require('polarity-integration-utils');

const { requestsInParallel } = require('../request');


const getFiles = async (entities, options) => {
  const Logger = getLogger();

  try {
    const fileRequests = map(
      (entity) => ({
        resultId: entity.value,
        route: `files/${entity.value}`,
        options
      }),
      entities
    );

    const files = await requestsInParallel(fileRequests, 'body.result')

    return files;
  } catch (error) {
    const err = parseErrorToReadableJson(error);
    Logger.error(
      {
        formattedError: err,
        error
      },
      'Getting Files Failed'
    );
    throw error;
  }
};

module.exports = getFiles;
