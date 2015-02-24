'use strict';

var assert = require('chai').assert;
var fs = require('fs');
var statici18n = require('../');
var stream = require('stream');
var through = require('through2');
var Translator = require('../lib/translator.js');
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
    locales.length.should.equal(2);
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
      'window.alert(\'Bonjour tout le monde\');\n',
      'window.alert(\'Olá mundo\');\n',
    ];

    var assertTranslation = through(function() {
      var msg = this.read();
      msgs.should.include(msg.translation);
      count += 1;
    });

    var asserAllLangsTranslated = function() {
      count.should.equal(2);
      done();
    };

    vfs.src(appPath + '/src/script.js')
      .pipe(translate)
      .pipe(assertTranslation)
      .on('end', asserAllLangsTranslated);

  });

  describe('javascript token regex', function() {

    it('should capture call gettext calls', function(){
      var jsStr = '' +
        'gettext(\'Should Capture\');' +
        'gettext("This too");' +
        'noop();' +
        'get text("Syntax Error")' +
        'gettext(    \'Much space\'    )\n' +
        'gettext(   "Such space"    )\n\n\n' ;

      var translator = new Translator();
      var re = translator.getTokenRegex('javascript');
      var count = 0;

      while (re.exec(jsStr)) {
        count += 1;
      }
      count.should.equal(4);
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

  it('should create a directory for french', function() {
    expect(fs.statSync(appPath + '/build/fr').isDirectory()).to.be.true;
  });

});
