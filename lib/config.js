/*
 * Create and export config variables
 *
 */

const environments = {};

environments.staging = {
  'httpPort': 3000,
  'httpsPort': 3003,
  'envName': 'staging',
  'hashingSecret': 'foo'
};

environments.prod = {
  'httpPort': 5000,
  'httpsPort': 5003,
  'envName': 'production',
  'hashingSecret': 'foo'
};

const currentEnv = typeof (process.env.NODE_ENV) === 'string'
  ? process.env.NODE_ENV.toLowerCase()
  : '';

const envToExport = typeof (environments[currentEnv]) === 'object'
  ? environments[currentEnv]
  : environments.staging;

module.exports = envToExport;
