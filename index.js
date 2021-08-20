#!/usr/bin/env node
//@ts-check

const prompts = require('prompts');

const { commands, events, info, newProject, types, update, args } = require('./src/cli');

(async () => {
    try {
        if (parseInt(process.versions.node.split(".")[0]) < 16) {
            console.log("\u001b[33m> It looks like you're using a Node.js version below 16.x.x. Discord.js v13 requires Node.js v16.6 or higher, make sure you update!\u001b[0m");
        }

        let action = args();

        if (!action) action = (await prompts([
            {
                type: "select",
                name: "action",
                message: "What would you like to do?",
                choices: [
                    { title: "┌ New project", description: "Create a new project!", value: "new" },
                    { title: "├ Update a project", description: "Update your current project to the newest version!", value: "update" },
                    { title: "├ Add command", description: "Add a new command to the current project", value: "commands" },
                    { title: "├ Add event", description: "Add a new event listener to the current project!", value: "events" },
                    { title: "├ Add types", description: "Add the needed type declarations for a schema!", value: "types" },
                    { title: "└ Information", description: "Get some information about this CLI tool!", value: "info" }
                ],
                warn: "This is still WIP!",
                hint: "Use arrow keys to navigate. Hit \"ENTER\" to select."
            }
        ])).action;

        if (!action) return;

        if (action === 'new') await newProject();
        else if (action === "info") await info();
        else if (action === "update") await update();
        else if (action === "commands") await commands();
        else if (action === "events") await events();
        else if (action === "types") await types();
    } catch (e) {
        console.log("\u001b[31m> Oops, something went wrong!\u001b[0m");
        console.log(e);
    }
})();
