//@ts-check

const prompts = require('prompts');
const fs = require('fs-extra');
const path = require('path');

const pkg = require('../../package.json');
const { isTemplate, getSettings, log } = require('./utils');
const dir = process.cwd();

/**
 * @type {import('./utils').CLICommand}
 */
module.exports = {
    long: "update",
    short: "u",
    description: "Update the current project",
    title: "Update a project",
    promptIndex: 1,

    run: async () => {
        if (!(await isTemplate())) return log("ERROR", "This doesn't seem to be a project made using this package!");

        const { confirm } = await prompts([
            {
                type: "confirm",
                name: "confirm",
                message: "\u001b[31mUpdating to a newer version will override the following folders: \"src/prefab\" and \"src/commands/prefab\". Any changes made will be lost, are you sure you want to continue?\u001b[0m",
                initial: false
            }
        ]);

        if (!confirm) return;

        const src = path.join(dir, "config", "settings.json");

        log("WARNING", "Updating the project...");
        const settings = await getSettings();

        if (settings.version >= pkg.version) return log("SUCCESS", "You already are using the newest version! Make sure to update the package itself!");

        const prefab = path.join(dir, "prefab");
        await fs.remove(prefab);
        await fs.copy(path.join(__dirname, "..", settings.language, "prefab"), prefab);

        const commands = path.join(dir, "src", "commands", "prefab");
        await fs.remove(commands);
        await fs.copy(path.join(__dirname, "..", settings.language, "src", "commands", "prefab"), commands);

        settings.version = pkg.version;
        await fs.writeFile(src, JSON.stringify(settings, null, 4));

        log("SUCCESS", `Successfully updated this project to v${pkg.version}!`);
    }
}
