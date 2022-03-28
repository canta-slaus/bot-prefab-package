//@ts-check

const prompts = require('prompts');
const fs = require('fs-extra');
const path = require('path');
const util = require('util');
const exec = util.promisify(require('child_process').exec);

const { log } = require('./utils');
const dir = process.cwd();

/**
 * @type {import('./utils').CLICommand}
 */
module.exports = {
    long: "new",
    short: "n",
    description: "Create a new project",
    title: "New project",
    promptIndex: 0,

    run: async () => {
        const { project, language } = await prompts([
            {
                type: "text",
                name: "project",
                message: "What should the name of the new project be?",
                validate: name => name?.length ? true : "Please enter a name!"
            },
            {
                type: "select",
                name: "language",
                message: "What language do you want to use?",
                choices: [
                    { title: "┌ \u001b[33mJavaScript\u001b[0m", value: "js" },
                    { title: "└ \u001b[34mTypeScript\u001b[0m", value: "ts" }
                ],
                hint: "Use arrow keys to navigate. Hit \"ENTER\" to select."
            },
        ]);

        if (!project?.length || !language) return;

        log("WARNING", "Creating new project...");

        let src = "";
        let pm = "";

        try {
            const { stdout } = await exec("npm list -g");

            src = path.join(stdout.split("\n")[0], "node_modules", "bot-prefab-package", "src", language);

            const exists = await fs.pathExists(src);
            if (!exists) throw new Error();
            pm = "npm";
        } catch (e) {
            try {
                const { stdout } = await exec("yarn global dir");
                src = path.join(stdout.split("\n").find(s => s.includes("global")), "node_modules", "bot-prefab-package", "src", language);

                const exists = await fs.pathExists(src);
                if (!exists) throw new Error();
                pm = "yarn";
            } catch (e) {
                return log("ERROR", "Oops, I couldn't find the global package installation folders!");
            }
        }

        await fs.mkdir(project);
        log("SUCCESS", "Created a new project folder!");

        log("WARNING", "Generating files...");
        await fs.copy(src, path.join(dir, project));
        log("SUCCESS", "Generated all files!");

        log("WARNING", "Installing packages...");
        await exec(`${pm} install`, { cwd: `./${project}` });
        const packagePath = path.join(dir, project, "package.json");
        const pkg = JSON.parse(await fs.readFile(packagePath, { encoding: "utf8" }));
        pkg.name = project.toLowerCase();
        await fs.writeFile(packagePath, JSON.stringify(pkg, null, 2));
        log("SUCCESS", "Installed all packages!");

        log("SUCCESS", "Done!");
    }
}
