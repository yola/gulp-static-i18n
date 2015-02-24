'use strict';

var fs = require('fs');
var gutil = require('gulp-util');
var lodash = require('lodash');
var through = require('through2');
var gettextParser = require('gettext-parser');

var TranslatedFile = require('./translated-file');
var PluginError = gutil.PluginError;

var TOKEN_REGEX = {
  'javascript': /gettext\(\s*(?:"([^"]+)"|\'([^\']+)\')\s*\)\s*/g,
  'handlebars': /todo/
};
var BOOKENDS = {
  'javascript': '\''
};

function Translator(options) {
  this.options = lodash.defaults(options, {
      localeDir: 'locale',
      defaultLang: 'en'
  });
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


Translator.prototype.getTokenRegex = function(type) {
  var re = TOKEN_REGEX[type];
  if (!re) {
    this.error('File type not supported: ' + type);
  }
  // Regexs are not immuteable, when exec'd they update internal indexes.
  // Returning a copy prevents the constant from being contaminated.
  return new RegExp(re);
};


Translator.prototype.translateCopy = function(copy, lang, re, bookend) {
  var gettext = lodash.bind(this.langGettext, this, lang);
  var translated = copy;
  var find = new RegExp(re);
  var match = find.exec(copy);
  var msgid, needle, replacement;
  while (match) {
    needle = match[0];
    msgid = match[1] || match[2];
    replacement = bookend + gettext(msgid) + bookend;
    translated = translated.replace(needle, replacement);
    match = find.exec(copy);
  }
  return translated;
};

Translator.prototype.readFile = function(file) {
  var copy = file && file.contents.toString('utf-8');
  if(!copy) {
    this.error('Unable to read file.');
  }
  return copy;
};


Translator.prototype.translate = function(file, type) {
  var copy = this.readFile(file);
  var re = this.getTokenRegex(type);
  var bookend = BOOKENDS[type] || '';
  var locales = this.getLocales();
  var opts = this.options;
  opts.file = file;
  for (var i = 0; i < locales.length; i++) {
    opts.lang = locales[i];
    opts.translation = this.translateCopy(copy, opts.lang, re, bookend);
    file = new TranslatedFile(opts);
    this.stream.push(file);
  }
};


Translator.prototype.getStreamTranslator = function(fileType) {
  var translator = this;
  return through.obj(function(file, encoding, cb) {
    translator.stream = this;
    translator.translate(file, fileType);
    cb();
  });
};


module.exports = Translator;
