# 80/04/2022 (v3.3.0)
- updated types of the `interaction` for `fetchReply(interaction, options)` and `replyOrEdit(interaction, options)`
- updated `paginate()` to look less messy and use a collector instead of calling `awaitMesssageComponent`
- fixed eval and permissions command class name (previously `Channels`, good old copy-pasting)
- fixed JSDoc string for `getCooldown(command, interaction)`
- fixed `Command.defaultPermission` when using `devOnly`
- deleted random `const { interactionCreate } = require('../../../prefab/events');` from `help.js`
- added `pagination()` function, example usage:
```js
await client.utils.pagination(interaction, { time: 30000, maxPages: 10, pages: n => {
    return new MessageEmbed()
        .setDescription(`This is page ${n}`);
} });
```
- Better docs coming soon!

# 28/03/2022 (v3.2.0)
- **There are some breaking changes in this update (listed at the end)**
- A lot of CLI-side changes (mostly structural changes and bug fixes)
- Languages: Changed the default value to `'default'` (before: `'english'`). This was both changed in the `languange.json` and the `prefabProfile` for the user schema
- Slash command loading: Previously, whenever you restarted the bot, it would re-set all the commands, making it painfully slow sometimes and even possibly hit the rate limit for creating slash commands. Now, it checks whether a command is new, edited, deleted or the same (in which case it won't do any API requests).
- PrefabCommand: fixed types for `command.groups` and `commands.subcommands` to comply with D.js v13.6.0
- Command: added new empty `additionalChecks(interaction: CommandInteraction)` that allows you to add your own checks to see if someone can use that command or not (it is executed _after_ all prefab-side checks)
- Added two more utility functions: `fetchReply(interaction, options)` and `replyOrEdit(interaction, options)`
- Added an event listener to listen to `process.on("unhandledRejection", () => { ... })`

- **Breaking change** Instead of adding an execute method to the command class, the execute function is now passed in as an option.
So instead of having:
```js
//@ts-check

const Command = require('../util/command');

module.exports = class Template extends Command {
    constructor (client) {
        super(client, {
            name: "template",
            description: "This is a template"
        });
    }

    /**
     * @param {object} p
     * @param {import('../util/client')} p.client
     * @param {import('discord.js').CommandInteraction} p.interaction
     * @param {string} p.group
     * @param {string} p.subcommand
     */
    async execute ({ client, interaction, group, subcommand }) {
        // 
    }
}
```
You now have to do:
```js
//@ts-check

const Command = require('../util/command');

module.exports = class Template extends Command {
    /**
     * @param {import('../util/client')} client 
     */
    constructor (client) {
        super(client, {
            name: "template",
            description: "This is a template",
            execute: async ({ client, interaction, group, subcommand }) => {
                // 
            }
        });
    }
}
```
- **Breaking change** The `pagination` and `getReply` function headers were changed

If you have any questions, suggestions or issues, message me on Discord: `canta#5556`