import { Interaction } from "discord.js";
import { interactionCreate } from "../../../prefab/events";
import { Client } from "../../util/client";

export default async (client: Client, interaction: Interaction) => {
    await interactionCreate(client, interaction);
}
