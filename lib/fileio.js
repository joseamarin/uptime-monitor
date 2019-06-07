/*
 * Library for storing and editing data
 * CRUD operations
 */

const fs = require('fs');
const path = require('path');
const helpers = require('./helpers');

const lib = {};

lib.baseDir = path.join(__dirname, '../.data/');

// Write data to file
lib.create = (dir, file, data, cb) => {
  // Open file
  fs.open(lib.baseDir + dir + '/' + file + '.json', 'wx', (err, filedescriptor) => {
    if (!err && filedescriptor) {
      // Convert data to a String
      const stringData = JSON.stringify(data);
      // Write to file and close it
      fs.writeFile(filedescriptor, stringData, err => {
        if (err) {
          cb(err, 'Error writing to new file');
        } else {
          // Close file
          fs.close(filedescriptor, err => {
            if (err) {
              cb(err, 'Error closing new file');
            } else {
              cb(null);
            }
          });
        }
      });
    } else {
      cb(err, 'Could not create a new file, it may already exist.');
    }
  });
};

// Read data from file
lib.read = (dir, file, cb) => {
  fs.readFile(`${lib.baseDir}${dir}/${file}.json`, 'utf8', (err, data) => {
    if (!err && data) {
      const parsedData = helpers.parseJsonToObj(data);
      cb(null, parsedData);
    } else {
      cb(err);
    }
  });
};

// Update a file
lib.update = (dir, file, data, cb) => {
  fs.open(lib.baseDir + dir + '/' + file + '.json', 'r+', (err, filedescriptor) => {
    if (!err && filedescriptor) {
      // Convert data to a String
      const stringData = JSON.stringify(data);

      // Truncate contents of the file
      fs.ftruncate(filedescriptor, err => {
        if (err) {
          cb(err, 'Error truncating file');
        } else {
          fs.writeFile(filedescriptor, stringData, err => {
            if (err) {
              cb(err);
            } else {
              fs.close(filedescriptor, err => {
                if (err) {
                  cb(err);
                } else {
                  cb(null);
                }
              });
            }
          });
        }
      });
    } else {
      cb(err, 'Could not open the file');
    }
  });
};

// Delete a file
lib.delete = (dir, file, cb) => {
  fs.unlink(lib.baseDir + dir + '/' + file + '.json', err => {
    if (err) {
      cb(err);
    } else {
      cb(null);
    }
  });
};

// List all the files in a directory
lib.list = (dir, cb) => {
  fs.readdir(lib.baseDir + dir + '/', (err, files) => {
    if (!err && files && files.length > 0) {
      const trimmedFileNames = [];
      files.forEach(file => {
        trimmedFileNames.push(file.replace(/.json/, ''));
        // trimmedFileNames.push(path.basename(file));
      });
      cb(null, trimmedFileNames);
    } else {
      cb(err);
    }
  });
};

module.exports = lib;
