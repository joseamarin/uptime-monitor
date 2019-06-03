/*
 * Request handlers
 *
 */

const _data = require('./data');
const helpers = require('./helpers');

// Handlers
const handlers = {};

// Users
handlers.users = (data, cb) => {
  const methods = ['post', 'get', 'put', 'delete'];
  if (methods.indexOf(data.method) > -1) {
    handlers._users[data.method](data, cb);
  }
  cb(null, 405);
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
    ? data.payload.phone
    : null;

  const pwd = typeof (data.payload.pwd) === 'string' &&
    data.payload.pwd.trim().length > 0
    ? data.payload.pwd
    : null;

  const tos = typeof (data.payload.tos) === 'boolean' &&
    data.payload.tos === true
    ? true
    : !!false;

  if (fname && lname && phone && pwd && tos) {
    // Check if user exists
    _data.read('users', phone, (err, data) => {
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
          _data.create('users', phone, user, err => {
            if (err) {
              cb(err, 500, 'Could not create user');
            }
            cb(null, 200);
          });
        }
        cb(err, 500, 'Could not hash the password');
      }
      // User already exists
      cb(null, err, 'User with that phone number already exists');
    });
  } else {
    // Missing required fields
    cb(null, 400);
  }
};

// Users get
handlers._users.get = (data, cb) => {
};

// Users put
handlers._users.put = (data, cb) => {
};

// Users delete
handlers._users.delete = (data, cb) => {
};

handlers.notFound = (data, cb) => {
  cb(null, 404);
};

handlers.ping = (data, cb) => {
  cb(null, 200);
};

module.exports = handlers;
