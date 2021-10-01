// @ts-check
const Command = require("../../util/command");

module.exports = class Ping extends Command {
	constructor (client) {
		super(client, {
			name: "ping",
			description: "Get the bots current ping",
			category: "Misc",
			clientPerms: ["SEND_MESSAGES", "EMBED_LINKS"],
			cooldown: 5
		});
	}

	/**
     * @param {object} p
     * @param {import('../../util/client')} p.client
     * @param {import('discord.js').CommandInteraction} p.interaction
     */
	async execute ({ client, interaction }) {
		await this.setCooldown(interaction);

		const embed = (await client.utils.CustomEmbed({ userID: interaction.user.id }))
			.setDescription(`Pong! Latency is ${Date.now() - interaction.createdTimestamp}ms.`)
			.setTimestamp();

		await interaction.reply({ embeds: [embed] });
	}
};