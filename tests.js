
var version = require('./version')
  , assert = require("assert")
  ;

var tmpLoad = version._loadFiles
  , tmpSave = version._saveFiles;


var setupLoadSpy = function (v1, v2) {
  version._loadFiles = function (callback) {
    var ret = {};

    if (v1) {
      ret.pkg = {
        version: v1
      };
    }

    if (v2) {
      ret.cpt = {
        version: v2
      };
    }

    callback(null, ret);
  };
};

version._saveFiles = function (pkg, cpt, callback) {
  var ret = [];
  if (pkg) ret.push("Updated package.json");
  if (cpt) ret.push("Updated component.json");
  callback(null, ret);
};

describe('Get', function(){
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


describe('Update', function () {

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