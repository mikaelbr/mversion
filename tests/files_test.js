var files = require('../lib/files'),
    assert = require('assert'),
    fs = require('fs'),
    path = require('path');

describe('files', function () {
  describe('#isPackageFile()', function(){
    it('should say if file is valid package file or not', function (done) {
      assert.equal(files.isPackageFile('package.json'), true);
      assert.equal(files.isPackageFile('component.json'), true);
      assert.equal(files.isPackageFile('bower.json'), true);
      assert.equal(files.isPackageFile('foobar.json'), false);
      assert.equal(files.isPackageFile('foobar.jquery.json'), true);
      assert.equal(files.isPackageFile('foojquery.json'), false);
      done();
    });
  });

  describe('#getLastChar()', function(){
    it('should say if contents has newline as last char or not', function (done) {
      assert.equal(files.getLastChar('foobar'), '');
      assert.equal(files.getLastChar('foobar\n'), '\n');
      assert.equal(files.getLastChar('foobar\n '), '');
      assert.equal(files.getLastChar('foobar\n\n'), '\n');
      done();
    });
  });

  describe('#space()', function(){
    var fixture = { 'foo': 'bar' };
    it('should get tabs if tabs is used in json document', function (done) {
      var obj = JSON.stringify(fixture, null, '\t');
      assert.equal(files.space(obj), '\t');
      done();
    });

    it('should get spaces if spaces is used as indendtation in json document', function (done) {
      var obj = JSON.stringify(fixture, null, 2);
      assert.equal(files.space(obj), 2);
      done();
    });
  });
});