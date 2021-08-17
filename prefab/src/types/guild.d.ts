declare interface Guild {
    _id: string;
    prefab: {
        prefix: string;
        disabledCommands: string[];
        disabledChannels: string[];
        commandPerms: any;
        commandCooldowns: any;
        commandAlias: any;
    };
}

export { Guild };
export default Guild;
