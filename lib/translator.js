'use strict';

var fs = require('fs');
var lodash = require('lodash');
var path = require('path');
var through = require('through2');
var gettextParser = require('gettext-parser');
var PluginError = require('plugin-error');

var TranslatedFile = require('./translated-file');



function Translator(options) {
  this.options = lodash.defaults(options, {
      localeDirs: ['locale'],
      defaultLang: 'en'
  });
  this.translators = {};
  return this;
}


Translator.prototype.getLocales = function() {
  if (this._locales && this._locales.length > 0) {
    return this._locales;
  }
  // the first locale directory is the canonical list of languages
  var localeDir = this.options.localeDirs[0];
  var isLocale = function(file) {
    var filePath = path.join(localeDir, file);
    return (! file.match(/template/)) && fs.statSync(filePath).isDirectory();
  };
  this._locales = lodash.filter(fs.readdirSync(localeDir), isLocale);
  var defaultLang = this.options.defaultLang;
  if (defaultLang !== null){
    this._locales.push(defaultLang);
  }
  return this._locales;
};

var getPoParser = function(lang) {
  var parser = function(localeDir) {
    var fp = path.join(localeDir, lang, 'LC_MESSAGES', 'messages.po');
    var hasPo = fs.existsSync(fp);
    var po = hasPo ? fs.readFileSync(fp, {encoding: 'utf8'}) : null;
    var catalog = po ? gettextParser.po.parse(po).translations[''] : {};
    return catalog;
  };
  return parser;
};

var getCatalogParser = function(defaultLang, localeDirs) {
  var parser = function(lang) {
    if (lang === defaultLang) {
      return {};
    }
    var parsePo = getPoParser(lang);
    var jsonPoArray = lodash.map(localeDirs, parsePo);
    return lodash.reduce(jsonPoArray, lodash.defaults);
  };
  return parser;
};

Translator.prototype.getCatalogs = function() {
  if(this._catalogs) {
    return this._catalogs;
  }
  var parseCatalog = getCatalogParser(
    this.options.defaultLang,
    this.options.localeDirs
  );
  var locales = this.getLocales();
  var catalogList = lodash.map(locales, parseCatalog, this);

  this._catalogs = lodash.zipObject(locales, catalogList);
  return this._catalogs;
};


Translator.prototype.getCatalog = function(lang) {
  var catalogs = this.getCatalogs();
  var cat = catalogs[lang];
  if (!cat) {
    this.error('Unable find a translation catalog for ' + lang);
  }
  return cat;
};


Translator.prototype.langGettext = function(lang, str) {
  if (!str || typeof str !== 'string') {
    return str;
  }
  var catalog = this.getCatalog(lang);
  var msg = catalog[str] || {};
  return (msg.msgstr && msg.msgstr[0]) || str;
};


Translator.prototype.error = function(msg) {
  var id = 'gulp-static-i18n/lib/Translator';
  if (this.stream) {
    this.stream.emit('error', new PluginError(id, msg));
  } else {
    throw new Error(msg);
  }
};


Translator.prototype.readFile = function(file) {
  if(!file || !file.contents) {
    this.error('No file found.');
  }
  return String(file.contents);
};


Translator.prototype.register = function(fileExts, translator) {
  var regExt = function(ext) {
    this.translators[ext] = translator;
  };
  lodash.forEach(fileExts, regExt, this);
};


Translator.prototype.getTranslator = function(file) {
  var ext = path.extname(file.path);
  var nullTranslator = function() { return null; };
  return this.translators[ext] || nullTranslator;
};

Translator.prototype.translate = function(file) {
  var translator = this.getTranslator(file);
  var copy = this.readFile(file);
  var locales = this.getLocales();
  var opts = this.options;
  opts.file = file;

  var translateFile = function(lang) {
    var gettext = lodash.bind(this.langGettext, this, lang);
    var translatedFile;
    lang = lang.toLowerCase().replace(/_/g, '-');
    opts.lang = lang;
    opts.translation = translator(copy, gettext, lang);
    translatedFile = new TranslatedFile(opts);
    this.stream.push(translatedFile);
  };

  lodash.forEach(locales, translateFile, this);
  this.stream.emit('translated', file);
};


Translator.prototype.getStreamTranslator = function() {
  var translator = this;
  return through.obj(function(file, encoding, cb) {
    translator.stream = this;
    translator.translate(file);
    cb();
  });
};


module.exports = Translator;
