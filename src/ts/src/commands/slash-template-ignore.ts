import { Client } from "../util/client";
import { Command } from "../util/command";

export default class Template extends Command {
    constructor (client: Client) {
        super(client, {
            name: "template",
            description: "This is a template",
            execute: async ({ client, interaction, group, subcommand }) => {
                // 
            }
        });
    }
}
