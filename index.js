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
        const { stdout } = await exec("npm list -g");
        const src = stdout.split("\n")[0];
        console.log(src);
        const response = await prompts([
            {
                type: "select",
                name: "action",
                message: "What would you like to do?",
                choices: [
                    { title: "New project", description: "Create a new project!", value: "new" },
                    { title: "Update", description: "Update your current project to the newest version!", value: "update", disabled: true },
                    { title: "Add command", description: "Add a new command to the current project", value: "command", disabled: true },
                    { title: "Add event", description: "Add a new event listener to the current project!", value: "event", disabled: true }
                ],
                warn: "This is still WIP!"
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
        ])

        if (response.action === 'new') {
            console.log("Creating new project...");
            await fs.mkdir(response.name);
            console.log("Created project...");

            await copy(src + "/node_modules/prefab-package", path.join(dir, `./${response.name}`));

            // console.log("Cloning bot-prefab from GitHub...");
            // await exec(`git clone https://github.com/canta-slaus/bot-prefab.git .`, { cwd: `./${response.name}` });

            // const files = await fs.readdir(path.join(dir, `./${response.name}`));
            // for (const file of files) {
            //     if (file !== "js") {
            //         await fs.rm(path.join(dir, `./${response.name}/${file}`), { recursive: true, force: true });
            //     }
            // }

            // await move(path.join(dir, `./${response.name}/js`), path.join(dir, `./${response.name}`))

            // console.log("Cloned bot-prefab from GitHub...");

            console.log("Done!");
        }
    } catch (e) {
        console.log("Oops, something went wrong!");
        console.log(e);
    }
})();
