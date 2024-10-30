const { get } = require('lodash/fp');
const {
  logging: { getLogger },
  errors: { parseErrorToReadableJson }
} = require('polarity-integration-utils');

const { requestWithDefaults } = require('../request');
const refreshFileHashScan = require('./refreshFileHashScan');

const NodeCache = require('node-cache');
const failedScanHashesCache = new NodeCache({});

const scanFileHash = async ({ entity }, options, callback) => {
  const Logger = getLogger();

  try {
    if (entityHasPreviouslyFailedHashScanning(entity)) return;

    let fileScan = get(
      'body',
      await requestWithDefaults({
        method: 'POST',
        route: 'analyze-by-hash',
        body: {
          hash: entity.value,
          disable_dynamic_execution: false
        },
        options
      })
    );

    Logger.trace({ fileScan }, 'Starting File Hash Scan Successful');

    const runningThisFunctionOnInitialLookup = !callback;
    if (runningThisFunctionOnInitialLookup) return { fileScan };

    refreshFileHashScan({ file: { fileScan }, entity }, options, callback);
  } catch (error) {
    const err = parseErrorToReadableJson(error);

    const fileHashNotFound = checkIfFileHashIsNotFound(err, entity, callback);
    if (fileHashNotFound) return;

    Logger.error(
      {
        detail: 'Failed File Hash Scan Lookup',
        formattedError: err
      },
      'File Hash Scan Lookup Failed'
    );
    return callback({
      errors: [
        {
          err: error,
          detail: error.message || 'File Hash Scan Lookup Failed'
        }
      ]
    });
  }
};

const entityHasPreviouslyFailedHashScanning = (entity) => {
  const failedScanCacheForEntity = failedScanHashesCache.get(entity.value);
  if (failedScanCacheForEntity) {
    getLogger().trace(
      { entity, failedScanCacheForEntity },
      'Failed Scan Cache Hit on Entity'
    );
  }

  return !!failedScanCacheForEntity;
};

const checkIfFileHashIsNotFound = (err, entity, callback) => {
  let requestErrorMessage;
  try {
    requestErrorMessage = get('error', JSON.parse(err.description));
  } catch (e) {}

  const fileHashCannotBeScanned =
    err.status === 404 && requestErrorMessage === 'File not found';

  if (fileHashCannotBeScanned) {
    const runningThisFunctionOnInitialLookup = !callback;
    if (runningThisFunctionOnInitialLookup) return true;

    cacheScanFailure(entity, {
      fileScan: { status: 'Failed Due to hash `File not found` on Intezer' }
    });

    callback(null, { file: { fileScan: { status: 'failed' } } });
    return true;
  }
};

const cacheScanFailure = (entity, analysis) => {
  getLogger().trace({ entity, analysis }, 'Caching Failed Hash Scan');

  failedScanHashesCache.set(entity.value, analysis);
};

module.exports = {
  scanFileHash,
  entityHasPreviouslyFailedHashScanning,
  cacheScanFailure
};
