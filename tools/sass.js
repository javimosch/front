var path = require('path');
var sander = require('sander');
var sass = require('sass');
require('dotenv').config({
    silent: true,
    path: path.join(process.cwd(), '.env')
});
const debug = require('debug')('styles.js');

module.exports = {
    run: () => {
        try {
            var result = sass.renderSync({ file: path.join(process.cwd(), "src/main.scss") });
            sander.writeFileSync(path.join(process.cwd(), "dist/app.css"), result.css);
            debug("SUCCESS", result.css.length);
        }
        catch (err) {
            debug("ERROR", err);
            process.exit(1);
        }

    }
};
