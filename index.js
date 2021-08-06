#!/usr/bin/env node
//@ts-check

const prompts = require('prompts');
const fs = require('fs/promises');
const copy = require('fs-extra').copy;
const path = require('path');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const dir = process.cwd();

(async () => {
    try {
        const response = await prompts([
            {
                type: "select",
                name: "action",
                message: "What would you like to do?",
                choices: [
                    { title: "┌ New project", description: "Create a new project!", value: "new" },
                    { title: "├ Update", description: "Update your current project to the newest version!", value: "update", disabled: true },
                    { title: "├ Add command", description: "Add a new command to the current project", value: "command", disabled: true },
                    { title: "├ Add event", description: "Add a new event listener to the current project!", value: "event", disabled: true },
                    { title: "└ Information", description: "Get some information about this CLI tool!", value: "info" }
                ],
                warn: "This is still WIP!",
                hint: "Use arrow keys to navigate. Hit \"ENTER\" to select."
            },
            {
                type: (prev, values) => values.action === "new" ? "text" : null,
                name: "name",
                message: "What should the name of the new project be?"
            },
            {
                type: (prev, values) => values.action === "command" ? "text" : null,
                name: "name",
                message: "What should the name of the command be?"
            },
            {
                type: (prev, values) => values.action === "event" ? "select" : null,
                name: "name",
                message: "Which event would you like to add?",
                choices: [

                ]
            }
        ]);

        if (response.action === 'new') {
            console.log("Creating new project...");

            const { stdout } = await exec("npm list -g");
            const src = stdout.split("\n")[0];

            await fs.mkdir(response.name);

            console.log("Generating files...");
            await copy(src + "/node_modules/bot-prefab-package/prefab", path.join(dir, `./${response.name}`));

            console.log("Installing packages...");
            await exec("npm init -y", { cwd: `./${response.name}` });
            await exec("npm i discord.js mongoose ms", { cwd: `./${response.name}` });

            console.log("Done!");
        } else if (response.action === "update") {
            // Update their prefab structure used in the project
        } else if (response.action === "command") {
            // Add a new command following the template command
            // Ask what category (existing or create new category)
        } else if (response.action === "event") {
            // Add a new event
        } else if (response.action === "info") {
            console.log("                                                                    ");
            console.log("   \u001b[34;1m┌────────────────────── \u001b[34;1mbot-prefab-package \u001b[34;1m─────────────────────┐");
            console.log("   │   \u001b[33mThis CLI was made based on my original bot-prefab to make   \u001b[34;1m│");
            console.log("   │                 \u001b[33mcreating new projects easier.                 \u001b[34;1m│");
            console.log("   \u001b[34;1m├───────────────────────────────────────────────────────────────┤")
            console.log("   │   \u001b[33mGitHub: \u001b[36;1mhttps://github.com/canta-slaus/bot-prefab-package   \u001b[34;1m│");
            console.log("   │       \u001b[33mnpm: \u001b[36;1mhttps://npmjs.com/package/bot-prefab-package       \u001b[34;1m│");
            console.log("   │             \u001b[33mDiscord: \u001b[36;1mhttps://discord.gg/Mg347Rcpwa            \u001b[34;1m│");
            console.log("   └───────────────────────────────────────────────────────────────┘\u001b[0m");
            console.log("                                                                    ");
        }
    } catch (e) {
        console.log("Oops, something went wrong!");
        console.log(e);
    }
})();
