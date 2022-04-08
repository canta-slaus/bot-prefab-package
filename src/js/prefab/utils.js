//@ts-check

const { MessageEmbed, MessageActionRow, MessageButton } = require("discord.js");

const paginationComponents = [
    new MessageActionRow().addComponents([
        new MessageButton().setCustomId("ll").setStyle("SECONDARY").setEmoji("⏪"),
        new MessageButton().setCustomId("l").setStyle("SECONDARY").setEmoji("◀️"),
        new MessageButton().setCustomId("stop").setStyle("SECONDARY").setEmoji("⏸️"),
        new MessageButton().setCustomId("r").setStyle("SECONDARY").setEmoji("▶️"),
        new MessageButton().setCustomId("rr").setStyle("SECONDARY").setEmoji("⏩"),
    ]),
];
const consoleColors = {
    "SUCCESS": "\u001b[32m",
    "WARNING": "\u001b[33m",
    "ERROR": "\u001b[31m"
};

class PrefabUtils {
    /**
     * @param {import('../src/util/client')} client 
     */
    constructor (client) {
        this.client = client;
    }

    /**
     * Function to automatically send paginated embeds and switch between the pages by listening to the user reactions
     * @param {import('discord.js').CommandInteraction} interaction - Used to send the paginated message to the channel, get the user, etc.
     * @param {MessageEmbed[]} embeds - The array of embeds to switch between
     * @param {object} [options] - Optional parameters
     * @param {number} [options.time] - The max time for createReactionCollector after which all of the reactions disappear
     */
    async paginate (interaction, embeds, options = {}) {
        const msg = await this.fetchReply(interaction, { embeds: [embeds[0]], components: paginationComponents });

        let pageIndex = 0;
        const time = options?.time ?? 30000;

        while (true) {
            try {
                const collector = msg.createMessageComponentCollector({ componentType: "BUTTON", filter: (b) => b.user.id === interaction.user.id, idle: time });

                collector.on("collect", async (button) => {
                    if (button.customId === "rr") {
                        pageIndex = embeds.length - 1;
                    } else if (button.customId === "r") {
                        if (pageIndex < embeds.length - 1) pageIndex++;
                        else pageIndex = 0;
                    } else if (button.customId === "stop") {
                        await button.update({ components: [] });
                        collector.stop();
                    } else if (button.customId === "ll") {
                        pageIndex = 0;
                    } else if (button.customId === "l") {
                        if (pageIndex > 0) pageIndex--;
                        else pageIndex = embeds.length - 1;
                    }

                    await button.update({ embeds: [embeds[pageIndex]] });
                });
            } catch (e) {
                //
            }
        }
    }

    /**
     * Function to await a reply from a specific user.
     * @param {import('discord.js').TextChannel} channel - The channel to listen to messages for
     * @param {string} userId - The user id that should reply
     * @param {object} [options] - Optional parameters
     * @param {number} [options.time] - The max time for awaitMessages
     * @param {string[]} [options.words] - Optional accepted words (lowercase)
     * @param {RegExp} [options.regexp] - Optional RegExp to accept user input that matches the RegExp
     * @param {( message: import('discord.js').Message ) => boolean | Promise<boolean> } [options.filter]
     * @return {Promise<import('discord.js').Message>} Returns the `message` sent by the user if there was one
     * @example const reply = await client.utils.getReply(interaction.channel, interaction.user.id, { words: ['yes', 'y', 'n', 'no'] });
     */
    async getReply (channel, userId, options = {}) {
        const time = options.time ?? 30000;

        const msgs = await channel.awaitMessages({ filter: async (msg) => {
            return msg.author.id === userId
                   && (!options.words?.length || options.words.includes(msg.content.toLowerCase()))
                   && (!options?.regexp || options.regexp.test(msg.content))
                   && (!options?.filter || (await options.filter(msg)));
        }, max: 1, time });

        if (msgs.size > 0) return msgs.first();
        return;
    }

    /**
     * Return an random integer between `min` and `max` (both inclusive)
     * @param {number} min - The lower bound
     * @param {number} max - The upper bound
     * @return {number}
     * @example const rand = client.utils.randomRange(0, 10)
     */
    randomRange (min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    /**
     * Function to set a timeout
     * @param {number} ms - Time to wait in milliseconds
     * @return {promise}
     * @example await client.utils.delay(5000)
     */
    delay (ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Function to get all missing permissions of a GuildMember
     * @param {import('discord.js').GuildMember} member - The guild member whose missing permissions you want to get
     * @param {import('discord.js').PermissionString[]} perms - The permissions you want to check for
     * @return {string} Readable string containing all missing permissions
     */
    missingPermissions (member, perms){
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
    log (type, path, text) {
        console.log(`\u001b[36;1m<bot-prefab>\u001b[0m\u001b[34m [${path}]\u001b[0m - ${consoleColors[type]}${text}\u001b[0m`);
    }

    /**
     * Custom embed class
     * @param {object} data
     * @param {string} data.userID - The ID of the user you're constructing this embed for
     */
    async CustomEmbed ({ userID }) {
        const userInfo = await this.client.profileInfo.get(userID);

        const embed = new MessageEmbed()
            .setColor(this.client.colors[userInfo.prefab.embedColor]);

        return embed;
    }

    /**
     * @param {import('./command')} command - The command you want to get the cooldown for
     * @param {import('discord.js').CommandInteraction} interaction - The command interaction
     * @return {Promise<number>}
     */
    async getCooldown (command, interaction) {
        let cd = command.cooldown;

        if (interaction.guildId) {
            const guildInfo = await this.client.guildInfo.get(interaction.guildId);
            if (guildInfo.prefab.commandCooldowns && guildInfo.prefab.commandCooldowns[command.name]) {
                const roles = Object.keys(guildInfo.prefab.commandCooldowns[command.name]);
                const member = await interaction.guild.members.fetch(interaction.user.id);
                const highestRole = member.roles.cache.filter(role => roles.includes(role.id)).sort((a, b) =>  b.position - a.position).first();
                if (highestRole) cd = guildInfo.prefab.commandCooldowns[command.name][highestRole.id] / 1000;
            }
        }

        return cd;
    }

    /**
     * Takes human time input and outputs time in ms (eg: 5m30s -> 330000 | 3d5h2m -> 277320000).
     * @param {string} timeStr - Time input (eg: 1m20s, 1s, 3h20m).
     * @returns {number} - Returns the human time input converted to milliseconds.
     * @example let time = client.utils.timeToMs('10s') // 10000
     */
    timeToMs (timeStr) {
        let values = getUnitAndNumber(timeStr);
        if (!values) return undefined;

        let ms = 0;
        try {
            for (let i = 0; i < values.length; ++i) ms += getMs(values[i].numberPart, values[i].unit);
        } catch (e) {
            return undefined;
        };

        return ms;
    }

    /**
     * Takes ms time input and outputs time in human time (eg: 3780000 -> 1h3m | 1hr3mins | 1 hour 3 minutes).
     * @param {number} time - Time input as ms (eg: 3780000).
     * @param {object} [options] - Optional parameters.
     * @param {('long'|'medium'|'short')} [options.format] - Format to use (short -> 1m3s | medium -> 1min3secs | long -> 1minute3seconds).
     * @param {boolean} [options.spaces] - Whether to use spaces (true or false).
     * @param {number} [options.unitRounding] - Amount of numbers to output (eg: 1 = 3780000 -> 1h).
     * @param {string} [options.joinString] - Specified string to join each unit (eg: ' , ').
     * @returns {string} - Returns a beautified converted string from milliseconds.
     * @example let time = client.utils.timeToMs(3780000, { format: 'medium', spaces: true, options.spaces: 2, joinstring: ', ' }); // '1 hr, 3 mins'
     */
    msToTime (time, options = {}) {
        if (
            options.format === undefined ||
            (options.format !== 'short' && options.format !== 'medium' && options.format !== 'long')
        ) options.format = 'short';

        if (options.spaces === undefined) options.spaces = false;
        if (options.joinString === undefined) options.joinString = ' ';

        let timeStr = '';
        let nr = 0;

        for (let i = Object.keys(timeUnitValues).length; i >= 0; --i) {
            let key = Object.keys(timeUnitValues)[i];
            if (key === 'a') continue;

            let ctime = time / timeUnitValues[key];
            if (ctime >= 1) {
                if ((options.unitRounding ?? 100) < ++nr) break;

                ctime = Math.floor(ctime);
                timeStr += ctime;
                timeStr += options.spaces === true && options.format !== 'short' ? ' ' : '';
                timeStr += fullTimeUnitNames[key][options.format] + (ctime !== 1 && options.format !== 'short' ? 's' : '');
                    timeStr += options.spaces === true ? options.joinString : '';
                time -= ctime * timeUnitValues[key];
            };
        }

        while (timeStr.endsWith(options.joinString)) timeStr = timeStr.slice(0, -1 * options.joinString.length);

        if (timeStr === '') return undefined;
        else return timeStr;
    }

    /**
     * @param {import('discord.js').CommandInteraction|import('discord.js').MessageComponentInteraction} interaction 
     * @param {import('discord.js').InteractionReplyOptions} options 
     * @returns {Promise<import('discord.js').Message>}
     */
    async fetchReply(interaction, options) {
        options.fetchReply = true;
        const reply = await interaction.reply(options);
        //@ts-ignore
        return await interaction.channel.messages.fetch(reply.id);
    }

    /**
     * @param {import('discord.js').CommandInteraction|import('discord.js').MessageComponentInteraction} interaction 
     * @param {import('discord.js').InteractionReplyOptions} options 
     */
    async replyOrEdit(interaction, options) {
        if (interaction.replied) await interaction.editReply(options);
        else await interaction.reply(options);
    }

    /**
     * @param {import('discord.js').CommandInteraction} interaction 
     * @param {object} options 
     * @param {number} [options.time]
     * @param {number} [options.initialPage]
     * @param {number} [options.maxPages]
     * @param {number} [options.fastForward]
     * @param {( page: number ) => import('discord.js').MessageEmbed | Promise<import('discord.js').MessageEmbed>} options.pages
     */
     async pagination(interaction, options) {
        const time = options.time ?? 30000;
        const pages = options.pages;
        const maxPages = options.maxPages ?? null;
        const fastForward = options.fastForward ?? 1;

        let page = options.initialPage ?? 0;
        let embed = await pages(page);

        const reply = await interaction.reply({ fetchReply: true, embeds: [embed], components: paginationComponents });
        const msg = await interaction.channel.messages.fetch(reply.id);

        const collector = msg.createMessageComponentCollector({ componentType: "BUTTON", filter: (b) => b.user.id === interaction.user.id, idle: time });

        collector.on('collect', async (button) => {
            if (button.customId === "rr") {
                if (maxPages) page = maxPages - 1;
                else page += fastForward;
            } else if (button.customId === "r") {
                if (!maxPages || page < maxPages - 1) page++;
                else page = 0;
            } else if (button.customId === "stop") {
                await button.update({ components: [] });
                collector.stop();
            } else if (button.customId === "ll") {
                page = 0;
            } else if (button.customId === "l") {
                if (page > 0) page--;
                else if (maxPages) page = maxPages - 1;
            }

            embed = await pages(page);
            await button.update({ embeds: [embed] });
        });
    }
}

module.exports = PrefabUtils;

const timeUnits = {
    ms: ['ms', 'millisecond(s)'],
    s: ['sec(s)', 'second(s)'],
    min: ['minute(s)', 'm', 'min(s)'],
    h: ['hr(s)', 'hour(s)'],
    d: ['day(s)'],
    w: ['wk(s)', 'week(s)'],
    mth: ['mth(s)', 'month(s)'],
    y: ['year(s)'],
    a: ['julianyear(s)'],
    dec: ['decade(s)'],
    cen: ['cent(s)', 'century', 'centuries']
}

const timeUnitValues = {
    ms: 1,
    s: 1000,
    min: 1000 * 60,
    h: 1000 * 60 * 60,
    d: 1000 * 60 * 60 * 24,
    w: 1000 * 60 * 60 * 24 * 7,
    mth: 1000 * 60 * 60 * 24 * 30,
    y: 1000 * 60 * 60 * 24 * 365,
    a: 1000 * 60 * 60 * 24 * 365.25,
    dec: 1000 * 60 * 60 * 24 * 365 * 10,
    cen: 1000 * 60 * 60 * 24 * 365 * 100
}

const fullTimeUnitNames = {
    ms: { short: 'ms', medium: 'msec', long: 'millisecond' },
    s: { short: 's', medium: 'sec', long: 'second' },
    min: { short: 'm', medium: 'min', long: 'minute' },
    h: { short: 'h', medium: 'hr', long: 'hour' },
    d: { short: 'd', medium: 'day', long: 'day' },
    w: { short: 'wk', medium: 'wk', long: 'week' },
    mth: { short: 'mth', medium: 'mo', long: 'month' },
    y: { short: 'y', medium: 'yr', long: 'year' },
    dec: { short: 'dec', medium: 'dec', long: 'decade' },
    cen: { short: 'cen', medium: 'cent', long: 'century' },
}

/**
 * Function to return the string(s) and numbers (n) of a string formatted as: 'nnssnnssnnss'.
 * /[0-9.,:]/g = regex for getting all the chars in a string which are equal to 0-9.,:
 * /[^0-9.,:]/g = regex for getting all the chars in a string which are not equal to 0-9.,:
 * @param {string} timeString
 */
function getUnitAndNumber (timeString) {
    timeString = timeString.toLowerCase().replace(/ /g, '');

    let unit = timeString.replace(/[0-9.,:]/g, ' ');
    let numberPart = timeString
        .replace(/[^0-9.,:]/g, ' ')
        .replace(',', '.');

    let units = unit.split(' ').filter((str) => str !== '');
    let numberParts = numberPart
        .split(' ')
        .filter((str) => str !== '');

    units = getExactUnits(units);

    if (
        unit === '' ||
        unit === undefined ||
        numberPart === '' ||
        numberPart === undefined ||
        units === undefined ||
        units.length === 0 ||
        numberParts.length === 0 ||
        units.length !== numberParts.length
    ) return undefined;

    let ans = [];
    for (let i = 0; i < units.length; ++i)
        ans.push({
            numberPart: numberParts[i],
            unit: units[i],
        });
    return ans;
}

/**
 * @param {string[]} thisUnits
 */
function getExactUnits (thisUnits) {
    let exactUnits = [];

    for (let newUnit of thisUnits) {
        if (timeUnits[newUnit] !== undefined) {
            exactUnits.push(newUnit);
            continue;
        } else {
            for (let timeUnit in timeUnits) {
                for (let timeUnitAllias of timeUnits[timeUnit]) {
                    if (timeUnitAllias.replace('(s)', '') === newUnit
                     || timeUnitAllias.replace('(s)', 's') === newUnit) {
                        exactUnits.push(timeUnit);
                        continue;
                    }
                }
            }
        }
    }

    if (exactUnits.length !== thisUnits.length) return undefined;

    return exactUnits;
}

/**
 * Checking for special case scenario.
 * @param {string} number
 * @param {string} unit
 */
function getMs (number, unit) {
    if (number.includes(':')) {
        switch (unit) {
            case 'min':
                return (
                    Number(number.split(':')[0]) * timeUnitValues['min'] +
                    Number(number.split(':')[1]) * timeUnitValues['s']
                );
            case 'h':
                return (
                    Number(number.split(':')[0]) * timeUnitValues['h'] +
                    Number(number.split(':')[1]) * timeUnitValues['min']
                );
            default:
                throw new Error('Used \':\' with a unit which doesn\'t support it');
        }
    }

    return Number(number) * timeUnitValues[unit];
}
