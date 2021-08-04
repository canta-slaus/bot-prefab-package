//@ts-check

const colors = require('../../../config/colors.json');
const cls = Object.keys(colors);

const Command = require('../../util/command');

module.exports = class ColorCommand extends Command {
    constructor (client) {
        super(client, {
            name: "color",
            category: "Utility",
            clientPerms: ['SEND_MESSAGES'],
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
    
        const userInfo = await client.profileInfo.get(message.author.id);

        if (!args[0]) {
            message.channel.send(`${message.author.tag}, your current embed color is \`${userInfo.prefab.embedColor}\`.\nThese are the available colors:\n\`${cls.join('`, `')}\``);
        } else {
            args[0] = args[0].toLowerCase();
            if (!cls.includes(args[0])) return message.channel.send(`${message.author.tag}, the embed color \`${args[0]}\` doesn't exist.`);

            message.channel.send(`${message.author.tag}, your embed color has been changed to \`${args[0]}\``);
            await client.profileInfo.findByIdAndUpdate(message.author.id, { $set: { "prefab.embedColor": args[0] } }, { new: true, upsert: true, setDefaultsOnInsert: true });
        }
    }
}
