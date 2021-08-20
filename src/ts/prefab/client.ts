import { ApplicationCommandData, Client, ClientOptions, Collection, ColorResolvable } from "discord.js";
import { connect } from 'mongoose';
import { Guild } from "../src/types/guild";
import { Profile } from "../src/types/profile";
import { Command } from "../src/util/command";
import { Manager } from './manager';
import { registerCommands, registerEvents } from './registry';
import GuildModel from '../src/schemas/guild';
import ProfileModel from '../src/schemas/profile';
import { Utils } from "../src/util/utils";

class PrefabClient extends Client {
    commands: Collection<string, Command>;
    categories: Collection<string, string[]>;
    guildInfo: Manager<string, Guild>;
    profileInfo: Manager<string, Profile>;
    config: Config;
    colors: { [x: string]: ColorResolvable };
    languages: { [x: string]: any };
    utils: Utils;
    serverCooldowns: Collection<string, Collection<string, Collection<string, number>>>;
    globalCooldowns: Collection<string, Collection<string, number>>;

    constructor(options: ClientOptions) {
        super(options);

        this.commands = new Collection();
        this.categories = new Collection();

        //@ts-ignore
        this.guildInfo = new Manager(this, GuildModel);
        //@ts-ignore
        this.profileInfo = new Manager(this, ProfileModel);
        //@ts-ignore
        this.utils = new Utils(this);

        this.config = require('../config/config.json');
        this.colors = require('../config/colors.json');
        this.languages = require('../config/languages.json');

        this.serverCooldowns = new Collection();
        this.globalCooldowns = new Collection();
    }

    async loadCommands () {
        if (!this.application?.owner) await this.application?.fetch();

        //@ts-ignore
        await registerCommands(this, '../src/commands');

        const guildCommands = toApplicationCommand(this.commands.filter(s => s.development));
        const globalCommands = toApplicationCommand(this.commands.filter(s => !s.development));

        if (guildCommands.length) {
            const guild = await this.guilds.fetch(this.config.TEST_SERVERS[0]);
            await guild.commands.set(guildCommands);
        }

        if (globalCommands.length) await this.application!.commands.set(globalCommands);

        const devOnly = this.commands.filter(s => s.devOnly).values();
        for (const command of devOnly) {
            if (command.development) {
                const guild = await this.guilds.fetch(this.config.TEST_SERVERS[0]);
                await guild.commands.cache.find(c => c.name === command.name)!.permissions.set({ permissions: this.config.DEVS.map(id => { return { id, type: "USER", permission: true } }) });
            }
        }
    }

    async loadEvents () {
        //@ts-ignore
        await registerEvents(this, '../src/events');
    }

    /**
     * @param {string} token 
     * @returns 
     */
    async login (token?: string) {
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
            this.utils.log("WARNING", "src/util/client.js", "Loading events...");
            await this.loadEvents();
            this.utils.log("SUCCESS", "src/util/client.js", "Loaded all events!");
        } catch (e) {
            this.utils.log("ERROR", "src/util/client.js", `Error loading events: ${e.message}`);
        }

        try {
            this.utils.log("WARNING", "src/util/client.js", "Logging in...");
            await super.login(token);
            this.utils.log("SUCCESS", "src/util/client.js", `Logged in as ${this.user!.tag}`);
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

        return this.token!;
    }
}

export { PrefabClient };

function toApplicationCommand (collection: Collection<string, Command>): ApplicationCommandData[] {
    return collection.map(s => { return { name: s.name, description: s.description, options: s.options, defaultPermission: s.devOnly ? false : s.defaultPermission } });
}

declare interface Config {
    TOKEN: string;
    MONGODB_URI: string;
    DEVS: string[];
    TEST_SERVERS: string[];
}
