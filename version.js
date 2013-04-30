
var semver = require('semver')
  , async = require('async')
  , fs = require('fs')
  , path = require('path')
  , exec = require("child_process").exec
  ;

exports._loadFiles = function (callback) {
  async.parallel({
    'pkg': function (done) {
      fs.readFile(path.join(process.cwd(), "package.json"), function (err, data) {
        done(null, data);
      });
    }

    , 'cpt': function (done) {
      fs.readFile(path.join(process.cwd(), "component.json"), function (err, data) {
        done(null, data);
      });
    }
  }, function (err, result) {
    var ret = {};

    if (!result.pkg && !result.cpt) {
      callback(new Error("Need one of package.json or component.json"));
      return void 0;
    }

    try {
      ret.pkg = JSON.parse(result.pkg)
    } catch (er) {
      ret.pkg = null;
    }

    try {
      ret.cpt = JSON.parse(result.cpt)
    } catch (er) {
      ret.cpt = null;
    }

    callback(null, ret);
  });
};

exports._saveFiles = function (pkg, cpt, callback) {
  // Save package/component file. 
  async.parallel({
    'pkg': function (done) {
      if (!pkg) {
        return done(null, null);
      }

      fs.writeFile( path.join(process.cwd(), "package.json"), 
          new Buffer(JSON.stringify(pkg, null, 2) + "\n"), function (err) {
            if (err) {
              return done(err);
            }
            done(null, "Updated package.json");
      });
    }

    , 'cpt': function (done) {
      if (!cpt) {
        return done(null, null);
      }
      fs.writeFile( path.join(process.cwd(), "component.json"), 
          new Buffer(JSON.stringify(cpt, null, 2) + "\n"), function (err) {
            if (err) {
              return done(err);
            }
            done(null, "Updated component.json");
      });
    }
  }, callback);
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
    var v1, v2, ret = {};

    if (err) {
      callback(err);
      return void 0;
    }

    v1 = result.pkg;
    v2 = result.cpt;

    if (v1 && v1.version) {
      ret['package.json'] = v1.version;
    }

    if (v2 && v2.version) {
      ret['component.json'] = v2.version;
    }

    callback(null, ret);
  });
};


exports.update = function (ver, commitMessage, callback) {
  var validVer = semver.valid(ver);
  ver = ver.toLowerCase();

  if (!callback && commitMessage && typeof commitMessage  === 'function') {
    callback = commitMessage;
    commitMessage = null;
  }
  if (!callback) {
    callback = function () { };
  }

  exports._loadFiles(function(err, result) {
    var pkg = result.pkg
      , cpt = result.cpt
      , currentVer = pkg ? pkg.version : cpt.version;

    if (err) {
      callback(err);
      return void 0;
    }

    if (validVer === null) {
      validVer = semver.inc(currentVer, ver);
    }

    if (validVer === null) {
      callback(new Error('No valid version given.'));
      return void 0;
    }

    if (pkg && pkg.version) {
      pkg.version = validVer;
    }
    if (cpt && cpt.version) {
      cpt.version = validVer;
    }

    exports._saveFiles(pkg, cpt, function (err, data) {
      var ret = {newVersion: validVer, versions: {}, message: []}
        , files = [];
      

      if (err) {
        callback(err);
        return void 0;
      }

      if (data.pkg) {
        ret.message.push(data.pkg);
      }
      if (data.cpt) {
        ret.message.push(data.cpt);
      }
      ret.message = ret.message.join("\n");

      if (pkg && pkg.version) {
        ret.versions['package.json'] = pkg.version;
        files.push('package.json');
      }

      if (cpt && cpt.version) {
        ret.versions['component.json'] = cpt.version;
        files.push('component.json');
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