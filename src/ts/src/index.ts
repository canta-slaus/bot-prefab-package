import { Intents } from "discord.js";
import { Client } from "./util/client";

const client = new Client({ intents: Object.values(Intents.FLAGS) });

(async () => {
    client.login(client.config.TOKEN);
})();
