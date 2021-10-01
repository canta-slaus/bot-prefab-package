import { Client } from "../../util/client";
import { Command } from "../../util/command";

export default class Cooldowns extends Command {
	constructor (client: Client) {
		super(client, {
			name: "cooldowns",
			description: "Check the all the custom cooldowns of a command and add new cooldowns",
			category: "Utility",
			ownerOnly: true,
			clientPerms: ["SEND_MESSAGES", "EMBED_LINKS"],
			cooldown: 5,
			subcommands: {
				list: {
					description: "List all cooldowns on a command",
					args: [
						{
							name: "command",
							description: "The command to check",
							type: "STRING",
							required: true
						}
					],
					execute: async ({ client, interaction }) => {
						await this.setCooldown(interaction);

						const guildInfo = await client.guildInfo.get(interaction.guildId!);

						const embed = (await client.utils.CustomEmbed({ userID: interaction.user.id }))
							.setTimestamp();

						const name = interaction.options.getString("command")!.toLowerCase();
						const command = client.commands.get(name);

						if (!command) embed.setDescription(`${interaction.user}, there is no command \`${name}\`.`);
						else if (command.canNotSetCooldown) embed.setDescription(`${interaction.user}, you can not set a cooldown for this command.`);
						else if (!guildInfo?.prefab?.commandCooldowns || !guildInfo?.prefab?.commandCooldowns[command.name]) embed.setDescription(`${interaction.user}, there are no modified cooldowns on this command.`);
						else {
							let desc = "";

							for (const [role, cooldown] of Object.entries(guildInfo.prefab.commandCooldowns[command.name])) {
								// @ts-ignore
								desc += `<@&${role}> \`${client.utils.msToTime(cooldown)}\`\n`;
							}

							embed.setDescription(`${interaction.user}, here are the cooldowns for the command \`${name}\`:\n${desc}`);
						}

						await interaction.reply({ embeds: [embed] });
					}
				},
				set: {
					description: "Set a cooldown for a certain role",
					args: [
						{
							name: "command",
							description: "The command to add the cooldown to",
							type: "STRING",
							required: true
						},
						{
							name: "role",
							description: "The role this cooldown should apply to",
							type: "ROLE",
							required: true
						},
						{
							name: "cooldown",
							description: "The cooldown (in seconds)",
							type: "NUMBER",
							required: true
						}
					],
					execute: async ({ client, interaction }) => {
						await this.setCooldown(interaction);

						const embed = (await client.utils.CustomEmbed({ userID: interaction.user.id }))
							.setTimestamp();

						const name = interaction.options.getString("command")!.toLowerCase();
						const role = interaction.options.getRole("role")!.id;
						const time = interaction.options.getNumber("cooldown")!;

						const command = client.commands.get(name);

						if (!command) embed.setDescription(`${interaction.user}, there is no command \`${name}\`.`);
						else if (command.canNotSetCooldown) embed.setDescription(`${interaction.user}, you can not set a cooldown for this command.`);
						else if (time > 86400000) embed.setDescription(`${interaction.user}, the cooldown can't be longer than 24h.`);
						else if ((command.cooldown ?? 0) === time) embed.setDescription(`${interaction.user}, that's already the default cooldown for this command.`);
						else if (time === 0) {
							await client.guildInfo.findByIdAndUpdate(interaction.guildId!, { $unset: { [`prefab.commandCooldowns.${command.name}.${role}`]: 1 } }, { new: true, upsert: true, setDefaultsOnInsert: true });

							embed.setDescription(`${interaction.user}, the cooldown on the command ${command.name} for the role <@&${role}> has been removed.`);
						} else {
							await client.guildInfo.findByIdAndUpdate(interaction.guildId!, { $set: { [`prefab.commandCooldowns.${command.name}.${role}`]: time * 1000 } }, { new: true, upsert: true, setDefaultsOnInsert: true });

							embed.setDescription(`${interaction.user}, the cooldown on the command ${command.name} for the role <@&${role}> has been set to \`${client.utils.msToTime(time * 1000)}\`.`);
						}

						await interaction.reply({ embeds: [embed] });
					}
				},
				clear: {
					description: "Clear all cooldowns for a command",
					args: [
						{
							name: "command",
							description: "The command to clear",
							type: "STRING",
							required: true
						}
					],
					execute: async ({ client, interaction }) => {
						await this.setCooldown(interaction);

						const embed = (await client.utils.CustomEmbed({ userID: interaction.user.id }))
							.setTimestamp();

						const name = interaction.options.getString("command")!.toLowerCase();
						const command = client.commands.get(name);

						if (!command) embed.setDescription(`${interaction.user}, there is no command \`${name}\`.`);
						else if (command.canNotSetCooldown) embed.setDescription(`${interaction.user}, you can not set a cooldown for this command.`);
						else {
							await client.guildInfo.findByIdAndUpdate(interaction.guildId!, { $unset: { [`prefab.commandCooldowns.${command.name}`]: 1 } }, { new: true, upsert: true, setDefaultsOnInsert: true });

							embed.setDescription(`${interaction.user}, the cooldown on the command ${command.name} has been set to the default (\`${command.cooldown ? client.utils.msToTime(command.cooldown) : "No cooldown"}\`).`);
						}

						await interaction.reply({ embeds: [embed] });
					}
				}
			}
		});
	}
}