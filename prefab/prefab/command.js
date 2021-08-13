//@ts-check

const { Collection } = require('discord.js');

class PrefabCommand {
    /**
     * @param {import('../src/util/client')} client - The client isntance
     * @param {CommandOptions} options - Settings for the command
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

module.exports = PrefabCommand;

/**
 * @typedef CommandOptions
 * @type {object}
 * @property {string} name - The name of the command
 * @property {string[]} [aliases] - Aliases for this command
 * @property {string} [category] - The category of this command
 * @property {number} [cooldown] - Cooldown of the command
 * @property {boolean} [globalCooldown] - Whether the cooldown on this command will be applied globally or for a server only
 * @property {boolean} [canNotDisable] - Whether or not this command can be disabled in a server
 * @property {boolean} [canNotSetCooldown] - Whether or not users can set a custom command cooldown for this command
 * @property {boolean} [canNotAddAlias] - Whether or not users can add custom aliases for this command
 * @property {boolean} [hideCommand] - Whether or not this command will be displayed in the help command
 * @property {boolean} [ignoreDisabledChannels] - Whether or not this command will still run in ignored channels
 * @property {import('discord.js').PermissionString[]} [perms] - Permissions that the user needs in order to use this command
 * @property {import('discord.js').PermissionString[]} [clientPerms] - Permissions that the client needs to run this command
 * @property {boolean} [devOnly] - Whether or not this command can only be used by a developer
 * @property {boolean} [testServersOnly] - Whether or not this command can only be used in specific servers
 * @property {boolean} [ownerOnly] Whether or not this command can only be used by the server owner
 * @property {boolean} [nsfw] - Whether or not this command can only be used in a NSFW channel
 * @property {boolean} [guildOnly] - Whether or not this command can only be used in a server
 * @property {boolean} [dmOnly] - Whether or not this command can only be used in DMs
 * @property {import('./arguments').Arguments} [args] - Arguments that the user should provide
 */