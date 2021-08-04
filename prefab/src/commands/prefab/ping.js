//@ts-check

const Command = require('../../util/command');

module.exports = class PingCommand extends Command {
    constructor (client) {
        super(client, {
            name: "ping",
            category: "Misc",
            aliases: ["pong"],
            clientPerms: ['SEND_MESSAGES']
        });
    }

    /**
     * @param {object} p
     * @param {import('../../util/client')} p.client
     * @param {import('discord.js').Message} p.message
     * @param {string[]} p.args 
     */
    async execute ({ client, message, args }) {
        await this.setCooldown(message);
        const msg = await message.channel.send("Ping?");
        await msg.edit(`Pong! Latency is ${msg.createdTimestamp - message.createdTimestamp}ms.`);
    }
}
