'use strict';

var expect = require('chai').expect;

var transhbs = require('../lib/translators/handlebars');


function gettext(str) {
  return str;
}

describe('Handlebars Translator', function(){

  it('replaces trans template tags', function() {
    var template = '' +
      '<h1>{{trans "sup"}}</h1>' +
      '<p>  {{trans      \'yo yo\'   }}  </p>';
    var translated = transhbs(template, gettext);
    expect(translated).to.equal('<h1>sup</h1><p>  yo yo  </p>');
  });

});
