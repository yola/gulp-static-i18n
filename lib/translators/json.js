'use strict';
var lodash = require('lodash');

function Dotted(obj) {
  this.obj = obj;
}

Dotted.prototype.getObj = function() {
  return this.obj;
};

Dotted.prototype.get = function(dottedStr) {
  var keys = dottedStr.split('.');
  var o = this.obj;
  var i, k;
  for (i = 0; i < keys.length; ++i) {
      k = keys[i];
      o = o[k];
  }
  return o;
};

Dotted.prototype.set = function(dottedStr, val) {
  var keys = dottedStr.split('.');
  var o = this.obj;
  var k = keys.shift();
  while(keys.length > 0) {
    o = o[k];
    k = keys.shift();
  }
  o[k] = val;
};

function pushDotKeys(parentkey, obj, queue) {
  var childkeys = lodash.keys(obj);
  var push = function(childkey) {
    queue.push(parentkey + '.' + childkey);
  };
  lodash.map(childkeys, push);
}

function translateObj(obj, translate) {
  // bfs traversal
  var queue = lodash.keys(obj);
  var dotobj = new Dotted(obj);
  var key = queue.shift();
  var val, translatedVal;

  while (key) {
    val = dotobj.get(key);
    if (typeof val === 'object') {
      pushDotKeys(key, val, queue);
    }
    if (typeof val === 'string') {
      translatedVal = translate(key, val);
      dotobj.set(key, translatedVal);
    }
    key = queue.shift();
  }
  return dotobj.getObj();
}

function filteredTranslate(reYes, reNo, gettext, key, val) {
  if(reNo && key.match(reNo)){
    return val;
  }
  if(key.match(reYes)){
    return gettext(val);
  }
  return val;
}

function translateJSON(options, copy, gettext) {
  var translationKeys = options.transKeys;
  var ignored = options.ignoreKeys;
  var translate, translated, obj, reYes, reNo;

  if (!translationKeys) {
    return copy;
  }

  reYes = translationKeys.join('|');
  reYes = reYes.replace('.', '\\.');
  reYes = new RegExp(reYes + '$'); // only match the end of the key
  reNo = false;
  if (ignored) {
    reNo = ignored.join('|');
    reNo = reNo.replace('.', '\\.');
    reNo = new RegExp(reNo); // will match anywhere in the key
  }

  obj = JSON.parse(copy);
  translate = lodash.partial(filteredTranslate, reYes, reNo, gettext);
  obj = translateObj(obj, translate);
  translated = JSON.stringify(obj);

  return translated;
}

function getConfiguredTranslator(options) {
  return lodash.partial(translateJSON, options);
}

module.exports = translateJSON;
module.exports.configure = getConfiguredTranslator;
module.exports.Dotted = Dotted;
