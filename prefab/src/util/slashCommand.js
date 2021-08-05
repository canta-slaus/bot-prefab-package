//@ts-check

const { Collection } = require('discord.js');

class SlashCommand {
    /**
     * @param {import('./client')} client - The client isntance
     * @param {object} options - Settings for the slash command
     * @param {string} options.name - The name of the slash command
     * @param {string} options.description - The description of the slash command
     * @param {import('discord.js').ApplicationCommandOptionData[]} [options.options] - The options for this slash command
     * @param {boolean} [options.defaultPermission] - If false, this slash command will be disabled for everyone
     * @param {import('discord.js').ApplicationCommandPermissionData[]} [options.permissions] - Data to give/take the permissions for a user/role to use this command
     * @param {boolean} [options.development] - Whether this is a global command or a guild only command (first ID of config.TEST_SERVERS)
     * @param {boolean} [options.devOnly] - Whether this command can only be used by a bot dev
     * @param {boolean} [options.ownerOnly] - Whether this command can only be used by the server owner
     * @param {import('discord.js').PermissionString[]} [options.perms] - Permissions that the user needs in order to use this command
     * @param {import('discord.js').PermissionString[]} [options.clientPerms] - Permissions that the client needs to run this command
     * @param {boolean} [options.nsfw] - Whether or not this command can only be used in a NSFW channel
     * @param {number} [options.cooldown] - Cooldown of the command
     * @param {boolean} [options.globalCooldown] - Whether the cooldown on this command will be applied globally or for a server only
     * @param {boolean} [options.ignoreDisabledChannels] - Whether or not this command will still run in ignored channels
     * @param {Object.<string, SubcommandGroup>} [options.groups] - Subcommand groups for this command
     * @param {Object.<string, Subcommand>} [options.subcommands] - Subcommands for this command
     */
    constructor (client, {
        name = "",
        description = "",
        options = [],
        defaultPermission = true,
        permissions = null,
        development = true,
        devOnly = false,
        ownerOnly = false,
        perms = [],
        clientPerms = [],
        nsfw = false,
        cooldown = 0,
        globalCooldown = true,
        ignoreDisabledChannels = false,
        groups = null,
        subcommands = null
    }) {
        this.client = client;
        this.name = name;
        this.description = description;
        this.options = options;
        this.defaultPermission = defaultPermission;
        this.permissions = permissions;
        this.development = development;
        this.devOnly = devOnly;
        this.ownerOnly = ownerOnly;
        this.perms = perms;
        this.clientPerms = clientPerms;
        this.nsfw = nsfw;
        this.cooldown = cooldown;
        this.globalCooldown = globalCooldown;
        this.ignoreDisabledChannels = ignoreDisabledChannels;
        this.groups = groups;
        this.subcommands = subcommands;
    }

    /**
     * @param {import('discord.js').CommandInteraction} interaction 
     */
     async setCooldown (interaction) {
        const cd = await this.client.utils.getCooldown(this, interaction);

        if (!cd) return;

        let cooldowns;
        if (typeof this.globalCooldown === 'undefined' || this.globalCooldown) {
            if (!this.client.globalCooldowns.has(this.name)) this.client.globalCooldowns.set(this.name, new Collection());
            cooldowns = this.client.globalCooldowns;
        } else {
            if (!this.client.serverCooldowns.has(interaction.guild.id)) this.client.serverCooldowns.set(interaction.guild.id, new Collection());
            cooldowns = this.client.serverCooldowns.get(interaction.guild.id);
            if (!cooldowns.has(this.name)) cooldowns.set(this.name, new Collection());
        }

        const now = Date.now();
        const timestamps = cooldowns.get(this.name);
        const cooldownAmount = cd * 1000;

        timestamps.set(interaction.user.id, now);
        setTimeout(() => timestamps.delete(interaction.user.id), cooldownAmount);
    }
}

module.exports = SlashCommand;

/**
 * @typedef SubcommandGroup 
 * @type {object} 
 * @property {string} description 
 * @property {Object.<string, Subcommand>} subcommands 
 */

/**
 * @typedef Subcommand 
 * @type {object} 
 * @property {string} description 
 * @property {Argument[]} [args] 
 * @property {({ client, interaction, args, group, subcommand } : { client: import('./client'), interaction: import('discord.js').CommandInteraction, args: Object.<string, *>, group: string, subcommand: string }) => any} [execute] 
 */

/**
 * @typedef Argument 
 * @type {object} 
 * @property {("STRING"|"INTEGER"|"BOOLEAN"|"USER"|"CHANNEL"|"ROLE"|"MENTIONABLE"|"NUMBER")} type 
 * @property {string} name 
 * @property {string} description 
 * @property {Choice[]} [choices] 
 * @property {boolean} [required] 
 */

/**
 * @typedef Choice 
 * @type {object} 
 * @property {string} name 
 * @property {string|number} value 
 */
