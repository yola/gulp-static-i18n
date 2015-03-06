'use strict';

var expect = require('chai').expect;
var stream = require('stream');
var through = require('through2');
var vfs = require('vinyl-fs');
var path = require('path');

var statici18n = require('../index');
var Translator = require('../lib/translator');
var TranslatedFile = require('../lib/translated-file');


describe('StaticI18n', function(){

  it('throws for null targets', function() {
    var target = null;
    var build = new statici18n.obj(target, {}, new stream());
    var checkNull = function() { build.checkTarget(target); };
    expect(checkNull).to.throw('Missing files');
  });

  it('blows up when fed an empty stream', function() {
    var emptyStream = new stream();
    var translatedStream = emptyStream.pipe(statici18n());
    var badStream = function() { translatedStream.write(); };
    expect(badStream).to.throw('Missing files');
  });

});


describe('Translator', function(){

  var baseDir = path.join(__dirname, '/fixtures/app');
  var singleOptions = {localeDirs: [baseDir + '/locale']};
  var multiOptions = {
    localeDirs: [baseDir + '/locale', baseDir + '/installed_deps/locale']
  };
  var hello = 'Hello World';
  var bonjour = 'Bonjour tout le monde';

  var testGetLocales = function(options) {
    var translator = new Translator(options);
    var locales = translator.getLocales();
    expect(locales.length).to.equal(3);
  };

  var testFrTranslate = function(options, string, translated) {
    var translator = new Translator(options);
    expect(translator.langGettext('fr', string)).to.equal(translated);
  };

  it('consumes translation catalogs', function() {
    testGetLocales(singleOptions);
  });

  it('merges catalogs that belong to the same language', function() {
    testGetLocales(multiOptions);
  });

  it('translates "Hello World"', function() {
    testFrTranslate(singleOptions, hello, bonjour);
  });

  it('prioritizes duplicate messages by catalog first seen', function() {
    testFrTranslate(multiOptions, hello, bonjour);
  });

  it('translates msgs from secondarily consumed catalogs', function() {
    testFrTranslate(multiOptions, 'Thank you very much', 'Merci beaucoup');
  });


  it('is useable through a stream', function(done){
    var translator = new Translator(multiOptions);
    var translate = translator.getStreamTranslator();
    var count = 0;

    var downStreamTransformer = through.obj(function(obj, enc, callback) {
      count += 1;
      this.resume();
      callback();
    });

    var assertSomeItemsWerePiped = function() {
      expect(count).to.not.equal(0);
      done();
    };

    vfs.src(path.join(__dirname, '/fixtures/app/src/*'))
      .pipe(translate)
      .pipe(downStreamTransformer)
      .on('end', assertSomeItemsWerePiped);

  });

});


describe('Translated File', function() {

  describe('prefixing', function() {

    it('creates lang prefixes from translation catalogs', function() {
      var ptPrefix = TranslatedFile.getLangPrefix('pt_BR');
      expect(ptPrefix).to.equal('pt-br/');
      var dePrefix = TranslatedFile.getLangPrefix('de-Latn_DE-1996');
      expect(dePrefix).to.equal('de-latn-de-1996/');
    });

  });

});
