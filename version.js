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
      commitMessage: void 0
    };
  }

  var ver = options.version || 'minor';
  var noPrefix = !!options.noPrefix;
  var commitMessage = options.commitMessage || void 0;
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
        stream = fUtil.loadFiles(),
        versionList = {},
        updated = null,
        hasSet = false;

    var i = 0;
    var stored = stream.pipe(through.obj(function(file, e, next) {
      if (file == null || file.isNull()) {
        this.push(null);
        next();
      }
      var json = file.contents.toString();
      var contents = JSON.parse(json);

      if (!hasSet) {
        hasSet = true;
        updated = updateJSON(contents, ver);
      }

      if (!updated) {
        callback(new Error('No valid version given.'));
        return void 0;
      }

      contents.version = updated.version;
      file.contents = new Buffer(JSON.stringify(contents, null, fUtil.space(json)) + fUtil.getLastChar(json));
      versionList[path.basename(file.path)] = updated.version;

      this.push(file);
      next();
    }))
    .pipe(fs.dest('./'));

    stored.on('data', function (file) {
      files.push(file.path);
    });

    stored.on('end', function () {
      var ret = {
        newVersion: updated.version,
        versions: versionList,
        message: files.map(function (file) {
          return 'Updated ' + path.basename(file);
        }).join('\n')
      };

      if (!commitMessage) {
        callback(null, ret);
        return void 0;
      }

      git.commit(files, commitMessage, updated.version, noPrefix, function (err) {
        if (err) {
          callback(err, ret);
          return void 0;
        }

        ret.message += '\nCommited to git and created tag ';
        if (!noPrefix) ret.message += 'v';
        ret.message += updated.version;
        callback(null, ret);
      });
    });
  });
  return this;
};

function noop () {
  return function () { };
}