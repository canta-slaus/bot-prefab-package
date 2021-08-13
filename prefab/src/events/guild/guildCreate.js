//@ts-check

const { guildCreate } = require('../../../prefab/events');

/**
 * @param {import('../../util/client')} client 
 * @param {import('discord.js').Guild} guild 
 */
module.exports = async (client, guild) => {
    await guildCreate(client, guild);
}
