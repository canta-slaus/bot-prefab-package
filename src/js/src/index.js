//@ts-check

const { Intents } = require('discord.js');
const Client = require('./util/client');

const client = new Client({ intents: Object.values(Intents.FLAGS) });

(async () => {
    await client.login(client.config.TOKEN);
})();

process.on("unhandledRejection", (error) => {
    client.utils.log("ERROR", "src/prefab/client.js", "An error occured:");
    console.log(error);
});
