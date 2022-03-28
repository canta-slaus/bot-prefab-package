const prefabGuild = {
    disabledCommands: [String],
    disabledChannels: [String],
    commandPerms: {},
    commandCooldowns: {},
    commandAlias: {}
}

const prefabProfile = {
    language: {
        default: 'default',
        type: String
    },
    embedColor: {
        default: 'default',
        type: String
    }
}

export {
    prefabGuild,
    prefabProfile
}
