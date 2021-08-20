declare interface Guild {
    _id: string;
    prefab: {
        disabledCommands: string[];
        disabledChannels: string[];
        commandPerms: any;
        commandCooldowns: any;
        commandAlias: any;
    };
}

export { Guild };
