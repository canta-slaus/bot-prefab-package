import { CommandInteraction } from "discord.js";
import { Client } from "../../util/client";
import { Command } from "../../util/command";

export default class Help extends Command {
	constructor (client: Client) {
		super(client, {
			name: "help",
			description: "Get help on commands",
			category: "Misc",
			clientPerms: ["SEND_MESSAGES", "EMBED_LINKS"],
			options: [
				{
					name: "name",
					description: "A category or command name",
					type: "STRING"
				}
			],
			guildOnly: false,
			cooldown: 5
		});
	}

	async execute ({ client, interaction, group, subcommand }: { client: Client, interaction: CommandInteraction, group: string, subcommand: string }) {
		await this.setCooldown(interaction);

		const userInfo = await client.profileInfo.get(interaction.user.id);

		const language = userInfo.prefab.language;
		const languageHelp = client.languages[language].help.names;

		const name = interaction.options.getString("name")?.toLowerCase();

		if (!name) {
			return defaultHelp(client, interaction, languageHelp);
		}

		const command = client.commands.get(name);

		const category = client.categories.get(name);

		const embed = await client.utils.CustomEmbed({ userID: interaction.user.id });

		// @ts-ignore
		if (command && !command.hideCommand && !(command.nsfw && !interaction.channel.nsfw)) {
			const commandHelp = client.languages[language][command.name];

			embed
				.setTitle(`${command.name}`)
				.setAuthor(command.category ? command.category : languageHelp.noCategory)
				.setTimestamp();

			if (commandHelp.description) embed.setDescription(commandHelp.description);

			if (commandHelp.usage) embed.addField(languageHelp.usage, commandHelp.usage);

			if (commandHelp.examples) embed.addField(languageHelp.examples, commandHelp.examples);

			const cd = await client.utils.getCooldown(command, interaction);
			if (cd) embed.addField(languageHelp.cooldown, `${client.utils.msToTime(cd * 1000)}`);

			if (interaction.inGuild()) {
				const guildInfo = await client.guildInfo.get(interaction.guildId);

				if (guildInfo.prefab.disabledCommands.includes(command.name)) embed.setAuthor(languageHelp.isDisabled);
			}

			await interaction.reply({ embeds: [embed] });
		} else if (category) {
			embed
				.setTitle(category[0])
				.setTimestamp()
				.setDescription(`\`${category.slice(1).join("`, `")}\``);

			await interaction.reply({ embeds: [embed] });
		} else defaultHelp(client, interaction, languageHelp);
	}
}

async function defaultHelp(client: Client, interaction: CommandInteraction, languageHelp: any) {
	const embed = (await client.utils.CustomEmbed({ userID: interaction.user.id }))
		.setTitle(languageHelp.commandCategories)
		.setDescription(languageHelp.categoriesHelp)
		.setTimestamp()
		.setThumbnail(client.user!.displayAvatarURL())
		.addField(languageHelp.categoriesName, client.categories.map(c => `> ${languageHelp.categories[c[0]]}`).join("\n\n"));

	await interaction.reply({ embeds: [embed] });
}