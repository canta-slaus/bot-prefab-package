//@ts-check

const processArguments = require("../../util/arguments");
const { Collection } = require("discord.js");
const escapeRegex = str => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * message event
 * @param {import('../../util/client')} client 
 * @param {import('discord.js').Message} message 
 */
module.exports = async (client, message) => {
    try {
        if (message.author.bot || message.channel.type !== 'GUILD_TEXT' || message.webhookId) return;

        const guildInfo = await client.guildInfo.get(message.guild.id);

        const prefixRegex = new RegExp(`^(<@!?${client.user.id}>|${escapeRegex(guildInfo.prefab.prefix)})\\s*`);
        if (!prefixRegex.test(message.content)) return;

        const [, matchedPrefix] = message.content.match(prefixRegex);
        let msgargs = message.content.slice(matchedPrefix.length).trim().split(/ +/);
        let cmdName = msgargs.shift().toLowerCase();

        if (message.mentions.has(client.user) && !cmdName)
            return message.channel.send(`My prefix is \`${guildInfo.prefab.prefix}\` or ${client.user}\nTo view a list of my commands, type either \`${guildInfo.prefab.prefix}help\` or \`@${client.user.tag} help\``);

        const command = client.commands.get(cmdName) || (guildInfo.prefab.commandAlias ? client.commands.get(guildInfo.prefab.commandAlias[cmdName]) : undefined);

        if (!command) return;

        if (command.devOnly && !client.config.DEVS.includes(message.author.id)) return;
        if (command.someServersOnly && !client.config.TEST_SERVERS.includes(message.guild.id)) return;
        if (command.serverOwnerOnly && message.guild.ownerId !== message.author.id) return;

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
            return message.channel.send(`${message.author.username}, this command may only be used in a NSFW channel.`)
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
                if (now < expirationTime) return message.channel.send(`${message.author.username}, please wait \`${client.utils.msToTime(expirationTime - now)}\` before using this command again.`)
            }
        }

        let flags;
        if (command.arguments) flags = processArguments(message, msgargs, command.arguments);
        if (flags && flags.invalid) {
            if (flags.prompt) return message.channel.send(flags.prompt);
            return;
        }

        try {
            await command.execute({ client: client, message: message, args: msgargs, flags: flags });
        } catch (e) {
            client.utils.log("ERROR", "src/eventHandlers/message.js", `Error running command ${command.name}: ${e.message}`)
        }
    } catch (e) {
        client.utils.log("ERROR", "src/eventHandlers/message.js", e.message)
    }
};
