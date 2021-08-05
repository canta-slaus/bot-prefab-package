//@ts-check

const { Collection } = require('discord.js');

/**
 * @param {import('../../util/client')} client 
 * @param {import('discord.js').Interaction} interaction 
 */
module.exports = async (client, interaction) => {
    try {
        if (interaction.isCommand()) {
            if (!interaction.inGuild()) return;

            const command = client.slashCommands.get(interaction.commandName);
            if (!command) return;

            if (command.ownerOnly && interaction.guild.ownerId !== interaction.user.id) return await quickReply(client, interaction, "This command can only be used by the server owner.");

            const guildInfo = await client.guildInfo.get(interaction.guildId);

            if (guildInfo.prefab.disabledCommands.includes(command.name)) return await quickReply(client, interaction, "This command is currently disabled in this server.");
            if (guildInfo.prefab.disabledChannels.includes(interaction.channelId) && !command.ignoreDisabledChannels) return await quickReply(client, interaction, "You can't use any commands in this channel.");

            //@ts-ignore
            if (command.clientPerms && !interaction.channel.permissionsFor(interaction.guild.me).has(command.clientPerms, true)) return await quickReply(client, interaction, `I am missing the following permissions: ${client.utils.missingPermissions(interaction.guild.me, command.clientPerms)}.`);

            //@ts-ignore
            if (guildInfo.prefab.commandPerms && guildInfo.prefab.commandPerms[command.name] && !interaction.member.permissions.has(guildInfo.prefab.commandPerms[command.name], true))  return await quickReply(client, interaction, `You are missing the following permissions: ${client.utils.missingPermissions(interaction.member, guildInfo.prefab.commandPerms[command.name])}.`);
            //@ts-ignore
            else if (command.perms && !interaction.member.permissions.has(command.perms, true)) return await quickReply(client, interaction, `You are missing the following permissions: ${client.utils.missingPermissions(interaction.member, command.perms)}.`);

            //@ts-ignore
            if (command.nsfw && !interaction.channel.nsfw) return await quickReply(client, interaction, `This command may only be used in an NSFW channel.`);

            const cd = await client.utils.getCooldown(command, interaction);

            let cooldowns;
            if (cd) {
                if (typeof command.globalCooldown === 'undefined' || command.globalCooldown) {
                    if (!client.globalCooldowns.has(command.name)) client.globalCooldowns.set(command.name, new Collection());
                    cooldowns = client.globalCooldowns;
                } else {
                    if (!client.serverCooldowns.has(interaction.guildId)) client.serverCooldowns.set(interaction.guildId, new Collection());
                    cooldowns = client.serverCooldowns.get(interaction.guildId);
                    if (!cooldowns.has(command.name)) cooldowns.set(command.name, new Collection());
                }

                const now = Date.now();
                const timestamps = cooldowns.get(command.name);
                const cooldownAmount = cd * 1000;
                if (timestamps.has(interaction.user.id)) {
                    const expirationTime = timestamps.get(interaction.user.id) + cooldownAmount;
                    if (now < expirationTime) return await quickReply(client, interaction, `Please wait \`${client.utils.msToTime(expirationTime - now)}\` before using this command again.`)
                }
            }

            const group = interaction.options.getSubcommandGroup(false);
            const subcommand = interaction.options.getSubcommand(false);

            let data;

            if (group) data = interaction.options.data.find(o => o.name === group).options.find(s => s.name === subcommand).options;
            else if (subcommand) data = interaction.options.data.find(s => s.name === subcommand).options;
            else data = interaction.options.data;

            const args = {  };
            for (const arg of data) {
                args[arg.name] = interaction.options.get(arg.name);
            }

            if (command.groups || command.subcommands) {
                const sub = command.groups ? command.groups[group].subcommands[subcommand]
                                                  : command.subcommands[subcommand];

                if (sub.execute) return await sub.execute({ client, interaction, args, group, subcommand });
            }

            //@ts-ignore
            await command.execute({ client, interaction, args, group, subcommand });
        }
    } catch (e) {
        client.utils.log("ERROR", "src/events/interaction/interactionCreate.js", e.message);
    }
};

/**
 * @param {import('../../util/client')} client
 * @param {import('discord.js').CommandInteraction} interaction 
 * @param {string} content 
 */
async function quickReply (client, interaction, content) {
    const embed = (await client.utils.CustomEmbed({ userID: interaction.user.id }))
        .setDescription(content);

    try {
        await interaction.reply({ embeds: [embed], ephemeral: true });
    } catch (e) {
        //
    }
}
