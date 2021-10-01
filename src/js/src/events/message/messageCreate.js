// @ts-check
const { messageCreate } = require("../../../prefab/events");

/**
 * @param {import('../../util/client')} client
 * @param {import('discord.js').Message} message
 */
module.exports = async (client, message) => {
	await messageCreate(client, message);
};