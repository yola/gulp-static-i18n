'use strict';

var assert = require('chai').assert;
var fs = require('fs');
var statici18n = require('../');
var stream = require('stream');

require('chai').should();

var appPath = __dirname + '/fixtures/app';
var appGulp = require(appPath + '/gulpfile');


// unit tests
describe('StaticI18n', function(){

  describe('.checkTarget()', function() {

    it('should throw for null targets', function() {
      var target = null;
      var build = new statici18n.obj(target, {}, new stream());
      assert.throws(build.checkTarget);
    });

  });

});


// integration tests
describe('Static translation of an app', function(){

  before(function(done){
    appGulp.start('default', done);
  });

  it('should blow up when fed an empty dir', function () {
    assert.throws(function() {
      new stream()
        .pipe(statici18n())
        .write();
    });
  });

  it('should knockout gettext calls from the js', function () {
    var expected = 'window.alert("Hello World");\n';
    var content = fs.readFileSync(appPath + '/build/script.js').toString();
    content.should.equal(expected);
  });

});
