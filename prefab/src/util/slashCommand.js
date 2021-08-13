//@ts-check

const PrefabSlashCommand = require('../../prefab/slashCommand');

class SlashCommand extends PrefabSlashCommand {
    /**
     * @param {import('./client')} client 
     * @param {import('../../prefab/slashCommand').SlashCommandOptions} options 
     */
    constructor(client, options) {
        super(client, options);
    }
}

module.exports = SlashCommand;
