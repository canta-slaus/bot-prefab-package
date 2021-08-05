//@ts-check

const Command = require('../util/command');

module.exports = class Template extends Command {
    constructor (client) {
        super(client, {
            name: "template"
        });
    }

    /**
     * @param {object} p
     * @param {import('../util/client')} p.client
     * @param {import('discord.js').Message} p.message
     * @param {string[]} p.args 
     * @param {Object.<string, *>} p.flags
     */
    async execute ({ client, message, args, flags }) {
        // 
    }
}
