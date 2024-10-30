const {
  map,
  get,
  flow,
  flatMap,
  first,
  mapValues,
  groupBy,
  compact,
  split,
  tail,
  trimCharsEnd,
  toPairs,
  join,
  replace,
  size
} = require('lodash/fp');

const {
  logging: { getLogger },
  errors: { parseErrorToReadableJson }
} = require('polarity-integration-utils');

const { requestWithDefaults } = require('../request');

const getFileTtps = async ({ file }, options, callback) => {
  const Logger = getLogger();

  try {
    const fileTtps = get(
      'body.result',
      await requestWithDefaults({
        route: `analyses/${file.analysis_id}/dynamic-ttps`,
        options
      })
    );

    const ttpsWithFormattedData = formatTtpsData(fileTtps);

    const mitreAttackTechniqueDetections = getMitreAttackTechniqueDetections(fileTtps);

    callback(null, {
      result: {
        techniques: ttpsWithFormattedData,
        mitreAttackTechniqueDetections
      }
    });
  } catch (error) {
    const err = parseErrorToReadableJson(error);

    let requestErrorMessage;
    try {
      requestErrorMessage = get('error', JSON.parse(err.description));
    } catch (e) {}

    const dynamicExecutionNotPossible =
      err.status === 404 && requestErrorMessage === 'Report not found';

    if (dynamicExecutionNotPossible) {
      callback(null, { result: { dynamicExecutionNotPossible: true } });
      return;
    }

    Logger.error(
      {
        formattedError: err,
        error
      },
      'Getting File TTPs Failed'
    );
    return callback({
      errors: [
        {
          err: error,
          detail: error.message || 'Getting File TTPs Failed'
        }
      ]
    });
  }
};

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
    mapValues(map(get('technique'))),
    (attackTechniques) => !!size(attackTechniques) && attackTechniques
  )(ttps);

module.exports = getFileTtps;
