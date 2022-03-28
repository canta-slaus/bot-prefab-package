//@ts-check

const prompts = require('prompts');

const { getPrefix } = require('./utils');

/**
 * @param {object} p
 * @param {import('./utils').CLICommand[]} p.commands
 */
module.exports = async ({ commands }) => {
    let len = 0;
    for (const command of commands) {
        if (!command.extra && command.title.length > len) len = command.title.length;
    }

    const action = (await prompts([
        {
            type: "select",
            name: "action",
            message: "What would you like to do?",
            choices: commands.filter(c => !c.extra && c.promptIndex !== -1).map((c, i, a) => ({
                title: `${getPrefix(i, a.length)} ${c.title}${" ".repeat(len - c.title.length)}   ${c.description}`,
                value: c.long || c.short,
                disabled: c.disabled
            })),
            hint: "Use arrow keys to navigate. Hit \"ENTER\" to select."
        }
    ])).action;

    return action;
}
