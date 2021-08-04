//@ts-check

const { Collection } = require('discord.js');

class Command {
    /**
     * @param {import('./client')} client - The client isntance
     * @param {object} CommandOptions - Settings for the command
     * @param {string} CommandOptions.name - The name of the command
     * @param {string[]} [CommandOptions.aliases] - Aliases for this command
     * @param {string} [CommandOptions.category] - The category of this command
     * @param {number} [CommandOptions.cooldown] - Cooldown of the command
     * @param {boolean} [CommandOptions.globalCooldown] - Whether the cooldown on this command will be globally or for a server only
     * @param {boolean} [CommandOptions.canNotDisable] - Whether or not this command can be disabled in a server
     * @param {boolean} [CommandOptions.canNotSetCooldown] - Whether or not users can set a custom command cooldown for this command
     * @param {boolean} [CommandOptions.canNotAddAlias] - Whether or not users can add custom aliases for this command
     * @param {boolean} [CommandOptions.hideCommand] - Whether or not this command will be displayed in the help command
     * @param {boolean} [CommandOptions.ignoreDisabledChannels] - Whether or not this command will still run in ignored channels
     * @param {string[]} [CommandOptions.perms] - Permissions that the user needs in order to use this command
     * @param {string[]} [CommandOptions.clientPerms] - Permissions that the client needs to run this command
     * @param {boolean} [CommandOptions.devOnly] - Whether or not this command can only be used by a developer
     * @param {boolean} [CommandOptions.testServersOnly] - Whether or not this command can only be used in specific servers
     * @param {boolean} [CommandOptions.ownerOnly] Whether or not this command can only be used by the server owner
     * @param {boolean} [CommandOptions.nsfw] - Whether or not this command can only be used in a NSFW channel
     * @param {boolean} [CommandOptions.guildOnly] - Whether or not this command can only be used in a server
     * @param {*} [CommandOptions.args] - Arguments that the user should provide
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
        args = {  },
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
