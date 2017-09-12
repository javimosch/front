const VAR = require('./constants');
const {
    FuseBox,
    QuantumPlugin,
    WebIndexPlugin,
    SassPlugin,
    CSSPlugin
} = require("fuse-box");
module.exports = {
    run: () => {
        const buildFile = 'app';
        const fuse = FuseBox.init({
            log: false,
            debug: false,
            homeDir: VAR.FUSE_HOME_DIR,
            output: VAR.FUSE_OUTPUT,
            sourceMaps: {
                inline: false
            },
            plugins: [
                QuantumPlugin({
                    treeshake: true,
                    uglify: !!process.env.PROD,
                    ensureES5: true,
                    target: 'browser',
                    bakeApiIntoBundle: buildFile,
                    containedAPI: true
                })
            ]
        });
        fuse.bundle(buildFile)
            .instructions(`>index.ts`)
            .target('browser');
        fuse.run();
    }
};
