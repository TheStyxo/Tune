import GlobalCTX from '../GlobalCTX';
import GuildData from '../../database/structures/Guild';
import GuildSettings from '../../database/structures/GuildSettings';
//import UserData from '../../database/structures/User';
import Utils from "../Utils";
import { GuildMember, TextChannel, Client, Permissions, Guild } from 'discord.js';

export class BaseCommand {
    name: string;
    aliases: string[] | undefined;
    category: string;
    description: string;
    cooldown: number;
    hidden: boolean;
    globalCTX = GlobalCTX;
    utils = Utils;

    constructor(options?: CommandProps) {
        const { name, aliases, category, description, cooldown, hidden } = check(options);
        this.name = name;
        this.aliases = aliases;
        this.category = category;
        this.description = description;
        this.cooldown = cooldown || 1000;
        this.hidden = hidden || false;
        this.globalCTX = GlobalCTX;
    }
    async run(ctx: CommandCTX, opts?: any): Promise<any> { };
    getUsage(guildPrefix: string): string | void { };
}

export interface CommandProps {
    name: string;
    aliases?: string[];
    category: string;
    description: string;
    cooldown?: number;
    hidden?: boolean;
}

function check(options?: CommandProps): CommandProps {
    if (!options) throw new TypeError("No options provided for command.");

    if (!options.name) throw new TypeError("No name provided for command.");
    if (typeof options.name !== 'string') throw new TypeError("Command option 'name' must be of type 'string'.");

    if (options.aliases && (Array.isArray(options.aliases) && options.aliases.some((e: any) => typeof e !== 'string'))) throw new TypeError("Aliases of command must be an array of strings.");

    if (!options.category) throw new TypeError("No category provided for command.");
    if (typeof options.category !== 'string') throw new TypeError("Command option 'category' must be of type 'string'.");

    if (!options.description) throw new TypeError("No description provided for command.");
    if (typeof options.description !== 'string') throw new TypeError("Command option 'description' must be of type 'string'.");

    if (typeof options.cooldown !== 'undefined' && typeof options.cooldown !== 'number') throw new TypeError("Command option 'cooldown' must be of type 'number'.");

    if (typeof options.hidden !== 'undefined' && typeof options.hidden !== 'boolean') throw new TypeError("Command option 'hidden' must be of type 'boolean'.");

    return options;
}

export interface CommandCTX {
    command: BaseCommand,
    args: string[],
    member: GuildMember,
    channel: TextChannel,
    guild: Guild,
    guildData: GuildData,
    guildSettings: GuildSettings,
    //userData: UserData,
    client: Client,
    permissions: Readonly<Permissions>,
    recievedTimestamp: number
}

export default BaseCommand;