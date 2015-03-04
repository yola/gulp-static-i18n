'use strict';

var del = require('del');
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
  var stage = this.target.path + '-stage';

  var clearStage = function() {
    del.sync(stage, {force: true});
  };
  var clearAndDone = function() {
    clearStage();
    done();
  };

  translator.register(['.js'], transjs);
  translator.register(['.hbs'], transhbs);

  clearStage();
  fs.renameSync(targetPath, stage);
  vfs.src(stage + '/**/*.*')
    .pipe(translate)
    .pipe(vfs.dest(targetPath))
    .on('end', clearAndDone);

};


StaticI18n.prototype.error = function(msg) {
  if (!this.stream) {
    throw new Error(msg);
  }
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
