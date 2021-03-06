var fs = require('fs');
var path = require('path');
var Q = require('q');
var spawn = require('cross-spawn-async');

// Recursively make a directory
exports.mkdirp = function(folder) {
  if(!folder) {
    return Q(process.cwd());
  }

  var parts = folder.split(path.sep);
  var dfd = Q();
  var current = '';

  parts.forEach(function(part) {
    var myPath = path.join(current, part);

    current = myPath;

    var resolve = function() {
      return myPath;
    };

    dfd = dfd.then(function() {
      return Q.nfcall(fs.mkdir, myPath).then(resolve, resolve);
    });
  });

  return dfd.then(function(myPath) {
    return path.join(process.cwd(), myPath);
  });
};

// Run a command and pipe the output.
// The returned promise will reject if there is a non-zero exist status
exports.spawn = function(cmd, args, options) {
  options.stdio = 'inherit';

  var child = spawn(cmd, args, options || { cwd: process.cwd() });
  var deferred = Q.defer();

  child.on('exit', function(status) {
    if(status) {
      deferred.reject(new Error('Command `' + cmd +
        '` did not complete successfully'));
    } else {
      deferred.resolve(child);
    }
  });

  return deferred.promise;
};

// Returns the NPM root
exports.projectRoot = function() {
  var root = process.cwd();
  var current = root;

  while(current && !fs.existsSync(path.join(current, 'node_modules')) ) {
    if(current === path.dirname(current)) {
      return Q(root);
    }

    current = path.dirname(current);
  }

  return Q(current || root);
};

// Log error messages and exit application
exports.log = function(promise) {
  return promise.then(function() {
    process.exit(0);
  }, function(error) {
    console.error(error.stack || error.message || error);
    process.exit(1);
  });
};

// Takes an exact version like 0.5.7 and turns into a range like ^0.5.0
exports.versionRange = function(exactVersion){
  return "^" + exactVersion.substr(0, exactVersion.lastIndexOf(".")) + ".0";
};
