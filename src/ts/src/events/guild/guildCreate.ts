import { Guild } from "discord.js";
import { guildCreate } from "../../../prefab/events";
import { Client } from "../../util/client";

export default async (client: Client, guild: Guild) => {
	await guildCreate(client, guild);
};