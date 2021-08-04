//@ts-check

const Command = require('../../util/command');

const languages = require('../../../config/languages.json');
const langs = Object.keys(languages);

module.exports = class LanguageCommand extends Command {
    constructor (client) {
        super(client, {
            name: "language",
            category: "Utility",
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

        const userInfo = await client.profileInfo.get(message.author.id);

        if (!args[0]) {
            message.channel.send(`${message.author.tag}, your current set language is \`${userInfo.prefab.language}\`.\nThese are the supported languages:\n\`${langs.join('`, `')}\``);
        } else {
            args[0] = args[0].toLowerCase();
            if (!langs.includes(args[0])) return message.channel.send(`${message.author.tag}, the language \`${args[0]}\` doesn't exist.`);

            message.channel.send(`${message.author.tag}, your language has been changed to \`${args[0]}\``);
            await client.profileInfo.findByIdAndUpdate(message.author.id, { $set: { "prefab.language": args[0] } }, { new: true, upsert: true, setDefaultsOnInsert: true });
        }
    }
}
