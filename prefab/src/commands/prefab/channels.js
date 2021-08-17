//@ts-check

const SlashCommand = require('../../util/slashCommand');

module.exports = class Channels extends SlashCommand {
    constructor (client) {
        super(client, {
            name: "channels",
            category: "Utility",
            description: "Check all the channels that will the bot will ignore and disable/enable them.",
            cooldown: 5,
            canNotDisable: true,
            ignoreDisabledChannels: true,
            ownerOnly: true,
            clientPerms: ['SEND_MESSAGES', 'EMBED_LINKS'],
            subcommands: {
                list: {
                    description: "Lists all disabled channels",
                    execute: async ({ client, interaction }) => {
                        await this.setCooldown(interaction);

                        const guildInfo = await client.guildInfo.get(interaction.guildId);

                        const embed = (await client.utils.CustomEmbed({ userID: interaction.user.id }))
                            .setTimestamp();

                        if (!guildInfo?.prefab?.disabledChannels?.length) embed.setDescription(`${interaction.user}, there are no disabled channels in this server!`)
                        else embed.setDescription(`These channels are currently disabled:\n${guildInfo.prefab.disabledChannels.map(id => `<#${id}>`).join(" ")}`);

                        await interaction.reply({ embeds: [embed] });
                    }
                },
                disable: {
                    description: "Disable a channel",
                    args: [
                        {
                            name: "channel",
                            description: "The channel you want to disable",
                            type: "CHANNEL",
                            required: true
                        }
                    ],
                    execute: async ({ client, interaction }) => {
                        await this.setCooldown(interaction);

                        const guildInfo = await client.guildInfo.get(interaction.guildId);

                        const embed = (await client.utils.CustomEmbed({ userID: interaction.user.id }))
                            .setTimestamp();

                        const channel = interaction.options.getChannel("channel");

                        if (channel.type !== 'GUILD_TEXT') embed.setDescription(`${interaction.user}, you can only disable text channels.`);
                        else if (guildInfo?.prefab?.disabledChannels?.includes(channel.id)) embed.setDescription(`${interaction.user}, the channel ${channel} is already disabled.`);
                        else {
                            await client.guildInfo.findByIdAndUpdate(interaction.guildId, { $push: { "prefab.disabledChannels": channel.id } }, { new: true, upsert: true, setDefaultsOnInsert: true });
    
                            embed.setDescription(`${interaction.user}, the channel ${channel} has been disabled.`);
                        }

                        await interaction.reply({ embeds: [embed] });
                    }
                },
                enable: {
                    description: "Enable a channel",
                    args: [
                        {
                            name: "channel",
                            description: "The channel you want to enable",
                            type: "CHANNEL",
                            required: true
                        }
                    ],
                    execute: async ({ client, interaction }) => {
                        await this.setCooldown(interaction);

                        const guildInfo = await client.guildInfo.get(interaction.guildId);

                        const embed = (await client.utils.CustomEmbed({ userID: interaction.user.id }))
                            .setTimestamp();

                        const channel = interaction.options.getChannel("channel");

                        if (channel.type !== 'GUILD_TEXT') embed.setDescription(`${interaction.user}, you can only enable text channels.`);
                        else if (!guildInfo?.prefab?.disabledChannels?.includes(channel.id)) embed.setDescription(`${interaction.user}, the channel ${channel} is already enabled.`);
                        else {
                            await client.guildInfo.findByIdAndUpdate(interaction.guildId, { $pull: { "prefab.disabledChannels": channel.id } }, { new: true, upsert: true, setDefaultsOnInsert: true });

                            embed.setDescription(`${interaction.user}, the channel ${channel} has been enabled.`)
                        }

                        await interaction.reply({ embeds: [embed] });
                    }
                }
            }
        });
    }
}
