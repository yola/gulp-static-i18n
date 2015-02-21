'use strict';
var gulp = require('gulp');
var clean = require('gulp-rimraf');
var statici18n = require('../../../');

gulp.task('clean', function() {
  return gulp.src(['build'], { cwd: __dirname })
    .pipe(clean({force: true}));
});

gulp.task('build', ['clean'], function(){
  return gulp.src(['src/**'], { cwd: __dirname, base: __dirname + '/src' })
    .pipe(gulp.dest('build', { cwd: __dirname }));
});

gulp.task('translate', ['build'], function(){
  return gulp.src(['build'], { cwd: __dirname })
    .pipe(statici18n());
});

gulp.task('default', ['translate']);

module.exports = gulp;
