'use strict';

function translateJavascript(copy, gettext) {
  var re = /gettext\(\s*(?:"([^"]+)"|\'([^\']+)\')\s*\)\s*/g;
  var msgid, needle, replacement, match, bookend, translated;

  translated = copy;
  match = re.exec(copy);
  while (match) {
    needle = match[0];
    msgid = match[1] || match[2];
    bookend = match[1] ? '"' : '\'';
    replacement = bookend + gettext(msgid) + bookend;
    translated = translated.replace(needle, replacement);
    match = re.exec(copy);
  }
  return translated;
}

module.exports = translateJavascript;
