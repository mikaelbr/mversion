var version = require('../version')
  , assert = require("assert")
  , fs = require('fs')
  , path = require('path')
  ;

describe('mversion(manifest.json)', function () {
  describe('#isPackageFile()', function(){
    it('should say if file is valid package file or not', function (done) {
      assert.equal(version.isPackageFile('package.json'), true);
      assert.equal(version.isPackageFile('component.json'), true);
      assert.equal(version.isPackageFile('bower.json'), true);
      assert.equal(version.isPackageFile('foobar.json'), false);
      assert.equal(version.isPackageFile('foobar.jquery.json'), true);
      assert.equal(version.isPackageFile('foojquery.json'), false);
      done();
    });
  });
});