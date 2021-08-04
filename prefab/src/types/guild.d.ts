declare interface GuildInfo {
    _id: string;
    prefab: {
        prefix: string;
        disabledCommands: string[];
        disabledChannels: string[];
        commandPerms: any;
        commandCooldowns: any;
        commandAlias: any;
    }
}

export { GuildInfo };
export default GuildInfo;
