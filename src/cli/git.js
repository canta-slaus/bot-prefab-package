//@ts-check

const { log } = require('./utils');

/**
 * @type {import('./utils').CLICommand}
 */
module.exports = {
    long: "git",
    short: "g",
    description: "Generate git commits to copy-paste for more standardized commits",
    title: "git commits",
    promptIndex: 0,
    extra: true,
    disabled: true,

    run: async () => {
        log("SUCCESS", "WIP");
    }
}
