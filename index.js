var semver = require('semver'),
    path = require('path'),
    through = require('through2'),
    fs = require('vinyl-fs'),
    fUtil = require('./lib/files'),
    git = require('./lib/git');

exports.get = function (callback) {
  var result = fUtil.loadFiles();
  var ret = {};
  var errors = [];

  return result
    .on('data', function (file) {
      try {
        var contents = JSON.parse(file.contents.toString());
        ret[path.basename(file.path)] = contents.version;
      } catch (e) {
        errors.push(file.relative + ": " + e.message);
      }
    })
    .on('end', function () {
      if (errors.length) {
        return callback(new Error(errors.join('\n')), ret);
      }
      return callback(null, ret);
    });
};

exports.isPackageFile = fUtil.isPackageFile;

var versionAliases = exports.versionAliases = {
  "pa": "patch",
  "pr": "prerelease",
  "ma": "major",
  "mi": "minor",
  // one char might be controversial, but it saves key strokes
  "m": "major",
  "p": "patch",
  "i": "minor"
};

var updateJSON = exports.updateJSON = function (obj, ver) {
  ver = ver.toString().toLowerCase();

  // check for aliases
  if(ver in versionAliases){
    ver = versionAliases[ver];
  }

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

exports.update = function (options, callback) {
  if (typeof options === "function") {
    callback = options;
    options = {};
  }

  options = options || {};

  if (typeof options === "string") {
    options = {
      version: options,
      noPrefix: false,
      precommit: void 0,
      commitMessage: void 0
    };
  }

  if (!options.tagName) {
    options.tagName = (options.noPrefix ? '' : 'v') + '%s';
  }

  var ver = options.version || 'minor';
  var noPrefix = !!options.noPrefix;
  var commitMessage = options.commitMessage || void 0;
  var precommitCallback = options.precommit;
  callback = callback || noop();

  (function (done) {
    if (commitMessage) {
      return git.isRepositoryClean(done);
    }
    return done(null);
  })(function(err) {
    if (err) {
      callback(err);
      return void 0;
    }

    var files = [],
        errors = [],
        fileStream = fUtil.loadFiles(),
        versionList = {},
        updated = null,
        hasSet = false;

    var stored = fileStream.pipe(through.obj(function(file, e, next) {
      if (file == null || file.isNull()) {
        this.push(null);
        next();
        return;
      }
      var json = file.contents.toString(),
          contents = null;

      try {
        contents = JSON.parse(json);
      } catch (e) {
        errors.push(new Error(file.relative + ': ' + e.message));
        next();
        return;
      }

      if (!hasSet) {
        hasSet = true;
        updated = updateJSON(contents, ver);

        if (!updated) {
          this.emit('error', new Error('Version bump failed, ' + ver + ' is not valid version.'))
          return void 0;
        }
      }

      contents.version = updated.version;
      file.contents = new Buffer(JSON.stringify(contents, null, fUtil.space(json)) + fUtil.getLastChar(json));
      versionList[path.basename(file.path)] = updated.version;

      this.push(file);
      next();
    }))
    .on('error', function (err) {
      callback(err);
    })
    .pipe(fs.dest('./'));

    stored.on('data', function (file) {
      files.push(file.path);
    });

    stored.on('end', function () {
      var errorMessage = null;
      if (errors.length) {
        errorMessage = errors.map(function (e) {
          return " * " + e.message;
        }).join('\n');
      }

      updated = updated || { version: 'N/A' };

      var ret = {
        newVersion: updated.version,
        versions: versionList,
        message: files.map(function (file) {
          return 'Updated ' + path.basename(file);
        }).join('\n'),
        updatedFiles: files
      };

      if (!commitMessage || errorMessage) {
        callback(errorMessage ? new Error(errorMessage) : null, ret);
        return void 0;
      }

      if (!precommitCallback) {
        return doCommit();
      }

      precommitCallback(function (err) {
        if (err) {
          return git.checkout();
        }
        doCommit();
      });

      function doCommit () {
        var tagName = options.tagName.replace('%s', updated.version).replace('"', '').replace("'", '');
        git.commit(files, commitMessage, updated.version, tagName, function (err) {
          if (err) {
            callback(err, null);
            return void 0;
          }

          ret.message += '\nCommited to git and created tag ' + tagName;
          callback(null, ret);
        });
      }
    });
  });
  return this;
};



function noop () {
  return function () { };
}
