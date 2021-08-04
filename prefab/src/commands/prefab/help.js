//@ts-check

const Command = require('../../util/command');
const languages = require('../../../config/languages.json');
const { Collection } = require("discord.js");

/**
 * @param {string} string 
 * @param {string} guildPrefix 
 */
const replacePrefix = (string, guildPrefix) => {
    return string.replace(/PREFIX/g, guildPrefix);
}

module.exports = class HelpCommand extends Command {
    constructor (client) {
        super(client, {
            name: "help",
            category: "Misc",
            aliases: ["h"],
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
        await this.setCooldown(message);
        const guildInfo = await client.guildInfo.get(message.guild.id);
        const guildPrefix = guildInfo.prefab.prefix;

        let userInfo = await client.profileInfo.get(message.author.id);

        const language = userInfo.prefab.language;
        const languageHelp = languages[language].help.names;

        if (!args.length) {
            return defaultHelp(client, message, guildPrefix, languageHelp);
        }

        const queryName = args.join(' ').toLowerCase();
        const command = client.commands.get(queryName) || (guildInfo.prefab.commandAlias ? client.commands.get(guildInfo.prefab.commandAlias[queryName]) : false);

        const category = client.categories.get(queryName);

        let hEmbed = (await client.utils.CustomEmbed({ userID: message.author.id }));

        //@ts-ignore
        if (command && !command.hideCommand && !(command.nsfw && !message.channel.nsfw)) {
            const commandHelp = languages[language][command.name];
            hEmbed
                .setTitle(`${command.name}`)
                .setAuthor(command.category ? command.category : languageHelp.noCategory)
                .setTimestamp();

            if (commandHelp.description) hEmbed.setDescription(replacePrefix(commandHelp.description, guildPrefix));

            if (commandHelp.usage) hEmbed.addField(languageHelp.usage, replacePrefix(commandHelp.usage, guildPrefix));

            const customAliases = await getCommandAliases(client, message.guild.id, command.name);
            let aliases = [ ];
            if (command.aliases && command.aliases.length !== 0) aliases = aliases.concat(command.aliases);
            if (customAliases && customAliases.length !== 0) aliases = aliases.concat(customAliases);
            if (aliases.length > 0) hEmbed.addField(languageHelp.aliases, '`' + aliases.join('`, `') + '`');

            if (commandHelp.examples) hEmbed.addField(languageHelp.examples, replacePrefix(commandHelp.examples, guildPrefix));

            let cd = await client.utils.getCooldown(command, message);
            if (cd) hEmbed.addField(languageHelp.cooldown, `${client.utils.msToTime(cd * 1000)}`);

            if (guildInfo.prefab.disabledCommands.includes(command.name)) hEmbed.setAuthor(languageHelp.isDisabled);

            message.channel.send({ embeds: [hEmbed] });
        } else if (category) {
            hEmbed
                .setTitle(category[0])
                .setTimestamp()
                .setDescription('`' + category.slice(1).join('`, `') + '`');

            message.channel.send({ embeds: [hEmbed] });
        } else defaultHelp(client, message, guildPrefix, languageHelp);
    }
}

/**
 * Default help message method
 * @param {import('../../util/client')} client 
 * @param {import('discord.js').Message} message 
 * @param {string} guildPrefix 
 * @param {*} languageHelp
 */
 async function defaultHelp(client, message, guildPrefix, languageHelp) {
    let hEmbed = (await client.utils.CustomEmbed({ userID: message.author.id }))
        .setTitle(languageHelp.commandCategories)
        .setDescription(replacePrefix(languageHelp.categoriesHelp, guildPrefix))
        .setTimestamp()
        .setThumbnail(client.user.displayAvatarURL())
        .addField(languageHelp.categoriesName, client.categories.map(c => '> ' + languageHelp.categories[c[0]]).join('\n\n'));

    message.channel.send({ embeds: [hEmbed] });
}

/**
 * Function to get all aliases for a command
 * @param {import('../../util/client')} client 
 * @param {string} guildId 
 * @param {string} commandName - The command name
 * @return {Promise<string[]>} All aliases in an array
 */
async function getCommandAliases(client, guildId, commandName) {
    let guildInfo = await client.guildInfo.get(guildId);
    let commandAlias = guildInfo.prefab.commandAlias ? Object.entries(guildInfo.prefab.commandAlias) : [  ];

    let commands = new Collection();
    for (const [alias, command] of commandAlias) {
        let aliases = commands.get(command);
        if (!aliases || aliases.length === 0) aliases = [alias]
        else aliases.push(alias);

        commands.set(command, aliases);
    }

    return commands.get(commandName);
}
