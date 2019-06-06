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

  checkData.id = typeof (checkData.id) === 'string' &&
    checkData.id.trim().length === 20
    ? checkData.id.trim() : false;

  checkData.userPhone = typeof (checkData.userPhone) === 'string' &&
    checkData.userPhone.trim().length === 10
    ? checkData.userPhone.trim() : false;

  checkData.protocol = typeof (checkData.protocol) === 'string' &&
    ['http', 'https'].indexOf(checkData.protocol) > -1
    ? checkData.protocol.trim() : false;

  checkData.url = typeof (checkData.url) === 'string' &&
    checkData.url.trim().length > 0
    ? checkData.url.trim() : false;

  checkData.method = typeof (checkData.method) === 'string' &&
    ['post', 'get', 'put', 'delete'].indexOf(checkData.method) > -1
    ? checkData.method.trim() : false;

  checkData.successCodes = typeof (checkData.successCodes) === 'object' &&
    checkData.successCodes instanceof Array &&
    checkData.successCodes.trim().length > 0
    ? checkData.successCodes.trim() : false;
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
