'use strict';

var transjs = require('../lib/translators/javascript');
require('chai').should();

function gettext(str) {
  return str;
}

describe('Javascript Translator', function(){

  before(function() {
    this.gettext = function(str) {
      return this.str;
    };
    this.translate;
  });

  it('should translate when there is one call', function() {
    var c = 'alert(gettext("Hello World"));';
    var expected = 'alert("Hello World");';
    var translated = transjs(c, gettext);
    translated.should.equal(expected);
  });

  // // Not a big concern but worth noting.
  // // To avoid these situation would need to avoid regex and use a parser.
  // it('should not capture bad gettext calls', function(){
  //   var c = 'ggettext("str")';
  //   var translated = transjs(c, gettext);
  //   translated.should.equal(c);
  // });

  it('should translate when calls have whitespace', function(){
    var c = '[' +
      'gettext(    \'Much space\'    ), ' +
      'gettext(   "Such space"    )' +
      ']';
    var expected = '[\'Much space\', "Such space"]';
    var translated = transjs(c, gettext);
    translated.should.equal(expected);
  });

});
