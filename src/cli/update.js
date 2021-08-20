//@ts-check

const prompts = require('prompts');
const fs = require('fs-extra');
const path = require('path');
const dir = process.cwd();
const pkg = require('../../package.json');

const { isTemplate, getSettings } = require('./utils');

module.exports = async () => {
    if (!(await isTemplate())) return console.log("\u001b[31m> This doesn't seem to be a project made using this package!\u001b[0m");

    const { confirm } = await prompts([
        {
            type: "confirm",
            name: "confirm",
            message: "\u001b[31mUpdating to a newer version will override the following folders: \"src/prefab\" and \"src/commands/prefab\". Any changes made will be lost, are you sure you want to continue?\u001b[0m",
            initial: false
        }
    ]);

    if (!confirm) return console.log("\u001b[33m> Canceled update!\u001b[0m");

    const src = path.join(dir, "config", "settings.json");

    console.log("\u001b[33m> Updating the project...\u001b[0m");
    const settings = await getSettings();

    if (settings.version === pkg.version) return console.log("\u001b[32m> You already are using the newest version! Make sure to update the package itself.\u001b[0m");

    const prefab = path.join(dir, "prefab");
    await fs.remove(prefab);
    await fs.copy(path.join(__dirname, "..", settings.language, "prefab"), prefab);

    const commands = path.join(dir, "src", "commands", "prefab");
    await fs.remove(commands);
    await fs.copy(path.join(__dirname, "..", settings.language, "src", "commands", "prefab"), commands);

    settings.version = pkg.version;
    await fs.writeFile(src, JSON.stringify(settings, null, 4));

    console.log(`\u001b[32m> Successfully updated this project to v${pkg.version}!\u001b[0m`);
}
