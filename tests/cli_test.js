var mversion = require('../'),
    currentVersion = require('../package.json').version;
    files = require('../lib/files');
    scripts = require('../lib/scripts');
    assert = require('assert');

var originalMversion = mversion.update;
var originalMversionGet = mversion.get;
var originalRc = files.getRC;
var originalScripts = scripts.run;
var cli = require('../bin/cli');

describe('cli', function() {

  afterEach(function () {
    mversion.update = originalMversion;
    mversion.get = originalMversionGet;
  });

  describe('options', function () {


    it('should be able to take a version bump', function (done) {
      mversion.update = function (options, cb) {
        assert.ok(options);
        assert.equal(options.version, 'minor');
        done();
      };

      cli(['minor']);
    });

    it('should get package versions if no arguments passed', function (done) {
      mversion.get = function () {
        assert.ok(true);
        done();
      };

      cli([]);
    });

    it('should be able to take a major version', function (done) {
      mversion.update = function (options, cb) {
        assert.ok(options);
        assert.equal(options.version, 'major');
        done();
      };

      cli(['major']);
    });

    it('should define default commit message when -m is present', function (done) {
      mversion.update = function (options, cb) {
        assert.ok(options);
        assert.equal(options.version, 'major');
        assert.equal(options.commitMessage, 'v%s');
        assert.equal(options.noPrefix, false);
        done();
      };

      cli(['major', '-m']);
    });

    it('should be able to override commit message by using -m flag', function (done) {
      var expectedString = '"expected commit message"';
      mversion.update = function (options, cb) {
        assert.ok(options);
        assert.equal(options.version, 'major');
        assert.equal(options.commitMessage, expectedString);
        assert.equal(options.noPrefix, false);
        done();
      };

      cli(['major', '-m', expectedString]);
    });

    it('should be able to remove tag name prefix by using the -n flag', function (done) {
      mversion.update = function (options, cb) {
        assert.ok(options);
        assert.equal(options.noPrefix, true);
        done();
      };

      cli(['major', '-n']);
    });

    it('should be able to remove tag name prefix by using the --no-prefix flag', function (done) {
      mversion.update = function (options, cb) {
        assert.ok(options);
        assert.equal(options.noPrefix, true);
        done();
      };

      cli(['major', '--no-prefix']);
    });

    it('should be able to remove tag name prefix by using the -n flag in conjunction with -m', function (done) {
      mversion.update = function (options, cb) {
        assert.ok(options);
        assert.equal(options.noPrefix, true);
        assert.equal(options.commitMessage, 'v%s');
        done();
      };

      cli(['major', '-n', '-m']);
    });

    it('should be agnostic to parameter order of -m and -n', function (done) {
      mversion.update = function (options, cb) {
        assert.ok(options);
        assert.equal(options.noPrefix, true);
        assert.equal(options.commitMessage, 'v%s');
        done();
      };

      cli(['major', '-m', '-n']);
    });

    it('should be agnostic to parameter order of -m and -n with message', function (done) {
      var expectedString = '"expected commit message"';
      mversion.update = function (options, cb) {
        assert.ok(options);
        assert.equal(options.noPrefix, true);
        assert.equal(options.commitMessage, expectedString);
        done();
      };

      cli(['major', '-m', expectedString, '-n']);
    });

    it('should be able to override tag name with -t', function (done) {
      var expectedString = 'test';
      mversion.update = function (options, cb) {
        assert.ok(options);
        assert.ok(options.tagName);
        assert.equal(options.tagName, expectedString);
        done();
      };

      cli(['major', '-t', expectedString]);
    });

    it('should be able to override tag name with --tag', function (done) {
      var expectedString = 'test';
      mversion.update = function (options, cb) {
        assert.ok(options);
        assert.ok(options.tagName);
        assert.equal(options.tagName, expectedString);
        done();
      };

      cli(['major', '--tag', expectedString]);
    });

    it('should be able to override tag name with --tag=custom', function (done) {
      var expectedString = 'test';
      mversion.update = function (options, cb) {
        assert.ok(options);
        assert.ok(options.tagName);
        assert.equal(options.tagName, expectedString);
        done();
      };

      cli(['major', '--tag=' + expectedString]);
    });

    it('should mversion version on -v', function (done) {
      cli(['-v'], {
        logger: function () {
          var message = Array.prototype.join.apply(arguments, [' ']);
          assert.notEqual(message.indexOf(currentVersion), -1);
          done();
        }
      });
    });

    it('should mversion version on --version', function (done) {
      cli(['--version'], {
        logger: function () {
          var message = Array.prototype.join.apply(arguments, [' ']);
          assert.notEqual(message.indexOf(currentVersion), -1);
          done();
        }
      });
    });
  });

  describe('.mversionrc', function () {

    afterEach(function () {
      files.getRC = originalRc;
      scripts.run = originalScripts;
    });

    it('should load default options from .mversionrc', function (done) {
      files.getRC = function () {
        return {
          commitMessage: 'foo',
          tagName: 'bar'
        };
      };

      mversion.update = function (options, cb) {
        assert.ok(options);
        assert.ok(options.tagName);
        assert.ok(options.commitMessage);
        assert.equal(options.version, 'major');
        assert.equal(options.tagName, 'bar');
        assert.equal(options.commitMessage, 'foo');
        done();
      };

      cli(['major']);
    });

    it('should let arguments passed take precedence over defaults', function (done) {
      files.getRC = function () {
        return {
          commitMessage: 'foo',
          tagName: 'bar'
        };
      };

      mversion.update = function (options, cb) {
        assert.ok(options);
        assert.ok(options.tagName);
        assert.ok(options.commitMessage);
        assert.equal(options.tagName, 'overriden');
        assert.equal(options.commitMessage, 'foo');
        done();
      };

      cli(['major', '--tag', 'overriden']);
    });

    it('should execute pre- and postupdate scripts', function (done) {
      files.getRC = function () {
        return {
          commitMessage: 'foo',
          tagName: 'bar',
          scripts: {
            preupdate: 'pre',
            postupdate: 'post'
          }
        };
      };
      var text = '';
      scripts.run = function (script, cb) {
        text += script;
        cb(null, script);
      };

      mversion.update = function (options, cb) {
        text += 'MIDDLE';
        cb(null, { newVersion: '1.1.1' });
      };

      cli(['major'], {
        logger: function () { }
      }, function () {
        assert.equal(text, 'preMIDDLEpost');
        done();
      });
    });

    it('should execute pre- and postcommit scripts', function (done) {
      files.getRC = function () {
        return {
          commitMessage: 'foo',
          tagName: 'bar',
          scripts: {
            precommit: 'preC',
            postcommit: 'postC'
          }
        };
      };
      var text = '';
      scripts.run = function (script, cb) {
        text += script;
        cb(null, script);
      };

      mversion.update = function (options, cb) {
        text += 'MIDDLE';
        cb(null, { newVersion: '1.1.1' });
      };

      cli(['major'], {
        logger: function () { }
      }, function () {
        assert.equal(text, 'preCMIDDLEpostC');
        done();
      });
    });

    it('should replace %s to version in postcommit script', function (done) {
      files.getRC = function () {
        return {
          commitMessage: 'foo',
          tagName: 'bar',
          scripts: {
            postcommit: 'foo%sfoo'
          }
        };
      };
      var text = '';
      scripts.run = function (script, cb) {
        text += script;
        cb(null, script);
      };

      mversion.update = function (options, cb) {
        text += 'MIDDLE';
        cb(null, { newVersion: '1.1.1' });
      };

      cli(['major'], {
        logger: function () { }
      }, function () {
        assert.equal(text, 'MIDDLEfoo1.1.1foo');
        done();
      });
    });

    it('should replace %s to version in postupdate script', function (done) {
      files.getRC = function () {
        return {
          commitMessage: 'foo',
          tagName: 'bar',
          scripts: {
            postupdate: 'foo%sfoo'
          }
        };
      };
      var text = '';
      scripts.run = function (script, cb) {
        text += script;
        cb(null, script);
      };

      mversion.update = function (options, cb) {
        text += 'MIDDLE';
        cb(null, { newVersion: '1.1.1' });
      };

      cli(['major'], {
        logger: function () { }
      }, function () {
        assert.equal(text, 'MIDDLEfoo1.1.1foo');
        done();
      });
    });

  });

  describe('version aliases', function () {

    var assertVersion = function(longName, shortName){
      return function(done){
        mversion.update = function (options, cb) {
          assert.ok(options);
          var version = mversion.updateJSON({version: "1.2.3"},options.version);
          if(version == false || version.version === undefined){
              assert.fail("unknown release type");
          }
          version = version.version;
          switch(longName){
            case "major":
              assert.equal(version, "2.0.0");
              break;
            case "minor":
              assert.equal(version, "1.3.0");
              break;
            case "patch":
              assert.equal(version, "1.2.4");
              break;
            case "prerelease":
              assert.equal(version, "1.2.4-0");
              break;
            default:
              assert.fail("unknown release type");
              break;
          }
          done();
        };
        cli([shortName]);
      };
    };
    for(var key in mversion.versionAliases){
      var longName = mversion.versionAliases[key];
      it('should be able to accept release type aliases: ' + longName + ' as ' + key, assertVersion(longName, key));
    }

  });
});
