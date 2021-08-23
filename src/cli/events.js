//@ts-check

const prompts = require('prompts');
const fs = require('fs-extra');
const path = require('path');
const dir = process.cwd();

const { isTemplate, getSettings, log } = require('./utils');

module.exports = async () => {
    if (!(await isTemplate())) return log("ERROR", "This doesn't seem to be a project made using this package!");

    const settings = await getSettings();

    const eventFolder = path.join(dir, "src", "events");
    const existingEvents = await getEvents(eventFolder, settings.language);
    const allEvents = [
        { title: "applicationCommandCreate", value: ["application.applicationCommandCreate", ["command", "import('discord.js').ApplicationCommand"]], description: "Emitted when a guild application command is created." },
        { title: "applicationCommandDelete", value: ["application.applicationCommandDelete", ["command", "import('discord.js').ApplicationCommand"]], description: "Emitted when a guild application command is deleted." },
        { title: "applicationCommandUpdate", value: ["application.applicationCommandUpdate", ["oldCommand", "import('discord.js').ApplicationCommand"], ["newCommand", "import('discord.js').ApplicationCommand"]], description: "Emitted when a guild application command is updated." },
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
        { title: "guildCreate", value: ["guild.guildCreate", ["guild", "import('discord.js').Guild"]], description: "Emitted whenever the client joins a guild." },
        { title: "guildDelete", value: ["guild.guildDelete", ["guild", "import('discord.js').Guild"]], description: "Emitted whenever a guild kicks the client or the guild is deleted/left." },
        { title: "guildIntegrationsUpdate", value: ["guild.guildIntegrationsUpdate", ["guild", "import('discord.js').Guild"]], description: "Emitted whenever a guild integration is updated" },
        { title: "guildMemberAdd", value: ["guild.guildMemberAdd", ["member", "import('discord.js').GuildMember"]], description: "Emitted whenever a user joins a guild." },
        { title: "guildMemberAvailable", value: ["guild.guildMemberAvailable", ["member", "import('discord.js').GuildMember"]], description: "Emitted whenever a member becomes available in a large guild." },
        { title: "guildMemberRemove", value: ["guild.guildMemberRemove", ["member", "import('discord.js').GuildMember"]], description: "Emitted whenever a member leaves a guild, or is kicked." },
        { title: "guildMembersChunk", value: ["guild.guildMembersChunk", ["members", "import('discord.js').Collection<string, import('discord.js').GuildMember>"], ["guild", "import('discord.js').GuildMember"], ["chunk", "{ count: number; index: number; nonce: string | undefined }"]], description: "Emitted whenever a chunk of guild members is received (all members come from the same guild)." },
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
        { title: "stickerCreate", value: ["sticker.stickerCreate", ["sticker", "import('discord.js').Sticker"]], description: "Emitted whenever a custom sticker is created in a guild." },
        { title: "stickerDelete", value: ["sticker.stickerDelete", ["sticker", "import('discord.js').Sticker"]], description: "Emitted whenever a custom sticker is deleted in a guild." },
        { title: "stickerUpdate", value: ["sticker.stickerUpdate", ["oldSticker", "import('discord.js').Sticker"], ["newSticker", "import('discord.js').Sticker"]], description: "Emitted whenever a custom sticker is updated in a guild." },
        { title: "threadCreate", value: ["thread.threadCreate", ["thread", "import('discord.js').ThreadChannel"]], description: "Emitted whenever a thread is created or when the client user is added to a thread." },
        { title: "threadDelete", value: ["thread.threadDelete", ["thread", "import('discord.js').ThreadChannel"]], description: "Emitted whenever a thread is deleted." },
        { title: "threadListSync", value: ["thread.threadListSync", ["threads", "import('discord.js').Collection<string, import('discord.js').ThreadChannel>"]], description: "Emitted whenever the client user gains access to a text or news channel that contains threads." },
        { title: "threadMembersUpdate", value: ["thread.threadMembersUpdate", ["oldMembers", "import('discord.js').Collection<string, import('discord.js').ThreadMember>"], ["newMembers", "import('discord.js').Collection<string, import('discord.js').ThreadMember>"]], description: "Emitted whenever members are added or removed from a thread. Requires GUILD_MEMBERS privileged intent." },
        { title: "threadMemberUpdate", value: ["thread.threadMemberUpdate", ["oldMember", "import('discord.js').ThreadMember"], ["newMember", "import('discord.js').ThreadMember"]], description: "Emitted whenever the client user's thread member is updated." },
        { title: "threadUpdate", value: ["thread.threadUpdate", ["oldThread", "import('discord.js').ThreadChannel"], ["newThread", "import('discord.js').ThreadChannel"]], description: "Emitted whenever a thread is updated - e.g. name change, archive state change, locked state change." },
        { title: "typingStart", value: ["misc.typingStart", ["typing", "import('discord.js').Typing"]], description: "Emitted whenever a user starts typing in a channel." },
        { title: "userUpdate", value: ["user.userUpdate", ["oldUser", "import('discord.js').User"], ["newUser", "import('discord.js').User"]], description: "Emitted whenever a user's details (e.g. username) are changed. Triggered by the Discord gateway events USER_UPDATE, GUILD_MEMBER_UPDATE and PRESENCE_UPDATE." },
        { title: "voiceStateUpdate", value: ["user.voiceStateUpdate", ["oldState", "import('discord.js').VoiceState"], ["newState", "import('discord.js').VoiceState"]], description: "Emitted whenever a member changes voice state - e.g. joins/leaves a channel, mutes/unmutes." },
        { title: "warn", value: ["dev.warn", ["info", "string"]], description: "Emitted for general warnings." },
        { title: "webhookUpdate", value: ["misc.webhookUpdate", ["channel", "import('discord.js').TextChannel"]], description: "Emitted whenever a guild text channel has its webhooks changed." }
    ];

    const choices = allEvents.filter(e => !existingEvents.includes(e.title));

    if (!choices.length) return log("SUCCESS", "You have added every event already!");

    const { events } = await prompts([
        {
            type: "autocompleteMultiselect",
            name: "events",
            message: "Which event(s) would you like to add?",
            choices
        }
    ]);

    if (!events?.length) return;

    log("WARNING", "Generating event file(s)...");

    for (const event of events) {
        const [ category, eventName ] = event[0].split(".");
        const categoryPath = path.join(eventFolder, category);

        if (!(await fs.pathExists(categoryPath))) await fs.mkdir(categoryPath);

        const eventPath = path.join(categoryPath, eventName + `.${settings.language}`);

        if (await fs.pathExists(eventPath)) {
            log("ERROR", `An event file at "src/events/${category}/${eventName}.${settings.language}" already exists`)
            continue;
        }

        const code = settings.language === "js" ? generateJSEventCode(event.slice(1)) : generateTSEventCode(event.slice(1));
        await fs.writeFile(eventPath, code);
    }

    log("SUCCESS", "Successfully added the event(s)!");
}

/**
 * @param {string} d 
 * @param {string} type
 */
async function getEvents (d, type) {
    let events = [];

    const files = await fs.readdir(d);

    for(const file of files) {
        const stat = await fs.lstat(path.join(d, file));

        if(stat.isDirectory())
            events = events.concat(await getEvents(path.join(d, file), type));
        else {
            if(file.endsWith(`.${type}`)) {
                events.push(file.substring(0, file.indexOf(`.${type}`)));
            }
        }
    }

    return events;
}

/**
 * @param {string[][]} types 
 */
function generateJSEventCode (types) {
    let code = "//@ts-check\n\n/**\n * @param {import('../../util/client')} client ";
    let params = "client";

    for (const type of types) {
        code += `\n * @param {${type[1]}} ${type[0]} `;
        params += `, ${type[0]}`;
    }

    code += `\n */\nmodule.exports = async (${params}) => {\n    // \n}\n`;

    return code;
}

/**
 * @param {string[][]} types 
 */
function generateTSEventCode (types) {
    let code = "";
    let params = "client: Client";
    const djs = [];

    for (const type of types) {
        if (type[1].includes("import('discord.js').")) {
            const match = type[1].match(/import\('discord.js'\)\.(\w+)/g);
            type[1] = type[1].replace(/import\('discord.js'\)\./g, "");
            for (let t of match) {
                t = t.replace("import('discord.js').", "");
                if (!djs.includes(t)) djs.push(t);
            }
            params += `, ${type[0]}: ${type[1]}`;
        } else {
            params += `, ${type[0]}: ${type[1]}`
        }
    }

    if (djs.length) code += `import { ${djs.join(", ")} } from "discord.js";\n`;

    code += `import { Client } from "../../util/client";\n\nexport default async (${params}) => {\n    // \n}\n`

    return code;
}
