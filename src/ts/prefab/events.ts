import { Collection, CommandInteraction, Guild, Interaction, Message, TextChannel } from "discord.js";
import { Client } from "../src/util/client";

const getDefaultChannel = (guild: Guild): TextChannel => {
	let channel;
	// Get "original" default channel
	if (guild.channels.cache.has(guild.id)) {
		channel = guild.channels.cache.get(guild.id);
		if (channel!.permissionsFor(guild.me!).has("SEND_MESSAGES")) {
			// @ts-ignore
			return guild.channels.cache.get(guild.id);
		}
	}

	// Check for a "general" channel, which is often default chat
	channel = guild.channels.cache.find(channel => channel.name === "general" && channel.permissionsFor(guild.me!).has("SEND_MESSAGES") && channel.type === "GUILD_TEXT");
	// @ts-ignore
	if (channel) return channel;

	// Now we get into the heavy stuff: first channel in order where the bot can speak
	// @ts-ignore
	return guild.channels.cache
		.filter(c => c.type === "GUILD_TEXT" && !c.isThread &&
                    c.permissionsFor(guild.me!).has("SEND_MESSAGES"))
	// @ts-ignore
		.sort((a, b) => a.position - b.position)
		.first();
};

async function quickReply (client: Client, interaction: CommandInteraction, content: string) {
	const embed = (await client.utils.CustomEmbed({ userID: interaction.user.id }))
		.setDescription(content);

	try {
		await interaction.reply({ embeds: [embed], ephemeral: true });
	} catch (e) {
		console.log(e);
	}
}

async function guildCreate (client: Client, guild: Guild) {
	try {
		if (guild.available) {
			const channel = getDefaultChannel(guild);
			if (!channel) return;

			await channel.send("Thanks for adding me! For a list of commands, type `/help`");
		}
	} catch (e) {
		client.utils.log("ERROR", "src/events/guild/guildCreate.js", "");
		console.log(e);
	}
}

async function interactionCreate (client: Client, interaction: Interaction) {
	try {
		if (interaction.isCommand()) {
			const command = client.commands.get(interaction.commandName);

			if (!command) return;

			if (!client.config.DEVS.includes(interaction.user.id)) {
				if (command.guildOnly) {
					if (!interaction.inGuild()) return;

					if (command.ownerOnly && interaction.guild!.ownerId !== interaction.user.id) return await quickReply(client, interaction, "This command can only be used by the server owner.");

					const guildInfo = await client.guildInfo.get(interaction.guildId);

					if (guildInfo.prefab.disabledCommands.includes(command.name)) return await quickReply(client, interaction, "This command is currently disabled in this server.");
					if (guildInfo.prefab.disabledChannels.includes(interaction.channelId) && !command.ignoreDisabledChannels) return await quickReply(client, interaction, "You can't use any commands in this channel.");

					// @ts-ignore
					if (command.clientPerms && !interaction.channel.permissionsFor(interaction.guild.me).has(command.clientPerms, true)) return await quickReply(client, interaction, `I am missing the following permissions: ${client.utils.missingPermissions(interaction.guild.me, command.clientPerms)}.`);

					// @ts-ignore
					if (guildInfo.prefab.commandPerms && guildInfo.prefab.commandPerms[command.name] && !interaction.member.permissions.has(guildInfo.prefab.commandPerms[command.name], true)) return await quickReply(client, interaction, `You are missing the following permissions: ${client.utils.missingPermissions(interaction.member, guildInfo.prefab.commandPerms[command.name])}.`);
					// @ts-ignore
					else if (command.perms && !interaction.member.permissions.has(command.perms, true)) return await quickReply(client, interaction, `You are missing the following permissions: ${client.utils.missingPermissions(interaction.member, command.perms)}.`);

					// @ts-ignore
					if (command.nsfw && !interaction.channel.nsfw) return await quickReply(client, interaction, "This command may only be used in an NSFW channel.");
				}

				const cd = await client.utils.getCooldown(command, interaction);

				let cooldowns;
				if (cd) {
					if (typeof command.globalCooldown === "undefined" || command.globalCooldown) {
						if (!client.globalCooldowns.has(command.name)) client.globalCooldowns.set(command.name, new Collection());
						cooldowns = client.globalCooldowns;
					} else {
						if (!client.serverCooldowns.has(interaction.guildId!)) client.serverCooldowns.set(interaction.guildId!, new Collection());
						cooldowns = client.serverCooldowns.get(interaction.guildId!);
						if (!cooldowns!.has(command.name)) cooldowns!.set(command.name, new Collection());
					}

					const now = Date.now();
					const timestamps = cooldowns!.get(command.name);
					const cooldownAmount = cd * 1000;
					if (timestamps!.has(interaction.user.id)) {
						const expirationTime = timestamps!.get(interaction.user.id)! + cooldownAmount;
						if (now < expirationTime) return await quickReply(client, interaction, `Please wait \`${client.utils.msToTime(expirationTime - now)}\` before using this command again.`);
					}
				}
			}

			const group = interaction.options.getSubcommandGroup(false)!;
			const subcommand = interaction.options.getSubcommand(false)!;

			try {
				let sub;
				if (command.groups) sub = command.groups[group].subcommands[subcommand];
				else if (command.subcommands) sub = command.subcommands[subcommand];

				if (sub && sub.execute) return await sub.execute({ client, interaction, group, subcommand });

				// @ts-ignore
				await command.execute({ client, interaction, group, subcommand });
			} catch (e) {
				client.utils.log("ERROR", "src/events/interaction/interactionCreate.js", `Error running command '${command.name}'`);
				console.log(e);
			}
		}
	} catch (e) {
		client.utils.log("ERROR", "src/events/interaction/interactionCreate.js", "");
		console.log(e);
	}
}

async function messageCreate (client: Client, message: Message) {
	//
}

export {
	guildCreate,
	interactionCreate,
	messageCreate
};