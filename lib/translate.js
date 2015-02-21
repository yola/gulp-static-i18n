'use strict';

var fs = require('fs');
var through = require('through2');

function Translate(file, options, stream) {
  // TODO: define a bunch of regex for each language
  this.file = file;
  this.stream = stream;
  this.options = options;
  return this;
}

Translate.prototype.translate = function(cb) {
  //this.file.contents.toString('utf8'));
  // TODO: will have to all become async and use all locales
  fs.writeFileSync(this.file.path, 'window.alert("Hello World");\n');
  this.stream.emit('end');
};


function gulpUntranslatedFiles(options) {
  return through.obj(function(file, encoding, cb) {
    var untranslatedFile = new Translate(file, options, this);
    untranslatedFile.translate();
    cb(null, file);
  });
}


module.exports = gulpUntranslatedFiles;
module.exports.obj = Translate;
