//@ts-check

const Command = require('../../util/command');

module.exports = class CommandsCommand extends Command {
    constructor (client) {
        super(client, {
            name: "commands",
            category: "Utility",
            canNotDisable: true,
            ownerOnly: true,
            clientPerms: ['SEND_MESSAGES', 'EMBED_LINKS']
        });
    }

    /**
     * @param {object} p
     * @param {import('../../util/client')} p.client
     * @param {import('discord.js').Message} p.message
     * @param {string[]} p.args 
     */
    async execute ({ client, message, args }) {
        const guildInfo = await client.guildInfo.get(message.guild.id);
        const disabledCommands = guildInfo.prefab.disabledCommands;

        if (!args[0]) {
            const embed = (await client.utils.CustomEmbed({ userID: message.author.id }))
                .setTimestamp()
                .setTitle('Disabled Commands')
                .setDescription(disabledCommands.length === 0 ? 'There are no disabled commands in this server!' : '\`' + disabledCommands.join('\`, \`') + '\`');

            message.channel.send({ embeds: [embed] });
        } else {
            if (!args[1]) return message.channel.send('Please specify a command.');

            const command = client.commands.get(args[1].toLowerCase());
            if (!command) return message.channel.send(`The command \`${args[1]}\` does not exist.`);

            if (command.canNotDisable) return message.channel.send(`The command \`${command.name}\` can not be disabled/enabled.`);

            await this.setCooldown(message);

            switch (args[0]) {
                case 'disable':
                    if (disabledCommands.includes(command.name)) return message.channel.send(`The command \`${command.name}\` is already disabled.`);

                    await client.guildInfo.findByIdAndUpdate(message.guild.id, { $push: { "prefab.disabledCommands": command.name } }, { new: true, upsert: true, setDefaultsOnInsert: true });

                    message.channel.send(`The command \`${command.name}\` has been disabled.`);
                    break;

                case 'enable':
                    if (!disabledCommands.includes(command.name)) return message.channel.send(`The command \`${command.name}\` is already enabled.`);

                    await client.guildInfo.findByIdAndUpdate(message.guild.id, { $pull: { "prefab.disabledCommands": command.name } }, { new: true, upsert: true, setDefaultsOnInsert: true });

                    message.channel.send(`The command \`${command.name}\` has been enabled.`);
                    break;
            }
        }
    }
}
