const cache = require('./local-cache');
var debug = require('debug')('ARTICLES');
var watch = require('gulp-watch');
var reload = require('require-reload')(require);
const VAR = require('./constants');
const _ = require('lodash');
/*
If a file is edited /src/articles, compile to dist
*/

module.exports = {
    run: () => {
        debug('ON:WATCH', VAR.ARTICLES_WATCH_GLOB);
        const hasValidName = (n) => !_.includes(["untitled", " "], n);
        const publish = (obj) => {
            var showdown = require('showdown'),
                converter = new showdown.Converter(),
                html = converter.makeHtml(obj.contents);
            debug('PUBLISH', html.length);
        };
        const hasUniqueUrls = (name, url) => {
            if (!url) return true;
            var urlProp, articleKey;
            url = typeof url === 'string' ? [url] : url;
            var articles = cache.getData('/articles');
            var articlesKeys = Object.keys(articles).filter(n => n != name);
            for (var index in articlesKeys) {
                articleKey = articlesKeys[index];
                if (typeof articles[articleKey].url !== 'undefined') {
                    urlProp = articles[articleKey].url;
                    urlProp = typeof urlProp === 'string' ? [urlProp] : urlProp;
                    if (_.intersection(urlProp, url).length > 0) {
                        debug("WARN: Url/s collision", name, url, 'against', articleKey, urlProp);
                        return false;
                    }
                }
            }
            return true;
        };
        watch(VAR.ARTICLES_WATCH_GLOB, {
            read: false
        }, (args) => {
            var fileName = args.path.substring(args.path.lastIndexOf('/') + 1);
            var name = fileName.toLowerCase().replace(new RegExp(" ", 'g'), "-");
            if (!hasValidName(name)) {
                return debug('Invalid name', name);
            }
            try {
                var obj = reload(args.path);
                if (!obj || typeof obj.contents === 'undefined' || !obj.url) {
                    debug('WARN: Empty, blank file, invalid file', obj);
                    return;
                }
                debug('Saving', name, typeof obj, obj);
                cache.push('/articles/' + name, obj);
                if (!hasUniqueUrls(name, obj.url)) {
                    return;
                }
                publish(obj);
            }
            catch (err) {
                if (err.code === "MODULE_NOT_FOUND") {
                    cache.delete('/articles/' + name);
                    debug("Deleted", name);
                }
                else {
                    debug('Unable to parse', err.code, err, err.trace);
                }
            }
        });

    }
}
