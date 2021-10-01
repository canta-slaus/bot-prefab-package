// @ts-check
const { Intents } = require("discord.js");
const Client = require("./util/client");

const client = new Client({ intents: Object.values(Intents.FLAGS) });

(async () => {
	await client.login(client.config.TOKEN);
})();