//@ts-check

const prompts = require('prompts');
const fs = require('fs-extra');
const path = require('path');

const { isTemplate, cap, getSettings, log } = require('./utils');
const dir = process.cwd();

const jsCommand = `//@ts-check

const Command = require('../../util/command');

module.exports = class $Name extends Command {
    /**
     * @param {import('../../util/client')} client 
     */
    constructor (client) {
        super(client, {
            name: "$name",
            category: "$Category",
            description: "$Name description",
            execute: async ({ client, interaction, group, subcommand }) => {
                //
            }
        });
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
            description: "$Name description",
            execute: async ({ client, interaction, group, command }) => {
                //
            }
        });
    }
}
`;

/**
 * @type {import('./utils').CLICommand}
 */
module.exports = {
    long: "commands",
    short: "c",
    description: "Add a new command",
    title: "Add a new command",
    promptIndex: 2,

    run: async () => {
        if (!(await isTemplate())) return log("ERROR", "This doesn't seem to be a project made using this package!");

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

        log("WARNING", "Generating category and command...");
        if (!(await fs.pathExists(categoryPath))) await fs.mkdir(categoryPath);

        const commandPath = path.join(categoryPath, name.toLowerCase() + `.${settings.language}`);
        if (await fs.pathExists(commandPath)) return log("ERROR", "That command already exists in that category!");

        const command = settings.language === "js" ? jsCommand : tsCommand;

        await fs.writeFile(commandPath, command.replace(/\$Name/g, cap(name.toLowerCase()))
                                               .replace(/\$name/g, name.toLowerCase())
                                               .replace(/\$Category/g, category));

        log("SUCCESS", "Successfully created a new command!");
    }
}
