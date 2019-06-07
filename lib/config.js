/*
 * Create and export config variables
 *
 */

const environments = {};

environments.staging = {
  'httpPort': 3000,
  'httpsPort': 3003,
  'envName': 'staging',
  'hashingSecret': 'foo',
  'maxChecks': 5,
  'twilio': {
    'accountSid': 'ACb32d411ad7fe886aac54c665d25e5c5d',
    'authToken': '9455e3eb3109edc12e3d8c92768f7a67',
    'fromPhone': '+15005550006'
  }
};

environments.prod = {
  'httpPort': 5000,
  'httpsPort': 5003,
  'envName': 'production',
  'hashingSecret': 'foo',
  'maxChecks': 5,
  'twilio': {
    'accountSid': '',
    'authToken': '',
    'fromPhone': ''
  }
};

const currentEnv = typeof (process.env.NODE_ENV) === 'string'
  ? process.env.NODE_ENV.toLowerCase()
  : '';

const envToExport = typeof (environments[currentEnv]) === 'object'
  ? environments[currentEnv]
  : environments.staging;

module.exports = envToExport;
