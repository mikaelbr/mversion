var semver = require('semver')
  , async = require('async')
  , path = require('path')
  , through = require('through2')
  , minimatch = require('minimatch')
  , fs = require('vinyl-fs')
  , exec = require('child_process').exec
  ;

exports._files = [
    'package.json'
  , 'npm-shrinkwrap.json'
  , 'component.json'
  , 'bower.json'
  , 'manifest.json'
];

var gitApp = 'git'
  , gitExtra = { env: process.env }
  ;

exports._loadFiles = function (cb) {
  var files = fs.src(exports._files);
  cb(null, files);
  return files;
};

var isPackageFile = exports.isPackageFile = function (file) {
  for (var i = 0; i < exports._files.length; i++) {
    if (minimatch(file, exports._files[i])) {
      return true;
    }
  }
  return false;
};

var doOnCleanRepository = function (callback) {
  exec(gitApp + ' ' + [ 'status', '--porcelain' ].join(' '), gitExtra, function (er, stdout, stderr) {
    // makeCommit parly inspired and taken from NPM version module
    var lines = stdout.trim().split('\n').filter(function (line) {
      var file = path.basename(line.replace(/.{1,2}\s+/, ''));
      return line.trim() && !line.match(/^\?\? /) && !isPackageFile(line);
    }).map(function (line) {
      return line.trim()
    });

    if (lines.length) {
      return callback(new Error('Git working directory not clean.\n'+lines.join('\n')));
    }
    return callback();
  });
};

var makeCommit = function (files, message, newVer, callback) {
  message = message.replace('%s', newVer).replace('"', '').replace("'", '');

  async.series(
    [
      function (done) {
        exec(gitApp + ' add ' + files.join(' '), gitExtra, done);
      }

      , function (done) {
        exec(gitApp + ' ' + ['commit', '-m', '"' + message + '"'].join(' '), gitExtra, done);
      }

      , function (done) {
        exec(gitApp + " " + ['tag', '-a', 'v' + newVer, '-m', '"' + message + '"'].join(' '), gitExtra, done);
      }
    ]
    , callback
  );
};

exports.get = function (callback) {
  exports._loadFiles(function(err, result) {
    var ret = {};
    if (err) {
      callback(err);
      return void 0;
    }
    result.pipe(through.obj(function (file, e, next) {
      var contents = JSON.parse(file.contents.toString());
      ret[path.basename(file.path)] = contents.version;
      this.push(file);
      next();
    }, function () {
      callback(null, ret);
    }));
  });
};

var updateJSON = exports.updateJSON = function (obj, ver) {
  ver = ver.toLowerCase();

  var validVer = semver.valid(ver);
  obj = obj || {};
  var currentVer = obj.version;

  if (validVer === null) {
    validVer = semver.inc(currentVer, ver);
  }

  if (validVer === null) {
    return false;
  }

  obj.version = validVer;
  return obj;
};

exports.update = function (ver, commitMessage, callback) {
  var files = [];

  if (!callback && commitMessage && typeof commitMessage  === 'function') {
    callback = commitMessage;
    commitMessage = null;
  }
  if (!callback) {
    callback = function () { };
  }

  async.series([
      function (done) {
        if (commitMessage) {
          return doOnCleanRepository(done);
        }
        return done();
      }
    , exports._loadFiles
  ], function(err, results) {
    if (err) {
      callback(err);
      return void 0;
    }

    var stream = results[1]
      , versionList = {}
      , updated = null
      , hasSet = false
      ;

    stream.pipe(through.obj(function(file, e, next) {
      var contents = JSON.parse(file.contents.toString());

      if (!hasSet) {
        hasSet = true;
        updated = updateJSON(contents, ver);
      }

      if (!updated) {
        callback(new Error('No valid version given.'));
        return void 0;
      }

      contents.version = updated.version;
      file.contents = new Buffer(JSON.stringify(contents, null, 2));
      versionList[path.basename(file.path)] = updated.version;
      files.push(file.path);
      this.push(file);
      next();
    }))
    .pipe(fs.dest('./'))
    .pipe(through.obj(function (file, enc, next) {
      this.push(file);
      next();
    }, function () {
      var ret = {
        newVersion: updated.version
        , versions: versionList
        , message: files.map(function (file) {
          return 'Updated ' + path.basename(file);
        }).join('\n')
      };

      if (!commitMessage) {
        callback(null, ret);
        return void 0;
      }

      makeCommit(files, commitMessage, updated.version, function (err) {
        if (err) {
          callback(err, ret);
          return void 0;
        }

        ret.message += '\nCommited to git and created tag v' + updated.version;
        callback(null, ret);
      });
    }))
  });
};