//@ts-check

const { Collection } = require('discord.js');
const processArguments = require("./arguments");
const escapeRegex = str => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * @param {import('discord.js').Guild} guild 
 * @return {import('discord.js').TextChannel} 
 */
 const getDefaultChannel = (guild) => {
    let channel;
    // Get "original" default channel
    if (guild.channels.cache.has(guild.id)) {
        channel = guild.channels.cache.get(guild.id)
        if (channel.permissionsFor(guild.client.user).has("SEND_MESSAGES")) {
            //@ts-ignore
            return guild.channels.cache.get(guild.id)
        }
    }

    // Check for a "general" channel, which is often default chat
    channel = guild.channels.cache.find(channel => channel.name === "general" && channel.permissionsFor(guild.client.user).has("SEND_MESSAGES") && channel.type === "GUILD_TEXT");
    //@ts-ignore
    if (channel) return channel;

    // Now we get into the heavy stuff: first channel in order where the bot can speak
    //@ts-ignore
    return guild.channels.cache
        .filter(c => c.type === "GUILD_TEXT" && !c.isThread &&
                     c.permissionsFor(guild.client.user).has("SEND_MESSAGES"))
        //@ts-ignore
        .sort((a, b) => a.position - b.position)
        .first();
}


/**
 * @param {import('../src/util/client')} client 
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

/**
 * @param {import('../src/util/client')} client 
 * @param {import('discord.js').Guild} guild 
 */
async function guildCreate (client, guild) {
    try {
        if (guild.available) {
            const channel = getDefaultChannel(guild);
            if (!channel) return;
    
            await channel.send(`Thanks for adding me! My prefix is \`${client.config.PREFIX}\`\nFor a list of commands, type \`${client.config.PREFIX}help\``);
        }
    } catch (e) {
        client.utils.log("ERROR", "src/events/guild/guildCreate.js", e.message);
    }
}

/**
 * @param {import('../src/util/client')} client 
 * @param {import('discord.js').Interaction} interaction 
 */
async function interactionCreate (client, interaction) {
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

                if (sub.execute) return await sub.execute({ client, interaction, group, subcommand });
            }

            //@ts-ignore
            await command.execute({ client, interaction, group, subcommand });
        }
    } catch (e) {
        client.utils.log("ERROR", "src/events/interaction/interactionCreate.js", e.message);
    }
}

async function messageCreate (client, message) {
    try {
        if (message.author.bot || message.channel.type !== 'GUILD_TEXT' || message.webhookId) return;

        const guildInfo = await client.guildInfo.get(message.guild.id);

        const prefixRegex = new RegExp(`^(<@!?${client.user.id}>|${escapeRegex(guildInfo.prefab.prefix)})\\s*`, 'i');
        if (!prefixRegex.test(message.content)) return;

        const [, matchedPrefix] = message.content.match(prefixRegex);
        let msgargs = message.content.slice(matchedPrefix.length).trim().split(/ +/);
        let cmdName = msgargs.shift().toLowerCase();

        if (message.mentions.has(client.user) && !cmdName)
            return message.channel.send(`My prefix is \`${guildInfo.prefab.prefix}\` or ${client.user}\nTo view a list of my commands, type either \`${guildInfo.prefab.prefix}help\` or \`@${client.user.tag} help\``);

        const command = client.commands.get(cmdName) || (guildInfo.prefab.commandAlias ? client.commands.get(guildInfo.prefab.commandAlias[cmdName]) : undefined);

        if (!command) return;

        if (!client.config.DEVS.includes(message.author.id)) {
            if (command.devOnly && !client.config.DEVS.includes(message.author.id)) return;
            if (command.testServersOnly && !client.config.TEST_SERVERS.includes(message.guild.id)) return;
            if (command.ownerOnly && message.guild.ownerId !== message.author.id) return;

            if (guildInfo.prefab.disabledCommands.includes(command.name)) return;
            if (guildInfo.prefab.disabledChannels.includes(message.channel.id) && !command.ignoreDisabledChannels) return;

            if (command.clientPerms && !message.channel.permissionsFor(message.guild.me).has(command.clientPerms, true)) {
                return message.channel.send(`${message.author.username}, I am missing the following permissions: ${client.utils.missingPermissions(message.guild.me, command.clientPerms)}`).catch();
            }

            if (guildInfo.prefab.commandPerms && guildInfo.prefab.commandPerms[command.name] && !message.member.permissions.has(guildInfo.prefab.commandPerms[command.name], true)) {
                return message.channel.send(`${message.author.username}, you are missing the following permissions: ${client.utils.missingPermissions(message.member, guildInfo.prefab.commandPerms[command.name])}`);
            } else if (command.perms && !message.member.permissions.has(command.perms, true)) {
                return message.channel.send(`${message.author.username}, you are missing the following permissions: ${client.utils.missingPermissions(message.member, command.perms)}`);
            }

            if (command.nsfw && !message.channel.nsfw) {
                return message.channel.send(`${message.author.username}, this command may only be used in a NSFW channel.`);
            }

            const cd = await client.utils.getCooldown(command, message);

            let cooldowns;
            if (cd) {
                if (typeof command.globalCooldown === 'undefined' || command.globalCooldown) {
                    if (!client.globalCooldowns.has(command.name)) client.globalCooldowns.set(command.name, new Collection());
                    cooldowns = client.globalCooldowns;
                } else {
                    if (!client.serverCooldowns.has(message.guild.id)) client.serverCooldowns.set(message.guild.id, new Collection());
                    cooldowns = client.serverCooldowns.get(message.guild.id);
                    if (!cooldowns.has(command.name)) cooldowns.set(command.name, new Collection());
                }

                const now = Date.now();
                const timestamps = cooldowns.get(command.name);
                const cooldownAmount = cd * 1000;
                if (timestamps.has(message.author.id)) {
                    const expirationTime = timestamps.get(message.author.id) + cooldownAmount;
                    if (now < expirationTime) return message.channel.send(`${message.author.username}, please wait \`${client.utils.msToTime(expirationTime - now)}\` before using this command again.`);
                }
            }
        }

        let flags;
        if (command.args && command.args.length) flags = processArguments(message, msgargs, command.args);
        if (flags && flags.invalid) {
            if (flags.prompt) return message.channel.send(flags.prompt);
            return;
        }

        try {
            //@ts-ignore
            await command.execute({ client: client, message: message, args: msgargs, flags: flags });
        } catch (e) {
            client.utils.log("ERROR", "src/events/message/messageCreate.js", `Error running command '${command.name}': ${e.message}`);
        }
    } catch (e) {
        client.utils.log("ERROR", "src/events/message/messageCreate.js", e.message);
    }
}

module.exports = {
    guildCreate, interactionCreate, messageCreate
}