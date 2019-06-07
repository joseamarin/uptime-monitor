const path = require('path');
const fs = require('fs');
const http = require('http');
const https = require('https');
const url = require('url');

const _fileio = require('./fileio');
const helpers = require('./helpers');

const workers = {};

workers.validateCheckData = checkData => {
  checkData = typeof (checkData) === 'object' &&
    checkData != null ? checkData : {};

  checkData.checkId = typeof (checkData.checkId) === 'string' &&
    checkData.checkId.trim().length === 20
    ? checkData.checkId.trim() : false;

  checkData.userPhone = typeof (checkData.userPhone) === 'string' &&
    checkData.userPhone.trim().length === 10
    ? checkData.userPhone.trim() : false;

  checkData.protocol = typeof (checkData.protocol) === 'string' &&
    ['http', 'https'].indexOf(checkData.protocol) > -1
    ? checkData.protocol : false;

  checkData.url = typeof (checkData.url) === 'string' &&
    checkData.url.trim().length > 0
    ? checkData.url.trim() : false;

  checkData.method = typeof (checkData.method) === 'string' &&
    ['post', 'get', 'put', 'delete'].indexOf(checkData.method) > -1
    ? checkData.method.trim() : false;

  checkData.successCodes = typeof (checkData.successCodes) === 'object' &&
    checkData.successCodes instanceof Array &&
    checkData.successCodes.length > 0
    ? checkData.successCodes : false;

  checkData.timeoutSecs = typeof (checkData.timeoutSecs) === 'number' &&
    checkData.timeoutSecs % 1 === 0 &&
    checkData.timeoutSecs >= 1 &&
    checkData.timeoutSecs <= 5
    ? checkData.timeoutSecs : false;

  // Set the keys that may not be set
  checkData.state = typeof (checkData.state) === 'string' &&
    ['UP', 'DOWN'].indexOf(checkData.state) > -1
    ? checkData.state : 'DOWN';

  checkData.lastChecked = typeof (checkData.lastChecked) === 'number' &&
    checkData.lastChecked.length > 0 ? checkData.lastChecked : false;

  // If all the checks passed, pass the data to the next step in the chain
  const checks = checkData.checkId &&
    checkData.userPhone &&
    checkData.protocol &&
    checkData.url &&
    checkData.method &&
    checkData.successCodes &&
    checkData.timeoutSecs;

  if (checks) {
    workers.performCheck(checkData);
  } else {
    console.log({ 'ERROR': 'Skipping improperly formatted check' });
  }
};

// Perform the check, send the original check data and the outcome to the next step
workers.performCheck = checkData => {
  // Prepare the initial check outcome
  const checkOutcome = {
    'error': false,
    'responseCode': false
  };

  // Mark that the checkOutcome has not been sent yet
  let outcome = false;

  // Parse the hostname and path out of the original check data
  const parsedUrl = url.parse(`${checkData.protocol}://${checkData.url}`, true);
  const hostname = parsedUrl.hostname;
  const path = parsedUrl.path;

  const requestDetails = {
    'protocol': checkData.protocol + ':',
    'hostname': hostname,
    'method': checkData.method.toUpperCase(),
    'path': path,
    'timeout': checkData.timeoutSecs * 1000
  };

  const _moduleToUse = checkData.protocol === 'http' ? http : https;

  const req = _moduleToUse.request(requestDetails, res => {
    const status = res.statusCode;

    // Update the checkOutcome
    checkOutcome.responseCode = status;

    console.log(checkOutcome);
    if (!outcome) {
      workers.processCheckOutcome(checkData, outcome);
      outcome = true;
    }
  });

  // Bind to the err event so it doesn't get thrown
  req.on('error', event => {
    // Update the checkOutcome
    checkOutcome.error = {
      'error': true,
      'value': event
    };
    if (!outcome) {
      workers.processCheckOutcome(checkData, outcome);
      outcome = true;
    }
  });

  // Bind to the timeout event
  req.on('timeout', () => {
    // Update the checkOutcome
    checkOutcome.error = {
      'error': true,
      'value': 'timeout'
    };
    if (!outcome) {
      workers.processCheckOutcome(checkData, outcome);
      outcome = true;
    }
  });

  req.end(); // End
};

// Process the check outcome and update the check data, and trigger alert
workers.processCheckOutcome = (checkData, outcome) => {
  // Is the check up or down?
  const state = !outcome.error &&
    outcome.responseCode &&
    checkData.successCodes.indexOf(outcome.responseCode) > -1
    ? 'UP' : 'DOWN';

  // Send alert?
  const alertWarrented = checkData.lastChecked &&
    checkData.state !== state ? Boolean(true) : false;

  // Update the check data
  const newData = checkData;
  newData.state = state;
  newData.lastChecked = Date.now();

  // Save the updates
  _fileio.update('checks', newData.checkId, newData, err => {
    if (err) {
      console.log({ 'ERROR': 'Could not save update to check: ' + newData.checkId });
    } else {
      // Send the new data to the next step to alert via SMS or not
      if (alertWarrented) {
        workers.alertStatusChange(newData);
      } else {
        console.log({ 'ERROR': 'Check status has not changed, aborting SMS' });
      }
    }
  });
};

// Alert the user
workers.alertStatusChange = data => {
  const msg = `ALERT: Your ${data.method.toUpperCase()}${data.protocol}://${data.url} is currently ${data.state}`;

  helpers.sendTwilioSms(data.userPhone, msg, err => {
    if (err) {
      console.log({ 'ERROR': err });
    } else {
      console.log({ 'SUCCESS': 'Alert was sent>> ' + msg });
    }
  });
};

workers.gatherChecks = () => {
  // Get all checks
  _fileio.list('checks', (err, checks) => {
    if (!err && checks && checks.length > 0) {
      checks.forEach(check => {
        _fileio.read('checks', check, (err, originalCheckData) => {
          if (!err && originalCheckData) {
            workers.validateCheckData(originalCheckData);
          } else {
            console.log({ 'ERROR': 'Error reading one of the checks data' });
          }
        });
      });
    } else {
      console.log({ 'ERROR': 'Could not find any checks to process' });
    }
  });
};

// Timer
workers.loop = () => {
  setInterval(() => {
    workers.gatherChecks();
  }, 1000 * 60);
};

workers.init = () => {
  // Execute all the checks immediately
  workers.gatherChecks();
  // Call the loop so the checks will execute later on
  workers.loop();
};

module.exports = workers;
