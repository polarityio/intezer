const { get } = require('lodash/fp');

const {
  logging: { setLogger, getLogger },
  errors: { parseErrorToReadableJson }
} = require('polarity-integration-utils');

const { validateOptions } = require('./server/userOptions');
const { getFiles, getFileMetadata } = require('./server/queries');
const assembleLookupResults = require('./server/assembleLookupResults');
const onMessageFunctions = require('./server/onMessage');

const doLookup = async (entities, options, cb) => {
  const Logger = getLogger();
  try {
    Logger.debug({ entities }, 'Entities');

    const files = await getFiles(entities, options);

    Logger.trace({ files });

    const lookupResults = assembleLookupResults(entities, files, options);

    Logger.trace({ lookupResults }, 'Lookup Results');

    cb(null, lookupResults);
  } catch (error) {
    const err = parseErrorToReadableJson(error);

    Logger.error({ error, formattedError: err }, 'Get Lookup Results Failed');
    cb({ detail: error.message || 'Lookup Failed', err });
  }
};

const onDetails = async (lookupObject, options, callback) => {
  const Logger = getLogger();

  try {
    let file = get('data.details.file', lookupObject);

    const fileHasBeenScannedWithoutResultsYet = (_file) => get('fileScan', _file);
    if (fileHasBeenScannedWithoutResultsYet(file)) {
      const refreshedFileScanResult = await onMessageFunctions.refreshFileHashScan(
        { file },
        options
      );

      if (fileHasBeenScannedWithoutResultsYet(refreshedFileScanResult)) {
        callback(null, {
          ...lookupObject.data,
          details: {
            file: refreshedFileScanResult
          }
        });
        return;
      }

      file = refreshedFileScanResult;
    } else if (get('needsToBeScanned', file)) {
      callback(null, lookupObject.data);
      return;
    }

    // File has results on first lookup so get metadata
    const metadata = await getFileMetadata(file, options);

    const fileSize = metadata.size_in_bytes
      ? `${Math.round((metadata.size_in_bytes / 1024) * 100) / 100} KB`
      : '';

    Logger.trace({ file, metadata, fileSize });

    callback(null, {
      ...lookupObject.data,
      details: {
        file: {
          ...file,
          fileSize
        },
        metadata
      }
    });
  } catch (error) {
    getLogger().trace({ error }, 'Failed to Get Details');

    callback(error);
  }
};

const onMessage = ({ action, data: actionParams }, options, callback) =>
  onMessageFunctions[action](actionParams, options, callback);

module.exports = {
  startup: setLogger,
  validateOptions,
  onDetails,
  onMessage,
  doLookup
};
