import * as fs from "fs/promises";
import * as path from "path";
import { Command } from "../src/util/command";
import { PrefabClient } from "./client";

async function registerCommands(client: PrefabClient, ...dirs: string[]) {
    for (const dir of dirs) {
        const files = await fs.readdir(path.join(__dirname, dir));

        for(let file of files) {
            const stat = await fs.lstat(path.join(__dirname, dir, file));

            if (file.includes("-ignore")) continue;

            if(stat.isDirectory())
                await registerCommands(client, path.join(dir, file));
            else {
                if(file.endsWith(".js")) {
                    try {
                        const cmdModule: Command = new ((await import(path.join(__dirname, dir, file))).default)(client);

                        const { name, category, hideCommand } = cmdModule;

                        if (!name) {
                            client.utils.log("WARNING", "src/registry.ts", `The command '${path.join(__dirname, dir, file)}' doesn't have a name`);
                            continue;
                        }

                        if (client.commands.has(name)) {
                            client.utils.log("WARNING", "src/registry.ts", `The command (slash) name '${name}' (${path.join(__dirname, dir, file)}) has already been added.`);
                            continue;
                        }

                        if (cmdModule.development) {
                            const server = client.config.TEST_SERVERS[0];

                            if (!server) {
                                client.utils.log("WARNING", "src/registry.ts", "To add a development only slash command, you need to have at least one test server.");
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
                            client.utils.log("WARNING", "src/registry.ts", `The command '${name}' doesn't have a category, it will default to 'No category'.`);
                            let commands = client.categories.get('no category');
                            if (!commands) commands = ['No category'];
                            commands.push(name);
                            client.categories.set('no category', commands);
                        }
                    } catch (e: any) {
                        client.utils.log("ERROR", "src/registry.ts", `Error loading commands: ${e.message}`);
                    }
                }
            }
        }
    }
}

async function registerEvents(client: PrefabClient, ...dirs: string[]) {
    for (const dir of dirs) {
        const files = await fs.readdir(path.join(__dirname, dir));

        for(let file of files) {
            const stat = await fs.lstat(path.join(__dirname, dir, file));

            if(stat.isDirectory())
                await registerEvents(client, path.join(dir, file));
            else {
                if(file.endsWith(".js")) {
                    const eventName = file.substring(0, file.indexOf(".js"));
                    try {
                        const eventModule = (await import(path.join(__dirname, dir, file))).default;
                        client.on(eventName, eventModule.bind(null, client));
                    } catch(e: any) {
                        client.utils.log("ERROR", "src/registry.ts", `Error loading events: ${e.message}`);
                    }
                }
            }
        }
    }
}

export {
    registerEvents, 
    registerCommands 
}
