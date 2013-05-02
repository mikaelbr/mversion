
var version = require('../version')
  , assert = require("assert")
  , fs = require('fs')
  , path = require('path')
  ;


describe('mversion(component.json)', function () {

  var filename = '/tests/fixtures/component/component.json';
  var tmp = version._files;

  before(function () {
    version._files = [filename];
  });

  after(function () {
    version._files = tmp;
  });

  beforeEach(function(done){
    fs.readFile(path.join(process.cwd(), filename), function (err, data) {
      try {
        data = JSON.parse(data);
      } catch (e) {
        done(e);
      }

      data.version = '0.0.0';
      fs.writeFile( path.join(process.cwd(), filename), new Buffer(JSON.stringify(data, null, 2) + "\n"), function (err) {
        if (err) {
          return done(err);
        }
        done();
      });
    });
  });

  describe('#Get()', function(){
    it('should return correct version from component.json', function (done) {
      version.get(function (err, data) {       
        assert.ifError(err);

        assert.equal('0.0.0', data[filename])
        done();
      });
    });
  });


  describe('#Update(version)', function () {

    it('should be able to update by setting version', function (done) {

      version.update('1.0.0', function (err, res) {
        assert.ifError(err);

        assert.equal('1.0.0', res.versions[filename]);
        assert.equal(res.message, "Updated " + filename);

        done();
      });
    });

    it('should be able to update by setting release', function (done) {

      version.update('minor', function (err, res) {
        assert.ifError(err);

        assert.equal('0.1.0', res.versions[filename])
        assert.equal(res.message, "Updated " + filename);

        done();
      });
    });

    it('should be able to update both files by setting release with capital letters', function (done) {

      version.update('MAJOR', function (err, res) {
        assert.ifError(err);

        assert.equal('1.0.0', res.versions[filename])
        assert.equal(res.message, "Updated " + filename);

        done();
      });
    });

    it('should be able to update to full semver scheme', function (done) {
      version.update('1.0.0-12345', function (err, res) {
        assert.ifError(err);

        assert.equal(res.versions[filename], '1.0.0-12345')
        assert.equal(res.message, "Updated " + filename);

        done();
      });
    });

    it('should be able to update to full semver scheme', function (done) {

      version.update('1.0.0-beta', function (err, res) {
        assert.ifError(err);

        assert.equal(res.versions[filename], '1.0.0-beta')
        assert.equal(res.message, "Updated " + filename);

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

