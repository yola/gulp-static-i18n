# gulp-static-i18n changelog

## 1.0.1

* Bump up `del` to 1.2.1

## 1.0.0

* Update dependencies

**Breaking changes**

Change required node version (>=14.21.3). It may work with lower node version,
but it's tested only with version 14.23.1.

## 0.1.0

* Add support for handling translating keys with dots ([#26][])

[#26]: https://github.com/yola/gulp-static-i18n/pull/26


## v0.0.9

* Update `defaultLang` to accept `null` and document behavior.


## v0.0.8

* Pin all dependencies to minor versions


## v0.0.7

* Add support for prefixing urls with language-code in json ([#15][])

[#15]: https://github.com/yola/gulp-static-i18n/pull/15


## v0.0.6

* Bugfix for sibling tests is json translation([#14][])

[#14]: https://github.com/yola/gulp-static-i18n/pull/14


## v0.0.5

* Add option to format output json ([#12][])
* Bugfix translating falsy values

[#12]: https://github.com/yola/gulp-static-i18n/pull/12


## v0.0.4

* Add support for sibling value tests for translating json ([#10][])

[#10]: https://github.com/yola/gulp-static-i18n/pull/10


## v0.0.3

* Add support for translating json ([#8][])

[#8]: https://github.com/yola/gulp-static-i18n/pull/8


## v0.0.2

* Allow sourcing of PO files from Multiple directories ([#5][])
* Change `localeDir` to `localeDirs` in options object passed
  to `Translator`.

[#5]: https://github.com/yola/gulp-static-i18n/pull/5


## v0.0.1

* Initial release
