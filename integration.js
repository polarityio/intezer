const {
  logging: { setLogger, getLogger },
  errors: { parseErrorToReadableJson }
} = require('polarity-integration-utils');

const { validateOptions } = require('./server/userOptions');
const {
  getFiles,
  getFilesMetadata,
  getFilesTtps,
  getFilesIocs,
  getFilesBehavior,
  getFilesDetections
} = require('./server/queries');

const assembleLookupResults = require('./server/assembleLookupResults');

const doLookup = async (entities, options, cb) => {
  const Logger = getLogger();
  try {
    Logger.debug({ entities }, 'Entities');

    const files = await getFiles(entities, options);

    const [metadata, ttps, iocs, behavior, detections] = await Promise.all([
      getFilesMetadata(files, options),
      getFilesTtps(files, options),
      getFilesIocs(files, options),
      getFilesBehavior(files, options),
      getFilesDetections(files, options)
    ]);

    Logger.trace({ files, metadata, ttps, iocs, behavior, detections });

    const lookupResults = assembleLookupResults(
      entities,
      files,
      metadata,
      ttps,
      iocs,
      behavior,
      detections,
      options
    );

    Logger.trace({ lookupResults }, 'Lookup Results');

    cb(null, lookupResults);
  } catch (error) {
    const err = parseErrorToReadableJson(error);

    Logger.error({ error, formattedError: err }, 'Get Lookup Results Failed');
    cb({ detail: error.message || 'Lookup Failed', err });
  }
};

module.exports = {
  startup: setLogger,
  validateOptions,
  doLookup
};
