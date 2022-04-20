import { PermissionString, Collection, ApplicationCommandPermissionData, CommandInteraction, ApplicationCommandOptionData, ApplicationCommandSubCommandData, ApplicationCommandNonOptionsData, ApplicationCommandChannelOptionData, ApplicationCommandChoicesData, ApplicationCommandAutocompleteOption, ApplicationCommandNumericOptionData, ApplicationCommandSubGroupData } from "discord.js";
import { Client } from "../src/util/client";

class PrefabCommand {
    client: Client;
    name: string;
    description: string;
    category: string;
    options: ApplicationCommandOptionData[];
    defaultPermission: boolean;
    permissions: ApplicationCommandPermissionData[]
    development: boolean;
    devOnly: boolean;
    hideCommand: boolean;
    ownerOnly: boolean;
    guildOnly: boolean;
    perms: PermissionString[];
    clientPerms: PermissionString[];
    nsfw: boolean;
    cooldown: number;
    globalCooldown: boolean;
    ignoreDisabledChannels: boolean;
    canNotDisable: boolean;
    canNotSetCooldown: boolean;
    groups: { [x: string]: SubcommandGroup } | null;
    subcommands: { [x: string]: Subcommand } | null;
    execute?: ExecuteFunction;

    constructor (client: Client, options: CommandOptions) {
        this.client = client;
        this.name = options.name;
        this.description = options.description;
        this.execute = options.execute;

        this.options = options.options ?? [];
        this.groups = options.groups ?? null;
        this.subcommands = options.subcommands ?? null;

        if (this.groups && Object.keys(this.groups)) this.options = getSubcommandGroupOptions(this.groups);
        else if (this.subcommands && Object.keys(this.subcommands)) this.options = getSubcommandOptions(this.subcommands);

        this.category = options.category ?? "No category";
        this.permissions = options.permissions ?? [];
        this.development = options.development ?? true;
        this.devOnly = options.devOnly ?? false;
        this.defaultPermission = this.devOnly ? false : (options.defaultPermission ?? true);
        this.hideCommand = options.hideCommand ?? false;
        this.ownerOnly = options.ownerOnly ?? false;
        this.guildOnly = options.guildOnly ?? false;
        this.perms = options.perms ?? [];
        this.clientPerms = options.clientPerms ?? [];
        this.nsfw = options.nsfw ?? false;
        this.cooldown = options.cooldown ?? 0;
        this.globalCooldown = options.globalCooldown ?? true;
        this.canNotDisable = options.canNotDisable ?? false;
        this.canNotSetCooldown = options.canNotSetCooldown ?? false;
        this.ignoreDisabledChannels = options.ignoreDisabledChannels ?? false;
    }

    async setCooldown (interaction: CommandInteraction) {
        //@ts-ignore
        const cd = await this.client.utils.getCooldown(this, interaction);

        if (!cd) return;

        let cooldowns;
        if (typeof this.globalCooldown === 'undefined' || this.globalCooldown) {
            if (!this.client.globalCooldowns.has(this.name)) this.client.globalCooldowns.set(this.name, new Collection());
            cooldowns = this.client.globalCooldowns;
        } else {
            if (!this.client.serverCooldowns.has(interaction.guild!.id)) this.client.serverCooldowns.set(interaction.guild!.id, new Collection());
            cooldowns = this.client.serverCooldowns.get(interaction.guild!.id);
            if (!cooldowns!.has(this.name)) cooldowns!.set(this.name, new Collection());
        }

        const now = Date.now();
        const timestamps = cooldowns!.get(this.name);
        const cooldownAmount = cd * 1000;

        timestamps!.set(interaction.user.id, now);
        setTimeout(() => timestamps!.delete(interaction.user.id), cooldownAmount);
    }
}

export { PrefabCommand, CommandOptions };

declare interface SubcommandGroup {
    description: string;
    subcommands: { [x: string]: Subcommand }
}

declare interface Subcommand {
    description: string;
    options?: (ApplicationCommandNonOptionsData | ApplicationCommandChannelOptionData | ApplicationCommandChoicesData | ApplicationCommandAutocompleteOption | ApplicationCommandNumericOptionData)[];
    execute?: ExecuteFunction ;
}

declare interface CommandOptions {
    name: string;
    description: string;
    category?: string;
    options?: ApplicationCommandOptionData[];
    defaultPermission?: boolean;
    permissions?: ApplicationCommandPermissionData[]
    development?: boolean;
    devOnly?: boolean;
    hideCommand?: boolean;
    ownerOnly?: boolean;
    guildOnly?: boolean;
    perms?: PermissionString[];
    clientPerms?: PermissionString[];
    nsfw?: boolean;
    cooldown?: number;
    globalCooldown?: boolean;
    canNotDisable?: boolean;
    canNotSetCooldown?: boolean;
    ignoreDisabledChannels?: boolean;
    groups?: { [x: string]: SubcommandGroup } | null;
    subcommands?: { [x: string]: Subcommand } | null;
    execute?: ExecuteFunction;
}

type ExecuteFunction = ({ client, interaction, group, subcommand } : { client: Client, interaction: CommandInteraction, group: string, subcommand: string }) => any;

function getSubcommandGroupOptions (groups: { [key: string]: SubcommandGroup }): ApplicationCommandSubGroupData[] {
    const names = Object.keys(groups);
    const options = [];

    for (const name of names) {
        const option: ApplicationCommandOptionData = {
            name,
            description: groups[name].description,
            options: getSubcommandOptions(groups[name].subcommands),
            type: "SUB_COMMAND_GROUP"
        };

        options.push(option);
    }

    return options;
}

function getSubcommandOptions (subcommands: { [key: string]: Subcommand }): ApplicationCommandSubCommandData[] {
    const names = Object.keys(subcommands);
    const options = [];

    for (const name of names) {
        const option: ApplicationCommandSubCommandData = {
            name,
            description: subcommands[name].description,
            options: subcommands[name].options,
            type: "SUB_COMMAND"
        };

        options.push(option);
    }

    return options;
}
