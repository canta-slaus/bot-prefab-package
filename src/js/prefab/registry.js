//@ts-check

const fs = require('fs').promises;
const path = require('path');
const Command = require('../src/util/command');

/**
 * @param {import('../src/util/client')} client 
 * @param  {...string} dirs 
 */
async function registerCommands(client, ...dirs) {
    for (const dir of dirs) {
        let files = await fs.readdir(path.join(__dirname, dir));

        for(let file of files) {
            let stat = await fs.lstat(path.join(__dirname, dir, file));

            if (file.includes("-ignore")) continue;

            if(stat.isDirectory())
                await registerCommands(client, path.join(dir, file));
            else {
                if(file.endsWith(".js")) {
                    try {
                        /**
                         * @type {Command}
                         */
                        let cmdModule = new (require(path.join(__dirname, dir, file)))(client);

                        const { name, category, hideCommand } = cmdModule;

                        if (!name) {
                            client.utils.log("WARNING", "src/registry.js", `The command '${path.join(__dirname, dir, file)}' doesn't have a name`);
                            continue;
                        }

                        if (client.commands.has(name)) {
                            client.utils.log("WARNING", "src/registry.js", `The command (slash) name '${name}' (${path.join(__dirname, dir, file)}) has already been added.`);
                            continue;
                        }

                        if (cmdModule.development) {
                            const server = client.config.TEST_SERVERS[0];

                            if (!server) {
                                client.utils.log("WARNING", "src/registry.js", "To add a development only slash command, you need to have at least one test server.");
                                continue;
                            }
                        }

                        client.commands.set(name, cmdModule);

                        if (hideCommand) continue;

                        if (category) {
                            let commands = client.categories.get(category.toLowerCase());
                            if (!commands) commands = [category];
                            commands.push(name);
                            client.categories.set(category.toLowerCase(), commands);
                        } else {
                            client.utils.log("WARNING", "src/registry.js", `The command '${name}' doesn't have a category, it will default to 'No category'.`);
                            let commands = client.categories.get('no category');
                            if (!commands) commands = ['No category'];
                            commands.push(name);
                            client.categories.set('no category', commands);
                        }
                    } catch (e) {
                        client.utils.log("ERROR", "src/registry.js", `Error loading commands: ${e.message}`);
                    }
                }
            }
        }
    }
}

/**
 * @param {import('../src/util/client')} client 
 * @param {...string} dirs
 */
async function registerEvents(client, ...dirs) {
    for (const dir of dirs) {
        let files = await fs.readdir(path.join(__dirname, dir));

        for(let file of files) {
            let stat = await fs.lstat(path.join(__dirname, dir, file));

            if(stat.isDirectory())
                await registerEvents(client, path.join(dir, file));
            else {
                if(file.endsWith(".js")) {
                    let eventName = file.substring(0, file.indexOf(".js"));
                    try {
                        let eventModule = require(path.join(__dirname, dir, file));
                        client.on(eventName, eventModule.bind(null, client));
                    } catch(e) {
                        client.utils.log("ERROR", "src/registry.js", `Error loading events: ${e.message}`);
                    }
                }
            }
        }
    }
}

module.exports = {
    registerEvents, 
    registerCommands 
}
