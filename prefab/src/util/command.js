//@ts-check

const { Collection } = require('discord.js');

class Command {
    /**
     * @param {import('./client')} client - The client isntance
     * @param {object} options - Settings for the command
     * @param {string} options.name - The name of the command
     * @param {string[]} [options.aliases] - Aliases for this command
     * @param {string} [options.category] - The category of this command
     * @param {number} [options.cooldown] - Cooldown of the command
     * @param {boolean} [options.globalCooldown] - Whether the cooldown on this command will be applied globally or for a server only
     * @param {boolean} [options.canNotDisable] - Whether or not this command can be disabled in a server
     * @param {boolean} [options.canNotSetCooldown] - Whether or not users can set a custom command cooldown for this command
     * @param {boolean} [options.canNotAddAlias] - Whether or not users can add custom aliases for this command
     * @param {boolean} [options.hideCommand] - Whether or not this command will be displayed in the help command
     * @param {boolean} [options.ignoreDisabledChannels] - Whether or not this command will still run in ignored channels
     * @param {import('discord.js').PermissionString[]} [options.perms] - Permissions that the user needs in order to use this command
     * @param {import('discord.js').PermissionString[]} [options.clientPerms] - Permissions that the client needs to run this command
     * @param {boolean} [options.devOnly] - Whether or not this command can only be used by a developer
     * @param {boolean} [options.testServersOnly] - Whether or not this command can only be used in specific servers
     * @param {boolean} [options.ownerOnly] Whether or not this command can only be used by the server owner
     * @param {boolean} [options.nsfw] - Whether or not this command can only be used in a NSFW channel
     * @param {boolean} [options.guildOnly] - Whether or not this command can only be used in a server
     * @param {boolean} [options.dmOnly] - Whether or not this command can only be used in DMs
     * @param {import('./arguments').Arguments} [options.args] - Arguments that the user should provide
     */
    constructor (client, {
        name = "",
        aliases = [],
        category = "No category",
        cooldown = 0,
        globalCooldown = true,
        canNotDisable = false,
        canNotSetCooldown = false,
        canNotAddAlias = false,
        hideCommand = false,
        ignoreDisabledChannels = false,
        perms = [],
        clientPerms = [],
        devOnly = false,
        testServersOnly = false,
        ownerOnly = false,
        nsfw = false,
        guildOnly = true,
        dmOnly = false,
        args = [],
    }) {
        this.client = client;
        this.name = name;
        this.aliases = aliases;
        this.category = category;
        this.cooldown = cooldown;
        this.globalCooldown = globalCooldown;
        this.canNotDisable = canNotDisable;
        this.canNotSetCooldown = canNotSetCooldown;
        this.canNotAddAlias = canNotAddAlias;
        this.hideCommand = hideCommand;
        this.ignoreDisabledChannels = ignoreDisabledChannels;
        this.perms = perms;
        this.clientPerms = clientPerms;
        this.devOnly = devOnly;
        this.testServersOnly = testServersOnly;
        this.ownerOnly = ownerOnly;
        this.nsfw = nsfw;
        this.guildOnly = guildOnly;
        this.dmOnly = dmOnly;
        this.args = args;
    }

    /**
     * @param {import('discord.js').Message} message 
     */
    async setCooldown (message) {
        const cd = await this.client.utils.getCooldown(this, message);

        if (!cd) return;

        let cooldowns;
        if (typeof this.globalCooldown === 'undefined' || this.globalCooldown) {
            if (!this.client.globalCooldowns.has(this.name)) this.client.globalCooldowns.set(this.name, new Collection());
            cooldowns = this.client.globalCooldowns;
        } else {
            if (!this.client.serverCooldowns.has(message.guild.id)) this.client.serverCooldowns.set(message.guild.id, new Collection());
            cooldowns = this.client.serverCooldowns.get(message.guild.id);
            if (!cooldowns.has(this.name)) cooldowns.set(this.name, new Collection());
        }

        const now = Date.now();
        const timestamps = cooldowns.get(this.name);
        const cooldownAmount = cd * 1000;

        timestamps.set(message.author.id, now);
        setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);
    }
}

module.exports = Command;
