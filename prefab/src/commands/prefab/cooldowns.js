//@ts-check

const Command = require('../../util/command');
const ms = require('ms');

module.exports = class CooldownsCommand extends Command {
    constructor (client) {
        super(client, {
            name: "cooldowns",
            category: "Utility",
            ownerOnly: true,
            args: [
                {
                    type: 'SOMETHING',
                    prompt: 'Please specify a command.',
                    id: 'command'
                }
            ],
            clientPerms: ['SEND_MESSAGES', 'EMBED_LINKS']
        });
    }

    /**
     * @param {object} p
     * @param {import('../../util/client')} p.client
     * @param {import('discord.js').Message} p.message
     * @param {string[]} p.args 
     * @param {*} p.flags
     */
    async execute ({ client, message, args, flags }) {
        const command = client.commands.get(flags.command.toLowerCase());
        if (!command) return message.channel.send(`${message.author.username}, that command doesn't exist.`);
        if (command.canNotSetCooldown) return message.channel.send(`${message.author.username}, you can not set a cooldown for this command.`);

        const guildInfo = await client.guildInfo.get(message.guild.id);
        const commandCooldowns = guildInfo.prefab.commandCooldowns || {};

        const embed = (await client.utils.CustomEmbed({ userID: message.author.id }))
            .setTimestamp();

        if (!args[1]) {
            await this.setCooldown(message);
            if (!commandCooldowns || !commandCooldowns[command.name]) embed.setDescription('There are no modified cooldowns on this command.');
            else {
                let desc = "";
                for (const [role, cooldown] of Object.entries(commandCooldowns[command.name])) {
                    desc += `<@&${role}> ${client.utils.msToTime(cooldown)}\n`;
                }

                embed.setDescription(desc);
            }

            return message.channel.send({ embeds: [embed] });
        }

        if (!args[2]) return message.channel.send(`${message.author.username}, please specify a role.`);

        let roleID = args[2].replace('<@&', '').replace('>', '');
        let role = message.guild.roles.cache.get(roleID);
        if (!role) return message.channel.send(`${message.author.username}, please specify a role.`);

        const update = { "prefab.commandCooldowns": { } };
        update["prefab.commandCooldowns"][command.name] = { };

        await this.setCooldown(message);

        switch (args[1].toLowerCase()) {
            case 'clear':
                if (commandCooldowns[command.name] && commandCooldowns[command.name][roleID]) {
                    delete commandCooldowns[command.name][roleID];
                    if (Object.keys(commandCooldowns[command.name]).length === 0) delete commandCooldowns[command.name];
                    update["prefab.commandCooldowns"] = commandCooldowns;
                }

                embed.setDescription(`The cooldown for the role <@&${roleID}> has been reset to the default (\`${command.cooldown ? client.utils.msToTime(command.cooldown) : 'No cooldown'}\`).`);
                break;

            case 'set':
                if (!args[3]) return message.channel.send(`${message.author.username}, please specify a cooldown.`);

                let time = ms(args.slice(3).join(''));
                if (time > 86400000) return message.channel.send(`${message.author.username}, the cooldown can't be longer than 24h.`);
                if ((command.cooldown ? command.cooldown : 0) === time / 1000) return message.channel.send(`${message.author.username}, that's already the default cooldown for this command.`);
                if (!commandCooldowns[command.name]) commandCooldowns[command.name] = { };
                commandCooldowns[command.name][roleID] = time;

                update["prefab.commandCooldowns"] = commandCooldowns;
                
                embed.setDescription(`The cooldown for the role <@&${roleID}> has been set to \`${client.utils.msToTime(time)}\`.`);
                break;

            default:
                embed.setDescription(`${message.author.username}, please check the usage of this command.`);
                return message.channel.send({ embeds: [embed] });
        }

        await client.guildInfo.findByIdAndUpdate(message.guild.id, { $set: update }, { new: true, upsert: true, setDefaultsOnInsert: true });
        message.channel.send({ embeds: [embed] });
    }
}
