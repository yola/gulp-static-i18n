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
    var options = {jsonKeys: ['description'] };
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
    var options = {jsonKeys: ['description'] };
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
    var options = {jsonKeys: ['nested.description'] };
    var translated = transjson(options, str, gettext);
    expect(translated).to.equal(JSON.stringify(expected));
  });

  it('does not translate values nested under an ignored key', function() {
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
    var options = {jsonKeys: ['description'], ignoreKeys: ['some'] };
    var translated = transjson(options, str, gettext);
    expect(translated).to.equal(JSON.stringify(expected));
  });

  it('translates an array of objects', function() {
    var obj = [
      { description: 'Hello world' },
      { some: { description: 'Hello world' } },
      { other: { description: 'goodbye' } }
    ];
    var expected = [
      { description: 'Olá mundo' },
      { some: { description: 'Hello world' } },
      { other: { description: 'adiós' } }
    ];
    var str = JSON.stringify(obj);
    var options = {jsonKeys: ['description'], ignoreKeys: ['some'] };
    var translated = transjson(options, str, gettext);
    expect(translated).to.equal(JSON.stringify(expected));
  });

  it('translates all strings in a key’s array value', function() {
    var obj = { description: ['Hello world', 'goodbye'] };
    var expected = { description: ['Olá mundo', 'adiós'] };
    var str = JSON.stringify(obj);
    var options = {jsonKeys: ['description.#'] };
    var translated = transjson(options, str, gettext);
    expect(translated).to.equal(JSON.stringify(expected));
  });


});


describe('Dotted object', function(){

  it('retrieves a string by a dotted key', function() {
    var dotobj = new transjson.Dotted({a: {b: {c: {d: 'some string'}}}});
    expect(dotobj.get('a•b•c•d')).to.equal('some string');
  });

  it('retrieves a nested object a dotted key', function() {
    var dotobj = new transjson.Dotted({a: {b: {c: {d: 'some string'}}}});
    expect(dotobj.get('a•b•c')).to.deep.equal({d: 'some string'});
  });

  it('sets a string using a dotted key', function() {
    var dotobj = new transjson.Dotted({a: {b: {c: {d: 'some string'}}}});
    dotobj.set('a•b•c•d', 'new string');
    expect(dotobj.getObj()).to.deep.equal({a: {b: {c: {d: 'new string'}}}});
  });

  it('retrieves an array value using a dotted key', function() {
    var dotobj = new transjson.Dotted([{a: ['', 'some string']}]);
    expect(dotobj.get('0•a•1')).to.equal('some string');
  });

  it('sets an array value using a dotted key', function() {
    var dotobj = new transjson.Dotted([{a: [{}, '', 0]}]);
    dotobj.set('0•a•3', 'sup');
    expect(dotobj.getObj()).to.deep.equal([{a: [{}, '', 0, 'sup']}]);
  });

});


describe('Key filter', function(){

  it('denies by default', function() {
    var kf = transjson.getKeyFilter([]);
    expect(kf('somekey')).to.be.false;
  });

  it('approves a single key match', function() {
    var kf = transjson.getKeyFilter(['yeskey']);
    expect(kf('yeskey')).to.be.true;
  });

  it('denies if the key is a substring', function() {
    var kf = transjson.getKeyFilter(['key']);
    expect(kf('somekey')).to.be.false;
  });

  it('denies if the key is not at the end', function() {
    var kf = transjson.getKeyFilter(['yeskey']);
    expect(kf('yeskey•end')).to.be.false;
  });

  it('denies if an ignore is present', function() {
    var kf = transjson.getKeyFilter(['yep'], ['no']);
    expect(kf('no')).to.be.false;
    expect(kf('some•no')).to.be.false;
    expect(kf('some•no•yep')).to.be.false;
  });

  it('denies if an ignore overwrites a yes', function() {
    var kf = transjson.getKeyFilter(['yep'], ['not.yep']);
    expect(kf('yep')).to.be.true;
    expect(kf('not•yep')).to.be.false;
  });

  it('approves all array values', function() {
    var kf = transjson.getKeyFilter(['#']);
    expect(kf('0')).to.be.true;
    expect(kf('123')).to.be.true;
    expect(kf('some•key•456')).to.be.true;
  });

  it('denies if the array is not at the end', function() {
    var kf = transjson.getKeyFilter(['#']);
    expect(kf('0.last')).to.be.false;
  });

  it('denies a similar period key', function() {
    var kf = transjson.getKeyFilter(['some.yep']);
    expect(kf('some.yep')).to.be.false;
  });

  it('matches if periods are present in the key', function() {
    var kf = transjson.getKeyFilter(['some.yep']);
    expect(kf('period.key•some•yep')).to.be.true;
  });

  it('denies a key with hash symbols', function() {
    var kf = transjson.getKeyFilter(['#.yep']);
    expect(kf('#.yep')).to.be.false;
    expect(kf('#•yep')).to.be.false;
  });

  it('denies if an ignore overwrites an array yes', function() {
    var kf = transjson.getKeyFilter(['#.yep'], ['not.that.#.yep']);
    expect(kf('0•yep')).to.be.true;
    expect(kf('some•0•yep')).to.be.true;
    expect(kf('not•that•0•yep')).to.be.false;
  });

  it('approves the nested values', function() {
    var kf = transjson.getKeyFilter(['some.key']);
    expect(kf('nested•value•some•key')).to.be.true;
  });

  it('approves the nested values under keys with periods', function() {
    var kf = transjson.getKeyFilter(['some.key']);
    expect(kf('nested•key.with.period•some•key')).to.be.true;
  });

  it('approves array keys using hash sign', function() {
    var kf = transjson.getKeyFilter(['some.#.key']);
    expect(kf('nested•some•10•key')).to.be.true;
    expect(kf('nested•some•0•key')).to.be.true;
    expect(kf('nested•some•key')).to.be.false;
  });

  it('denies using ignores', function() {
    var kf = transjson.getKeyFilter(['item'], ['ignore']);
    expect(kf('item.ignore')).to.be.false;
  });

  describe('using multiple keys', function () {

    var yes = ['yes.please', 'some.#.name', 'yep'];
    var no = ['nope', 'nah.some.#.name', 'this.that.but.not.yep'];
    var kf = transjson.getKeyFilter(yes, no);

    it('approves each yes key', function() {
      expect(kf('some•yes•please')).to.be.true;
      expect(kf('some•0•name')).to.be.true;
      expect(kf('a•long•key•with.a•yep')).to.be.true;
    });

    it('denies partial yes keys', function() {
      expect(kf('yes')).to.be.false;
      expect(kf('yesplease')).to.be.false;
      expect(kf('some•name')).to.be.false;
    });

    it('denies a each ignore key', function() {
      expect(kf('nope')).to.be.false;
      expect(kf('this•that•but•not•yep')).to.be.false;
      expect(kf('nah•some•0•name')).to.be.false;
    });

    it('denies a yes key if contains a no match', function() {
      expect(kf('big•fat•nope•and•yep')).to.be.false;
    });

    it('denies a no key that overwrites a yes key', function() {
      expect(kf('beep•boop•this•that•but•not•yep')).to.be.false;
    });

  });

});
