const { get, flow, eq, first, find, getOr, size, tail } = require('lodash/fp');

const {
  logging: { getLogger },
  errors: { parseErrorToReadableJson }
} = require('polarity-integration-utils');

const { requestWithDefaults } = require('../request');

const getFileBehavior = async ({ file }, options, callback) => {
  const Logger = getLogger();
  try {
    const filesBehavior = get(
      'body.result',
      await requestWithDefaults({
        route: `analyses/${file.analysis_id}/behavior`,
        options
      })
    );

    const processTreeWithTabs = addTabsToProcessTree(filesBehavior.process_tree);

    callback(null, { result: { ...filesBehavior, processTreeWithTabs } });
  } catch (error) {
    const err = parseErrorToReadableJson(error);

    let requestErrorMessage;
    try {
      requestErrorMessage = get('error', JSON.parse(err.description));
    } catch (e) {}

    const dynamicExecutionNotPossible =
      err.status === 404 && requestErrorMessage === 'Behavior report not found';

    if (dynamicExecutionNotPossible) {
      callback(null, { result: { dynamicExecutionNotPossible: true } });
      return;
    }

    Logger.error(
      {
        formattedError: err,
        error
      },
      'Getting File Behavior Failed'
    );
    return callback({
      errors: [
        {
          err: error,
          detail: error.message || 'Getting File Behavior Failed'
        }
      ]
    });
  }
};

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

module.exports = getFileBehavior;
