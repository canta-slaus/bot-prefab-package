//@ts-check

const { MessageButton } = require('discord.js');
const Command = require('../util/command');

module.exports = class Template extends Command {
    constructor (client) {
        super(client, {
            name: "test"
        });
    }

    /**
     * @param {object} p
     * @param {import('../util/client')} p.client
     * @param {import('discord.js').Message} p.message
     * @param {string[]} p.args 
     */
    async execute ({ client, message, args }) {
        const msg = await message.reply({ content: "_imagine some character information here_", allowedMentions: { repliedUser: true }, components: [ { components: [ new MessageButton().setLabel("Build").setStyle("PRIMARY").setCustomId("build"), new MessageButton().setLabel("Artifacts").setStyle("PRIMARY").setCustomId("artifacts"), new MessageButton().setLabel("Trailer").setStyle("PRIMARY").setCustomId("trailer") ], type: "ACTION_ROW" } ] });
        try {
            const e = await msg.awaitMessageComponent({ time: 30000 });
            if (e.customId === "build") {
                await msg.edit("_imagine some build information here_");
                await e.update({ components: [ { components: [ new MessageButton().setLabel("DPS").setStyle("PRIMARY").setCustomId("dps"), new MessageButton().setLabel("Support").setStyle("PRIMARY").setCustomId("support"), new MessageButton().setLabel("Support DPS").setStyle("PRIMARY").setCustomId("support_dps") ], type: "ACTION_ROW" } ] });
            } else if (e.customId === "artifacts") {
                await msg.edit("_imagine some artifact (whatever the fuck that is) information here_");
                await e.update({ components: [] });
            } else if (e.customId === "trailer") {
                await msg.edit("_idk a trailer i guess lol_");
                await e.update({ components: [] })
            }
        } catch (e) {
            await msg.reply("Time ran out!");
        }
    }
}
