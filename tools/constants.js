var path = require('path');


var self = module.exports = {
    CACHE_FILE_PATH: ".cache.json",
    ARTICLES_PATH: path.join(process.cwd(), 'src/articles'),
    FUSE_HOME_DIR: path.join(process.cwd(), 'src'),
    FUSE_OUTPUT: path.join(process.cwd(), "dist/$name.js")
};
self.ARTICLES_WATCH_GLOB = path.join(self.ARTICLES_PATH, "*");
