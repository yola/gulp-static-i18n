'use strict';

var fs = require('fs');
var gutil = require('gulp-util');
var lodash = require('lodash');
var path = require('path');
var through = require('through2');
var gettextParser = require('gettext-parser');

var TranslatedFile = require('./translated-file');
var PluginError = gutil.PluginError;


function Translator(options) {
  this.options = lodash.defaults(options, {
      localeDir: 'locale',
      defaultLang: 'en'
  });
  this.translators = {};
  return this;
}


Translator.prototype.getLocales = function() {
  if (this._locales && this._locales.length > 0) {
    return this._locales;
  }

  var localeDir = this.options.localeDir;
  var isLocale = function(file) {
    var filePath = localeDir + '/' + file;
    return (! file.match(/template/)) && fs.statSync(filePath).isDirectory();
  };
  this._locales = lodash.filter(fs.readdirSync(localeDir), isLocale);
  this._locales.push(this.options.defaultLang);
  return this._locales;
};


Translator.prototype.getCatalogs = function() {
  if(this._catalogs) {
    return this._catalogs;
  }

  var parseMessages = function(lang) {
    if (lang === this.options.defaultLang) {
      return {};
    }
    var fp = this.options.localeDir + '/' + lang + '/LC_MESSAGES/messages.po';
    var po = fs.readFileSync(fp, {encoding: 'utf8'});
    return gettextParser.po.parse(po).translations[''];
  };
  var locales = this.getLocales();
  var catalogList = lodash.map(locales, parseMessages, this);

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
  if (!str) {
    this.error('Unable to translate ' + str);
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
  return this.translators[ext] || lodash.identity;
};

Translator.prototype.translate = function(file) {
  var translator = this.getTranslator(file);
  var copy = this.readFile(file);
  var locales = this.getLocales();
  var opts = this.options;
  opts.file = file;

  var translateFile = function(lang) {
    var gettext = lodash.bind(this.langGettext, this, lang);
    opts.lang = lang;
    opts.translation = translator(copy, gettext);
    file = new TranslatedFile(opts);
    this.stream.push(file);
  };

  lodash.forEach(locales, translateFile, this);
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
