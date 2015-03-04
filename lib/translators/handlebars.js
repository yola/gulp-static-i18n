'use strict';

function translateHandlebars(template, gettext) {

  var re = /\{\{trans\s*(?:"([^"]+)"|\'([^\']+)\')\s*\}\}/g;
  var msgid, needle, match, translated;

  translated = template;
  match = re.exec(template);

  while (match) {
    needle = match[0];
    msgid = match[1] || match[2];
    translated = translated.replace(needle, gettext(msgid));
    match = re.exec(template);
  }
  return translated;
}

module.exports = translateHandlebars;
