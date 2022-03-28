//@ts-check

const pkg = require('../../package.json');

/**
 * @type {import('./utils').CLICommand}
 */
module.exports = {
    long: "version",
    short: "v",
    description: "Check package version",
    title: "Package version",
    promptIndex: 3,
    extra: true,

    run: async () => {
        console.log(`v${pkg.version}`);
    }
}
