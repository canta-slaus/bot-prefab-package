//@ts-check

const prompts = require('prompts');
const fs = require('fs-extra');
const path = require('path');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const dir = process.cwd();

module.exports = async () => {
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

    console.log("\u001b[33m> Creating new project...\u001b[0m");

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
            return console.log("\u001b[31m> Oops, I couldn't find the global package installation folders!\u001b[0m");
        }
    }

    await fs.mkdir(project);
    console.log("\u001b[32m> Created a new project folder!\u001b[0m");

    console.log("\u001b[33m> Generating files...\u001b[0m");
    await fs.copy(src, path.join(dir, project));
    console.log("\u001b[32m> Generated all files!\u001b[0m");

    console.log("\u001b[33m> Installing packages...\u001b[0m");
    await exec(`${pm} install`, { cwd: `./${project}` });
    const packagePath = path.join(dir, project, "package.json");
    const pkg = JSON.parse(await fs.readFile(packagePath, { encoding: "utf8" }));
    pkg.name = project.toLowerCase();
    await fs.writeFile(packagePath, JSON.stringify(pkg, null, 2));
    console.log("\u001b[32m> Installed all packages!\u001b[0m");

    console.log("\u001b[32m> Done!\u001b[0m");
}
