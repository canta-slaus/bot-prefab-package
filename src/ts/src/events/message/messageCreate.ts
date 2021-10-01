import { Message } from "discord.js";
import { messageCreate } from "../../../prefab/events";
import { Client } from "../../util/client";

export default async (client: Client, message: Message) => {
	await messageCreate(client, message);
};