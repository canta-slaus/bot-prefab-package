//@ts-check

const Command = require('../../util/command');
const { inspect } = require('util');
const { MessageAttachment } = require('discord.js');

module.exports = class Template extends Command {
    constructor (client) {
        super(client, {
            name: "eval",
            hideCommand: true,
            devOnly: true
        });
    }

    /**
     * @param {object} p
     * @param {import('../../util/client')} p.client
     * @param {import('discord.js').Message} p.message
     * @param {string[]} p.args 
     */
    async execute ({ client, message, args }) {
        /**
         * @param {string} text 
         */
        function clean (text) {
            if (typeof text === 'string') {
                text = text
                    .replace(/`/g, `\`${String.fromCharCode(8203)}`)
                    .replace(/@/g, `@${String.fromCharCode(8203)}`)
                    .replace(new RegExp(client.config.TOKEN, 'gi'), '****')
                    .replace(new RegExp(client.config.MONGODB_URI, 'gi'), '****');
            }
            return text;
        }

        let code = args.join(' ');
        code = code.replace(/[“”]/g, '"').replace(/[‘’]/g, "'");
        let evaled;
        try {
            const start = process.hrtime();
            evaled = eval(`(async () => { ${code} })();`);
            if (evaled instanceof Promise) {
                evaled = await evaled;
            }
            const stop = process.hrtime(start);
            const response = [
                `**Output:** \`\`\`js\n${clean(inspect(evaled, { depth: 0 }))}\n\`\`\``,
                `**Time Taken:** \`\`\`${(((stop[0] * 1e9) + stop[1])) / 1e6}ms\`\`\``
            ];
            const res = response.join('\n');
            if (res.length < 2000) {
                await message.channel.send(res);
            } else {
                const output = new MessageAttachment(Buffer.from(res), 'output.txt');
                await message.channel.send({ files: [output] });
            }
        } catch (err) {
            return message.channel.send(`Error: \`\`\`xl\n${clean(err)}\n\`\`\``);
        }
    }
}
