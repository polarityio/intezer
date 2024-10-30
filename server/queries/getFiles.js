const { map, get } = require('lodash/fp');

const {
  logging: { getLogger },
  errors: { parseErrorToReadableJson }
} = require('polarity-integration-utils');

const { requestWithDefaults } = require('../request');
const { scanFileHash, entityHasPreviouslyFailedHashScanning } = require('../onMessage');

const getFiles = async (entities, options) =>
  await Promise.all(
    map(async (entity) => {
      const Logger = getLogger();

      try {
        const file = get(
          'body.result',
          await requestWithDefaults({
            route: `files/${entity.value}`,
            options
          })
        );

        return { resultId: entity.value, result: file };
      } catch (error) {
        const err = parseErrorToReadableJson(error);

        let requestErrorMessage;
        try {
          requestErrorMessage = get('error', JSON.parse(err.description));
        } catch (e) {}

        const fileHashNotAnalyzedYetOrExpired =
          (err.status === 404 && requestErrorMessage === 'Analysis was not found') ||
          (err.status === 410 && requestErrorMessage === 'Analysis expired');

        if (fileHashNotAnalyzedYetOrExpired) {
          return await handleFileHashNotAnalyzedYet(entity, options);
        }

        Logger.error(
          {
            entity,
            formattedError: err,
            error
          },
          'Getting File Failed'
        );

        throw error;
      }
    }, entities)
  );

const handleFileHashNotAnalyzedYet = async (entity, options) => {
  if (options.autoHashScan) {
    const fileWithFileScan = await scanFileHash({ entity }, options);
    return { resultId: entity.value, result: fileWithFileScan };
  } else if (options.allowHashScan && !entityHasPreviouslyFailedHashScanning(entity)) {
    return { resultId: entity.value, result: { needsToBeScanned: true } };
  } else {
    return;
  }
};
module.exports = getFiles;
