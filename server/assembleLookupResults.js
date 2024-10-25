const {
  flow,
  map,
  mapValues,
  flatMap,
  filter,
  groupBy,
  find,
  some,
  compact,
  get,
  getOr,
  size,
  omit,
  eq,
  uniq,
  split,
  first,
  tail,
  trimCharsEnd,
  toPairs,
  join,
  replace,
  isArray
} = require('lodash/fp');
const { getResultForThisEntity } = require('./dataTransformations');
const { logging } = require('polarity-integration-utils');

const assembleLookupResults = (
  entities,
  files,
  metadata,
  ttps,
  iocs,
  behavior,
  detections,
  options
) =>
  map((entity) => {
    const resultsForThisEntity = getResultsForThisEntity(
      entity,
      files,
      metadata,
      ttps,
      iocs,
      behavior,
      detections,
      options
    );

    const resultsFound = flow(
      omit(['fromNetwork', 'toNetwork']),
      some(size)
    )(resultsForThisEntity);

    const lookupResult = {
      entity,
      data: resultsFound
        ? {
            summary: createSummaryTags(resultsForThisEntity, options),
            details: resultsForThisEntity
          }
        : null
    };

    return lookupResult;
  }, entities);

const getResultsForThisEntity = (
  entity,
  files,
  _metadata,
  _ttps,
  _iocs,
  _behavior,
  _detections
) => {
  const file = getResultForThisEntity(entity, files, true);
  const metadata = getResultForThisEntity(entity, _metadata, true);
  const ttps = getResultForThisEntity(entity, _ttps);
  const iocs = getResultForThisEntity(entity, _iocs, true);
  const behavior = getResultForThisEntity(entity, _behavior, true);
  const detections = getResultForThisEntity(entity, _detections);

  const families = getFileFamilies(entity, detections);

  const size = metadata.size_in_bytes
    ? `${Math.round((metadata.size_in_bytes / 1024) * 100) / 100} KB`
    : '';

  const ttpsWithFormattedData = formatTtpsData(ttps);

  const mitreAttackTechniqueDetections = getMitreAttackTechniqueDetections(ttps);

  const processTreeWithTabs = addTabsToProcessTree(behavior.process_tree);

  const formattedDetections = map(
    (detection) => ({ ...detection, valueIsArray: isArray(detection.value) }),
    detections
  );

  return {
    file: {
      ...file,
      families,
      size
    },
    metadata,
    ttps: ttpsWithFormattedData,
    iocs,
    behavior: {
      ...behavior,
      mitreAttackTechniqueDetections,
      processTreeWithTabs
    },
    detections: formattedDetections
  };
};

const getFileFamilies = (entity, detections) =>
  flow(
    filter(flow(get('value'), eq(entity.value))),
    flatMap(get('families')),
    map(get('family_name')),
    uniq
  )(detections);

const getMitreAttackTechniqueDetections = (ttps) =>
  flow(
    flatMap(get('ttps')),
    compact,
    map(
      flow(get('ttp'), split('::'), (splitTtp) => {
        const technique = flow(tail, join('::'))(splitTtp);
        const [name, code] = flow(trimCharsEnd(']'), split(' ['))(technique);

        return {
          enterprise: first(splitTtp),
          technique: {
            name,
            link: code && `https://attack.mitre.org/techniques/${replace('.', '/', code)}`
          }
        };
      })
    ),
    groupBy('enterprise'),
    mapValues(map(get('technique')))
  )(ttps);

const formatTtpsData = (ttps) =>
  map(
    (ttp) => ({
      ...ttp,
      formattedData: flow(
        get('data'),
        map(
          flow(
            toPairs,
            map(([key, value]) => `${key}: ${value}`),
            join(', ')
          )
        )
      )(ttp)
    }),
    ttps
  );

const addTabsToProcessTree = (processTree, tabAddedProcessTree = []) => {
  if (!size(processTree)) return tabAddedProcessTree;

  const currentProcess = first(processTree);
  const numberOfParentProcessTabs = flow(
    find((possibleParentProcess) =>
      eq(possibleParentProcess.process_id, currentProcess.parent_id)
    ),
    getOr(-1, 'numberOfTabs')
  )(tabAddedProcessTree);

  return addTabsToProcessTree(
    tail(processTree),
    tabAddedProcessTree.concat({
      ...currentProcess,
      numberOfTabs: numberOfParentProcessTabs + 1
    })
  );
};

const createSummaryTags = (
  { file, metadata, ttps, iocs, behavior, detections },
  options
) =>
  []
    .concat(
      size(get('files', iocs)) || size(get('network', iocs))
        ? `IOCs: ${size(get('files', iocs)) + size(get('network', iocs))}`
        : []
    )
    .concat(size(detections) ? `Detect Opps: ${size(detections)}` : []);
    
module.exports = assembleLookupResults;
