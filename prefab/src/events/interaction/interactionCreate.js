//@ts-check

const { interactionCreate } = require('../../../prefab/events');

/**
 * @param {import('../../util/client')} client 
 * @param {import('discord.js').Interaction} interaction 
 */
module.exports = async (client, interaction) => {
    await interactionCreate(client, interaction);
}
