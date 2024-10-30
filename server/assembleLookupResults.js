const { map, get, size } = require('lodash/fp');
const { getResultForThisEntity } = require('./dataTransformations');

const assembleLookupResults = (entities, files, options) =>
  map((entity) => {
    const file = getResultForThisEntity(entity, files, true);

    const lookupResult = {
      entity,
      data: size(file)
        ? {
            summary: createSummaryTags(file),
            details: { file }
          }
        : null
    };

    return lookupResult;
  }, entities);

const createSummaryTags = (file) =>
  [].concat(
    get('analysis_id', file)
      ? get('verdict', file)
      : get('needsToBeScanned', file)
      ? 'Scan File'
      : get('fileScan', file)
      ? 'Scanning File...'
      : []
  );

module.exports = assembleLookupResults;
