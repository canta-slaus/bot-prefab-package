//@ts-check

const { Schema, model } = require('mongoose');
const { PREFIX } = require('../../config/config.json')

const guild = new Schema({
    _id: String,
    prefab: {
        prefix: {
            default: PREFIX,
            type: String
        },
        disabledCommands: Array,
        disabledChannels: Array,
        commandPerms: {},
        commandCooldowns: {},
        commandAlias: {}
    },

    // You can add your own things after this 
});

module.exports = model('guilds', guild);
