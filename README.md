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
var del = require('del');
var statici18n = require('gulp-static-i18n');

gulp.task('clean', function(cb) {
  del(['build'], cb);
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

### What happens:

`po` files are catalogued/merged from each locale directory, then used
for translation calls.

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
├── script.js
└── locale
    ├── fr
    └── pt_BR
```

**Translated**
```
app
├── build
│   ├── en
│   │   ├── index.html
│   │   └── script.js  // alert("Hello World");
│   ├── fr
│   │   ├── index.html
│   │   └── script.js  // alert("Bonjour tout le monde");
│   └── pt-br
│       ├── index.html
│       └── script.js  // alert("Olá mundo");
├── index.html
├── script.js
└── locale
    ├── fr
    └── pt_BR
```


## API

### options

#### localeDirs

Type: `Array`
Default: `['locale']`

Array of [paths to] locale directories. The directory at index 0 is used as the
canonical list of supported languages. When two directories have conflicting
translations the lower indexed directory will be used.

## License

MIT © [Yola](https://github.com/yola)


## Development

Lint and run js tests:
```
npm test
```

To run just the js tests:
```
npm install -g mocha
mocha
```
