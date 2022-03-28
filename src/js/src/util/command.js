//@ts-check

const PrefabCommand = require('../../prefab/command');

class Command extends PrefabCommand {
    /**
     * @param {import('./client')} client 
     * @param {import('../../prefab/command').CommandOptions} options 
     */
    constructor(client, options) {
        super(client, options);
    }

    /**
     * @param {import('discord.js').CommandInteraction} interaction 
     * @returns {Promise<boolean>}
     */
    async additionalChecks(interaction) {
        return true;
    }
}

module.exports = Command;
