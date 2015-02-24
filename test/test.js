'use strict';

var assert = require('chai').assert;
var statici18n = require('../');
var stream = require('stream');
var through = require('through2');
var Translator = require('../lib/translator');
var TranslatedFile = require('../lib/translated-file');
var vfs = require('vinyl-fs');

require('chai').should();

var appPath = __dirname + '/fixtures/app';


describe('StaticI18n', function(){

  it('should throw for null targets', function() {
    var target = null;
    var build = new statici18n.obj(target, {}, new stream());
    assert.throws(build.checkTarget);
  });

  it('should blow up when fed an empty stream', function() {
    var emptyStream = new stream();
    var translatedStream = emptyStream.pipe(statici18n());
    assert.throws(translatedStream.write);
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

  it('should be useable through a stream', function(done){
    var translator = new Translator({localeDir: appPath + '/locale'});
    var translate = translator.getStreamTranslator();
    var count = 0;

    var downStreamTransformer = through.obj(function(obj, enc, callback) {
      count += 1;
      this.resume();
      callback();
    });

    var assertSomeItemsWerePiped = function() {
      count.should.not.equal(0);
      done();
    };

    vfs.src(appPath + '/src/*')
      .pipe(translate)
      .pipe(downStreamTransformer)
      .on('end', assertSomeItemsWerePiped);

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
