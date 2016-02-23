'use strict';

var expect = require('chai').expect;
var stream = require('stream');
var through = require('through2');
var vfs = require('vinyl-fs');
var path = require('path');

var statici18n = require('../index');
var Translator = require('../lib/translator');


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
  var hello = 'Hello World';
  var bonjour = 'Bonjour tout le monde';

  describe('single locale directory', function() {
    var options = {localeDirs: [baseDir + '/locale']};

    it('consumes translation catalogs', function() {
      var translator = new Translator(options);
      var locales = translator.getLocales();
      expect(locales.length).to.equal(3);
    });

    it('translates "Hello World"', function() {
      var translator = new Translator(options);
      expect(translator.langGettext('fr', hello)).to.equal(bonjour);
    });

    it('returns null for null', function() {
      var translator = new Translator(options);
      expect(translator.langGettext('fr', null)).to.equal(null);
    });

    it('returns empty string for empty string', function() {
      var translator = new Translator(options);
      expect(translator.langGettext('fr', '')).to.equal('');
    });

  });

  describe('multiple locale directories', function() {
    var options = {
      localeDirs: [baseDir + '/locale', baseDir + '/installed_deps/locale']
    };

    it('merges catalogs that belong to the same language', function() {
      var translator = new Translator(options);
      var locales = translator.getLocales();
      expect(locales.length).to.equal(3);
    });

    it('prioritizes duplicate messages by catalog first seen', function() {
      var translator = new Translator(options);
      expect(translator.langGettext('fr', hello)).to.equal(bonjour);
    });

    it('translates msgs from secondarily consumed catalogs', function() {
      var translator = new Translator(options);
      expect(translator.langGettext('fr', 'Thank you very much'))
        .to.equal('Merci beaucoup');
    });

    it('is useable through a stream', function(done){
      var translator = new Translator(options);
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
});
