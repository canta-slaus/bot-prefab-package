#!/usr/bin/env node
//@ts-check

const fs = require('fs').promises;
const path = require('path');

const args = require('./src/cli/args');
const { log } = require('./src/cli/utils');

(async () => {
    try {
        if (parseInt(process.versions.node.split(".")[0]) < 16) {
            log("WARNING", "It looks like you're using a Node.js version below 16.x.x. Discord.js v13 requires Node.js v16.6 or higher, make sure you update!");
        }

        const files = await fs.readdir(path.join(__dirname, "src", "cli"));
        /** @type {import('./src/cli/utils').CLICommand[]} */
        const commands = [];

        for(const file of files) {
            const stat = await fs.lstat(path.join(__dirname, "src", "cli", file));

            if(!stat.isDirectory() && file.endsWith(".js")) {
                const command = require(path.join(__dirname, "src", "cli", file));
                if (command.long || command.short) commands.push(command);
            }
        }

        commands.sort((a, b) => a.promptIndex - b.promptIndex);

        const action = await args({ commands });

        if (action) await commands.find(c => c.long === action || c.short === action).run({ commands });
    } catch (e) {
        log("ERROR", "Oops, something went wrong!");
        console.log(e);
    }
})();
