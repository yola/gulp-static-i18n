'use strict';

var assert = require('chai').assert;
var fs = require('fs');
var statici18n = require('../');
var stream = require('stream');
var through = require('through2');
var Translator = require('../lib/translator');
var TranslatedFile = require('../lib/translated-file');
var vfs = require('vinyl-fs');

require('chai').should();

var appPath = __dirname + '/fixtures/app';
var appGulp = require(appPath + '/gulpfile');


// unit tests


describe('StaticI18n', function(){

  it('should throw for null targets', function() {
    var target = null;
    var build = new statici18n.obj(target, {}, new stream());
    assert.throws(build.checkTarget);
  });

});


describe('Translator', function(){

  it('should consume translation catalogs', function() {
    var translator = new Translator({localeDir: appPath + '/locale'});
    var locales = translator.getLocales();
    locales.length.should.equal(3);
  });

  it('should translate strings', function() {
    var translator = new Translator({localeDir: appPath + '/locale'});
    var bonjour = 'Bonjour tout le monde';
    translator.langGettext('fr', 'Hello World').should.equal(bonjour);
  });

  it('should translate file streams', function(done){
    var translator = new Translator({localeDir: appPath + '/locale'});
    var translate = translator.getStreamTranslator('javascript');
    var count = 0;
    var msgs = [
      'window.alert(\'Hello World\');\n',
      'window.alert(\'Bonjour tout le monde\');\n',
      'window.alert(\'Olá mundo\');\n',
    ];

    var assertTranslation = through.obj(function(file, enc, callback) {
      msgs.should.include(String(file.contents));
      count += 1;
      this.resume();
      callback();
    });

    var asserAllLangsTranslated = function() {
      count.should.equal(3);
      done();
    };

    vfs.src(appPath + '/src/script.js')
      .pipe(translate)
      .pipe(assertTranslation)
      .on('end', asserAllLangsTranslated);

  });

  describe('token regex', function() {

    before(function() {
      var translator = new Translator();
      this.getRegEx = translator.getTokenRegex;
    });

    it('should capture gettext calls from js', function(){
      var jsStr = '' +
        'gettext(\'Should Capture\');' +
        'gettext("This too");' +
        'noop();' +
        'get text("Syntax Error")' +
        'gettext(    \'Much space\'    )\n' +
        'gettext(   "Such space"    )\n\n\n' ;

      var count = 0;
      var re = this.getRegEx('javascript');
      while (re.exec(jsStr)) {
        count += 1;
      }
      count.should.equal(4);
    });

    // Not a big concern but worth noting.
    // To avoid these situation, should refactor using a js parser.
    /*
    it('should not capture bad gettext calls', function(){
      var jsStr = 'ggettext("str")';
      var re = this.getRegEx('javascript');
      var match = jsStr.match(re);
      match.should.not.be.ok;
    });
    */

    it('should caputure trans calls from handlebars', function() {
      var hbsStr = '' +
        '<h1>{{trans "sup"}}</h1>' +
        '<p>  {{trans      \'yo yo\'   }}' +
        '<p>  {{trans}}';
      var re = this.getRegEx('handlebars');
      var count = 0;
      while (re.exec(hbsStr)) {
        count += 1;
      }
      count.should.equal(2);
    });

  });

});


describe('Translated File', function() {
  it('should be able create lang prefixes from catalog names', function() {
    var getPrefix = TranslatedFile.getLangPrefix;
    getPrefix('en', 'en').should.equal('');
    getPrefix('pt_BR').should.equal('pt-br/');
    getPrefix('de-Latn_DE-1996').should.equal('de-latn-de-1996/');
  });
});



// integration tests


describe('Static translation of an app', function() {

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

  it('should create a directory for French and Portuguese', function() {
    var hasFrenchDir = fs.statSync(appPath + '/build/fr').isDirectory();
    var hasPtDir = fs.statSync(appPath + '/build/pt-br').isDirectory();
    hasFrenchDir.should.be.true;
    hasPtDir.should.be.true;
  });

  it('should knockout gettext calls from the js', function () {
    var expected = 'window.alert(\'Hello World\');\n';
    var content = String(fs.readFileSync(appPath + '/build/script.js'));
    content.should.equal(expected);
  });

  it('should traslate the js in Portuguese', function () {
    var expected = 'window.alert(\'Olá mundo\');\n';
    var content = String(fs.readFileSync(appPath + '/build/pt-br/script.js'));
    content.should.equal(expected);
  });

  it('should knockout gettext calls from the handlebars', function () {
    var expected = '<h1>Hello World</h1>\n';
    var content = String(fs.readFileSync(appPath + '/build/template.hbs'));
    content.should.equal(expected);
  });

  it('should use French for the trans call in the handlebars', function () {
    var expected = '<h1>Bonjour tout le monde</h1>\n';
    var content = String(fs.readFileSync(appPath + '/build/fr/template.hbs'));
    content.should.equal(expected);
  });

});
