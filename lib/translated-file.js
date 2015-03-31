'use strict';

var path = require('path');
var File = require('vinyl');

function getLangPrefix(lang) {
  return path.join(lang, '/');
}

function TranslatedFile(options) {
  var contents;
  var langDir = getLangPrefix(options.lang);
  var relPath = path.relative(options.file.base, options.file.path);
  var filePath = path.join(langDir, relPath);

  if (options.translation) {
    contents = new Buffer(options.translation);
  } else {
    contents = options.file.contents;
  }

  return new File({
    stat: options.file.stat,
    path: filePath,
    contents: contents
  });

}

module.exports = TranslatedFile;
module.exports.getLangPrefix = getLangPrefix;
