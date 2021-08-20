//@ts-check

const prompts = require('prompts');
const fs = require('fs-extra');
const path = require('path');
const dir = process.cwd();

const { isTemplate, cap, getSettings } = require('./utils');

const jsCommand = `//@ts-check

const Command = require('../../util/command');

module.exports = class $Name extends Command {
    constructor (client) {
        super(client, {
            name: "$name",
            category: "$Category",
            description: 
        });
    }

    /**
    * @param {object} p
    * @param {import('../../util/client')} p.client
    * @param {import('discord.js').CommandInteraction} p.interaction
    * @param {string} p.group
    * @param {string} p.subcommand
    */
    async execute ({ client, interaction, group, subcommand }) {
        // 
    }
}
`;

const tsCommand = `import { CommandInteraction } from "discord.js";
import { Client } from "../../util/client";
import { Command } from "../../util/command";

export default class $Name extends Command {
    constructor (client: Client) {
        super(client, {
            name: "$name",
            category: "$Category",
            description: 
        });
    }

    async execute ({ client, interaction, group, subcommand }: { client: Client, interaction: CommandInteraction, group: string, subcommand: string }) {
        // 
    }
}
`

module.exports = async () => {
    if (!(await isTemplate())) return console.log("\u001b[31m> This doesn't seem to be a project made using this package!\u001b[0m");

    const { name, category } = await prompts([
        {
            type: "text",
            name: "name",
            message: "What should the name of the command be?",
            validate: name => name?.length ? true : "Please enter a name!"
        },
        {
            type: "text",
            name: "category",
            message: "What should the category of the command be?",
            validate: name => name?.length ? true : "Please enter a category!"
        }
    ]);

    if (!name || !category) return;

    const categoryPath = path.join(dir, "src", "commands", category.toLowerCase());

    const settings = await getSettings();

    console.log("\u001b[33m> Generating category and command...\u001b[0m");
    if (!(await fs.pathExists(categoryPath))) await fs.mkdir(categoryPath);

    const commandPath = path.join(categoryPath, name.toLowerCase() + `.${settings.language}`);
    if (await fs.pathExists(commandPath)) return console.log("\u001b[33m> That command already exists in that category!\u001b[0m");

    const command = settings.language === "js" ? jsCommand : tsCommand;

    await fs.writeFile(commandPath, command.replace(/\$Name/g, cap(name.toLowerCase()))
                                           .replace(/\$name/g, name.toLowerCase())
                                           .replace(/\$Category/g, category));

    console.log("\u001b[32m> Successfully create a new command!\u001b[0m");
}
