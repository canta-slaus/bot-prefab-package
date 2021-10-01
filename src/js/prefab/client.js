// @ts-check
const { Client, Collection } = require("discord.js");
const { connect } = require("mongoose");
const Manager = require("./manager.js");
const { registerCommands, registerEvents } = require("./registry");

class PrefabClient extends Client {
	/** @param {import('discord.js').ClientOptions} options */
	constructor(options) {
		super(options);

		/** @type {Collection<string, import('../src/util/command')>} */
		this.commands = new Collection();
		/** @type {Collection<string, string[]>} */
		this.categories = new Collection();
		/** @type {import('./tmanager').Manager<string, import('../src/types/guild').Guild>} */
		// @ts-ignore
		this.guildInfo = new Manager(this, require("../src/schemas/guild"));
		/** @type {import('./tmanager').Manager<string, import('../src/types/profile').Profile>} */
		// @ts-ignore
		this.profileInfo = new Manager(this, require("../src/schemas/profile"));
		/** @type {import('../config/config.json')} */
		this.config = require("../config/config.json");
		/** @type {import('../config/colors.json')} */
		this.colors = require("../config/colors.json");
		/** @type {import('../config/languages.json')} */
		this.languages = require("../config/languages.json");
		/** @type {import('../src/util/utils')} */
		// @ts-ignore
		this.utils = new (require("../src/util/utils"))(this);
		/** @type {import('discord.js').Collection<string, Collection<string, Collection<string, number>>>} */
		this.serverCooldowns = new Collection();
		/** @type {import('discord.js').Collection<string, Collection<string, number>>} */
		this.globalCooldowns = new Collection();
	}

	async loadCommands () {
		if (!this.application?.owner) await this.application?.fetch();

		// @ts-ignore
		await registerCommands(this, "../src/commands");

		const guildCommands = toApplicationCommand(this.commands.filter(s => s.development), this);
		const globalCommands = toApplicationCommand(this.commands.filter(s => !s.development), this);

		if (guildCommands.length) {
			const guild = await this.guilds.fetch(this.config.TEST_SERVERS[0]);
			await guild.commands.set(guildCommands);
		}

		if (globalCommands.length) await this.application.commands.set(globalCommands);

		const devOnly = this.commands.filter(s => s.devOnly).values();
		for (const command of devOnly) {
			if (command.development) {
				const guild = await this.guilds.fetch(this.config.TEST_SERVERS[0]);
				await guild.commands.cache.find(c => c.name === command.name).permissions.set({ permissions: this.config.DEVS.map(id => { return { id, type: "USER", permission: true }; }) });
			}
		}
	}

	async loadEvents () {
		// @ts-ignore
		await registerEvents(this, "../src/events");
	}

	/**
     * @param {string} token
     * @returns
     */
	async login (token) {
		try {
			this.utils.log("WARNING", "src/util/client.js", "Connecting to the database...");
			await connect(this.config.MONGODB_URI, {
				useNewUrlParser: true,
				useUnifiedTopology: true,
				useFindAndModify: false
			});
			this.utils.log("SUCCESS", "src/util/client.js", "Connected to the database!");
		} catch (e) {
			this.utils.log("ERROR", "src/util/client.js", `Error connecting to the database: ${e.message}`);
			process.exit(1);
		}

		try {
			this.utils.log("WARNING", "src/util/client.js", "Loading events...");
			await this.loadEvents();
			this.utils.log("SUCCESS", "src/util/client.js", "Loaded all events!");
		} catch (e) {
			this.utils.log("ERROR", "src/util/client.js", `Error loading events: ${e.message}`);
		}

		try {
			this.utils.log("WARNING", "src/util/client.js", "Logging in...");
			await super.login(token);
			this.utils.log("SUCCESS", "src/util/client.js", `Logged in as ${this.user.tag}`);
		} catch (e) {
			this.utils.log("ERROR", "src/util/client.js", `Error logging in: ${e.message}`);
			process.exit(1);
		}

		try {
			this.utils.log("WARNING", "src/util/client.js", "Loading commands...");
			await this.loadCommands();
			this.utils.log("SUCCESS", "src/util/client.js", "Loaded all commands!");
		} catch (e) {
			this.utils.log("ERROR", "src/util/client.js", `Error loading commands: ${e.message}`);
		}

		return this.token;
	}
}

module.exports = PrefabClient;

/**
 * @param {Collection<string, import('../src/util/command')>} collection
 * @param {PrefabClient} client
 * @returns {import('discord.js').ApplicationCommandData[]}
 */
function toApplicationCommand (collection, client) {
	return collection.map(s => { return { name: s.name, description: s.description, options: s.options, defaultPermission: s.devOnly ? false : s.defaultPermission }; });
}