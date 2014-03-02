var version = require('../version')
  , assert = require("assert")
  , fs = require('fs')
  , vinylFs = require('vinyl-fs')
  , path = require('path')
  , File = require('vinyl')
  , through = require('through2')
  ;

describe('mversion(nofile)', function () {
  var packages = "package.json";
  var component = "component.json";
  var expectedPackagesPath = path.join(__dirname, './fixtures/', packages);
  var expectedComponentPath = path.join(__dirname, './fixtures/', component);

  var expectedPackages = new File({
    base: __dirname,
    cwd: __dirname,
    path: expectedPackagesPath,
    contents: fs.readFileSync(expectedPackagesPath)
  });

  var expectedComponent = new File({
    base: __dirname,
    cwd: __dirname,
    path: expectedComponentPath,
    contents: fs.readFileSync(expectedComponentPath)
  });

  var original = version._loadFiles;
  var dest = vinylFs.dest;

  before(function () {
    vinylFs.dest = function () {
      return through.obj(function (file, enc, next) {
        this.push(file);
        next();
      });
    }
  });

  after(function () {
    version._loadFiles = original;
    vinylFs.dest = dest;
  });

  var setupLoadSpy = function (v1, v2) {
    version._loadFiles = function (cb) {
      var stream = through.obj();
      if (v1) {
        var c1 = JSON.parse(expectedPackages.contents.toString());
        c1.version = v1;
        expectedPackages.contents = new Buffer(JSON.stringify(c1));
        stream.write(expectedPackages);
      }
      if (v2) {
        var c2 = JSON.parse(expectedPackages.contents.toString());
        c2.version = v2;
        expectedComponent.contents = new Buffer(JSON.stringify(c2));
        stream.write(expectedComponent);
      }
      cb(null, stream);
      stream.end();
      return stream;
    };
  };

  describe('#Get()', function(){
    it('should return correct version from both files', function (done) {
      setupLoadSpy('0.0.0', '0.0.0');

      version.get(function (err, data) {
        assert.ifError(err);
        assert.equal('0.0.0', data['package.json'])
        assert.equal('0.0.0', data['component.json'])
        done();
      });
    });

    it('should return correct version from both files if unequal', function (done) {
      setupLoadSpy('0.1.0', '1.0.0');

      version.get(function (err, data) {
        assert.ifError(err);

        assert.equal('0.1.0', data['package.json'])
        assert.equal('1.0.0', data['component.json'])
        done();
      });
    });

    it('should return correct version when only package.json', function (done) {
      setupLoadSpy('0.1.0');

      version.get(function (err, data) {
        assert.ifError(err);

        assert.equal('0.1.0', data['package.json'])
        done();
      });
    });

    it('should return correct version when only component.json', function (done) {
      setupLoadSpy(null, '0.1.0');

      version.get(function (err, data) {
        assert.ifError(err);

        assert.equal('0.1.0', data['component.json'])
        done();
      });
    });
  });


  describe('#Update(version)', function () {

    it('should be able to update both files by setting version', function (done) {
      setupLoadSpy('0.0.0', '0.0.0');

      version.update('1.0.0', function (err, res) {
        assert.ifError(err);

        assert.equal('1.0.0', res.versions['package.json']);
        assert.equal('1.0.0', res.versions['component.json']);
        assert.equal(res.message, "Updated package.json\nUpdated component.json");

        done();
      });
    });

    it('should be able to update only package.json', function (done) {
      setupLoadSpy('1.0.0');

      version.update('2.0.0', function (err, res) {
        assert.ifError(err);

        assert.equal('2.0.0', res.versions['package.json'])
        assert.equal(res.message, "Updated package.json");
        done();
      });
    });

    it('should be able to update only component.json', function (done) {
      setupLoadSpy(null, '1.0.0');

      version.update('2.0.0', function (err, res) {
        assert.ifError(err);

        assert.equal('2.0.0', res.versions['component.json'])
        assert.equal(res.message, "Updated component.json");
        done();
      });
    });

    it('should be able to update both files by setting release', function (done) {
      setupLoadSpy('0.0.0', '0.0.0');

      version.update('minor', function (err, res) {
        assert.ifError(err);

        assert.equal('0.1.0', res.versions['package.json'])
        assert.equal('0.1.0', res.versions['component.json'])
        assert.equal(res.message, "Updated package.json\nUpdated component.json");

        done();
      });
    });

    it('should be able to update both files by setting release with capital letters', function (done) {
      setupLoadSpy('0.0.0', '0.0.0');

      version.update('MAJOR', function (err, res) {
        assert.ifError(err);

        assert.equal('1.0.0', res.versions['package.json'])
        assert.equal('1.0.0', res.versions['component.json'])
        assert.equal(res.message, "Updated package.json\nUpdated component.json");

        done();
      });
    });

    it('should be able to update to full semver scheme', function (done) {
      setupLoadSpy('1.0.0', '1.0.0');

      version.update('1.0.0-12345', function (err, res) {
        assert.ifError(err);

        assert.equal(res.versions['package.json'], '1.0.0-12345')
        assert.equal(res.versions['component.json'], '1.0.0-12345')
        assert.equal(res.message, "Updated package.json\nUpdated component.json");

        done();
      });
    });

    it('should be able to update to full semver scheme', function (done) {
      setupLoadSpy('1.0.0', '1.0.0');

      version.update('1.0.0-beta', function (err, res) {
        assert.ifError(err);

        assert.equal(res.versions['package.json'], '1.0.0-beta')
        assert.equal(res.versions['component.json'], '1.0.0-beta')
        assert.equal(res.message, "Updated package.json\nUpdated component.json");

        done();
      });
    });

    it('should fail if invalid semver passed', function (done) {
      setupLoadSpy('1.0.0', '1.0.0');

      version.update('a.b.c', function (err, res) {
        assert.ok(err);
        done();
      });
    });

    it('should fail if invalid release passed', function (done) {
      setupLoadSpy('1.0.0', '1.0.0');

      version.update('foobar', function (err, res) {
        assert.ok(err);
        done();
      });
    });
  });
});

