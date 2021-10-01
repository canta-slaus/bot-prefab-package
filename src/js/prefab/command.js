// @ts-check
const { Collection } = require("discord.js");

class PrefabCommand {
	/**
     * @param {import('../src/util/client')} client - The client isntance
     * @param {CommandOptions} options - Settings for the slash command
     */
	constructor (client, {
		name = "",
		description = "",
		category = "No category",
		options = [],
		defaultPermission = true,
		permissions = [],
		development = true,
		devOnly = false,
		hideCommand = false,
		ownerOnly = false,
		guildOnly = true,
		perms = [],
		clientPerms = [],
		nsfw = false,
		cooldown = 0,
		globalCooldown = true,
		ignoreDisabledChannels = false,
		canNotDisable = false,
		canNotSetCooldown = true,
		groups = null,
		subcommands = null
	}) {
		this.client = client;
		this.name = name;
		this.description = description;
		this.category = category;
		this.options = options;
		this.defaultPermission = defaultPermission;
		this.permissions = permissions;
		this.development = development;
		this.devOnly = devOnly;
		this.hideCommand = hideCommand;
		this.ownerOnly = ownerOnly;
		this.guildOnly = guildOnly;
		this.perms = perms;
		this.clientPerms = clientPerms;
		this.nsfw = nsfw;
		this.cooldown = cooldown;
		this.globalCooldown = globalCooldown;
		this.canNotDisable = canNotDisable;
		this.canNotSetCooldown = canNotSetCooldown;
		this.ignoreDisabledChannels = ignoreDisabledChannels;
		this.groups = groups;
		this.subcommands = subcommands;

		if (options && options.length) this.options = options;
		else if (groups && Object.keys(groups)) this.options = getSubcommandGroupOptions(this.groups);
		else if (subcommands && Object.keys(subcommands)) this.options = getSubcommandOptions(this.subcommands);
	}

	/**
     * @param {import('discord.js').CommandInteraction} interaction
     */
	async setCooldown (interaction) {
		const cd = await this.client.utils.getCooldown(this, interaction);

		if (!cd) return;

		let cooldowns;
		if (typeof this.globalCooldown === "undefined" || this.globalCooldown) {
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

module.exports = PrefabCommand;

/**
 * @param {Object.<string, import('./command').SubcommandGroup>} groups
 */
function getSubcommandGroupOptions (groups) {
	const names = Object.keys(groups);
	const options = [];

	for (const name of names) {
		/** @type {import('discord.js').ApplicationCommandOptionData} */
		const option = {
			name,
			description: groups[name].description,
			options: getSubcommandOptions(groups[name].subcommands),
			type: "SUB_COMMAND_GROUP"
		};

		options.push(option);
	}

	return options;
}

/**
 * @param {Object.<string, import('./command').Subcommand>} subcommands
 */
function getSubcommandOptions (subcommands) {
	const names = Object.keys(subcommands);
	const options = [];

	for (const name of names) {
		/** @type {import('discord.js').ApplicationCommandOptionData} */
		const option = {
			name,
			description: subcommands[name].description,
			options: subcommands[name].args,
			type: "SUB_COMMAND"
		};

		options.push(option);
	}

	return options;
}

/**
 * @typedef CommandOptions
 * @type {object}
 * @property {string} name - The name of the slash command
 * @property {string} description - The description of the slash command
 * @property {string} [category] - The category of this command
 * @property {import('discord.js').ApplicationCommandOptionData[]} [options] - The options for this slash command
 * @property {boolean} [defaultPermission] - If false, this slash command will be disabled for everyone
 * @property {import('discord.js').ApplicationCommandPermissionData[]} [permissions] - Data to give/take the permissions for a user/role to use this command
 * @property {boolean} [development] - Whether this is a global command or a guild only command (first ID of config.TEST_SERVERS)
 * @property {boolean} [devOnly] - Whether this command can only be used by a bot dev
 * @property {boolean} [hideCommand] - Whether or not this command will be displayed in the help command
 * @property {boolean} [ownerOnly] - Whether this command can only be used by the server owner
 * @property {boolean} [guildOnly] - Whether this command can only be used in a server
 * @property {import('discord.js').PermissionString[]} [perms] - Permissions that the user needs in order to use this command
 * @property {import('discord.js').PermissionString[]} [clientPerms] - Permissions that the client needs to run this command
 * @property {boolean} [nsfw] - Whether or not this command can only be used in a NSFW channel
 * @property {number} [cooldown] - Cooldown of the command
 * @property {boolean} [globalCooldown] - Whether the cooldown on this command will be applied globally or for a server only
 * @property {boolean} [canNotDisable] - Whether or not this command can be disabled in a server
 * @property {boolean} [canNotSetCooldown] - Whether or not users can set a custom command cooldown for this command
 * @property {boolean} [ignoreDisabledChannels] - Whether or not this command will still run in ignored channels
 * @property {Object.<string, SubcommandGroup>} [groups] - Subcommand groups for this command
 * @property {Object.<string, Subcommand>} [subcommands] - Subcommands for this command
 */

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
 * @property {({ client, interaction, group, subcommand } : { client: import('../src/util/client'), interaction: import('discord.js').CommandInteraction, group: string, subcommand: string }) => any} [execute]
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