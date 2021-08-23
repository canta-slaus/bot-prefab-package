#!/usr/bin/env node
//@ts-check

const prompts = require('prompts');

const { commands, events, info, newProject, types, update, args, extra, validate, parse } = require('./src/cli');
const { log } = require('./src/cli/utils');

(async () => {
    try {
        if (parseInt(process.versions.node.split(".")[0]) < 16) {
            log("WARNING", "It looks like you're using a Node.js version below 16.x.x. Discord.js v13 requires Node.js v16.6 or higher, make sure you update!");
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
                    { title: "├ Extra tools", description: "Additional tools (type generator, command validator, ...)", value: "extra" },
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
        else if (action === "extra") await extra();
        else if (action === "validate") await validate();
        else if (action === "parse") await parse();
    } catch (e) {
        log("ERROR", "Oops, something went wrong!");
        console.log(e);
    }
})();
