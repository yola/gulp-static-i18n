'use strict';
var lodash = require('lodash');


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
  if (Array.isArray(obj)) {
    for(var i =0; i < obj.length; i++) {
      childkeys.push(String(i));
    }
  } else {
    childkeys = lodash.keys(obj);
  }
  var push = function(childkey) {
    var prefix = parentkey ? parentkey + '•' : '';
    queue.push(prefix + childkey);
  };
  lodash.map(childkeys, push);
}


function translate(obj, isTransKey, gettext) {
  // bfs traversal
  var queue = [];
  var dotobj = new Dotted(obj);
  var key, val;
  var next = function() {
    key = queue.shift();
    val = dotobj.get(key);
    return key;
  };

  pushDotKeys(null, obj, queue);
  while (next()) {
    if (typeof val === 'object' || Array.isArray(val)) {
      pushDotKeys(key, val, queue);
    }
    if (typeof val === 'string' && isTransKey(key)) {
      dotobj.set(key, gettext(val));
    }
  }

  return dotobj.getObj();
}


function getKeyFilter(keys, ignored) {
  var reYes, reNo, filter;
  reYes = '(' + keys.join('|') + ')';

  // using a bullet char to avoid conflict with keys with periods
  reYes = reYes.replace(/\./g, '•');

  // hoping hash simbols in keys is not a thing
  reYes = reYes.replace(/#/g, '[0-9]+');

  // only match the end of the key / leaf values
  reYes = new RegExp(/(^|•)/.source + reYes + /$/.source);

  // will match anywhere in the key
  reNo = false;
  if (ignored) {
    reNo = '(' + ignored.join('|') + ')';
    reNo = reNo.replace(/\./g, '•');
    reNo = reNo.replace(/#/g, '[0-9]+');
    reNo = new RegExp(reNo);
  }
  filter = function(key) {
    if(reNo && key.match(reNo)) {
      return false;
    }
    if(key.match(reYes)) {
      return true;
    }
    return false;
  };

  return filter;

}

function translateJSON(options, copy, gettext) {
  var keys = options.jsonKeys;
  var ignored = options.ignoreKeys;
  var translated, obj, keyfilter;

  if (!keys) {
    return copy;
  }

  keyfilter = getKeyFilter(keys, ignored);
  obj = JSON.parse(copy);
  obj = translate(obj, keyfilter, gettext);
  translated = JSON.stringify(obj);

  return translated;
}

function getConfiguredTranslator(options) {
  return lodash.partial(translateJSON, options);
}

module.exports = translateJSON;
module.exports.configure = getConfiguredTranslator;

// export for testing
module.exports.Dotted = Dotted;
module.exports.getKeyFilter = getKeyFilter;
