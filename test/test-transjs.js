'use strict';

var expect = require('chai').expect;

var transjs = require('../lib/translators/javascript');

function gettext(str) {
  return str;
}

describe('Javascript Translator', function(){

  it('replaces a single gettext call', function() {
    var c = 'alert(gettext("Hello World"));';
    var translated = transjs(c, gettext);
    expect(translated).to.equal('alert("Hello World");');
  });

  // // Not a big concern but worth noting.
  // // To avoid these situation would need to avoid regex and use a parser.
  // it('does not capture bad gettext calls', function(){
  //   var c = 'ggettext("str")';
  //   var translated = transjs(c, gettext);
  //   expect(translated).to.equal(c);
  // });

  it('replaces gettext calls with whitespace', function(){
    var c = '[' +
      'gettext(    \'Much space\'    ), ' +
      'gettext(   "Such space"    )' +
      ']';
    var translated = transjs(c, gettext);
    expect(translated).to.equal('[\'Much space\', "Such space"]');
  });

});
