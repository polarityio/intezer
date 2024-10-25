const { map, get, getOr, filter, flow, negate, isEmpty } = require('lodash/fp');
const { parallelLimit } = require('async');

const {
  requests: { createRequestWithDefaults }
} = require('polarity-integration-utils');
const config = require('../config/config');
const NodeCache = require('node-cache');
const tokenCache = new NodeCache({
  stdTTL: 2 * 59 * 60 // Tokens reset ever 2 hours
});

const requestForAuth = createRequestWithDefaults({
  config,
  roundedSuccessStatusCodes: [200],
  requestOptionsToOmitFromLogsKeyPaths: ['headers.api_key'],
  postprocessRequestResponse: (response) => ({
    ...response,
    body: JSON.parse(get('body', response))
  }),
  postprocessRequestFailure: (error) => {
    error.message = `Authentication Failed: Check Credentials and Try Again - (${error.status})`;

    throw error;
  }
});

const requestWithDefaults = createRequestWithDefaults({
  config,
  roundedSuccessStatusCodes: [200],
  requestOptionsToOmitFromLogsKeyPaths: ['headers.Authentication'],
  preprocessRequestOptions: async ({ route, options, ...requestOptions }) => {
    const token = await getAuthToken(options);

    return {
      ...requestOptions,
      url: `${options.url}/api/v2-0/${route}`,
      headers: {
        Authorization: `Bearer ${token}`
      },
      json: true
    };
  },
  postprocessRequestFailure: (error) => {
    const errorResponseBody = JSON.parse(error.description);
    error.message = `${error.message} - (${error.status})${
      errorResponseBody.message || errorResponseBody.error
        ? `| ${errorResponseBody.message || errorResponseBody.error}`
        : ''
    }`;

    throw error;
  }
});

const getAuthToken = async ({ url, apiKey }) => {
  const cachedToken = tokenCache.get(apiKey);
  if (cachedToken) return cachedToken;

  const accessToken = get(
    'body.result',
    await requestForAuth({
      method: 'POST',
      url: `${url}/api/v2-0/get-access-token`,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ api_key: apiKey })
    })
  );

  tokenCache.set(apiKey, accessToken);

  return accessToken;
};

const createRequestsInParallel =
  (requestWithDefaults) =>
  async (
    requestsOptions,
    responseGetPath,
    limit = 10,
    onlyReturnPopulatedResults = true
  ) => {
    const unexecutedRequestFunctions = map(
      ({ resultId, ...requestOptions }) =>
        async () => {
          const response = await requestWithDefaults(requestOptions);
          const result = responseGetPath ? get(responseGetPath, response) : response;
          return resultId ? { resultId, result } : result;
        },
      requestsOptions
    );

    const results = await parallelLimit(unexecutedRequestFunctions, limit);

    return onlyReturnPopulatedResults
      ? filter(
          flow((result) => getOr(result, 'result', result), negate(isEmpty)),
          results
        )
      : results;
  };

const requestsInParallel = createRequestsInParallel(requestWithDefaults);

module.exports = {
  requestWithDefaults,
  requestsInParallel
};
