//@ts-check

const Command = require('../../util/command');
const { Collection } = require('discord.js');

module.exports = class AliasCommand extends Command {
    constructor (client) {
        super(client, {
            name: "alias",
            category: "Utility",
            clientPerms: ['SEND_MESSAGES', 'EMBED_LINKS'],
            ownerOnly: true
        });
    }

    /**
     * @param {object} p
     * @param {import('../../util/client')} p.client
     * @param {import('discord.js').Message} p.message
     * @param {string[]} p.args 
     */
    async execute ({ client, message, args }) {
        await this.setCooldown(message);
        const guildInfo = await client.guildInfo.get(message.guild.id);
        const commandAlias = guildInfo.prefab.commandAlias ? Object.entries(guildInfo.prefab.commandAlias) : [  ];
        const commands = new Collection();
        const embed = (await client.utils.CustomEmbed({ userID: message.author.id }))
            .setTitle('Custom command aliases');

        if (!args[0]) {
            if (commandAlias.length === 0) {
                embed.setDescription('There are no custom aliases for this server set yet.');
            } else {
                for (let [alias, command] of commandAlias) {
                    let aliases = commands.get(command);
                    if (!aliases || aliases[1].length === 0) aliases = [command, [alias]];
                    else aliases[1].push(alias);

                    commands.set(command, aliases);
                }

                let text = "";
                for (const a of commands.values()) {
                    text += `**${a[0]}**\n\`${a[1].join('`, `')}\`\n`;
                }

                embed.setDescription(text);
            }
        } else {
            let action = args[0].toLowerCase();
            args.shift();

            let aliasAlreadyExists, command;
            switch (action) {
                case 'set':
                    if (args.length < 2) {
                        embed.setDescription(`${message.author}, please check the usage of the command.`);
                        break;
                    }

                    aliasAlreadyExists = client.commands.get(args[0]) || (guildInfo.prefab.commandAlias ? guildInfo.prefab.commandAlias[args[0]] : false);
                    command = client.commands.get(args[1]);

                    if (aliasAlreadyExists) {
                        //@ts-ignore
                        embed.setDescription(`${message.author}, this alias is already in use for the command: \`${aliasAlreadyExists.name ? aliasAlreadyExists.name : aliasAlreadyExists}\``);
                        break;
                    }

                    if (!command) {
                        embed.setDescription(`${message.author}, the command \`${args[1]}\` doesn't exist.`);
                        break;
                    }

                    if (command.canNotAddAlias) {
                        embed.setDescription(`${message.author}, you can not add aliases to the command \`${args[1]}\`.`);
                    }

                    if (!guildInfo.prefab.commandAlias) guildInfo.prefab.commandAlias = {  };

                    guildInfo.prefab.commandAlias[args[0]] = command.name;
                    await client.guildInfo.findByIdAndUpdate(message.guild.id, { $set: { "prefab.commandAlias": guildInfo.prefab.commandAlias } }, { new: true, upsert: true, setDefaultsOnInsert: true });

                    embed.setDescription(`${message.author}, the command \`${command.name}\` has been given the new alias \`${args[0]}\``);
                    break;

                case 'remove':
                    if (args.length < 1) {
                        embed.setDescription(`${message.author}, please check the usage of the command.`);
                        break;
                    }

                    aliasAlreadyExists = guildInfo.prefab.commandAlias[args[0]];
                    if (!aliasAlreadyExists) {
                        embed.setDescription(`${message.author}, that alias doesn't exist yet.`);
                        break;
                    }

                    delete guildInfo.prefab.commandAlias[args[0]];
                    await client.guildInfo.findByIdAndUpdate(message.guild.id, { $set: { "prefab.commandAlias": guildInfo.prefab.commandAlias } }, { new: true, upsert: true, setDefaultsOnInsert: true });

                    embed.setDescription(`${message.author}, the alias \`${args[0]}\` has been removed.`);
                    break;

                default:
                    embed.setDescription(`${message.author}, please check the usage of the command.`);
            }
        }
        message.channel.send({ embeds: [embed] })
    }
}
