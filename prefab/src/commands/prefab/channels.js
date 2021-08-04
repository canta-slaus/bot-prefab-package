//@ts-check

const Command = require('../../util/command');

module.exports = class ChannelsCommand extends Command {
    constructor (client) {
        super(client, {
            name: "channels",
            category: "Utility",
            canNotDisable: true,
            ignoreDisabledChannels: true,
            ownerOnly: true,
            clientPerms: ['SEND_MESSAGES', 'EMBED_LINKS']
        });
    }

    /**
     * @param {object} p
     * @param {import('../../util/client')} p.client
     * @param {import('discord.js').Message} p.message
     * @param {string[]} p.args 
     */
    async execute ({ client, message, args }) {
        const guildInfo = await client.guildInfo.get(message.guild.id);
        const disabledChannels = guildInfo.prefab.disabledChannels;

        const channelEmbed = (await client.utils.CustomEmbed({ userID: message.author.id }))
            .setTimestamp();

        if (!args[0]) {
            channelEmbed
                .setTitle('Disabled Channels')
                .setDescription(disabledChannels.length === 0 ? 'There are no disabled channels in this server!' : '<#' + disabledChannels.join('>, <#') + '>');

            return message.channel.send({ embeds: [channelEmbed] });
        }

        if (!args[1]) return message.channel.send({ embeds: [channelEmbed.setDescription('**Please specify a channel to disable.**')] });

        const channel = message.mentions.channels.first() || message.guild.channels.cache.get(args[1]);
        if (!channel) return message.channel.send({ embeds: [channelEmbed.setDescription(`**The channel ${args[1]} does not exist.**`)] });
        if (channel.type !== 'GUILD_TEXT') return message.channel.send({ embeds: [channelEmbed.setDescription(`**You can only disable text channels.**`)] });

        await this.setCooldown(message);

        switch (args[0]) {
            case 'disable':
                if (disabledChannels.includes(channel.id)) return message.channel.send({ embeds: [channelEmbed.setDescription(`**The channel ${channel} is already disabled.**`)] });

                await client.guildInfo.findByIdAndUpdate(message.guild.id, { $push: { "prefab.disabledChannels": channel.id } }, { new: true, upsert: true, setDefaultsOnInsert: true });

                message.channel.send({ embeds: [channelEmbed.setDescription(`**The channel ${channel} has been disabled.**`)] });
                break;

            case 'enable':
                if (!disabledChannels.includes(channel.id)) return message.channel.send({ embeds: [channelEmbed.setDescription(`**The channel ${channel} is already enabled.**`)] });

                await client.guildInfo.findByIdAndUpdate(message.guild.id, { $pull: { "prefab.disabledChannels": channel.id } }, { new: true, upsert: true, setDefaultsOnInsert: true });

                message.channel.send({ embeds: [channelEmbed.setDescription(`**The channel ${channel} has been enabled.**`)] });
                break;

            default:
                message.channel.send({ embeds: [channelEmbed.setDescription(`${message.author}, please check the usage of the command.`)] });
                break;
        }
    }
}
