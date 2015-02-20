# Static Internationalization [![Build Status](https://travis-ci.org/yola/gulp-static-i18n.svg?branch=master)](https://travis-ci.org/yola/gulp-static-i18n)

> Gulp plugin to translate static assets.


## Install

```
$ npm install --save-dev gulp-static-i18n
```


## Usage

```js
var gulp = require('gulp');
var staticI18n = require('gulp-static-i18n');

gulp.task('default', function () {
  return gulp.src('src/file.ext')
    .pipe(staticI18n())
    .pipe(gulp.dest('dist'));
});
```


## API

### staticI18n(options)

#### options

##### foo

Type: `boolean`  
Default: `false`

Lorem ipsum.


## License

MIT © [Yola](https://github.com/yola)
