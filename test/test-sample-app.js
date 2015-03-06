'use strict';

var expect = require('chai').expect;
var fs = require('fs');
var path = require('path');

var appPath = path.join(__dirname, 'fixtures', 'app');
var appGulp = require(path.join(appPath, 'gulpfile'));


// integration tests


describe('Static translation of an app', function() {

  before(function(done){
    appGulp.start('default', done);
  });

  it('creates a directory for French and Portuguese', function() {
    var hasFrenchDir = fs.statSync(appPath + '/build/fr').isDirectory();
    var hasPtDir = fs.statSync(appPath + '/build/pt-br').isDirectory();
    expect(hasFrenchDir).to.be.true;
    expect(hasPtDir).to.be.true;
  });

  it('knocks out gettext calls from the js', function () {
    var content = String(fs.readFileSync(appPath + '/build/en/script.js'));
    expect(content).to.equal('window.alert("Hello World");\n');
  });

  it('translates the js in Portuguese', function () {
    var content = String(fs.readFileSync(appPath + '/build/pt-br/script.js'));
    expect(content).to.equal('window.alert("Olá mundo");\n');
  });

  it('knocks out gettext calls from the handlebars', function () {
    var content = String(fs.readFileSync(appPath + '/build/en/template.hbs'));
    expect(content).to.equal('<h1>Hello World</h1>\n<h2>Thank you very much</h2>\n');
  });

  it('translates the handlebars into French', function () {
    var content = String(fs.readFileSync(appPath + '/build/fr/template.hbs'));
    expect(content).to.equal('<h1>Bonjour tout le monde</h1>\n<h2>Merci beaucoup</h2>\n');
  });

  it('copies over miscellaneous files', function () {
    var hasTxt = fs.statSync(appPath + '/build/fr/some.txt').isFile();
    expect(hasTxt).to.be.true;
  });

  it('clears the original untraslated script', function() {
    var hasScript = fs.existsSync(appPath + '/build/script.js');
    expect(hasScript).to.be.false;
  });

});
