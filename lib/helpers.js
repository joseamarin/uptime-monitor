/*
 * Utility functions
 *
 */

const crypto = require('crypto');
const { hashingSecret } = require('./config');

const helpers = {};

// Create a SHA256 hash
helpers.hash = string => {
  if (typeof (string) === 'string' && string.length > 0) {
    const hash = crypto.createHmac('sha256', hashingSecret)
      .update(string).digest('hex');

    return hash;
  }
  return false;
};

// Parse a JSON string to an object without throwing
helpers.parseJsonToObj = string => {
  try {
    const obj = JSON.parse(string);
    return obj;
  } catch (err) {
    return err;
  }
};

module.exports = helpers;