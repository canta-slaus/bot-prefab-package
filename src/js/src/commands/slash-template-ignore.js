//@ts-check

const Command = require('../util/command');

module.exports = class Template extends Command {
    /**
     * @param {import('../util/client')} client 
     */
    constructor (client) {
        super(client, {
            name: "template",
            description: "This is a template",
            execute: async ({ client, interaction, group, subcommand }) => {
                // 
            }
        });
    }
}
