const { get, map, isArray, size, flow, filter, eq, flatMap, uniq } = require('lodash/fp');

const {
  logging: { getLogger },
  errors: { parseErrorToReadableJson }
} = require('polarity-integration-utils');

const { requestWithDefaults } = require('../request');

const getFileDetections = async ({ file, entity }, options, callback) => {
  const Logger = getLogger();

  try {
    const fileDetections = get(
      'body.result',
      await requestWithDefaults({
        route: `analyses/${file.analysis_id}/detect`,
        options
      })
    );

    const fileFamilyTags = getFileFamilies(entity, fileDetections);

    const formattedDetections = map(
      (detection) => ({ ...detection, valueIsArray: isArray(detection.value) }),
      fileDetections
    );

    const summary = size(fileDetections) ? `Detect Opps: ${size(fileDetections)}` : [];

    callback(null, {
      result: {
        detectOpps: formattedDetections,
        fileFamilyTags
      },
      summary
    });
  } catch (error) {
    const err = parseErrorToReadableJson(error);

    let requestErrorMessage;
    try {
      requestErrorMessage = get('error', JSON.parse(err.description));
    } catch (e) {}

    const dynamicExecutionNotPossible =
      err.status === 409 && requestErrorMessage === 'Detection report not found';

    if (dynamicExecutionNotPossible) {
      callback(null, { result: { dynamicExecutionNotPossible: true } });
      return;
    }

    Logger.error(
      {
        formattedError: err,
        error
      },
      'Getting File Detections Failed'
    );
    return callback({
      errors: [
        {
          err: error,
          detail: error.message || 'Getting File Detections Failed'
        }
      ]
    });
  }
};

const getFileFamilies = (entity, detections) =>
  flow(
    filter(flow(get('value'), eq(entity.value))),
    flatMap(get('families')),
    map(get('family_name')),
    uniq
  )(detections);

module.exports = getFileDetections;
