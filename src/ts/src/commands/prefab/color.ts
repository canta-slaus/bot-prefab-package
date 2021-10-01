import { CommandInteraction } from "discord.js";
import { Client } from "../../util/client";
import { Command } from "../../util/command";

export default class Color extends Command {
	constructor (client: Client) {
		super(client, {
			name: "color",
			description: "Set your own embed color",
			category: "Utility",
			clientPerms: ["SEND_MESSAGES", "EMBED_LINKS"],
			cooldown: 5,
			options: [
				{
					name: "color",
					description: "The new color you want",
					type: "STRING"
				}
			]
		});
	}

	async execute ({ client, interaction, group, subcommand }: { client: Client, interaction: CommandInteraction, group: string, subcommand: string }) {
		await this.setCooldown(interaction);

		const userInfo = await client.profileInfo.get(interaction.user.id);

		const embed = (await client.utils.CustomEmbed({ userID: interaction.user.id }))
			.setTimestamp();

		const color = interaction.options.getString("color")?.toLowerCase();

		if (!color) {
			embed.setDescription(`${interaction.user}, your current embed color is \`${userInfo.prefab.embedColor}\`\n\nThese are the available colors: \`${Object.keys(client.colors).join("`, `")}\``);
		} else if (!Object.keys(client.colors).includes(color)) embed.setDescription(`${interaction.user}, the embed color \`${color}\` doesn't exist.`);
		else {
			embed.setDescription(`${interaction.user}, your embed color has been changed to \`${color}\``);
			await client.profileInfo.findByIdAndUpdate(interaction.user.id, { $set: { "prefab.embedColor": color } }, { new: true, upsert: true, setDefaultsOnInsert: true });
		}

		await interaction.reply({ embeds: [embed] });
	}
}