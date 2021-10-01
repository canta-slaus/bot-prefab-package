// @ts-check
const PrefabClient = require("../../prefab/client");

class Client extends PrefabClient {
	/** @param {import('discord.js').ClientOptions} options */
	constructor(options) {
		super(options);
	}
}

module.exports = Client;