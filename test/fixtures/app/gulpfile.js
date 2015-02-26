'use strict';
var gulp = require('gulp');
var del = require('del');

var statici18n = require('../../../index');

gulp.task('clean', function(done) {
  del(['build'], { cwd: __dirname, force: true }, done);
});

gulp.task('build', ['clean'], function(){
  return gulp.src(['src/**'], { cwd: __dirname, base: __dirname + '/src' })
    .pipe(gulp.dest('build', { cwd: __dirname }));
});

var options = {
  localeDir: __dirname + '/locale'
};

gulp.task('translate', ['build'], function(){
  return gulp.src(['build'], { cwd: __dirname })
    .pipe(statici18n(options));
});

gulp.task('default', ['translate']);

module.exports = gulp;
