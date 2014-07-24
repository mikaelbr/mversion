var version = require('../version'),
    assert = require('assert'),
    fs = require('fs'),
    vinylFs = require('vinyl-fs'),
    path = require('path'),
    File = require('vinyl'),
    through = require('through2'),
    fUtil = require('../lib/files');

describe('mversion(package.json)', function () {
  var filename = 'package.json';
  var expectedPath = path.join(__dirname, './fixtures/', filename);
  var expectedContent = fs.readFileSync(expectedPath);

  var original = fUtil.loadFiles;
  var dest = vinylFs.dest;

  before(function () {
    vinylFs.dest = function () {
      return through.obj(function (file, enc, next) {
        this.push(file);
        next();
      });
    }
  });

  beforeEach(function () {
    var expectedFile = new File({
      base: __dirname,
      cwd: __dirname,
      path: expectedPath,
      contents: expectedContent
    });

    fUtil.loadFiles = function () {
      var stream = through.obj();
      stream.write(expectedFile);
      stream.end();
      return stream;
    };
  });

  after(function () {
    fUtil.loadFiles = original;
    vinylFs.dest = dest;
  });

  describe('#Get()', function(){
    it('should return correct version from package.json', function (done) {
      version.get(function (err, data) {
        assert.ifError(err);

        assert.equal('0.0.0', data[filename])
        done();
      });
    });

    it('should give error if syntax error in package.json', function (done) {
      var expectedFile = new File({
        base: __dirname,
        cwd: __dirname,
        path: expectedPath,
        contents: new Buffer('{ "version": "1.1.1" "foo": "bar }')
      });

      fUtil.loadFiles = function () {
        var stream = through.obj();
        stream.write(expectedFile);
        stream.end();
        return stream;
      };

      version.get(function (err, data) {
        assert.ok(err, 'Should have error');
        assert.equal(data[filename], void 0, 'Version should not be set');
        done();
      });
    });
  });

  describe('#Update(version)', function () {
    it('should be able to update by setting version', function (done) {
      version.update('1.0.0', function (err, res) {
        assert.ifError(err);

        assert.equal('1.0.0', res.versions[filename]);
        assert.equal(res.message, 'Updated ' + filename);

        done();
      });
    });

    it('should give error if syntax error in package.json', function (done) {
      var expectedFile = new File({
        base: __dirname,
        cwd: __dirname,
        path: expectedPath,
        contents: new Buffer('{ "version": "1.1.1" "foo": "bar }')
      });

      fUtil.loadFiles = function () {
        var stream = through.obj();
        stream.write(expectedFile);
        stream.end();
        return stream;
      };

      version.update('1.0.0', function (err, res) {
        assert.ok(err);
        assert.ok(err.message);
        assert.equal(err.message, ' * fixtures/package.json: Unexpected string');
        assert.equal(res.versions[filename], void 0);

        done();
      });
    });

    it('should be able to update by setting release', function (done) {
      version.update('minor', function (err, res) {
        assert.ifError(err);

        assert.equal('0.1.0', res.versions[filename])
        assert.equal(res.message, 'Updated ' + filename);

        done();
      });
    });

    it('should be able to update both files by setting release with capital letters', function (done) {
      version.update('MAJOR', function (err, res) {
        assert.ifError(err);

        assert.equal('1.0.0', res.versions[filename])
        assert.equal(res.message, 'Updated ' + filename);

        done();
      });
    });

    it('should be able to update to full semver scheme', function (done) {
      version.update('1.0.0-12345', function (err, res) {
        assert.ifError(err);

        assert.equal(res.versions[filename], '1.0.0-12345')
        assert.equal(res.message, 'Updated ' + filename);

        done();
      });
    });

    it('should be able to update to full semver scheme', function (done) {
      version.update('1.0.0-beta', function (err, res) {
        assert.ifError(err);

        assert.equal(res.versions[filename], '1.0.0-beta')
        assert.equal(res.message, 'Updated ' + filename);

        done();
      });
    });

    it('should fail if invalid semver passed', function (done) {
      version.update('a.b.c', function (err, res) {
        assert.ok(err);
        done();
      });
    });

    it('should fail if invalid release passed', function (done) {
      version.update('foobar', function (err, res) {
        assert.ok(err);
        done();
      });
    });
  });
});