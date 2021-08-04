//@ts-check

const { Client, Collection, Intents } = require('discord.js');
const { connect } = require('mongoose');
const Manager = require('./manager');
const { registerCommands, registerEvents } = require('./registry');

class PrefabClient extends Client {
    constructor() {
        super({ intents: Object.values(Intents.FLAGS) });

        this.commands = new Collection();
        this.categories = new Collection();
        /** @type {import('../types/manager').Manager<string, import('../types/guild').GuildInfo>} */
        this.guildInfo = new Manager(this, require('../schemas/guild'));
        /** @type {import('../types/manager').Manager<string, import('../types/profile').ProfileInfo>} */
        this.profileInfo = new Manager(this, require('../schemas/profile'));
        this.config = require('../../config/config.json');
        this.settings = require('../../config/settings.json');
        this.utils = new (require('../util/utils'))(this);
        /** @type {import('discord.js').Collection<string, Collection<string, Collection<string, number>>>} */
        this.serverCooldowns = new Collection();
        /** @type {import('discord.js').Collection<string, Collection<string, number>>} */
        this.globalCooldowns = new Collection();
    }

    async loadCommands () {
        await registerCommands(this, '../commands');
        return this;
    }

    async loadEvents () {
        await registerEvents(this, '../events');
        return this;
    }

    /**
     * @param {string} token 
     * @returns 
     */
    async login (token) {
        this.utils.log("WARNING", "src/util/client.js", "Loading commands...");
        await this.loadCommands();
        this.utils.log("SUCCESS", "src/util/client.js", "Loaded all commands!");

        this.utils.log("WARNING", "src/util/client.js", "Loading events...");
        await this.loadEvents();
        this.utils.log("SUCCESS", "src/util/client.js", "Loaded all events!");

        try {
            this.utils.log("WARNING", "src/util/client.js", "Connecting to the database...");
            await connect(this.config.MONGODB_URI, {
                useNewUrlParser: true,
                useUnifiedTopology: true,
                useFindAndModify: false
            })
            this.utils.log("SUCCESS", "src/util/client.js", "Connected to the database!");
        } catch (e) {
            this.utils.log("ERROR", "src/util/client.js", `Error connecting to the database: ${e.message}`);
            process.exit(1);
        }

        try {
            this.utils.log("WARNING", "src/util/client.js", "Logging in...");
            await super.login(token);
            this.utils.log("SUCCESS", "src/util/client.js", `Logged in as ${this.user.tag}`);
        } catch (e) {
            this.utils.log("ERROR", "src/util/client.js", `Error logging in: ${e.message}`);
        }

        return this.token;
    }
}

module.exports = PrefabClient;
