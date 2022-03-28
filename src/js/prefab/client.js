//@ts-check

const { Client, Collection } = require('discord.js');
const { connect } = require('mongoose');
const Manager = require('./manager.js');
const { registerCommands, registerEvents } = require('./registry');

class PrefabClient extends Client {
    /** @param {import('discord.js').ClientOptions} options */
    constructor(options) {
        super(options);

        /** @type {Collection<string, import('../src/util/command')>} */
        this.commands = new Collection();
        /** @type {Collection<string, string[]>} */
        this.categories = new Collection();
        /** @type {import('./tmanager').Manager<string, import('../src/types/guild').Guild>} */
        this.guildInfo = new Manager(this, require('../src/schemas/guild'));
        /** @type {import('./tmanager').Manager<string, import('../src/types/profile').Profile>} */
        this.profileInfo = new Manager(this, require('../src/schemas/profile'));
        /** @type {import('../config/config.json')} */
        this.config = require('../config/config.json');
        /** @type {import('../config/colors.json')} */
        this.colors = require('../config/colors.json');
        /** @type {import('../config/languages.json')} */
        this.languages = require('../config/languages.json');
        /** @type {import('../src/util/utils')} */
        this.utils = new (require('../src/util/utils'))(this);
        /** @type {import('discord.js').Collection<string, Collection<string, Collection<string, number>>>} */
        this.serverCooldowns = new Collection();
        /** @type {import('discord.js').Collection<string, Collection<string, number>>} */
        this.globalCooldowns = new Collection();
    }

    async loadCommands () {
        if (!this.application?.owner) await this.application?.fetch();

        await registerCommands(this, '../src/commands');

        const guildCommands = toApplicationCommand(this.commands.filter(s => s.development), this);
        const globalCommands = toApplicationCommand(this.commands.filter(s => !s.development), this);
        const devOnly = this.commands.filter(s => s.devOnly);

        if (guildCommands.length) {
            const guild = await this.guilds.fetch(this.config.TEST_SERVERS[0]);
            this.utils.log("SUCCESS", "prefab/client.js", "Guild commands:");
            //@ts-ignore
            await saveCommands(this, guild.commands, guildCommands);
        }

        if (globalCommands.length) {
            this.utils.log("SUCCESS", "prefab/client.js", "Global commands:")
            await saveCommands(this, this.application.commands, globalCommands);
        }

        if (devOnly.size) {
            const guild = await this.guilds.fetch(this.config.TEST_SERVERS[0]);

            for (const [name, command] of devOnly) {
                if (command.development) {
                    await guild.commands.cache.find(c => c.name === command.name).permissions.set({ permissions: this.config.DEVS.map(id => { return { id, type: "USER", permission: true } }) });
                }
            }
        }
    }

    async loadEvents () {
        await registerEvents(this, '../src/events');
    }

    /**
     * @param {string} token 
     * @returns 
     */
    async login (token) {
        try {
            this.utils.log("WARNING", "prefab/client.js", "Connecting to the database...");
            await connect(this.config.MONGODB_URI);
            this.utils.log("SUCCESS", "prefab/client.js", "Connected to the database!");
        } catch (e) {
            this.utils.log("ERROR", "prefab/client.js", `Error connecting to the database: ${e.message}`);
            process.exit(1);
        }

        try {
            this.utils.log("WARNING", "prefab/client.js", "Loading events...");
            await this.loadEvents();
            this.utils.log("SUCCESS", "prefab/client.js", "Loaded all events!");
        } catch (e) {
            this.utils.log("ERROR", "prefab/client.js", `Error loading events: ${e.message}`);
        }

        try {
            this.utils.log("WARNING", "prefab/client.js", "Logging in...");
            await super.login(token);
            this.utils.log("SUCCESS", "prefab/client.js", `Logged in as ${this.user.tag}`);
        } catch (e) {
            this.utils.log("ERROR", "prefab/client.js", `Error logging in: ${e.message}`);
            process.exit(1);
        }

        try {
            this.utils.log("WARNING", "prefab/client.js", "Loading commands...");
            await this.loadCommands();
            this.utils.log("SUCCESS", "prefab/client.js", "Loaded all commands!");
        } catch (e) {
            this.utils.log("ERROR", "prefab/client.js", `Error loading commands: ${e.message}`);
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
    return collection.map(s => { return { name: s.name, description: s.description, options: s.options, defaultPermission: s.devOnly ? false : s.defaultPermission } });
}

/**
 * @param {PrefabClient} client 
 * @param {import('discord.js').ApplicationCommandManager} manager 
 * @param {import('discord.js').ApplicationCommandData[]} commands 
 */
async function saveCommands(client, manager, commands) {
    const existingCommands = await manager.fetch();

    const newCommands = commands.filter(c => !existingCommands.find(e => e.name === c.name));
    const deletedCommands = existingCommands.filter(c => !commands.find(e => e.name === c.name));
    const editedCommands = commands.filter(c => {
        const command = existingCommands.find(e => e.name === c.name);
        if (!command) return false;
        return !command.equals(c, true);
    });

    client.utils.log("SUCCESS", "prefab/client.js", `Total commands   - ${commands.length}`);
    client.utils.log("SUCCESS", "prefab/client.js", `New commands     - ${newCommands.length}`);
    client.utils.log("SUCCESS", "prefab/client.js", `Deleted commands - ${deletedCommands.size}`);
    client.utils.log("SUCCESS", "prefab/client.js", `Edited commands  - ${editedCommands.length}`);

    for (const command of newCommands) {
        await manager.create(command);
    }

    for (const [id, command] of deletedCommands) {
        await manager.delete(id);
    }

    for (const command of editedCommands) {
        await manager.edit(existingCommands.find(c => c.name === command.name).id, command);
    }
}
