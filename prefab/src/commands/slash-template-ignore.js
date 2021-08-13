//@ts-check

const SlashCommand = require('../util/slashCommand');

module.exports = class SlashTemplate extends SlashCommand {
    constructor (client) {
        super(client, {
            name: "template",
            description: "This is a template"
        });
    }

    /**
     * @param {object} p
     * @param {import('../util/client')} p.client
     * @param {import('discord.js').CommandInteraction} p.interaction
     * @param {string} p.group
     * @param {string} p.subcommand
     */
    async execute ({ client, interaction, group, subcommand }) {
        // 
    }
}
