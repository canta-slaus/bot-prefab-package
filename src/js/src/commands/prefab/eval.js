// @ts-check
const Command = require("../../util/command");
const { inspect } = require("util");
const { MessageAttachment } = require("discord.js");

module.exports = class Channels extends Command {
	constructor (client) {
		super(client, {
			name: "eval",
			description: "Dev-only command",
			category: "Utility",
			clientPerms: ["SEND_MESSAGES"],
			devOnly: true,
			options: [
				{
					name: "code",
					description: "Code to evaluate",
					type: "STRING",
					required: true
				}
			],
			hideCommand: true
		});
	}

	/**
     * @param {object} p
     * @param {import('../../util/client')} p.client
     * @param {import('discord.js').CommandInteraction} p.interaction
     */
	async execute ({ client, interaction }) {
		let code = interaction.options.getString("code");
		code = code.replace(/[“”]/g, "\"").replace(/[‘’]/g, "'");
		let evaled;

		try {
			const start = process.hrtime();
			evaled = eval(`(async () => { ${code} })();`);

			if (evaled instanceof Promise) {
				evaled = await evaled;
			}

			const stop = process.hrtime(start);
			const res = `**Output:** \`\`\`js\n${clean(client, inspect(evaled, { depth: 0 }))}\n\`\`\`\n**Time Taken:** \`\`\`${(stop[0] * 1e9 + stop[1]) / 1e6}ms\`\`\``;

			if (res.length < 2000) {
				await interaction.reply({ content: res, ephemeral: true });
			} else {
				const output = new MessageAttachment(Buffer.from(res), "output.txt");
				await interaction.reply({ files: [output], ephemeral: true });
			}
		} catch (e) {
			await interaction.reply({ content: `Error: \`\`\`xl\n${clean(client, e)}\n\`\`\``, ephemeral: true });
		}
	}
};

/**
 * @param {import('../../util/client')} client
 * @param {string} text
 */
function clean (client, text) {
	if (typeof text === "string") {
		text = text
			.replace(/`/g, `\`${String.fromCharCode(8203)}`)
			.replace(/@/g, `@${String.fromCharCode(8203)}`)
			.replace(new RegExp(client.config.TOKEN, "gi"), "****")
			.replace(new RegExp(client.config.MONGODB_URI, "gi"), "****");
	}

	return text;
}