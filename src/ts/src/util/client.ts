import { ClientOptions } from 'discord.js';
import { PrefabClient } from '../../prefab/client';

class Client extends PrefabClient {
    constructor(options: ClientOptions) {
        super(options);
    }
}

export { Client };
