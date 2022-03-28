import { CommandInteraction } from 'discord.js';
import { PrefabCommand, CommandOptions } from '../../prefab/command';
import { Client } from './client';

class Command extends PrefabCommand {
    constructor(client: Client, options: CommandOptions) {
        super(client, options);
    }

    async additionalChecks(interaction: CommandInteraction) {
        return true;
    }
}

export { Command };
