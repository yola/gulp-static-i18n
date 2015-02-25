# Static Internationalization [![Build Status](https://travis-ci.org/yola/gulp-static-i18n.svg?branch=master)](https://travis-ci.org/yola/gulp-static-i18n)

> Gulp plugin to translate static assets.


## Install

```
$ npm install --save-dev gulp-static-i18n
```


## Usage

Example gulp file:

```js
'use strict';
var gulp = require('gulp');
var clean = require('gulp-rimraf');
var statici18n = require('gulp-static-i18n');

gulp.task('clean', function() {
  return gulp.src(['build'])
    .pipe(clean({force: true}));
});

gulp.task('build', ['clean'], function(){
  return gulp.src(['src/**'])
    .pipe(gulp.dest('build'));
});

gulp.task('translate', ['build'], function(){
  return gulp.src(['build'])
    .pipe(statici18n());
});

module.exports = gulp;
```

### What happens on disk

The source is copied for each language present in the locale directory. Every
file is pruned for translation calls.

Example:

**Source**
```
app
├── index.html
├── script.js // alert(gettext("Hello World"));
└── locale
    ├── fr
    └── pt_BR
```

**Build**
```
app
├── build
│   ├── index.html
│   └── script.js  // alert(gettext("Hello World"));
├── index.html
├── index.js
└── locale
    ├── fr
    └── pt_BR
```

**Translated**
```
app
├── build
|   ├── index.html
|   ├── script.js  // alert("Hello World");
│   ├── fr
│   │   ├── index.html
│   │   └── script.js  // alert("Bonjour tout le monde");
│   └── pt-br
│       ├── index.html
│       └── script.js  // alert("Olá mundo");
├── index.html
├── index.js
└── locale
    ├── fr
    └── pt_BR
```


## API

### options

#### localeDir

Type: `str`  
Default: `locale`

The directory that holds the gettext translation catalogs.


## License

MIT © [Yola](https://github.com/yola)
