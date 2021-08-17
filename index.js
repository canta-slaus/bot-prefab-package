#!/usr/bin/env node
//@ts-check

const prompts = require('prompts');
const fs = require('fs-extra');
const path = require('path');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const dir = process.cwd();

(async () => {
    try {
        if (parseInt(process.versions.node.split(".")[0]) < 16) {
            console.log("\u001b[33m> It looks like you're using a Node.js version below 16.x.x. Discord.js v13 requires Node.js v16.6 or higher, make sure you update!\u001b[0m");
        }

        const { action } = await prompts([
            {
                type: "select",
                name: "action",
                message: "What would you like to do?",
                choices: [
                    { title: "┌ New project", description: "Create a new project!", value: "new" },
                    { title: "├ Update a project", description: "Update your current project to the newest version!", value: "update" },
                    { title: "├ Add command", description: "Add a new command to the current project", value: "command" },
                    { title: "├ Add event", description: "Add a new event listener to the current project!", value: "event" },
                    { title: "├ Add types", description: "Add the needed type declarations for a schema!", value: "types" },
                    { title: "└ Information", description: "Get some information about this CLI tool!", value: "info" }
                ],
                warn: "This is still WIP!",
                hint: "Use arrow keys to navigate. Hit \"ENTER\" to select."
            }
        ]);

        if (!action) return;

        if (action === 'new') {
            const { project } = await prompts([
                {
                    type: "text",
                    name: "project",
                    message: "What should the name of the new project be?",
                    validate: name => name?.length ? true : "Please enter a name!"
                }
            ]);

            if (!project?.length) return;

            console.log("\u001b[33m> Creating new project...\u001b[0m");

            let src = "";
            let pm = "";

            try {
                const { stdout } = await exec("npm list -g");

                src = path.join(stdout.split("\n")[0], "node_modules", "bot-prefab-package", "prefab");

                const exists = await fs.pathExists(src);
                if (!exists) throw new Error();
                pm = "npm";
            } catch (e) {
                try {
                    const { stdout } = await exec("yarn global dir");
                    src = path.join(stdout.split("\n").find(s => s.includes("global")), "node_modules", "bot-prefab-package", "prefab");

                    const exists = await fs.pathExists(src);
                    if (!exists) throw new Error();
                    pm = "yarn";
                } catch (e) {
                    return console.log("\u001b[31m> Oops, I couldn't find the global package installation folders!\u001b[0m");
                }
            }

            await fs.mkdir(project);
            console.log("\u001b[32m> Created a new project folder!\u001b[0m");

            console.log("\u001b[33m> Generating files...\u001b[0m");
            await fs.copy(src, path.join(dir,project));
            console.log("\u001b[32m> Generated all files!\u001b[0m");

            console.log("\u001b[33m> Installing packages...\u001b[0m");
            await exec(`${pm} init -y`, { cwd: `./${project}` });
            console.log("\u001b[32m> Installed all packages!\u001b[0m");

            pm === "npm" ? await exec(`npm i discord.js mongoose`, { cwd: `./${project}` }) 
                         : await exec(`yarn add discord.js mongoose`, { cwd: `./${project}` });

            console.log("\u001b[32m> Done!\u001b[0m");

            return;
        }

        if (action === "info") {
            console.clear();
            console.log("                                                                    ");
            console.log("   \u001b[34;1m┌────────────────────── \u001b[34;1mbot-prefab-package \u001b[34;1m─────────────────────┐");
            console.log("   │   \u001b[33mThis CLI was made based on my original bot-prefab to make   \u001b[34;1m│");
            console.log("   │                 \u001b[33mcreating new projects easier.                 \u001b[34;1m│");
            console.log("   \u001b[34;1m├───────────────────────────────────────────────────────────────┤")
            console.log("   │   \u001b[33mGitHub: \u001b[36;1mhttps://github.com/canta-slaus/bot-prefab-package   \u001b[34;1m│");
            console.log("   │       \u001b[33mnpm: \u001b[36;1mhttps://npmjs.com/package/bot-prefab-package       \u001b[34;1m│");
            console.log("   │             \u001b[33mDiscord: \u001b[36;1mhttps://discord.gg/Mg347Rcpwa            \u001b[34;1m│");
            console.log("   └───────────────────────────────────────────────────────────────┘\u001b[0m");
            console.log("                                                                    ");

            return;
        }

        if (!(await isTemplate())) return console.log("\u001b[31m> This doesn't seem to be a project made using this package!\u001b[0m");

        if (action === "update") {
            const { confirm } = await prompts([
                {
                    type: "confirm",
                    name: "confirm",
                    message: "\u001b[31mUpdating to a newer version will override the following folders: \"src/prefab\" and \"src/commands/prefab\". Any changes made will be lost, are you sure you want to continue?\u001b[0m",
                    initial: false
                }
            ]);

            if (!confirm) return console.log("\u001b[33m> Canceled update!\u001b[0m");

            const src = path.join(dir, "config", "settings.json");

            console.log("\u001b[33m> Updating the project...\u001b[0m");
            const version = JSON.parse(await fs.readFile(src, { encoding: "utf8" })).version;
            const package = JSON.parse(await fs.readFile(path.join(__dirname, "package.json"), { encoding: "utf8" })).version;

            if (version === package) return console.log("\u001b[32m> You already are using the newest version! Make sure to update the package itself.\u001b[0m");

            const prefab = path.join(dir, "prefab");
            await fs.remove(prefab);
            await fs.copy(path.join(__dirname, "prefab", "prefab"), prefab);

            const commands = path.join(dir, "src", "commands", "prefab");
            await fs.remove(commands);
            await fs.copy(path.join(__dirname, "prefab", "commands", "prefab"), commands);

            console.log(`\u001b[32m> Successfully updated this project to v${package}!\u001b[0m`);

            return;
        }

        if (action === "command") {
            const { slash, name, category } = await prompts([
                {
                    type: "select",
                    name: "slash",
                    message: "What type of command should it be?",
                    choices: [
                        { title: "┌ Slash command", value: true },
                        { title: "└ Message command", value: false }
                    ],
                    hint: "Use arrow keys to navigate. Hit \"ENTER\" to select."
                },
                {
                    type: "text",
                    name: "name",
                    message: "What should the name of the command be?",
                    validate: name => name?.length ? true : "Please enter a name!"
                },
                {
                    type: "text",
                    name: "category",
                    message: "What should the category of the command be?",
                    validate: name => name?.length ? true : "Please enter a category!"
                }
            ]);

            if (!name || !category || typeof slash === undefined) return;

            const categoryPath = path.join(dir, "src", "commands", category.toLowerCase());

            console.log("\u001b[33m> Generating category and command...\u001b[0m");
            if (!(await fs.pathExists(categoryPath))) await fs.mkdir(categoryPath);

            const commandPath = path.join(categoryPath, name.toLowerCase() + ".js");
            if (!(await fs.pathExists(commandPath))) return console.log("\u001b[33m> That command already exists in that category!\u001b[0m");

            const command = slash ? `//@ts-check

const SlashCommand = require('../../util/slashCommand');

module.exports = class $Name extends SlashCommand {
    constructor (client) {
        super(client, {
            name: "$name",
            category: "$Category",
            description: 
        });
    }

    /**
     * @param {object} p
     * @param {import('../../util/client')} p.client
     * @param {import('discord.js').CommandInteraction} p.interaction
     * @param {string} p.group
     * @param {string} p.subcommand
     */
    async execute ({ client, interaction, group, subcommand }) {
        // 
    }
}
` : `//@ts-check

const Command = require('../../util/command');

module.exports = class $Name extends Command {
    constructor (client) {
        super(client, {
            name: "$name",
            category: "$Category"
        });
    }

    /**
     * @param {object} p
     * @param {import('../../util/client')} p.client
     * @param {import('discord.js').Message} p.message
     * @param {string[]} p.args 
     * @param {Object.<string, *>} p.flags
     */
    async execute ({ client, message, args, flags }) {
        // 
    }
}
`;

            await fs.writeFile(commandPath, command.replace(/\$Name/g, cap(name.toLowerCase()))
                                                   .replace(/\$name/g, name.toLowerCase())
                                                   .replace(/\$Category/g, category));

            console.log("\u001b[32m> Successfully create a new command!\u001b[0m");

            return;
        }

        if (action === "event") {
            const eventFolder = path.join(dir, "src", "events");
            const existingEvents = await getEvents(eventFolder);
            const allEvents = [
                { title: "applicationCommandCreate", value: ["application.applicationCommandCreate", ["command", "import('discord.js').ApplicationCommand"]], description: "Emitted when a guild application command is created." },
                { title: "applicationCommandDelete", value: ["application.applicationCommandDelete", ["command", "import('discord.js').ApplicationCommand"]], description: "Emitted when a guild application command is deleted." },
                { title: "applicationCommandUpdate", value: ["application.applicationCommandUpdate", ["oldCommand", "import('discord.js').ApplicationCommand"], ["oldCommand", "import('discord.js').ApplicationCommand"]], description: "Emitted when a guild application command is updated." },
                { title: "channelCreate", value: ["channel.channelCreate", ["channel", "import('discord.js').GuildChannel"]], description: "Emitted whenever a guild channel is created." },
                { title: "channelDelete", value: ["channel.channelDelete", ["channel", "import('discord.js').GuildChannel"]], description: "Emitted whenever a guild channel is deleted." },
                { title: "channelPinsUpdate", value: ["channel.channelPinsUpdate", ["channel", "import('discord.js').GuildChannel"], ["time", "Date"]], description: "Emitted whenever the pins of a channel are updated. Due to the nature of the WebSocket event, not much information can be provided easily here - you need to manually check the pins yourself." },
                { title: "channelUpdate", value: ["channel.channelUpdate", ["oldChannel", "import('discord.js').GuildChannel|import('discord.js').DMChannel"], ["newChannel", "import('discord.js').GuildChannel|import('discord.js').DMChannel"]], description: "Emitted whenever a channel is updated - e.g. name change, topic change, channel type change." },
                { title: "debug", value: ["dev.debug", ["info", "string"]], description: "Emitted for general debugging information." },
                { title: "emojiCreate", value: ["emoji.emojiCreate", ["emoji", "import('discord.js').GuildEmoji"]], description: "Emitted whenever a custom emoji is created in a guild." },
                { title: "emojiDelete", value: ["emoji.emojiDelete", ["emoji", "import('discord.js').GuildEmoji"]], description: "Emitted whenever a custom emoji is deleted in a guild." },
                { title: "emojiUpdate", value: ["emoji.emojiUpdate", ["oldEmoji", "import('discord.js').GuildEmoji"], ["newEmoji", "import('discord.js').GuildEmoji"]], description: "Emitted whenever a custom emoji is updated in a guild." },
                { title: "error", value: ["dev.error", ["error", "Error"]], description: "Emitted when the client encounters an error." },
                { title: "guildBanAdd", value: ["guild.guildBanAdd", ["ban", "import('discord.js').GuildBan"]], description: "Emitted whenever a member is banned from a guild." },
                { title: "guildBanRemove", value: ["guild.guildBanRemove", ["ban", "import('discord.js').GuildBan"]], description: "Emitted whenever a member is unbanned from a guild." },
                { title: "guildCreate", value: ["guild.guildCreate", ["guild", "import('discord.js').GuildCreate"]], description: "Emitted whenever the client joins a guild." },
                { title: "guildDelete", value: ["guild.guildDelete", ["guild", "import('discord.js').GuildDelete"]], description: "Emitted whenever a guild kicks the client or the guild is deleted/left." },
                { title: "guildIntegrationsUpdate", value: ["guild.guildIntegrationsUpdate", ["guild", "import('discord.js').Guild"]], description: "Emitted whenever a guild integration is updated" },
                { title: "guildMemberAdd", value: ["guild.guildMemberAdd", ["member", "import('discord.js').GuildMember"]], description: "Emitted whenever a user joins a guild." },
                { title: "guildMemberAvailable", value: ["guild.guildMemberAvailable", ["member", "import('discord.js').GuildMember"]], description: "Emitted whenever a member becomes available in a large guild." },
                { title: "guildMemberRemove", value: ["guild.guildMemberRemove", ["member", "import('discord.js').GuildMember"]], description: "Emitted whenever a member leaves a guild, or is kicked." },
                { title: "guildMembersChunk", value: ["guild.guildMembersChunk", ["members", "import('discord.js').Collection<string, import('discord.js').GuildMember>"], ["guild", "import('discord.js').GuildMember"], ["chunk", "import('discord.js').GuildMembersChunk"]], description: "Emitted whenever a chunk of guild members is received (all members come from the same guild)." },
                { title: "guildMemberUpdate", value: ["guild.guildMemberUpdate", ["oldMember", "import('discord.js').GuildMember"], ["newMember", "import('discord.js').GuildMember"]], description: "Emitted whenever a guild member changes - i.e. new role, removed role, nickname. Also emitted when the user's details (e.g. username) change." },
                { title: "guildUnavailable", value: ["guild.guildUnavailable", ["guild", "import('discord.js').Guild"]], description: "Emitted whenever a guild becomes unavailable, likely due to a server outage." },
                { title: "guildUpdate", value: ["guild.guildUpdate", ["guild", "import('discord.js').Guild"]], description: "Emitted whenever a guild is updated - e.g. name change." },
                { title: "interactionCreate", value: ["interaction.interactionCreate", ["interaction", "import('discord.js').Interaction"]], description: "Emitted when an interaction is created." },
                { title: "invalidated", value: ["dev.invalidated"], description: "Emitted when the client's session becomes invalidated. You are expected to handle closing the process gracefully and preventing a boot loop if you are listening to this event." },
                { title: "invalidRequestWarning", value: ["dev.invalidRequestWarning", ["invalidRequestWarningData", "import('discord.js').InvalidRequestWarningData"]], description: "Emitted periodically when the process sends invalid requests to let users avoid the 10k invalid requests in 10 minutes threshold that causes a ban." },
                { title: "inviteCreate", value: ["invite.inviteCreate", ["invite", "import('discord.js').Invite"]], description: "Emitted when an invite is created. This event only triggers if the client has MANAGE_GUILD permissions for the guild, or MANAGE_CHANNELS permissions for the channel." },
                { title: "inviteDelete", value: ["invite.inviteDelete", ["invite", "import('discord.js').Invite"]], description: "Emitted when an invite is deleted. This event only triggers if the client has MANAGE_GUILD permissions for the guild, or MANAGE_CHANNELS permissions for the channel." },
                { title: "messageCreate", value: ["message.messageCreate", ["message", "import('discord.js').Message"]], description: "Emitted whenever a message is created." },
                { title: "messageDelete", value: ["message.messageDelete", ["message", "import('discord.js').Message"]], description: "Emitted whenever a message is deleted." },
                { title: "messageDeleteBulk", value: ["message.messageDeleteBulk", ["messages", "import('discord.js').Collection<string, import('discord.js').Message>"]], description: "Emitted whenever messages are deleted in bulk." },
                { title: "messageReactionAdd", value: ["message.messageReactionAdd", ["messageReaction", "import('discord.js').MessageReaction"], ["user", "import('discord.js').User"]], description: "Emitted whenever a reaction is added to a cached message." },
                { title: "messageReactionRemove", value: ["message.messageReactionRemove", ["messageReaction", "import('discord.js').MessageReaction"], ["user", "import('discord.js').User"]], description: "Emitted whenever a reaction is removed from a cached message." },
                { title: "messageReactionRemoveAll", value: ["message.messageReactionRemoveAll", ["message", "import('discord.js').Message"]], description: "Emitted whenever all reactions are removed from a cached message." },
                { title: "messageReactionRemoveEmoji", value: ["message.messageReactionRemoveEmoji", ["messageReaction", "import('discord.js').MessageReaction"]], description: "Emitted when a bot removes an emoji reaction from a cached message." },
                { title: "messageUpdate", value: ["message.messageUpdate", ["oldMessage", "import('discord.js').Message"], ["newMessage", "import('discord.js').Message"]], description: "Emitted whenever a message is updated - e.g. embed or content change." },
                { title: "presenceUpdate", value: ["user.presenceUpdate", ["oldPresence", "import('discord.js').Presence"], ["newPresence", "import('discord.js').Presence"]], description: "Emitted whenever a guild member's presence (e.g. status, activity) is changed." },
                { title: "rateLimit", value: ["dev.rateLimit", ["rateLimitData", "import('discord.js').RateLimitData"]], description: "Emitted when the client hits a rate limit while making a request." },
                { title: "ready", value: ["dev.ready"], description: "Emitted when the client becomes ready to start working." },
                { title: "roleCreate", value: ["role.roleCreate", ["role", "import('discord.js').Role"]], description: "Emitted whenever a role is created." },
                { title: "roleDelete", value: ["role.roleDelete", ["role", "import('discord.js').Role"]], description: "Emitted whenever a guild role is deleted." },
                { title: "roleUpdate", value: ["role.roleUpdate", ["oldRole", "import('discord.js').Role"], ["newRole", "import('discord.js').Role"]], description: "Emitted whenever a guild role is updated." },
                { title: "shardDisconnect", value: ["shard.shardDisconnect", ["event", "CloseEvent"], ["id", "number"]], description: "Emitted when a shard's WebSocket disconnects and will no longer reconnect." },
                { title: "shardError", value: ["shard.shardError", ["error", "Error"], ["id", "number"]], description: "Emitted whenever a shard's WebSocket encounters a connection error." },
                { title: "shardReady", value: ["shard.shardReady", ["id", "number"], ["unavailableGuilds", "Set<string>"]], description: "Emitted when a shard turns ready." },
                { title: "shardReconnecting", value: ["shard.shardReconnecting", ["id", "number"]], description: "Emitted when a shard is attempting to reconnect or re-identify." },
                { title: "shardResume", value: ["shard.shardResume", ["id", "number"], ["replayedEvents", "number"]], description: "Emitted when a shard resumes successfully." },
                { title: "stageInstanceCreate", value: ["stage.stageInstanceCreate", ["stageInstance", "import('discord.js').StageInstance"]], description: "Emitted whenever a stage instance is created." },
                { title: "stageInstanceDelete", value: ["stage.stageInstanceDelete", ["stageInstance", "import('discord.js').StageInstance"]], description: "Emitted whenever a stage instance is deleted." },
                { title: "stageInstanceUpdate", value: ["stage.stageInstanceUpdate", ["oldStageInstance", "import('discord.js').StageInstance"], ["newStageInstance", "import('discord.js').StageInstance"]], description: "Emitted whenever a stage instance gets updated - e.g. change in topic or privacy level." },
                { title: "stickerCreate", value: ["sticker.stickerCreate", ["stickerCreate", "import('discord.js').Sticker"]], description: "Emitted whenever a custom sticker is created in a guild." },
                { title: "stickerDelete", value: ["sticker.stickerDelete", ["stickerDelete", "import('discord.js').Sticker"]], description: "Emitted whenever a custom sticker is deleted in a guild." },
                { title: "stickerUpdate", value: ["sticker.stickerUpdate", ["oldSticker", "import('discord.js').Sticker"], ["newSticker", "import('discord.js').Sticker"]], description: "Emitted whenever a custom sticker is updated in a guild." },
                { title: "threadCreate", value: ["thread.threadCreate", ["thread", "import('discord.js').ThreadChannel"]], description: "Emitted whenever a thread is created or when the client user is added to a thread." },
                { title: "threadDelete", value: ["thread.threadDelete", ["thread", "import('discord.js').ThreadChannel"]], description: "Emitted whenever a thread is deleted." },
                { title: "threadListSync", value: ["thread.threadListSync", ["threads", "import('discord.js').Collection<string, import('discord.js').ThreadChannel>"]], description: "Emitted whenever the client user gains access to a text or news channel that contains threads." },
                { title: "threadMembersUpdate", value: ["thread.threadMembersUpdate", ["oldMembers", "import('discord.js').Collection<string, import('discord.js').ThreadMember>"], ["newMembers", "import('discord.js').Collection<string, import('discord.js').ThreadMember>"]], description: "Emitted whenever members are added or removed from a thread. Requires GUILD_MEMBERS privileged intent." },
                { title: "threadMemberUpdate", value: ["thread.threadMemberUpdate", ["oldMember", "import('discord.js').ThreadMember"], ["newMember", "import('discord.js').ThreadMember"]], description: "Emitted whenever the client user's thread member is updated." },
                { title: "threadUpdate", value: ["thread.threadUpdate", ["oldThread", "import('discord.js').ThreadChannel"], ["newThread", "import('discord.js').ThreadChannel"]], description: "Emitted whenever a thread is updated - e.g. name change, archive state change, locked state change." },
                { title: "typingStart", value: ["misc.typingStart", ["Typing", "import('discord.js').Typing"]], description: "Emitted whenever a user starts typing in a channel." },
                { title: "userUpdate", value: ["user.userUpdate", ["oldUser", "import('discord.js').User"], ["newUser", "import('discord.js').User"]], description: "Emitted whenever a user's details (e.g. username) are changed. Triggered by the Discord gateway events USER_UPDATE, GUILD_MEMBER_UPDATE and PRESENCE_UPDATE." },
                { title: "voiceStateUpdate", value: ["user.voiceStateUpdate", ["oldState", "import('discord.js').VoiceState"], ["newState", "import('discord.js').VoiceState"]], description: "Emitted whenever a member changes voice state - e.g. joins/leaves a channel, mutes/unmutes." },
                { title: "warn", value: ["dev.warn", ["info", "string"]], description: "Emitted for general warnings." },
                { title: "webhookUpdate", value: ["misc.webhookUpdate", ["channel", "import('discord.js').TextChannel"]], description: "Emitted whenever a guild text channel has its webhooks changed." }
            ];

            const choices = allEvents.filter(e => !existingEvents.includes(e.title));

            const { events } = await prompts([
                {
                    type: "autocompleteMultiselect",
                    name: "events",
                    message: "Which event(s) would you like to add?",
                    choices
                }
            ]);

            if (!events?.length) return;

            console.log("\u001b[33m> Generating event file(s)...\u001b[0m");
            for (const event of events) {
                const [ category, eventName ] = event[0].split(".");
                const categoryPath = path.join(eventFolder, category);

                if (!(await fs.pathExists(categoryPath))) await fs.mkdir(categoryPath);

                const eventPath = path.join(categoryPath, eventName + ".js");

                if (await fs.pathExists(eventPath)) {
                    console.log(`\u001b[33m> An event file at "src/events/${category}/${eventName}.js" already exists\u001b[0m`);
                    continue;
                }

                await fs.writeFile(eventPath, generateEventCode(event.slice(1)));
            }

            console.log("\u001b[32m> Successfully added the event(s)!\u001b[0m");
            return;
        }

        if (action === "types") {
            const schemas = await fs.readdir(path.join(dir, "src", "schemas"));
            const { schema } = await prompts([
                {
                    type: "select",
                    name: "schema",
                    choices: schemas.filter(f => f.endsWith('.js')).map(f => { return { title: f, value: f } }),
                    message: "Which schema would you like to generate the type for?"
                }
            ]);

            if (!schema) return;

            console.log("\u001b[33m> Fetching schema and generating type...\u001b[0m");
            const model = require(path.join(dir, "src", "schemas", schema));
            const types = getObjectTypes(model.schema.obj, 4);
            console.log("\u001b[32m> Fetched the schema and successfully generated the type!\u001b[0m");

            console.log("\u001b[33m> Adding .d.ts file...\u001b[0m");
            const file = path.join(dir, "src", "types", schema.replace('.js', '.d.ts'));
            await fs.remove(file);

            const name = cap(schema.replace('.js', ''));
            await fs.writeFile(file, `declare interface ${name} {\n${types}}\n\nexport { ${name} };\nexport default ${name};\n`);
            console.log("\u001b[32m> Added the .d.ts file!\u001b[0m");

            console.log("\u001b[34m> If this is a new schema, here is a copy-paste to add to your client in \"src/util/client.js\":\u001b[0m\n");
            console.log(`\u001b[32m/** @type {import('../../prefab/tmanager').Manager<${types.match(/_id: (\D*?);/)[1]}, import('../types/${name.toLowerCase()}').${name}>} */\u001b[0m`);
            console.log(`\u001b[34mthis\u001b[0m.${name.toLowerCase()} = \u001b[34mnew\u001b[0m \u001b[33mManager\u001b[0m(\u001b[34mthis\u001b[33m, require\u001b[0m(\u001b[31m'../schemas/${schema.replace('.js', '')}'\u001b[0m));`);
        }
    } catch (e) {
        console.log("\u001b[31m> Oops, something went wrong!\u001b[0m");
        console.log(e);
    }
})();

const isTemplate = async () => await fs.pathExists(path.join(dir, "config", "settings.json"));

/**
 * @param {Object.<*, *>} obj 
 * @param {number} [depth]
 * @param {boolean} [name]
 */
 function getObjectTypes (obj, depth = 0, name = true) {
    let type = "";

    if (typeof obj === "object") {
        for (const key of Object.keys(obj)) {
            type += `${" ".repeat(depth)}${name ? `${key}: ` : ""}`;
            type += getObjectType(obj[key], depth);
        }
    } else {
        type += getObjectType(obj, depth);
    }

    return type;
}

/**
 * @param {Object.<*, *>} obj 
 * @param {number} [depth] 
 */
function getObjectType (obj, depth = 0) {
    let type = "";

    if (typeof obj === "function") {
        type += `${obj.name.toLowerCase()};\n`;
    } else if (Array.isArray(obj)) {
        if (typeof obj[0] === "function") {
            type += `${obj[0].name.toLowerCase()}[];\n`;
        } else if (typeof obj[0] === "object") {
            type += `{\n${getObjectTypes(obj[0], depth + 4)}${" ".repeat(depth)}}[];\n`;
        }
    } else if (typeof obj === "object") {
        if (!Object.keys(obj).length) type += `any;\n`;
        else if (obj.type) type += `${getObjectTypes(obj.type, depth + 4)}`;
        else type += `{\n${getObjectTypes(obj, depth + 4)}${" ".repeat(depth)}};\n`;
    } else {
        throw new Error(`Your schema contains content that is not yet supported by this tool (only arrays, nested objects, StringConstructors, NumberConstructors and BooleanContructors are officially supported)!`);
    }

    return type;
}

/**
 * @param {string} string 
 */
function cap (string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

/**
 * @param {string} d 
 */
async function getEvents (d) {
    let events = [];

    const files = await fs.readdir(d);

    for(const file of files) {
        const stat = await fs.lstat(path.join(d, file));

        if(stat.isDirectory())
            events = events.concat(await getEvents(path.join(d, file)));
        else {
            if(file.endsWith(".js")) {
                events.push(file.substring(0, file.indexOf(".js")));
            }
        }
    }

    return events;
}

/**
 * @param {string[][]} types 
 */
function generateEventCode (types) {
    let code = "//@ts-check\n\n/**\n * @param {import('../../util/client')} client ";
    let params = "client";

    for (const type of types) {
        code += `\n * @param {${type[1]}} ${type[0]} `;
        params += `, ${type[0]}`;
    }

    code += `\n */\nmodule.exports = async (${params}) => {\n    // \n}\n`;

    return code;
}
