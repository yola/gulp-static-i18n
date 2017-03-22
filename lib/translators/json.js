'use strict';
var lodash = require('lodash');
var path = require('path');


function Dotted(obj) {
  this.obj = obj;
}

Dotted.prototype.getObj = function() {
  return this.obj;
};

Dotted.prototype.get = function(dottedStr) {
  if(!dottedStr) {
    return null;
  }
  var keys = dottedStr.split('•');
  var o = this.obj;
  var i, k;
  for (i = 0; i < keys.length; ++i) {
      k = keys[i];
      o = o[k];
  }
  return o;
};

Dotted.prototype.set = function(dottedStr, val) {
  var keys = dottedStr.split('•');
  var o = this.obj;
  var k = keys.shift();
  while(keys.length > 0) {
    o = o[k];
    k = keys.shift();
  }
  o[k] = val;
};


function pushDotKeys(parentkey, obj, queue) {
  var childkeys = [];
  if (typeof obj === 'object') {
    childkeys = lodash.keys(obj);
  }
  var push = function(childkey) {
    var prefix = parentkey ? parentkey + '•' : '';
    queue.push(prefix + childkey);
  };
  lodash.map(childkeys, push);
}


function translate(obj, isTransKey, isUrlKey, gettext, lang) {
  // bfs traversal
  var queue = [];
  var dotobj = new Dotted(obj);
  var key, val;
  var next = function() {
    key = queue.shift();
    val = dotobj.get(key);
    return key;
  };

  var transPrefix = function(currentKey, currentVal) {
    if(isTransKey(currentKey, obj)) {
      dotobj.set(currentKey, gettext(currentVal));
    }
    if(isUrlKey(currentKey, obj)) {
      dotobj.set(currentKey, path.join('/', lang, currentVal));
    }
  };

  pushDotKeys(null, obj, queue);
  while (next()) {
    if (typeof val === 'object') {
      pushDotKeys(key, val, queue);
    }
    if (typeof val === 'string') {
      transPrefix(key, val);
    }
  }

  return dotobj.getObj();
}


var getKeyFilter;

function siblingtest(key, obj, config) {

  // config comes in as `some.key` and needs to be parsed into
  // code applicable to Dotted objs and matches the tail of long keys
  if (!config.parsed) {
    var keys = lodash.keys(config);
    var mkTest = function(k) {
      var test = {};
      // provides a test to say `key(sib=val)` applies to `some.long.key`
      test.verifiesKey = getKeyFilter(new Array(k));
      // verifies `val2` is in `key(sib=val1|val2|val3)`
      test.isSibValOk = function(sibv) {
        var validVals = config[k].vals;
        var val = String(sibv);
        if(validVals.indexOf(val) >= 0) {
          return true;
        }
        return false;
      };
      test.sibkey = config[k].key;
      return test;
    };
    var tests = lodash.map(keys,mkTest);
    config.tests = tests;
    config.parsed = true;
  }

  // cycle through all the sibling tests extracted from the include keys
  var dob = new Dotted(obj);
  var ignore = true;
  var verified = false;
  var verifyKey = function(test) {
    if( ! test.verifiesKey(key) ) {
      return;
    }
    ignore = false;
    var sibkey = key.replace(/(•)?[^•]+$/, '$1' + test.sibkey);
    var sibval = dob.get(sibkey);
    if(test.isSibValOk(sibval)) {
      verified = true;
    }
  };
  lodash.forEach(config.tests, verifyKey);
  return ignore || verified;
}

function userLookupToDottedKey(lookup) {
  // Converts user-defined lookups (which uses '.' as the delimiter for
  // nested keys) to DotKey (lookups that use '•' as the delimiter).
  // User can use escaping for json like { "some.key": { a: v } }
  // Converts: some\.key.a > some\.key•a
  return lookup.replace(/(\\)?\./g, function(match, isSlashed) {
    // negative lookbehinds are not pretty in js
    return isSlashed ? match : '•';
  });
}

var createPattern = function(lookups, opts){
  // convert a list of lookups to a regular expression
  var matchAnywhere = opts.matchAnywhere;

  var re = '(' + lookups.join('|') + ')';

  // hoping hash simbols in keys is not a thing
  re = re.replace(/#/g, '[0-9]+');

  if(!matchAnywhere) {
    re = '(^|•)' + re + '$';
  }

  return new RegExp(re);
};

function getKeyFilter(lookups, ignoredLookups) {
  // Converts user defined lookups into a test that determines if a
  // DotKey (a lookup that uses bullets as an object key delimiter)
  // references a value the user has defined as needing translation.
  if(!lookups) {
    return function() { return false; };
  }

  var skipTest, siblingTestConfig;

  // extract config for sibling tests
  skipTest = true;
  siblingTestConfig = {};
  var extractSiblingTest = function(lookup) {

    // matches: some.key(sibling-key=val1|val2)
    var m = lookup.match(/^(.+)\(([^=]+)=([^\)]+)\)$/);
    if( ! m || m.length < 4) {
      return lookup;
    }
    skipTest = false;

    // associate the user define sibling test with the key
    var testConfig = {};
    var lookupSansTest = m[1];
    testConfig.key = m[2];
    testConfig.vals = m[3].split('|');
    siblingTestConfig[lookupSansTest] = testConfig;

    return lookupSansTest;
  };
  var lookupsSansTests = lodash.map(lookups, extractSiblingTest);

  // create regex for keys to be accepted
  // User's lookups match only the end of a key (leaf values)
  // Ex, say the include lookup is 'prop.text', we want to:
  //  * accept: 'a•b•c•prop•text' (keys value we want to extract)
  //  * reject: 'prop•text•something•else' (keys something unknown)
  var dottedLookups = lodash.map(lookupsSansTests, userLookupToDottedKey);
  var reYes = createPattern(dottedLookups, {matchAnywhere: false});

  // create regex for keys to be rejected
  // these lookups can match anywhere in the key under test
  var reNo = false;
  if (ignoredLookups) {
    var dottedIgnores = lodash.map(ignoredLookups, userLookupToDottedKey);
    reNo = createPattern(dottedIgnores, {matchAnywhere: true});
  }

  function filter(key, obj) {
    if(reNo && key.match(reNo)) {
      return false;
    }
    var sibtest = skipTest || siblingtest(key, obj, siblingTestConfig);
    if(key.match(reYes) && sibtest) {
      return true;
    }
    return false;
  }

  return filter;
}

function translateJSON(options, copy, gettext, lang) {
  var keys = options.jsonKeys;
  var urls = options.urlKeys;
  var ignored = options.ignoreKeys;
  var translated, obj, keyfilter, urlfilter;
  var formatSpaces = options.formatSpaces || 0;

  if (!keys && !urls) {
    return copy;
  }

  keyfilter = getKeyFilter(keys, ignored);
  urlfilter = getKeyFilter(urls);
  obj = JSON.parse(copy);
  obj = translate(obj, keyfilter, urlfilter, gettext, lang);
  translated = JSON.stringify(obj, null, formatSpaces);
  return translated;
}

function getConfiguredTranslator(options) {
  return lodash.partial(translateJSON, options);
}

module.exports = translateJSON;
module.exports.configure = getConfiguredTranslator;

// exported for testing and use in msg extraction
module.exports.Dotted = Dotted;
module.exports.getKeyFilter = getKeyFilter;
module.exports.pushDotKeys = pushDotKeys;
