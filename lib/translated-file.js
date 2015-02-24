'use strict';

var path = require('path');
var File = require('vinyl');

function getLangPrefix(lang, defaultLang) {
  if(lang === defaultLang) {
    return '';
  }
  var dir = lang.toLowerCase().replace(/_/g, '-');
  return dir + '/';
}

function TranslatedFile(options) {
  var contents;
  var langDir = getLangPrefix(options.lang, options.defaultLang);
  var relPath = path.relative(options.file.base, options.file.path);
  var filePath = langDir + relPath;

  if (options.translation) {
    contents = new Buffer(options.translation);
  } else {
    contents = options.file.contents;
  }

  return new File({
    path: filePath,
    contents: contents
  });

}

module.exports = TranslatedFile;
module.exports.getLangPrefix = getLangPrefix;
