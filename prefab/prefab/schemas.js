//@ŧs-check

const { PREFIX } = require('../config/config.json');

const prefabGuild = {
    prefix: {
        default: PREFIX,
        type: String
    },
    disabledCommands: [String],
    disabledChannels: [String],
    commandPerms: {},
    commandCooldowns: {},
    commandAlias: {}
}

const prefabProfile = {
    language: {
        default: 'english',
        type: String
    },
    embedColor: {
        default: 'default',
        type: String
    }
}

module.exports = { prefabGuild, prefabProfile };
