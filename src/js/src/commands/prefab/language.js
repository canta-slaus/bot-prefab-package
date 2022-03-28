//@ts-check

const Command = require('../../util/command');

module.exports = class Language extends Command {
    constructor (client) {
        super(client, {
            name: "language",
            description: "Set the language you want to get help on commands with.",
            category: "Utility",
            clientPerms: ['SEND_MESSAGES', 'EMBED_LINKS'],
            options: [
                {
                    name: "language",
                    description: "The language you want",
                    type: "STRING"
                }
            ],
            execute: async ({ client, interaction }) => {
                await this.setCooldown(interaction);

                const userInfo = await client.profileInfo.get(interaction.user.id);

                const language = interaction.options.getString("language")?.toLowerCase();

                const embed = (await client.utils.CustomEmbed({ userID: interaction.user.id }))
                    .setTimestamp();

                if (!language) {
                    embed.setDescription(`${interaction.user}, your current set language is \`${userInfo.prefab.language}\`.\n\nThese are the supported languages: \`${Object.keys(client.languages).join('`, `')}\``);
                } else {
                    if (!Object.keys(client.languages).includes(language)) embed.setDescription(`${interaction.user}, the language \`${language}\` doesn't exist.`);
                    else {
                        embed.setDescription(`${interaction.user}, your language has been changed to \`${language}\``);
        
                        await client.profileInfo.findByIdAndUpdate(interaction.user.id, { $set: { "prefab.language": language } }, { new: true, upsert: true, setDefaultsOnInsert: true });
                    }
                }

                await interaction.reply({ embeds: [embed] });
            }
        });
    }
}
