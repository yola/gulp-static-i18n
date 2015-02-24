'use strict';

var fs = require('fs');
var gutil = require('gulp-util');
var through = require('through2');
var vfs = require('vinyl-fs');

var transhbs = require('./lib/translators/handlebars');
var transjs = require('./lib/translators/javascript');
var Translator = require('./lib/translator');

var PluginError = gutil.PluginError;


function StaticI18n(target, options, stream) {
  this.target = target;
  this.options = options || {};
  this.stream = stream;
  return this;
}


StaticI18n.prototype.translate = function(done) {

  if(!this.checkTarget(this.target)){
    done();
    return;
  }

  var translator = new Translator(this.options);
  var translate = translator.getStreamTranslator();
  var targetPath = this.target.path;

  translator.register(['.js'], transjs);
  translator.register(['.hbs'], transhbs);

  vfs.src(targetPath + '/**/*.*')
    .pipe(translate)
    .pipe(vfs.dest(targetPath))
    .on('end', done);

};


StaticI18n.prototype.error = function(msg) {
  this.stream.emit('error', new PluginError('gulp-static-i18n', msg));
};


function isEmpty(dir) {
  var items = fs.readdirSync(dir.path);
  return !items || !items.length;
}


StaticI18n.prototype.checkTarget = function(dir) {

  if (!dir || !dir.path || isEmpty(dir)) {
    this.error('Missing files to translate.');
    return false;
  }

  if (dir.isStream()) {
    this.error('Streaming not supported');
    return false;
  }

  return true;
};


// plugin wrapper so streams can pipe to it.
function gulpStaticI18n(options) {
  return through.obj(function(target, encoding, cb) {
    var stream = this;
    var build = new StaticI18n(target, options, stream);
    build.translate(cb);
  });
}


module.exports = gulpStaticI18n;
module.exports.obj = StaticI18n;
