var async = require('async'),
  path = require('path'),
  fUtils = require('./files'),
  cp = require('child_process');

var gitApp = 'git', gitExtra = { env: process.env };

module.exports.isRepositoryClean = function (callback) {
  cp.exec(gitApp + ' ' + [ 'status', '--porcelain' ].join(' '), gitExtra, function (er, stdout, stderr) {
    // makeCommit parly inspired and taken from NPM version module
    var lines = stdout.trim().split('\n').filter(function (line) {
      var file = path.basename(line.replace(/.{1,2}\s+/, ''));
      return line.trim() && !line.match(/^\?\? /) && !fUtils.isPackageFile(line);
    }).map(function (line) {
      return line.trim()
    });

    if (lines.length) {
      return callback(new Error('Git working directory not clean.\n'+lines.join('\n')));
    }
    return callback();
  });
};

module.exports.commit = function (files, message, newVer, noPrefix, callback) {
  message = message.replace('%s', newVer).replace('"', '').replace("'", '');

  var functionSeries = [
    function (done) {
      cp.exec(gitApp + ' add ' + files.join(' '), gitExtra, done);
    },

    function (done) {
      cp.exec([gitApp, 'commit', '-m', '"' + message + '"'].join(' '), gitExtra, done);
    },

    function (done) {
      cp.exec(
        [
          gitApp, 'tag', '-a', (noPrefix ? '' : 'v') + newVer, '-m', '"' + message + '"'
        ].join(' '),
        gitExtra, done
      );
    }
  ];
  async.series(functionSeries, callback);
};
