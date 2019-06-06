/*
 * Request handlers
 *
 */

const _fileio = require('./fileio');
const helpers = require('./helpers');
const { maxChecks } = require('./config');

// Handlers
const handlers = {};

// Users
handlers.users = (data, cb) => {
  const methods = ['post', 'get', 'put', 'delete'];
  if (methods.indexOf(data.method) > -1) {
    handlers._users[data.method](data, cb);
  } else {
    cb(null, 405);
  }
};

// Container for users submethods
handlers._users = {};

/*
 * @function _users.post
 *
 * @param {string} fname
 * @param {string} lname
 * @param {string} phone
 * @param {string} pwd
 * @param {boolean} tos
 */
handlers._users.post = (data, cb) => {
  const fname = typeof (data.payload.fname) === 'string' &&
    data.payload.fname.trim().length > 0
    ? data.payload.fname.trim()
    : null;

  const lname = typeof (data.payload.lname) === 'string' &&
    data.payload.lname.trim().length > 0
    ? data.payload.lname.trim()
    : null;

  const phone = typeof (data.payload.phone) === 'string' &&
    data.payload.phone.trim().length === 10
    ? data.payload.phone.trim()
    : null;

  const pwd = typeof (data.payload.pwd) === 'string' &&
    data.payload.pwd.trim().length > 0
    ? data.payload.pwd.trim()
    : null;

  const tos = typeof (data.payload.tos) === 'boolean' &&
    data.payload.tos === true
    ? true
    : !!false;

  if (fname && lname && phone && pwd && tos) {
    // Check if user exists
    _fileio.read('users', phone, (err, data) => {
      if (err) {
        // Hash the pwd
        const hashedPwd = helpers.hash(pwd);

        // Create the user object
        if (hashedPwd) {
          const user = {
            fname,
            lname,
            phone,
            hashedPwd,
            tos: true
          };

          // Persist that user to disk
          _fileio.create('users', phone, user, err => {
            if (err) {
              cb(err, 500, { 'ERROR': 'Could not create user' });
            } else {
              cb(null, 200);
            }
          });
        } else {
          cb(err, 500, { 'ERROR': 'Could not hash the password' });
        }
      } else {
        // User already exists
        cb(err, 400, { 'ERROR': 'User with that phone number already exists' });
      }
    });
  } else {
    // Missing required fields
    cb(null, 400, { 'ERROR': 'Missing required fields' });
  }
};

/*
 * @func _users.get
 * @param {string} phone
 *
 */
handlers._users.get = (data, cb) => {
  // Check for valid phone number
  const phone = typeof (data.queryStringObj.phone) === 'string' &&
    data.queryStringObj.phone.trim().length === 10
    ? data.queryStringObj.phone.trim()
    : false;
  if (phone) {
    // Get the token from the headers
    const token = typeof (data.headers.token) === 'string'
      ? data.headers.token
      : false;

    // Check that the token is valid for the phone number given in the request
    handlers._tokens.verifyToken(token, phone, (err, valid) => {
      if (valid) {
        // Look up the user
        _fileio.read('users', phone, (err, data) => {
          if (!err && data) {
            // Remove the hashed pwd from the user object before returning it
            delete data.hashedPwd;
            cb(null, 200, data);
          } else {
            cb(err, 400, { 'ERROR': 'Could not find the user' });
          }
        });
      } else {
        cb(err, 403, { 'ERROR': 'Invalid or missing token in header' });
      }
    });
  } else {
    cb(null, 400, { 'ERROR': 'Missing required field' });
  }
};

/*
 * @func _users.put
 * @param {string} phone
 * @param {string} [fname]
 * @param {string} [lname]
 * @param {string} [pwd]
 * fname, lname, or pwd is required
 */
handlers._users.put = (data, cb) => {
  // Check for required
  const phone = typeof (data.payload.phone) === 'string' &&
    data.payload.phone.trim().length === 10
    ? data.payload.phone.trim()
    : false;

  // Check for ops
  const fname = typeof (data.payload.fname) === 'string' &&
    data.payload.fname.trim().length > 0
    ? data.payload.fname.trim()
    : null;

  const lname = typeof (data.payload.lname) === 'string' &&
    data.payload.lname.trim().length > 0
    ? data.payload.lname.trim()
    : null;

  const pwd = typeof (data.payload.pwd) === 'string' &&
    data.payload.pwd.trim().length > 0
    ? data.payload.pwd.trim()
    : null;

  if (phone) {
    if (fname || lname || pwd) {
      // Get the token from the headers
      const token = typeof (data.headers.token) === 'string'
        ? data.headers.token
        : false;

      // Check that the token is valid for the phone number given in the request
      handlers._tokens.verifyToken(token, phone, (err, valid) => {
        if (valid) {
          // Look up the user
          _fileio.read('users', phone, (err, userData) => {
            if (!err && userData) {
              // Update field here
              if (fname) {
                userData.fname = fname;
              }
              if (lname) {
                userData.lname = lname;
              }
              if (pwd) {
                userData.hashedPwd = helpers.hash(pwd);
              }
              // Store the new updates
              _fileio.update('users', phone, userData, err => {
                if (err) {
                  cb(err, 500, { 'ERROR': 'Could not update the user' });
                } else {
                  cb(null, 200);
                }
              });
            } else {
              cb(null, 400, { 'ERROR': 'The user does not exist' });
            }
          });
        } else {
          cb(err, 403, { 'ERROR': 'Invalid or missing token in header' });
        }
      });
    } else {
      cb(null, 400, { 'ERROR': 'Missing required field to update' });
    }
  } else {
    cb(null, 400, { 'ERROR': 'Missing phone number' });
  }
};

/*
 * @func _users.delete
 * @param {string} phone
 *
 */
handlers._users.delete = (data, cb) => {
  // Check for valid phone number
  const phone = typeof (data.queryStringObj.phone) === 'string' &&
    data.queryStringObj.phone.trim().length === 10
    ? data.queryStringObj.phone.trim()
    : false;
  if (phone) {
    // Get the token from the headers
    const token = typeof (data.headers.token) === 'string'
      ? data.headers.token
      : false;

    // Check that the token is valid for the phone number given in the request
    handlers._tokens.verifyToken(token, phone, (err, valid) => {
      if (valid) {
        // Look up the user
        _fileio.read('users', phone, (err, userData) => {
          if (!err && userData) {
            _fileio.delete('users', phone, err => {
              if (err) {
                cb(err, 500, { 'ERROR': 'Could not delete user' });
              } else {
                // Delete each check associated with the user
                const userChecks = typeof (userData.checks) === 'object' &&
                  userData.checks instanceof Array ? userData.checks : [];
                const checksToDel = userChecks.length;

                if (checksToDel > 0) {
                  let checksDeleted = 0;
                  let deletionErrs = false;

                  userChecks.forEach(checkId => {
                    _fileio.delete('checks', checkId, err => {
                      if (err) {
                        deletionErrs = true;
                      }
                      checksDeleted++;
                      if (checksDeleted === checksToDel) {
                        if (!deletionErrs) {
                          cb(null, 200);
                        } else {
                          const msg = {
                            'ERROR': `Errors encountered: ${deletionErrs}`
                          };
                          cb(null, 500, msg);
                        }
                      }
                    });
                  });
                } else {
                  cb(null, 200);
                }
              }
            });
          } else {
            cb(err, 400, { 'ERROR': 'Could not find user' });
          }
        });
      } else {
        cb(err, 403, { 'ERROR': 'Invalid or missing token in header' });
      }
    });
  } else {
    cb(null, 400, { 'ERROR': 'Missing required fields' });
  }
};

// Tokens
handlers.tokens = (data, cb) => {
  const methods = ['post', 'get', 'put', 'delete'];
  if (methods.indexOf(data.method) > -1) {
    handlers._tokens[data.method](data, cb);
  } else {
    cb(null, 405);
  }
};

// Container for tokens submethods
handlers._tokens = {};

/*
 * @func _tokens.post
 * @param {string} phone
 * @param {string} pwd
 */
handlers._tokens.post = (data, cb) => {
  const phone = typeof (data.payload.phone) === 'string' &&
    data.payload.phone.trim().length === 10
    ? data.payload.phone.trim()
    : null;

  const pwd = typeof (data.payload.pwd) === 'string' &&
    data.payload.pwd.trim().length > 0
    ? data.payload.pwd.trim()
    : null;

  if (phone && pwd) {
    // Look up the user who matches that phone number
    _fileio.read('users', phone, (err, userData) => {
      if (!err && userData) {
        // Hash the sent pwd and compare it to the pwd stored in userData
        const hashedPwd = helpers.hash(pwd);
        if (hashedPwd === userData.hashedPwd) {
          // If valid pwd create a token with a random name that expires in 1 hr
          const tokenId = helpers.createRanStr(20);
          const expires = Date.now() + 1000 * 60 * 60;
          const tokenObj = {
            phone,
            tokenId,
            expires
          };
          // Store the token
          _fileio.create('tokens', tokenId, tokenObj, err => {
            if (err) {
              cb(err, 500, { 'ERROR': 'Could not create the new token' });
            } else {
              cb(null, 200, tokenObj);
            }
          });
        } else {
          cb(err, 400, { 'ERROR': 'Password did not match' });
        }
      } else {
        cb(err, 400, { 'ERROR': 'Could not find the user' });
      }
    });
  } else {
    cb(null, 400, { 'ERROR': 'Missing required field(s)' });
  }
};

/*
 * @func _tokens.get
 * @param {string} id
 *
 */
handlers._tokens.get = (data, cb) => {
  const id = typeof (data.queryStringObj.id) === 'string' &&
    data.queryStringObj.id.trim().length === 20
    ? data.queryStringObj.id.trim()
    : false;
  if (id) {
    // Look up the token
    _fileio.read('tokens', id, (err, tokenData) => {
      if (!err && tokenData) {
        cb(null, 200, tokenData);
      } else {
        cb(err, 404, { 'ERROR': 'Could not find the token' });
      }
    });
  } else {
    cb(null, 400, { 'ERROR': 'Missing required field' });
  }
};

/*
 * @func _tokens.put
 * @param {string} id
 * @param {string} extend
 *
 */
handlers._tokens.put = (data, cb) => {
  const id = typeof (data.payload.id) === 'string' &&
    data.payload.id.trim().length === 20
    ? data.payload.id.trim()
    : null;

  const extend = typeof (data.payload.extend) === 'boolean' &&
    data.payload.extend === true
    ? !!true
    : false;

  if (id && extend) {
    // Look up the token
    _fileio.read('tokens', id, (err, tokenData) => {
      if (!err && tokenData) {
        // Has the token expired?
        if (tokenData.expires > Date.now()) {
          // Increase token expiration by 1 hr
          tokenData.expires = Date.now() + 1000 * 60 * 60;

          _fileio.update('tokens', id, tokenData, err => {
            if (err) {
              cb(err, 500, { 'ERROR': 'Could not extend token\'s expiration' });
            } else {
              cb(null, 200);
            }
          });
        } else {
          cb(err, 400, { 'ERROR': 'Token expired' });
        }
      } else {
        cb(err, 400, { 'ERROR': 'Token invalid' });
      }
    });
  } else {
    cb(null, 400, { 'ERROR': 'Missing required field(s) or field(s) invalid' });
  }
};

/*
 * @func _tokens.delete
 * @param {string} id
 *
 */
handlers._tokens.delete = (data, cb) => {
  // Check for valid id
  const id = typeof (data.queryStringObj.id) === 'string' &&
    data.queryStringObj.id.trim().length === 20
    ? data.queryStringObj.id.trim()
    : false;
  if (id) {
    // Look up the token
    _fileio.read('tokens', id, (err, data) => {
      if (!err && data) {
        _fileio.delete('tokens', id, err => {
          if (err) {
            cb(err, 500, { 'ERROR': 'Could not delete token' });
          } else {
            cb(null, 200);
          }
        });
      } else {
        cb(err, 400, { 'ERROR': 'Could not find token' });
      }
    });
  } else {
    cb(null, 400, { 'ERROR': 'Missing required fields' });
  }
};

/*
 * @func verifyToken
 * @param {string} id
 */
handlers._tokens.verifyToken = (id, phone, cb) => {
  // Look up the token
  _fileio.read('tokens', id, (err, tokenData) => {
    if (!err && tokenData) {
      // Check token against user and exp date
      if (tokenData.phone === phone && tokenData.expires > Date.now()) {
        cb(null, true);
      } else {
        cb(null); // return err here?
      }
    } else {
      cb(err);
    }
  });
};

handlers.checks = (data, cb) => {
  const methods = ['post', 'get', 'put', 'delete'];
  if (methods.indexOf(data.method) > -1) {
    handlers._checks[data.method](data, cb);
  } else {
    cb(null, 405);
  }
};

// Container for checks submethods
handlers._checks = {};

/*
 * @func _checks.post
 *
 * @param {string} protocol
 * @param {string} url
 * @param {string} method
 * @param {array}  successCodes
 * @param {number} timeoutSecs
 */
handlers._checks.post = (data, cb) => {
  const protocol = typeof (data.payload.protocol) === 'string' &&
    ['http', 'https'].indexOf(data.payload.protocol) > -1
    ? data.payload.protocol
    : null;

  const url = typeof (data.payload.url) === 'string' &&
    data.payload.url.trim().length > 0
    ? data.payload.url.trim()
    : null;

  const method = typeof (data.payload.method) === 'string' &&
    ['post', 'get', 'put', 'delete'].indexOf(data.payload.method) > -1
    ? data.payload.method
    : null;

  const successCodes = typeof (data.payload.successCodes) === 'object' &&
    data.payload.successCodes instanceof Array &&
    data.payload.successCodes.length > 0
    ? data.payload.successCodes
    : null;

  const timeoutSecs = typeof (data.payload.timeoutSecs) === 'number' &&
    data.payload.timeoutSecs % 1 === 0 &&
    data.payload.timeoutSecs >= 1 &&
    data.payload.timeoutSecs <= 5
    ? data.payload.timeoutSecs
    : null;

  if (protocol && url && method && successCodes && timeoutSecs) {
    // Get the token from the headers
    const token = typeof (data.headers.token) === 'string' ? data.headers.token : false;

    // Look up the user by matching against the token
    _fileio.read('tokens', token, (err, tokenData) => {
      if (!err && tokenData) {
        const userPhone = tokenData.phone;

        // Lookup user data
        _fileio.read('users', userPhone, (err, userData) => {
          if (!err && userData) {
            const userChecks = typeof (userData.checks) === 'object' &&
              userData.checks instanceof Array ? userData.checks : [];

            // Verify that user has less than maxChecks
            if (userChecks.length < maxChecks) {
              // Create id for check
              const checkId = helpers.createRanStr(20);

              // Create the check Object and include user phone number
              const checkObj = {
                checkId,
                userPhone,
                protocol,
                url,
                method,
                successCodes,
                timeoutSecs
              };

              // Save the object
              _fileio.create('checks', checkId, checkObj, err => {
                if (err) {
                  cb(err, 500, { 'ERROR': 'Could not create the new check' });
                } else {
                  // Add the checkId to the users object
                  userData.checks = userChecks;
                  userData.checks.push(checkId);

                  // Save the new user data
                  _fileio.update('users', userPhone, userData, (err) => {
                    if (err) {
                      cb(err, { 'ERROR': 'Unable to add check to users data' });
                    } else {
                      // Return the data about the new check
                      cb(null, 200, checkObj);
                    }
                  });
                }
              });
            } else {
              const msg = `User already has ${userChecks.length} checks`;
              cb(null, 400, { 'ERROR': msg });
            }
          } else {
            cb(err, 403);
          }
        });
      } else {
        cb(err, 403);
      }
    });
  } else {
    cb(null, 400, { 'ERROR': 'Invalid or missing required inputs' });
  }
};

/*
 * @func _checks.get
 * @param {string} id
 *
 */
handlers._checks.get = (data, cb) => {
  // Check for valid phone number
  const id = typeof (data.queryStringObj.id) === 'string' &&
    data.queryStringObj.id.trim().length === 20
    ? data.queryStringObj.id.trim()
    : false;
  if (id) {
    // Look up the check
    _fileio.read('checks', id, (err, checkData) => {
      if (!err && checkData) {
        // Get the token from the headers
        const token = typeof (data.headers.token) === 'string'
          ? data.headers.token
          : false;

        // Check that the token is valid for the phone number
        // and belongs to the same user
        handlers._tokens.verifyToken(token, checkData.userPhone, (err, valid) => {
          if (valid) {
            cb(null, 200, checkData);
          } else {
            cb(err, 403);
          }
        });
      } else {
        cb(err, 404);
      }
    });
  } else {
    cb(null, 400, { 'ERROR': 'Missing required field' });
  }
};

/*
 * @func _checks.put
 * @param {string} id
 * @param {string} [protocol]
 * @param {string} [url]
 * @param {string} [method]
 * @param {array}  [successCodes]
 * @param {number} [timeoutSecs]
 *
 */
handlers._checks.put = (data, cb) => {
  // Check for required
  const id = typeof (data.payload.id) === 'string' &&
    data.payload.id.trim().length === 20
    ? data.payload.id.trim()
    : false;

  // Check for ops
  const protocol = typeof (data.payload.protocol) === 'string' &&
    ['http', 'https'].indexOf(data.payload.protocol) > -1
    ? data.payload.protocol
    : null;

  const url = typeof (data.payload.url) === 'string' &&
    data.payload.url.trim().length > 0
    ? data.payload.url.trim()
    : null;

  const method = typeof (data.payload.method) === 'string' &&
    ['post', 'get', 'put', 'delete'].indexOf(data.payload.method) > -1
    ? data.payload.method
    : null;

  const successCodes = typeof (data.payload.successCodes) === 'object' &&
    data.payload.successCodes instanceof Array &&
    data.payload.successCodes.length > 0
    ? data.payload.successCodes
    : null;

  const timeoutSecs = typeof (data.payload.timeoutSecs) === 'number' &&
    data.payload.timeoutSecs % 1 === 0 &&
    data.payload.timeoutSecs >= 1 &&
    data.payload.timeoutSecs <= 5
    ? data.payload.timeoutSecs
    : null;

  if (id) {
    if (protocol || url || method || successCodes || timeoutSecs) {
      _fileio.read('checks', id, (err, checkData) => {
        if (!err && checkData) {
          // Get the token from the headers
          const token = typeof (data.headers.token) === 'string'
            ? data.headers.token
            : false;

          handlers._tokens.verifyToken(token, checkData.userPhone, (err, valid) => {
            if (valid) {
              // Update the check
              if (protocol) {
                checkData.protocol = protocol;
              }
              if (url) {
                checkData.url = url;
              }
              if (method) {
                checkData.method = method;
              }
              if (successCodes) {
                checkData.successCodes = successCodes;
              }
              if (timeoutSecs) {
                checkData.timeoutSecs = timeoutSecs;
              }

              // Save the updates
              _fileio.update('checks', id, checkData, err => {
                if (err) {
                  cb(err, 500, { 'ERROR': 'Could not update the check' });
                } else {
                  cb(null, 200);
                }
              });
            } else {
              cb(err, 403);
            }
          });
        } else {
          cb(err, 400, { 'ERROR': 'Check ID did not exist' });
        }
      });
    } else {
      cb(null, 400, { 'ERROR': 'Missing field(s) to update' });
    }
  } else {
    cb(null, 400, { 'ERROR': 'Missing required field' });
  }
};

/*
 * @func _checks.delete
 * @param {string} id
 *
 */
handlers._checks.delete = (data, cb) => {
  // Check for valid id
  const id = typeof (data.queryStringObj.id) === 'string' &&
    data.queryStringObj.id.trim().length === 20
    ? data.queryStringObj.id.trim()
    : false;
  if (id) {
    // Look up check to delete
    _fileio.read('checks', id, (err, checkData) => {
      if (!err && checkData) {
        // Get the token from the headers
        const token = typeof (data.headers.token) === 'string'
          ? data.headers.token
          : false;

        // Check that the token is valid for the phone given in the request
        handlers._tokens.verifyToken(token, checkData.userPhone, (err, valid) => {
          if (valid) {
            // Delete the check data
            _fileio.delete('checks', id, err => {
              if (err) {
                cb(err, 500, { 'ERROR': 'Could not delete the check data' });
              } else {
                // Look up the user
                _fileio.read('users', checkData.userPhone, (err, userData) => {
                  if (!err && userData) {
                    const userChecks = typeof (userData.checks) === 'object' &&
                      userData.checks instanceof Array ? userData.checks : [];

                    // Remove the deleted check from list of checks
                    const checkPos = userChecks.indexOf(id);

                    if (checkPos > -1) {
                      userChecks.splice(checkPos, 1);

                      // Save the users modified data
                      _fileio.update('users', checkData.userPhone, userData, err => {
                        if (err) {
                          cb(err, 500, { 'ERROR': 'Could not update the user' });
                        } else {
                          cb(null, 200);
                        }
                      });
                    } else {
                      cb(null, 500, { 'ERROR': 'Could not find the check' });
                    }
                  } else {
                    cb(err, 500, { 'ERROR': 'Could not find owner of check' });
                  }
                });
              }
            });
          } else {
            cb(err, 403);
          }
        });
      } else {
        cb(err, 400, { 'ERROR': 'Invalid ID' });
      }
    });
  } else {
    cb(null, 400, { 'ERROR': 'Missing required fields' });
  }
};

handlers.notFound = (data, cb) => {
  cb(null, 404);
};

handlers.ping = (data, cb) => {
  cb(null, 200);
};

module.exports = handlers;
