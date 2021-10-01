// @ts-check
const { MessageEmbed } = require("discord.js");

const reactions = ["⏪", "◀️", "⏸️", "▶️", "⏩", "🔢"];
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

		if (reaction.emoji.name === "⏩") {
			if (pageIndex === embeds.length - 1) return embeds.length - 1;
			pageIndex = embeds.length - 1;
			await pageMsg.edit({ embeds: [embeds[pageIndex]] });
		} else if (reaction.emoji.name === "▶️") {
			if (pageIndex < embeds.length - 1) {
				pageIndex++;
				await pageMsg.edit({ embeds: [embeds[pageIndex]] });
			} else {
				if (pageIndex === 0) return 0;
				pageIndex = 0;
				await pageMsg.edit({ embeds: [embeds[pageIndex]] });
			}
		} else if (reaction.emoji.name === "🗑") {
			await pageMsg.delete();
		} else if (reaction.emoji.name === "⏪") {
			if (pageIndex === 0) return 0;
			pageIndex = 0;
			await pageMsg.edit({ embeds: [embeds[pageIndex]] });
		} else if (reaction.emoji.name === "◀️") {
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
	async paginate (message, embeds, options) {
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
			}

			const collector = pageMsg.createReactionCollector({ filter: (reaction, user) => reactions.includes(reaction.emoji.name) && user.id === message.author.id, time });
			collector.on("collect", async (reaction, user) => {
				try {
					pageIndex = await handleReaction({ reaction: reaction, collector: collector, embeds: embeds, pageMsg: pageMsg, pageIndex: pageIndex });
				} catch (e) {
					//
				}
			});

			collector.on("remove", async (reaction, user) => {
				try {
					pageIndex = await handleReaction({ reaction: reaction, collector: collector, embeds: embeds, pageMsg: pageMsg, pageIndex: pageIndex });
				} catch (e) {
					//
				}
			});

			collector.on("end", async () => {
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
	async getReply (message, options) {
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
                   && (!options || !options.regexp || options.regexp.test(msg.content));
		};

		const msgs = await message.channel.awaitMessages({ filter, max: 1, time });

		if (msgs.size > 0) return msgs.first();

	}

	/**
     * Return an random integer between `min` and `max` (both inclusive)
     * @param {number} min - The lower bound
     * @param {number} max - The upper bound
     * @return {number}
     * @example const rand = randomRange(0, 10)
     */
	randomRange (min, max) {
		return Math.floor(Math.random() * (max - min + 1)) + min;
	}

	/**
     * Function to set a timeout
     * @param {number} ms - Time to wait in milliseconds
     * @return {promise}
     * @example await delay(5000)
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
	missingPermissions (member, perms) {
		const missingPerms = member.permissions.missing(perms)
			.map(str => `\`${str.replace(/_/g, " ").toLowerCase().replace(/\b(\w)/g, char => char.toUpperCase())}\``);

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
     * @param {import('../src/util/command')} command - The command you want to set a cooldown for
     * @param {import('discord.js').CommandInteraction} interaction - The guild ID the command is executed in
     * @return {Promise<number>}
     */
	async getCooldown (command, interaction) {
		let cd = command.cooldown;

		if (interaction.guildId) {
			const guildInfo = await this.client.guildInfo.get(interaction.guildId);
			if (guildInfo.prefab.commandCooldowns && guildInfo.prefab.commandCooldowns[command.name]) {
				const roles = Object.keys(guildInfo.prefab.commandCooldowns[command.name]);
				// @ts-ignore
				const highestRole = interaction.member.roles.cache.filter(role => roles.includes(role.id)).sort((a, b) => b.position - a.position).first();
				if (highestRole) cd = guildInfo.prefab.commandCooldowns[command.name][highestRole.id] / 1000;
			}
		}

		return cd;
	}

	/**
     * Takes human time input and outputs time in ms (eg: 5m30s -> 330000 | 3d5h2m -> 277320000).
     * @param {string} timeStr - Time input (eg: 1m20s, 1s, 3h20m).
     * @returns {number} - Returns the human time input converted to milliseconds.
     * @example let time = timeToMs('10s') -> 10000
     */
	timeToMs (timeStr) {
		const values = getUnitAndNumber(timeStr);
		if (!values) return;

		let ms = 0;
		try {
			for (let i = 0; i < values.length; ++i) ms += getMs(values[i].numberPart, values[i].unit);
		} catch (e) {
			return;
		}

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
     * @example let time = timeToMs(3780000, { format: 'medium', spaces: true, options.spaces: 2, joinstring: ', ' }); -> '1 hr, 3 mins'
     */
	msToTime (time, options = {}) {
		if (
			!options.format ||
            options.format !== "short" && options.format !== "medium" && options.format !== "long"
		) options.format = "short";

		if (!options.spaces) options.spaces = false;
		if (!options.joinString) options.joinString = " ";

		let timeStr = "";
		let nr = 0;

		for (let i = Object.keys(timeUnitValues).length; i >= 0; --i) {
			const key = Object.keys(timeUnitValues)[i];
			if (key === "a") continue;

			let ctime = time / timeUnitValues[key];
			if (ctime >= 1) {
				if ((options.unitRounding ?? 100) < ++nr) break;

				ctime = Math.floor(ctime);
				timeStr += ctime;
				timeStr += options.spaces === true && options.format !== "short" ? " " : "";
				timeStr += fullTimeUnitNames[key][options.format] + (ctime !== 1 && options.format !== "short" ? "s" : "");
				timeStr += options.spaces === true ? options.joinString : "";
				time -= ctime * timeUnitValues[key];
			}
		}

		while (timeStr.endsWith(options.joinString)) timeStr = timeStr.slice(0, -1 * options.joinString.length);

		if (timeStr === "") return;
		return timeStr;
	}
}

module.exports = PrefabUtils;

const timeUnits = {
	ms: ["ms", "millisecond(s)"],
	s: ["sec(s)", "second(s)"],
	min: ["minute(s)", "m", "min(s)"],
	h: ["hr(s)", "hour(s)"],
	d: ["day(s)"],
	w: ["wk(s)", "week(s)"],
	mth: ["mth(s)", "month(s)"],
	y: ["year(s)"],
	a: ["julianyear(s)"],
	dec: ["decade(s)"],
	cen: ["cent(s)", "century", "centuries"]
};

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
};

const fullTimeUnitNames = {
	ms: { short: "ms", medium: "msec", long: "millisecond" },
	s: { short: "s", medium: "sec", long: "second" },
	min: { short: "m", medium: "min", long: "minute" },
	h: { short: "h", medium: "hr", long: "hour" },
	d: { short: "d", medium: "day", long: "day" },
	w: { short: "wk", medium: "wk", long: "week" },
	mth: { short: "mth", medium: "mo", long: "month" },
	y: { short: "y", medium: "yr", long: "year" },
	dec: { short: "dec", medium: "dec", long: "decade" },
	cen: { short: "cen", medium: "cent", long: "century" }
};

/**
 * Function to return the string(s) and numbers (n) of a string formatted as: 'nnssnnssnnss'.
 * /[0-9.,:]/g = regex for getting all the chars in a string which are equal to 0-9.,:
 * /[^0-9.,:]/g = regex for getting all the chars in a string which are not equal to 0-9.,:
 * @param {string} timeString
 */
function getUnitAndNumber (timeString) {
	timeString = timeString.toLowerCase().replace(/ /g, "");

	const unit = timeString.replace(/[0-9.,:]/g, " ");
	const numberPart = timeString
		.replace(/[^0-9.,:]/g, " ")
		.replace(",", ".");

	let units = unit.split(" ").filter((str) => str !== "");
	const numberParts = numberPart
		.split(" ")
		.filter((str) => str !== "");

	units = getExactUnits(units);

	if (
		unit === "" ||
        !unit ||
        numberPart === "" ||
        !numberPart ||
        !units ||
        units.length === 0 ||
        numberParts.length === 0 ||
        units.length !== numberParts.length
	) return;

	const ans = [];
	for (let i = 0; i < units.length; ++i)
		ans.push({
			numberPart: numberParts[i],
			unit: units[i]
		});
	return ans;
}

/**
 * @param {string[]} thisUnits
 */
function getExactUnits (thisUnits) {
	const exactUnits = [];

	for (const newUnit of thisUnits) {
		if (timeUnits[newUnit]) {
			exactUnits.push(newUnit);
			continue;
		} else {
			for (const timeUnit in timeUnits) {
				for (const timeUnitAllias of timeUnits[timeUnit]) {
					if (timeUnitAllias.replace("(s)", "") === newUnit || timeUnitAllias.replace("(s)", "s") === newUnit) {
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

/**
 * Checking for special case scenario.
 * @param {string} number
 * @param {string} unit
 */
function getMs (number, unit) {
	if (number.includes(":")) {
		switch (unit) {
			case "min":
				return (
					Number(number.split(":")[0]) * timeUnitValues.min +
                    Number(number.split(":")[1]) * timeUnitValues.s
				);
			case "h":
				return (
					Number(number.split(":")[0]) * timeUnitValues.h +
                    Number(number.split(":")[1]) * timeUnitValues.min
				);
			default:
				throw new Error("Used ':' with a unit which doesn't support it");
		}
	}

	return Number(number) * timeUnitValues[unit];
}