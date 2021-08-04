//@ts-check

const Command = require('../../util/command');
const prefixRegExp = /^[a-zA-Z0-9!@#\$%\^\&*\)\(+=._-]{1,15}$/;

module.exports = class PrefixCommand extends Command {
    constructor (client) {
        super(client, {
            name: "prefix",
            category: "Utility",
            ownerOnly: true,
            args: [
                {
                    type: 'SOMETHING',
                    prompt: 'Please enter a new prefix to use!'
                }
            ],
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
        if (!prefixRegExp.test(args[0])) return message.channel.send(`${message.author.username}, that prefix doesn't follow the rules. Please try again.`);

        let guildInfo = await client.guildInfo.get(message.guild.id);
        if (guildInfo.prefab.prefix === args[0]) return message.channel.send(`${message.author.username}, please make sure to enter a new prefix.`);

        await this.setCooldown(message);
        await client.guildInfo.findByIdAndUpdate(message.guild.id, { $set: { "prefab.prefix": args[0] } }, { new: true, upsert: true, setDefaultsOnInsert: true });

        message.channel.send(`${message.author.username}, the new prefix is: \`${args[0]}\``);
    }
}
