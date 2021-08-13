//@ts-check

const PrefabUtils = require('../../prefab/utils');

class Utils extends PrefabUtils {
    /** @param {import('./client')} client*/
    constructor(client) {
        super(client);
    }
}

module.exports = Utils;
