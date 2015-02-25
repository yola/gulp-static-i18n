'use strict';

var fs = require('fs');
require('chai').should();

var appPath = __dirname + '/fixtures/app';
var appGulp = require(appPath + '/gulpfile');


// integration tests


describe('Static translation of an app', function() {

  before(function(done){
    appGulp.start('default', done);
  });

  it('should create a directory for French and Portuguese', function() {
    var hasFrenchDir = fs.statSync(appPath + '/build/fr').isDirectory();
    var hasPtDir = fs.statSync(appPath + '/build/pt-br').isDirectory();
    hasFrenchDir.should.be.true;
    hasPtDir.should.be.true;
  });

  it('should knockout gettext calls from the js', function () {
    var expected = 'window.alert("Hello World");\n';
    var content = String(fs.readFileSync(appPath + '/build/script.js'));
    content.should.equal(expected);
  });

  it('should translate the js in Portuguese', function () {
    var expected = 'window.alert("Olá mundo");\n';
    var content = String(fs.readFileSync(appPath + '/build/pt-br/script.js'));
    content.should.equal(expected);
  });

  it('should knockout gettext calls from the handlebars', function () {
    var expected = '<h1>Hello World</h1>\n';
    var content = String(fs.readFileSync(appPath + '/build/template.hbs'));
    content.should.equal(expected);
  });

  it('should translate the handlebars into French', function () {
    var expected = '<h1>Bonjour tout le monde</h1>\n';
    var content = String(fs.readFileSync(appPath + '/build/fr/template.hbs'));
    content.should.equal(expected);
  });

  it('should copy over miscellaneous files', function () {
    var hasTxt = fs.statSync(appPath + '/build/fr/some.txt').isFile();
    hasTxt.should.be.true;
  });

});
