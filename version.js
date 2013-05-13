
var semver = require('semver')
  , async = require('async')
  , fs = require('fs')
  , path = require('path')
  , exec = require("child_process").exec
  ;

exports._files = ["package.json", "component.json"];

exports._loadFiles = function (callback) {
  async.parallel(exports._files.map(function (file) {
    return function (done) {
      fs.readFile(path.join(process.cwd(), file), function (err, data) {
        if (err) {
          done(null, null);
          return void 0;
        }
        done(null, {
            file: file
          , data: data
        });
      });
    };
  }), function (err, data) {
    data = data.filter(function (file) {
      return !!file;
    });
    if (!data.length || data[0] === null) {
      callback(new Error("At least one .json file must exist."));
      return void 0;
    }
    data.forEach(function (fileData) {
      try {
        fileData.data = JSON.parse(fileData.data)
      } catch (er) { /* No handling */ }
    });

    callback(null, data);
  });
};

exports._saveFiles = function (fileData, callback) {
  // Save package/component file. 
  async.parallel(fileData.map(function (file) {
    return function (done) {
      fs.writeFile( path.join(process.cwd(), file.file), 
          new Buffer(JSON.stringify(file.data, null, 2) + "\n"), function (err) {
            if (err) {
              return done(err);
            }
            done(null, "Updated " + file.file);
      });
    };
  }), callback);
};


var makeCommit = function (files, message, newVer, callback) {
    var git = 'git'
      , extra = {env: process.env}
      ;

    message = message.replace('%s', newVer).replace('"', '').replace("'", '');

    exec(git + " " + [ "status", "--porcelain" ].join(' '), extra, function (er, stdout, stderr) {
      // makeCommit parly inspired and taken from NPM version module
      var lines = stdout.trim().split("\n").filter(function (line) {
        return line.trim() && !line.match(/^\?\? /) 
                  && line.indexOf('package.json') === -1 
                  && line.indexOf('component.json') === -1
      }).map(function (line) {
        return line.trim()
      });

      if (lines.length) {
        return callback(new Error("Git working directory not clean.\n"+lines.join("\n")));
      }

      async.series(
        [ 
          function (done) {
            exec(git + " add " + files.join(' '), extra, done);
          }

          , function (done) {
            exec(git + " " + ["commit", "-m", "\"" + message + "\""].join(' '), extra, done);
          }

          , function (done) {
            exec(git + " " + ["tag", "-a", "v" + newVer, "-m", "\"" + message + "\""].join(' '), extra, done);
          }
        ]
        , callback
      );
    });
  }
;

exports.get = function (callback) {
  exports._loadFiles(function(err, result) {
    var ret = {};
    if (err) {
      callback(err);
      return void 0;
    }
    result.forEach(function (file) {
      ret[file.file] = file.data.version;
    });

    callback(null, ret);
  });
};


exports.update = function (ver, commitMessage, callback) {
  var validVer = semver.valid(ver)
    , files = [];
  ver = ver.toLowerCase();

  if (!callback && commitMessage && typeof commitMessage  === 'function') {
    callback = commitMessage;
    commitMessage = null;
  }
  if (!callback) {
    callback = function () { };
  }

  exports._loadFiles(function(err, result) {
    if (err) {
      callback(err);
      return void 0;
    }

    var currentVer = result[0].data ? result[0].data.version : undefined
      , versionList = {}
      ;

    if (validVer === null) {
      validVer = semver.inc(currentVer, ver);
    }

    if (validVer === null) {
      callback(new Error('No valid version given.'));
      return void 0;
    }
    result.forEach(function (file) {
      if (file.data) {
        file.data.version = validVer;
        versionList[file.file] = validVer;
        files.push(file.file);
      }
    });

    exports._saveFiles(result, function (err, data) {
      var ret = { 
          newVersion: validVer
          , versions: versionList
          , message: data.join('\n')
        };

      if (err) {
        callback(err);
        return void 0;
      }

      if (!commitMessage) {
        callback(null, ret);
        return void 0;
      }

      makeCommit(files, commitMessage, validVer, function (err) {
        if (err) {
          callback(err, ret);
          return void 0;
        }

        ret.message += "\nCommited to git and created tag v" + validVer;
        callback(null, ret);
      });
    });
  });
};