# Static Internationalization
[![Build Status](https://travis-ci.org/yola/gulp-static-i18n.svg?branch=master)](https://travis-ci.org/yola/gulp-static-i18n)
[![npm version](https://badge.fury.io/js/gulp-static-i18n.svg)](http://badge.fury.io/js/gulp-static-i18n)

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

### Creating Language Builds

`statici18n` consumes source files and puts out versions
in each language present in the canonical locale directory,
organized in their own sub-directories.

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

Array of [paths to] locale directories. The first directory is used as the
canonical list of supported languages. When two directories have catalogs with
conflicting translations the directory closer to first is used.

#### jsonKeys

Type: `Array`  
Default: `[]`

Object keys that require translation. The keys can be nested using a `.` or
a `#` to indicate an array.

Example, to translate the json:
```json
{
  "flowers": [
    {"name": "roses", "description": "are red"},
    {"name": "violets", "description": "are blue"}
  ],
  "bugs": [
    {"name": "bees", "description": "buzz"}
  ],
  "items": [
    {"item": "title", "value": "some title"},
    {"item": "count", "value": 4},
    {"item": "description", "value": "some description"},
    {"item": "test", "value": true}
  ]
}
```

Use `['description']` to translate all object descriptions.  For just flower
descriptions use `['flowers.#.description']`.

When translating an array of items, it is somtimes necessary to evaluate a
sibling key to determine if the object value requires translation.

Example: to translate all item values that are titles, use:
`['items.#.value(item=title)']`.  To translate items values that are
titles or descriptions, use:
`['items.#.value(item=title|description)']`

#### urlKeys

Type: `Array`  
Default: `[]`

Object keys of urls that require prefixing with language codes. These keys
follow the same rules and use the same syntax as `jsonKeys`, except `ignoreKeys`
will not ignore any `urlKeys`.

#### ignoreKeys

Type: `Array`  
Default: `null`

Object keys that should be ignored.  These keys override matching `jsonKeys`
and match anywhere in a nested key. Using example above, if wanting
to translate all descriptions except for `bugs` use options:

```js
{
  jsonKeys: ['description'],
  ignoreKeys: ['bugs']
}
```

#### formatSpaces

Type: `Int`  
Default: 0

Number of spaces to use when writing out json.


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
