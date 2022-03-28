//@ts-check

const { log } = require('./utils');

/**
 * @type {import('./utils').CLICommand}
 */
module.exports = {
    short: "faq",
    description: "Frequently asked questions",
    title: "FAQ",
    promptIndex: 5,
    extra: true,
    disabled: true,

    run: async () => {
        log("SUCCESS", "WIP");
    }
}
