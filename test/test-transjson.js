'use strict';

var expect = require('chai').expect;

var transjson = require('../lib/translators/json');

function gettext(str) {
  if (str === 'Hello world') {
    return 'Olá mundo';
  }
  if (str === 'goodbye') {
    return 'adiós';
  }
  return 'some spanish';
}

describe('JSON Translator', function(){

  it('does nothing when not given keys to translate', function() {
    var str = '{"some": "json" }';
    var translated = transjson({}, str, gettext);
    expect(translated).to.equal(str);
  });

  it('translates a given object key', function() {
    var str = '{"description":"Hello world", "not":"this"}';
    var options = {transKeys: ['description'] };
    var translated = transjson(options, str, gettext);
    expect(translated).to.equal('{"description":"Olá mundo","not":"this"}');
  });

  it('translates keys of nested objects', function() {
    var obj = {
      description: 'Hello world',
      not: 'this',
      some: {
        nested: {
          description: 'goodbye'
        }
      }
    };
    var expected = {
      description: 'Olá mundo',
      not: 'this',
      some: {
        nested: {
          description: 'adiós'
        }
      }
    };
    var str = JSON.stringify(obj);
    var options = {transKeys: ['description'] };
    var translated = transjson(options, str, gettext);
    expect(translated).to.equal(JSON.stringify(expected));
  });

  it('translates only the nested key', function() {
    var obj = {
      description: 'Hello world',
      some: {
        nested: {
          description: 'goodbye'
        }
      }
    };
    var expected = {
      description: 'Hello world',
      some: {
        nested: {
          description: 'adiós'
        }
      }
    };
    var str = JSON.stringify(obj);
    var options = {transKeys: ['nested.description'] };
    var translated = transjson(options, str, gettext);
    expect(translated).to.equal(JSON.stringify(expected));
  });

  it('will not translate key that is matched by the ignore', function() {
    var obj = {
      description: 'Hello world',
      some: {
        nested: {
          description: 'goodbye'
        }
      }
    };
    var expected = {
      description: 'Olá mundo',
      some: {
        nested: {
          description: 'goodbye'
        }
      }
    };
    var str = JSON.stringify(obj);
    var options = {transKeys: ['description'], ignoreKeys: ['some'] };
    var translated = transjson(options, str, gettext);
    expect(translated).to.equal(JSON.stringify(expected));
  });

});


describe('Dotted object', function(){

  it('retrieves a string by a dotted key', function() {
    var dotobj = new transjson.Dotted({a: {b: {c: {d: 'some string'}}}});
    expect(dotobj.get('a.b.c.d')).to.equal('some string');
  });

  it('retrieves a nested object a dotted key', function() {
    var dotobj = new transjson.Dotted({a: {b: {c: {d: 'some string'}}}});
    expect(dotobj.get('a.b.c')).to.deep.equal({d: 'some string'});
  });

  it('sets a string using a dotted key', function() {
    var dotobj = new transjson.Dotted({a: {b: {c: {d: 'some string'}}}});
    dotobj.set('a.b.c.d', 'new string');
    expect(dotobj.get('a.b.c.d')).to.equal('new string');
  });

});
