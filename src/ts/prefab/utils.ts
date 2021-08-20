import { CommandInteraction, GuildMember, Message, MessageEmbed, MessageReaction, PermissionString, ReactionCollector, User } from 'discord.js';
import { Client } from '../src/util/client';
import { Command } from '../src/util/command';

const reactions = ['⏪', '◀️', '⏸️', '▶️', '⏩', '🔢'];
const consoleColors = {
    "SUCCESS": "\u001b[32m",
    "WARNING": "\u001b[33m",
    "ERROR": "\u001b[31m"
};

async function handleReaction ({ reaction, pageMsg, collector, pageIndex, embeds }: { reaction: MessageReaction, pageMsg: Message; collector: ReactionCollector; pageIndex: number; embeds: MessageEmbed[] }) {
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
    } catch (e) {
        //
    }

    return pageIndex;
}

class PrefabUtils {
    client: Client;

    constructor (client: Client) {
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
    async paginate(message: Message, embeds: MessageEmbed[], options?: { time?: number }) {
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

            const collector = pageMsg.createReactionCollector({ filter: (reaction, user) => reactions.includes(reaction.emoji.name!) && user.id === message.author.id, time });
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

    async getReply(message: Message, options?: { time?: number, user?: User, words?: string[], regexp?: RegExp }) {
        let time = 30000;
        let user = message.author;
        let words: string[] = [];

        if (options) {
            if (options.time) time = options.time;
            if (options.user) user = options.user;
            if (options.words) words = options.words;
        }

        const filter = (msg: Message): boolean => {
            return msg.author.id === user.id
                   && (words.length === 0 || words.includes(msg.content.toLowerCase()))
                   && (!options || !options.regexp || options.regexp.test(msg.content))
        }

        const msgs = await message.channel.awaitMessages({ filter, max: 1, time });

        if (msgs.size > 0) return msgs.first();
        return;
    }

    randomRange(min: number, max: number) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    delay(ms: number) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    missingPermissions(member: GuildMember, perms: PermissionString[]){
        const missingPerms = member.permissions.missing(perms)
            .map(str=> `\`${str.replace(/_/g, ' ').toLowerCase().replace(/\b(\w)/g, char => char.toUpperCase())}\``);
    
        return missingPerms.length > 1 ?
            `${missingPerms.slice(0, -1).join(", ")} and ${missingPerms.slice(-1)[0]}` :
            missingPerms[0];
    }

    log(type: 'SUCCESS'|'WARNING'|'ERROR', path: string, text: string) {
        console.log(`\u001b[36;1m<bot-prefab>\u001b[0m\u001b[34m [${path}]\u001b[0m - ${consoleColors[type]}${text}\u001b[0m`);
    }

    async CustomEmbed({ userID }: { userID: string }) {
        const userInfo = await this.client.profileInfo.get(userID);

        const embed = new MessageEmbed()
            .setColor(this.client.colors[userInfo.prefab.embedColor]);

        return embed;
    }

    async getCooldown (command: Command, message: Message|CommandInteraction) {
        let cd = command.cooldown;

        if (message.guildId) {
            const guildInfo = await this.client.guildInfo.get(message.guildId);
            if (guildInfo.prefab.commandCooldowns && guildInfo.prefab.commandCooldowns[command.name]) {
                let roles = Object.keys(guildInfo.prefab.commandCooldowns[command.name]);
                //@ts-ignore
                let highestRole = message.member.roles.cache.filter(role => roles.includes(role.id)).sort((a, b) =>  b.position - a.position).first();
                if (highestRole) cd = guildInfo.prefab.commandCooldowns[command.name][highestRole.id] / 1000;
            }
        }

        return cd;
    }

    timeToMs(timeStr: string) {
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

    msToTime(time: number, options: { format?: 'long'|'medium'|'short', spaces?: boolean, unitRounding?: number, joinString?: string } = {}) {
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

        if (timeStr === '') return;
        else return timeStr;
    }
}

export { PrefabUtils };

const timeUnits: { [x: string]: string[] } = {
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

const timeUnitValues: { [x: string]: number } = {
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

const fullTimeUnitNames: { [x: string]: { [y: string]: string } } = {
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

function getUnitAndNumber(timeString: string) {
    timeString = timeString.toLowerCase().replace(/ /g, '');

    let unit = timeString.replace(/[0-9.,:]/g, ' ');
    let numberPart = timeString
        .replace(/[^0-9.,:]/g, ' ')
        .replace(',', '.');

    let units = unit.split(' ').filter((str) => str !== '');
    let numberParts = numberPart
        .split(' ')
        .filter((str) => str !== '');

    units = getExactUnits(units)!;

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

function getExactUnits(thisUnits: string[]) {
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

    if (exactUnits.length !== thisUnits.length) return;

    return exactUnits;
}

function getMs(number: string, unit: string) {
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
