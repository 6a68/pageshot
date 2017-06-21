const fs = require("fs");
const path = require("path");
const globby = require("globby");
require("fluent-intl-polyfill");
const { MessageContext } = require("fluent");
const negotiateLanguages = require("fluent-langneg/compat");
const mozlog = require("./logging").mozlog("l10n");

let userLangs;
const contexts = [];
let inited = false;

function init(userLocales = []) {
  if (inited) {
    return Promise.resolve();
  }
  inited = true;
  userLangs = userLocales;
  return _getLocales(userLocales).then(locales => {
    // module-global assignment
    userLangs = locales;

    const mcPromises = [];
    userLangs.forEach(lang => {
      const mc = new MessageContext(lang);
      mcPromises.push(new Promise((resolve, reject) => {
        // TODO: is this path correct?
        const filename = path.join(__dirname, '..', '..', 'locales', lang, 'server.ftl');
        fs.readFile(filename, 'utf-8', (err, data) => {
          if (err) { return reject(err); }
          mc.addMessages(data);
          contexts[lang] = mc;
          resolve(mc);
        });
      }));
    });
    return Promise.all(mcPromises);
  }).catch(err => {
    mozlog.error('l10n-init-failed', {err: err});
  });
}

function getText(l10nID, args) {
  if (!inited) { init(); }
  // Find the first MessageContext with the l10n ID, in order of user preference.
  for (let lang of userLangs) {
    if (contexts[lang].hasMessage(l10nID)) {
      return contexts[lang].getMessage(l10nID, args);
    }
  }
  return null;
}

function _getLocales(requestedLocales) {
  return _getAvailableLocales().then(availableLocales => {
    const locales = negotiateLanguages(
      userLangs,
      availableLocales,
      { defaultLocale: 'en-US' }
    );
    return locales;
  });
}

module.exports = { init, getText, userLangs, generateMessages };

// Returns a Promise that resolves to a list of languages for which
// there exists a 'server.ftl' file inside the top-level 'locales' dir.
function _getAvailableLocales() {
  // TODO: double-check the paths
  const localesGlob = path.join(__dirname, '..', '..', 'locales') + path.normalize('/*/server.ftl');
  return globby(localesGlob).then(paths => {
    // paths contains strings of the form '/path/to/screenshots/locales/en-US/server.ftl'.
    // To get the locale, get the next-to-last piece of the path.
    return paths.map(path => {
      const locale = path.split('/').slice(-2, -1);
      return locale;
    });
  });
}

// hacky, but will it work?
function generateMessages(userLocales) {
  return contexts;
}
