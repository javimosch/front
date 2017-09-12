//https://github.com/zeit/serve
const serve = require('serve');
var path = require('path');
module.exports = {
    run: () => {
        serve(path.join(process.cwd(), 'dist'), {
            port: process.env.PORT,
            ignore: ['node_modules']
        });
    }
};
