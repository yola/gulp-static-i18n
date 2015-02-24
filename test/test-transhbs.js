'use strict';

var transhbs = require('../lib/translators/handlebars');
require('chai').should();

function gettext(str) {
  return str;
}

describe('Handlebars Translator', function(){

  it('should translate trans template tags', function() {
    var template = '' +
      '<h1>{{trans "sup"}}</h1>' +
      '<p>  {{trans      \'yo yo\'   }}  </p>';
    var expected = '<h1>sup</h1><p>  yo yo  </p>';
    var translated = transhbs(template, gettext);
    translated.should.equal(expected);
  });

});
