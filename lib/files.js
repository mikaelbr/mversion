var minimatch = require('minimatch');
var fs = require('vinyl-fs');
var rc = require('rc');

exports._files = [
  'package.json',
  'npm-shrinkwrap.json',
  '*.jquery.json',
  'component.json',
  'bower.json',
  'manifest.json',
  'composer.json'
];

module.exports.loadFiles = function () {
  return fs.src(exports._files);
};

module.exports.getRC = function () {
  return rc('mversion');
};

module.exports.isPackageFile = function (file) {
  for (var i = 0; i < exports._files.length; i++) {
    if (minimatch(file, exports._files[i])) {
      return true;
    }
  }
  return false;
};

// Preserver new line at the end of a file
module.exports.getLastChar = function (json) {
  return (json.slice(-1) === '\n') ? '\n' : '';
};

// Figured out which "space" params to be used for JSON.stringfiy.
module.exports.space = function (json) {
    var match = json.match(/^(?:(\t+)|( +))"/m);
    return match ? (match[1] ? '\t' : match[2].length) : ''
};