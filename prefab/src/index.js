//@ts-check

const PrefabClient = require('./util/client');

const client = new PrefabClient();

(async () => {
    client.login(client.config.TOKEN);
})();
