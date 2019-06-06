/*
 * Utility functions
 *
 */

const crypto = require('crypto');
const querystring = require('querystring');
const https = require('https');
const config = require('./config');

const helpers = {};

// Create a SHA256 hash
helpers.hash = string => {
  if (typeof (string) === 'string' && string.length > 0) {
    const hash = crypto.createHmac('sha256', config.hashingSecret)
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

// Create a random alphanumeric string of a specified length
helpers.createRanStr = length => {
  length = typeof (length) === 'number' && length > 0 ? length : false;
  if (length) {
    let string = '';
    while (string.length < length) {
      string += Math.random().toString(36).slice(2);
    }
    return string.substring(0, length);
  }
};

// Send an SMS through Twilio
helpers.sendTwilioSms = (phone, msg, cb) => {
  phone = typeof (phone) === 'string' &&
    phone.trim().length === 10 ? phone.trim() : false;

  msg = typeof (msg) === 'string' &&
    msg.trim().length > 0 &&
    msg.trim().length <= 1600 ? msg : false;

  if (phone && msg) {
    // Configure the request payload
    const payload = {
      'From': config.twilio.fromPhone,
      'To': '+1' + phone,
      'Body': msg
    };

    // Stringify the payload
    const stringPayload = querystring.stringify(payload);

    // Configure the request details
    const reqDetails = {
      'protocol': 'https:',
      'hostname': 'https://api.twilio.com/',
      'method': 'POST',
      'path': `2010-04-01/Accounts/${config.twilio.accountSid}/Messages.json`,
      'auth': `${config.twilio.accountSid}:${config.twilio.authToken}`,
      'headers': {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(stringPayload)
      }
    };

    // Instantiate the request object
    const request = https.request(reqDetails, response => {
      // Grab the status of the sent request
      const status = response.statusCode;
      if (status === 200 || status === 201) {
        cb(null, status);
      } else {
        cb(null, status);
      }
    });

    // Bind to the error event so it doesn't get thrown
    request.on('error', event => {
      cb(event);
    });

    // Add the payload to the request
    request.write(stringPayload);

    // End the request
    request.end();
  } else {
    cb(null, { 'ERROR': 'Parameters missing or invalid' });
  }
};

module.exports = helpers;
