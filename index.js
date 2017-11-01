const path = require('path');
require('dotenv').config({
    silent: true,
    path: path.join(process.cwd(), '.env')
});
const debug = require('debug')('index.js');
const cache = require('./tools/local-cache');
debug("STATE", cache.state());
//require('./tools/compile-articles').run();
require('./tools/sass').run();
if (process.env.PROD === '1') {
    require('./tools/prod-server').run();
}
else {
    require('./tools/dev-server').run();
}
//require('./tools/fuse').run();
