//@ts-check

const SlashCommand = require('../../util/slashCommand');
const prefixRegExp = /^[a-zA-Z0-9!@#\$%\^\&*\)\(+=._-]{1,15}$/;

module.exports = class Prefix extends SlashCommand {
    constructor (client) {
        super(client, {
            name: "prefix",
            description: "Set a new prefix for your server",
            category: "Utility",
            // ownerOnly: true,
            clientPerms: ['SEND_MESSAGES', 'EMBED_LINKS'],
            options: [
                {
                    name: "prefix",
                    description: "The new prefix",
                    type: "STRING",
                    required: true
                }
            ],
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

        const guildInfo = await client.guildInfo.get(interaction.guildId);

        const embed = (await client.utils.CustomEmbed({ userID: interaction.user.id }))
            .setTimestamp();

        const prefix = interaction.options.getString("prefix");

        if (!prefixRegExp.test(prefix)) embed.setDescription(`${interaction.user}, that prefix doesn't follow the rules. Please try again.`);
        else if (guildInfo.prefab.prefix === prefix) embed.setDescription(`${interaction.user}, please make sure to enter a new prefix.`);
        else {
            await client.guildInfo.findByIdAndUpdate(interaction.guildId, { $set: { "prefab.prefix": prefix } }, { new: true, upsert: true, setDefaultsOnInsert: true });
    
            embed.setDescription(`${interaction.user}, the new prefix is: \`${prefix}\``);
        }

        await interaction.reply({ embeds: [embed] });
    }
}
