//@ts-check

const { MessageEmbed } = require("discord.js");
const embedColors = require('../config/colors.json');
const reactions = ['⏪', '◀️', '⏸️', '▶️', '⏩', '🔢'];
const consoleColors = {
    "SUCCESS": "\u001b[32m",
    "WARNING": "\u001b[33m",
    "ERROR": "\u001b[31m"
};

/**
 * @param {object} p
 * @param {import('discord.js').MessageReaction} p.reaction 
 * @param {import('discord.js').Message} p.pageMsg 
 * @param {import('discord.js').ReactionCollector} p.collector 
 * @param {number} p.pageIndex
 * @param {import('discord.js').MessageEmbed[]} p.embeds
 */
 async function handleReaction ({ reaction, pageMsg, collector, pageIndex, embeds }) {
    try {
        collector.resetTimer();
        if (reaction.emoji.name === '⏩') {
            if (pageIndex === embeds.length - 1) return embeds.length - 1;
            pageIndex = embeds.length - 1;
            await pageMsg.edit({ embeds: [embeds[pageIndex]] });
        } else if (reaction.emoji.name === '▶️') {
            if (pageIndex < embeds.length - 1) {
                pageIndex++;
                await pageMsg.edit({ embeds: [embeds[pageIndex]] });
            } else {
                if (pageIndex === 0) return 0;
                pageIndex = 0;
                await pageMsg.edit({ embeds: [embeds[pageIndex]] });
            }
        } else if (reaction.emoji.name === '🗑') {
            await pageMsg.delete();
        } else if (reaction.emoji.name === '⏪') {
            if (pageIndex === 0) return 0;
            pageIndex = 0;
            await pageMsg.edit({ embeds: [embeds[pageIndex]] });
        } else if (reaction.emoji.name === '◀️') {
            if (pageIndex > 0) {
                pageIndex--;
                await pageMsg.edit({ embeds: [embeds[pageIndex]] });
            } else {
                if (pageIndex === embeds.length - 1) return embeds.length - 1;
                pageIndex = embeds.length - 1;
                await pageMsg.edit({ embeds: [embeds[pageIndex]] });
            }
        }
        return pageIndex;
    } catch (e) {
        //
    }
}

class PrefabUtils {
    /**
     * @param {import('../src/util/client')} client 
     */
    constructor (client) {
        this.client = client;
    }

    /**
     * Function to automatically send paginated embeds and switch between the pages by listening to the user reactions
     * @param {import('discord.js').Message} message - Used to send the paginated message to the channel, get the user, etc.
     * @param {MessageEmbed[]} embeds - The array of embeds to switch between
     * @param {object} [options] - Optional parameters
     * @param {number} [options.time] - The max time for createReactionCollector after which all of the reactions disappear
     * @example Examples can be seen in `src/utils/utils.md`
     */
    async paginate(message, embeds, options) {
        try {
            const pageMsg = await message.channel.send({ embeds: [embeds[0]] });

            for (const emote of reactions) {
                await pageMsg.react(emote);
                await this.delay(750);
            }

            let pageIndex = 0;
            let time = 30000;

            if (options) {
                if (options.time) time = options.time;
            };

            const collector = pageMsg.createReactionCollector({ filter: (reaction, user) => reactions.includes(reaction.emoji.name) && user.id === message.author.id, time });
            collector.on('collect', async (reaction, user) => {
                try {
                    pageIndex = await handleReaction({ reaction: reaction, collector: collector, embeds: embeds, pageMsg: pageMsg, pageIndex: pageIndex });
                } catch (e) {
                    //
                }
            });

            collector.on('remove', async (reaction, user) => {
                try {
                    pageIndex = await handleReaction({ reaction: reaction, collector: collector, embeds: embeds, pageMsg: pageMsg, pageIndex: pageIndex });
                } catch (e) {
                    //
                }
            });

            collector.on('end', async () => {
                try {
                    await pageMsg.reactions.removeAll();
                } catch (e) {
                    //
                }
            });
        } catch (e) {
            //
        }
    }

    /**
     * Function to await a reply from a specific user.
     * @param {import('discord.js').Message} message - The message to listen to
     * @param {object} [options] - Optional parameters
     * @param {number} [options.time] - The max time for awaitMessages 
     * @param {import('discord.js').User} [options.user] - The user to listen to messages to
     * @param {string[]} [options.words] - Optional accepted words, will aceept any word if not provided
     * @param {RegExp} [options.regexp] - Optional RegExp to accept user input that matches the RegExp
     * @return {Promise<import('discord.js').Message>} Returns the `message` sent by the user if there was one, returns `false` otherwise.
     * @example const reply = await getReply(message, { time: 10000, words: ['yes', 'y', 'n', 'no'] })
     */
    async getReply(message, options) {
        let time = 30000;
        let user = message.author;
        let words = [];

        if (options) {
            if (options.time) time = options.time;
            if (options.user) user = options.user;
            if (options.words) words = options.words;
        }

        const filter = msg => {
            return msg.author.id === user.id
                   && (words.length === 0 || words.includes(msg.content.toLowerCase()))
                   && (!options || !options.regexp || options.regexp.test(msg.content))
        }

        const msgs = await message.channel.awaitMessages({ filter, max: 1, time });

        if (msgs.size > 0) return msgs.first();
        return;
    }

    /**
     * Return an random integer between `min` and `max` (both inclusive)
     * @param {number} min - The lower bound
     * @param {number} max - The upper bound
     * @return {number}
     * @example const rand = randomRange(0, 10)
     */
    randomRange(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    /**
     * Function to set a timeout
     * @param {number} ms - Time to wait in milliseconds
     * @return {promise}
     * @example await delay(5000)
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Function to convert milliseconds into readable time
     * @param {number} ms - The time in 
     * @return {string} Readable time as a string
     */
    msToTime(ms) {
        let time = "";

        let n = 0;
        if (ms >= 31536000000) {
            n = Math.floor(ms / 31536000000);
            time = `${n}y `;
            ms -= n * 31536000000;
        }

        if (ms >= 2592000000) {
            n = Math.floor(ms / 2592000000);
            time += `${n}mo `;
            ms -= n * 2592000000;
        }

        if (ms >= 604800000) {
            n = Math.floor(ms / 604800000);
            time += `${n}w `;
            ms -= n * 604800000;
        }

        if (ms >= 86400000) {
            n = Math.floor(ms / 86400000);
            time += `${n}d `;
            ms -= n * 86400000;
        }

        if (ms >= 3600000) {
            n = Math.floor(ms / 3600000);
            time += `${n}h `;
            ms -= n * 3600000;
        }

        if (ms >= 60000) {
            n = Math.floor(ms / 60000);
            time += `${n}m `;
            ms -= n * 60000;
        }

        n = Math.ceil(ms / 1000);
        time += n === 0 ? '' : `${n}s`;

        return time.trimEnd();
    }

    /**
     * Function to get all missing permissions of a GuildMember
     * @param {import('discord.js').GuildMember} member - The guild member whose missing permissions you want to get
     * @param {import('discord.js').PermissionString[]} perms - The permissions you want to check for
     * @return {string} Readable string containing all missing permissions
     */
    missingPermissions(member, perms){
        const missingPerms = member.permissions.missing(perms)
            .map(str=> `\`${str.replace(/_/g, ' ').toLowerCase().replace(/\b(\w)/g, char => char.toUpperCase())}\``);
    
        return missingPerms.length > 1 ?
            `${missingPerms.slice(0, -1).join(", ")} and ${missingPerms.slice(-1)[0]}` :
            missingPerms[0];
    }

    /**
     * Function to shorten down console logs
     * @param {('SUCCESS'|'WARNING'|'ERROR')} type - The type of log (SUCCESS, WARNING, ERROR)
     * @param {string} path - The path where the console log is coming from
     * @param {string} text - The message to be displayed
     */
    log(type, path, text) {
        console.log(`\u001b[36;1m<bot-prefab>\u001b[0m\u001b[34m [${path}]\u001b[0m - ${consoleColors[type]}${text}\u001b[0m`);
    }

    /**
     * Custom embed class
     * @param {object} data
     * @param {string} data.userID - The ID of the user you're constructing this embed for
     */
    async CustomEmbed({ userID }) {
        const userInfo = await this.client.profileInfo.get(userID);
    
        const embed = new MessageEmbed()
            .setColor(embedColors[userInfo.prefab.embedColor]);
    
        return embed;
    }

    /**
     * @param {import('./slashCommand')|import('./command')} command - The command you want to set a cooldown for
     * @param {import('discord.js').Message|import('discord.js').CommandInteraction} message - The guild ID the command is executed in
     * @return {Promise<number>}
     */
    async getCooldown (command, message) {
        const guildInfo = await this.client.guildInfo.get(message.guild.id);
        let cd = command.cooldown;
        if (guildInfo.prefab.commandCooldowns && guildInfo.prefab.commandCooldowns[command.name]) {
            let roles = Object.keys(guildInfo.prefab.commandCooldowns[command.name]);
            //@ts-ignore
            let highestRole = message.member.roles.cache.filter(role => roles.includes(role.id)).sort((a, b) =>  b.position - a.position).first();
            if (highestRole) cd = guildInfo.prefab.commandCooldowns[command.name][highestRole.id] / 1000;
        }

        return cd;
    }
}

module.exports = PrefabUtils;
