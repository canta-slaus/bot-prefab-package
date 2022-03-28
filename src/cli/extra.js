//@ts-check

const prompts = require('prompts');

const { getPrefix } = require('./utils');

/**
 * @type {import('./utils').CLICommand}
 */
module.exports = {
    long: "extra",
    short: "x",
    description: "Additional commands and tools",
    title: "...",
    promptIndex: 4,

    run: async ({ commands }) => {
        let len = 0;
        for (const command of commands) {
            if (command.extra && command.title.length > len) len = command.title.length;
        }

        const { action } = (await prompts([
            {
                type: "select",
                name: "action",
                message: "Which tool do you want to use?",
                choices: commands.filter(c => c.extra && c.promptIndex !== -1).map((c, i, a) => ({
                    title: `${getPrefix(i, a.length)} ${c.title}${" ".repeat(len - c.title.length)}   ${c.description}`,
                    value: c.long || c.short,
                    disabled: c.disabled
                })),
                warn: "This is still WIP!",
                hint: "Use arrow keys to navigate. Hit \"ENTER\" to select."
            }
        ]));

        if (!action) return;

        await commands.find(c => c.long === action || c.short === action).run({ commands });
    }
}
