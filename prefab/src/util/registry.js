//@ts-check

const fs = require('fs').promises;
const path = require('path');
const Command = require('./command');
const SlashCommand = require('./slashCommand');

/**
 * @param {import('./client')} client 
 * @param  {...string} dirs 
 */
async function registerCommands(client, ...dirs) {
    for (const dir of dirs) {
        let files = await fs.readdir(path.join(__dirname, dir));
        // Loop through each file.
        for(let file of files) {
            let stat = await fs.lstat(path.join(__dirname, dir, file));

            // if (file.includes("-ignore")) continue;

            if(stat.isDirectory()) // If file is a directory, recursive call recurDir
                registerCommands(client, path.join(dir, file));
            else {
                // Check if file is a .js file.
                if(file.endsWith(".js")) {
                    try {
                        /**
                         * @type {Command|SlashCommand}
                         */
                        let cmdModule = new (require(path.join(__dirname, dir, file)))(client);

                        if (cmdModule instanceof Command) {
                            let { name, aliases, category, hideCommand } = cmdModule;

                            if (!name) {
                                client.utils.log("WARNING", "src/registry.js", `The command '${path.join(__dirname, dir, file)}' doesn't have a name`);
                                continue;
                            }

                            if (client.commands.has(name)) {
                                client.utils.log("WARNING", "src/registry.js", `The command name '${name}' has already been added.`);
                                continue;
                            }

                            client.commands.set(name, cmdModule);

                            if(aliases && aliases.length !== 0) {
                                aliases.forEach(alias => {
                                    if (client.commands.has(alias)) {
                                        client.utils.log("WARNING", "src/registry.js", `The command alias '${alias}' has already been added.`);
                                        //@ts-ignore
                                    } else client.commands.set(alias, cmdModule);
                                });
                            }

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
                        } else {
                            if (!client.application?.owner) await client.application?.fetch();

                            let options;

                            if (cmdModule.options && cmdModule.options.length) options = cmdModule.options;
                            else if (cmdModule.groups && Object.keys(cmdModule.groups)) options = getSubcommandGroupOptions(cmdModule.groups);
                            else if (cmdModule.subcommands && Object.keys(cmdModule.subcommands)) options = getSubcommandOptions(cmdModule.subcommands);

                            const data = { name: cmdModule.name, description: cmdModule.description, options, defaultPermission: cmdModule.defaultPermission };
                            let command;
                            if (cmdModule.development) {
                                const server = client.config.TEST_SERVERS[0];

                                if (!server) {
                                    client.utils.log("WARNING", "src/registry.js", "To add a development only slash command, you need to have at least one test server.");
                                    continue;
                                }

                                const guild = await client.guilds.fetch(server);
                                command = await guild.commands.create(data);
                            } else {
                                command = await client.application.commands.create(data);
                            }

                            if (cmdModule.devOnly && client.config.DEVS.length) await command.permissions.set({ permissions: client.config.DEVS.map(id => { return { id, type: "USER", permission: true } }) });
                            else if (cmdModule.permissions && cmdModule.permissions.length) await command.permissions.set({ permissions: cmdModule.permissions });

                            client.slashCommands.set(data.name, cmdModule);
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
 * @param {import('./client')} client 
 * @param {...string} dirs
 */
async function registerEvents(client, ...dirs) {
    for (const dir of dirs) {
        let files = await fs.readdir(path.join(__dirname, dir));
        // Loop through each file.
        for(let file of files) {
            let stat = await fs.lstat(path.join(__dirname, dir, file));
            if(stat.isDirectory()) // If file is a directory, recursive call recurDir
                registerEvents(client, path.join(dir, file));
            else {
                // Check if file is a .js file.
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
};

/**
 * @param {Object.<string, import('./slashCommand').SubcommandGroup>} groups 
 */
function getSubcommandGroupOptions (groups) {
    const names = Object.keys(groups);
    const options = [];

    for (const name of names) {
        /** @type {import('discord.js').ApplicationCommandOptionData} */
        const option = {
            name,
            description: groups[name].description,
            options: getSubcommandOptions(groups[name].subcommands),
            type: "SUB_COMMAND_GROUP"
        }

        options.push(option);
    }

    return options;
}

/**
 * @param {Object.<string, import('./slashCommand').Subcommand>} subcommands 
 */
function getSubcommandOptions (subcommands) {
    const names = Object.keys(subcommands);
    const options = [];

    for (const name of names) {
        /** @type {import('discord.js').ApplicationCommandOptionData} */
        const option = {
            name,
            description: subcommands[name].description,
            options: subcommands[name].args,
            type: "SUB_COMMAND"
        }

        options.push(option);
    }

    return options;
}
