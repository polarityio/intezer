const { get, flow, tail, join } = require('lodash/fp');
const {
  logging: { getLogger },
  errors: { parseErrorToReadableJson }
} = require('polarity-integration-utils');

const { requestWithDefaults } = require('../request');
const getFileMetadata = require('../queries/getFileMetadata');
const { cacheScanFailure } = require('./scanFileHash');

const refreshFileHashScan = async ({ file, entity }, options, callback) => {
  const Logger = getLogger();
  try {
    const runningThisFunctionFromOnDetails = !callback;
    
    let analysis = get(
      'body',
      await requestWithDefaults({
        route: flow(get('fileScan.result_url'), tail, join(''))(file),
        options
      })
    );

    const analysisStatus = get('status', analysis);
    if (analysisStatus !== 'succeeded') {
      Logger.trace({ file, analysis }, 'File Scan Not Finished');

      if (analysisStatus === 'failed') cacheScanFailure(entity, analysis);

      const fileScanWithStatus = {
        fileScan: { ...file.fileScan, status: analysisStatus }
      };
      if (runningThisFunctionFromOnDetails) return fileScanWithStatus;
      callback(null, { file: fileScanWithStatus });
    }

    const newFile = get('result', analysis);
    Logger.trace({ newFile }, 'File Scan Finished Successfully');

    if (runningThisFunctionFromOnDetails) return newFile;

    const metadata = await getFileMetadata(newFile, options);

    const fileSize = metadata.size_in_bytes
      ? `${Math.round((metadata.size_in_bytes / 1024) * 100) / 100} KB`
      : '';

    Logger.trace({ newFile, metadata, fileSize }, 'Getting Metadata Succeeded');

    callback(null, {
      file: {
        ...newFile,
        fileSize
      },
      metadata
    });
  } catch (error) {
    const err = parseErrorToReadableJson(error);
    Logger.error(
      {
        detail: 'Failed Refreshing File Scan',
        formattedError: err
      },
      'Refreshing File Scan Failed'
    );

    if (!callback) throw error;

    return callback({
      errors: [
        {
          err: error,
          detail: error.message || 'Refreshing File Scan Failed'
        }
      ]
    });
  }
};

module.exports = refreshFileHashScan;
