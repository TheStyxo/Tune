import owners from "../../config/owners.json";
import settings from "../../config/settings.json";
import appearance from "../../config/appearance.json";
import credentials from "../../config/credentials.json";
import * as discord from "discord.js";
import chalk, { Chalk } from 'chalk';

import { BaseCommand, CommandCTX } from './structures/BaseCommand';
import GlobalCTX from "./GlobalCTX";
import InternalPermissions, { InternalPermissionResolvable } from "../database/utils/InternalPermissions";
import { Player } from "tune-lavalink-client";
import GuildData from "../database/structures/Guild";
import GuildSettings from "../database/structures/GuildSettings";
import { Client } from "discord.js";


export type Commands = discord.Collection<BaseCommand["name"], BaseCommand>;

export interface MessageParserCTX {
    prefix: string,
    commandsCollection: Commands,
    message: discord.Message,
    guildData: GuildData,
    guildSettings: GuildSettings
}

export class Cooldowns {
    static cooldowns = new discord.Collection<string, discord.Collection<string, number>>();

    static async check(command: BaseCommand, user: discord.User, channel: discord.TextChannel, message: discord.Message | null, add = true): Promise<boolean> {
        if (!this.cooldowns.has(command.name)) this.cooldowns.set(command.name, new discord.Collection<string, number>());

        const now = Date.now();
        const timestamps = this.cooldowns.get(command.name);
        const cooldownAmount = command.cooldown;

        if (timestamps?.has(user.id)) {
            const expirationTime = (timestamps.get(user.id) || 0) + cooldownAmount;
            if (now < expirationTime) {
                if (message && channel.permissionsFor(channel.client.user!)?.has('MANAGE_MESSAGES') && message.delete) await message.delete().catch((err: Error) => GlobalCTX.logger?.error(err.message));

                const timeLeft = (expirationTime - now) / 1000;
                await channel.send(Utils.embedifyString(channel.guild, `${user}, please wait ${timeLeft.toFixed(1)} more second(s) before reusing the \`${command.name}\` command.`, true))
                    .then(msg => {
                        msg.delete({ timeout: expirationTime - now }).catch((err: Error) => GlobalCTX.logger?.error(err.message))
                    });
                return true;
            }
        }

        if (add) {
            timestamps?.set(user.id, now);
            setTimeout(() => timestamps?.delete(user.id), cooldownAmount);
        }

        return false;
    }
}

export class MessageParser {
    static async parseCommand(ctx: MessageParserCTX): Promise<CommandCTX | null> {
        const recievedTimestamp = Date.now();
        const { prefix, commandsCollection, message } = ctx;

        if (typeof prefix !== 'string') throw new TypeError("'prefix' must be a string.");
        if (!(message instanceof discord.Message)) throw new TypeError("'message' must be a discord message.");
        if (!message.client.user) throw new TypeError("value of 'clientUser' is null.");
        if (!commandsCollection) throw new TypeError("value of 'commandsCollection' is null.");
        if (!message.guild) return null;

        const prefixes = [prefix, `<@${message.client.user.id}>`, `<@!${message.client.user.id}>`, message.client.user.id, message.client.user.username];
        const usedPrefix = prefixes.find(prefix => message.content.startsWith(prefix))

        if (!usedPrefix) return null;

        const args = message.content.trim().slice(usedPrefix.length).trim().split(/\s+/);
        const commandName = args.shift()?.toLowerCase();

        if (!commandName) return null;

        const command = commandsCollection.get(commandName) || commandsCollection.find((cmd) => cmd.aliases !== undefined && cmd.aliases.length > 0 && cmd.aliases.includes(commandName));
        if (!command) return null;

        const channel = message.channel as discord.TextChannel;
        const permissions = await Utils.getClientPermissionsForChannel(channel, message.author);
        if (!permissions) return null;

        //Handle cooldown
        if (await Cooldowns.check(command, message.author, message.channel as unknown as discord.TextChannel, message)) return null;

        if (usedPrefix !== prefix) {
            message.mentions.users.delete(message.client.user.id);
            if (message.mentions.members) message.mentions.members.delete(message.client.user.id);
        }


        return { command, args, rawContent: message.content.trim().slice(usedPrefix.length).trim().slice(commandName.length).trim(), member: message.member as discord.GuildMember, channel, client: message.client, permissions, recievedTimestamp, guild: message.guild, guildData: ctx.guildData, guildSettings: ctx.guildSettings, isInteraction: false }
    }
}

export class Utils {
    public static readonly owners = owners;
    public static readonly settings = settings;
    public static readonly appearance = appearance;
    public static readonly credentials = credentials;
    public static readonly discord = discord;
    public static readonly emojisCache = new discord.Collection<string, discord.GuildEmoji>();

    /**
     * Get the displayed colour of the client in a guild.
     * @param guild [Required] A discord "Guild"
     * @param raw [false] Wether to return the raw color in the guild or default to the default colour in 'appearance.general.colour' if none was returned from the guild
     */
    public static getClientColour(guild: discord.Guild, raw: boolean = false): string {
        if (!(guild instanceof discord.Guild)) throw new TypeError("The provided value for 'guild' is not a discord 'Guild'");
        if (typeof raw !== 'boolean') throw new TypeError("The provided value for 'raw' is not a 'Boolean'");

        const clientMember = guild.members.resolve(guild.client.user!);
        if (!clientMember) throw new TypeError("Client is not a member of the guild.");

        const colour = clientMember.displayHexColor;
        return (colour === "#000000" || !colour) && !raw ? this.appearance.colours.general : colour;
    }

    /**
     * Convert any text to a simple embed with the text as it's description.
     * @param guild A discord "Guild" or null
     * @param text [Required] Any text to include in the embed description
     * @param isError [false] If the error colour should be used as embed colour from 'appearance.error.colour'
     * @param embedColour [optional] The colour of the embed
     */
    public static embedifyString(guild: discord.Guild | null, text: string, isError: boolean = false, embedColour?: string): discord.MessageEmbed {
        if (guild !== null && !(guild instanceof discord.Guild)) throw new TypeError("The provided value for 'guild' is not a discord 'Guild'");
        if (typeof text !== 'string') throw new TypeError("The provided value for 'text' is not a 'String'");
        if (typeof isError !== 'boolean') throw new TypeError("The provided value for 'isError' is not a 'Boolean'");
        if (typeof embedColour !== 'undefined' && typeof embedColour !== 'string') throw new TypeError("The provided value for 'embedColour' is not a 'String'");

        if (!embedColour && guild) embedColour = isError ? appearance.colours.error : this.getClientColour(guild);
        return new discord.MessageEmbed({ color: embedColour || appearance.colours.general, description: text });
    }

    /**
     * Compare two arrays and get missing elements.
     * @param array The array in which to check elements.
     * @param needed The needed elements.
     */
    public static getMissingFromArray(array: any, needed: any): any[] | null {
        if (array && !Array.isArray(array)) array = [array];
        if (needed && !Array.isArray(needed)) needed = [needed];
        if (!array) return needed;
        if (!needed) return null;
        const mis = needed.filter((p: any) => !array.includes(p))
        return mis.length > 0 ? mis : null;
    }

    /**
     * Convert the first letter of a string to caps
     * @param string The string to change the first letter
     */
    public static firstLetterCaps(string: string): string {
        if (typeof string !== 'string') throw new TypeError("The provided value for 'string' is not a 'String'");
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    /**
     * Limit the length of a string to a specified value and optionally append it with some characters
     * @param string The string to limit length of
     * @param opts Options
     */
    public static limitLength(text: string, { maxLength = 2000, splitAt = '\n', prepend = '', append = '...' }: limitLengthOpts = {}): string {
        if (typeof text !== 'string') throw new TypeError("The provided value for 'text' is not a 'String'");
        if (typeof maxLength !== 'number') throw new TypeError("The provided value for 'maxLength' is not a 'Number'");
        return discord.Util.splitMessage(text, { maxLength, char: splitAt, prepend, append })[0];
    };

    /**
     * Get the mean of array elements
     * @param array The array containing numbers
     */
    public static getArrayAverage(array: number[]): number {
        return array.reduce((a, b) => a + b) / array.length;
    }

    /**
     * Multiply a string by a number of times (like python "x"*n)
     * @param array The array containing numbers
     */
    public static multiplyString(times: number, string: string): string {
        return Array(times + 1).join(string);
    };


    public static async getEmoji(id: string) {
        const emojiConfig = this.appearance.emojis as unknown as EmojisConfig

        if (!/^\d+$/.test(id)) id = emojiConfig[id];
        if (!id) return await this.emojiNotFound();

        const cache = this.emojisCache.get(id);
        if (cache) return cache;

        const emoji = GlobalCTX.client.emojis.cache.get(id) || await this.broadcastAndFindEmoji(id);

        if (!emoji) return await this.emojiNotFound();

        this.emojisCache.set(id, emoji);
        return emoji;
    }

    public static async emojiNotFound() {
        let emoji = this.emojisCache.get(appearance.emojis.not_found.id)!;
        if (!emoji) {
            // @ts-expect-error because api is private
            const guildData = await GlobalCTX.client.api.guilds(appearance.emojis.not_found.guild).get();
            if (!guildData) return null;
            emoji = new discord.GuildEmoji(GlobalCTX.client, appearance.emojis.not_found, new discord.Guild(GlobalCTX.client, guildData));
            this.emojisCache.set(appearance.emojis.not_found.id, emoji);
        }
        return emoji;
    }

    /**
     * Get an emoji on the client and process it for sending through broadcast eval
     * @param client The client to get the emoji for
     * @param id the string id of the emoji
     */
    public static getToSendEmoji = (client: Client, id: string) => {
        const temp: discord.GuildEmoji | undefined = client.emojis.cache.get(id);
        if (!temp) return null;

        const emoji = Object.assign({}, temp);
        // @ts-expect-error
        if (emoji.guild) emoji.guild = emoji.guild.id;
        // @ts-expect-error
        emoji.require_colons = emoji.requiresColons;

        return emoji;
    }

    /**
     * Use broadcast eval to find emoji on other shards
     * @param id the string id of the emoji
     */
    public static async broadcastAndFindEmoji(id: string) {
        const res = await GlobalCTX.client.shard?.broadcastEval(`(${this.getToSendEmoji}).call(this, this, '${id}')`).catch((err: Error) => GlobalCTX.logger?.error(err.message));
        if (!res) return null;

        const emojiData = res.find((emoji: any) => emoji);
        if (!emojiData) return null;

        // @ts-expect-error because api is private
        const guildData = await GlobalCTX.client.api.guilds(emojiData.guild).get();
        const guild = new discord.Guild(GlobalCTX.client, guildData);

        return new discord.GuildEmoji(GlobalCTX.client, emojiData, guild);
    }

    public static async getClientPermissionsForChannel(channel: discord.TextChannel, userToDM?: discord.User) {
        if (!userToDM) userToDM = channel.guild.owner?.user;
        const permissions = channel.permissionsFor(channel.client.user!);
        if (permissions?.has("SEND_MESSAGES")) return permissions;
        const invite = permissions?.has("CREATE_INSTANT_INVITE") ? await (await channel.createInvite({ maxAge: 0, reason: "Error occured in channel!" })).toString() : null;
        if (userToDM) await this.sendDirectMessageHandler(this.embedifyString(null, `I dont have permissions to send messages${invite ? "" : " and create invites"} on ${invite ? `**[${channel.guild.name}](${invite})**` : `\`${channel.guild.name}\``} in ${invite ? `**[#${channel.name}](${invite})**` : `\`#${channel.name}\``}`), userToDM, channel.guild.owner?.user);
    }

    public static async sendDirectMessageHandler(messageToBeSent: any, userToDM: discord.User, altUserToDM?: discord.User): Promise<{ success: boolean, obj?: discord.Message, error?: Error }> {
        try {
            const obj = await userToDM.send(messageToBeSent);
            return { success: true, obj: obj };
        }
        catch (error) {
            return altUserToDM ? this.sendDirectMessageHandler(messageToBeSent, altUserToDM) : { success: false, error };
        }
    }

    public static generateNoPermsMessage(missing: discord.PermissionString[]) {
        return `I don't have the following permissions for the command to work properly in this channel!\n\n•\`${missing.join("\n•`")}\``;
    }
}

export class CustomError {
    // Class props //
    flag: FLAG;
    memberPerms: InternalPermissions;
    missingPerms?: string[]
    isPermsError = false;
    readonly isSuccess = false;
    readonly isError = true;
    // Class props //
    constructor(flag: FLAG, memberPerms?: InternalPermissions, missingPerms?: string[]) {
        this.flag = flag;
        this.memberPerms = memberPerms || new InternalPermissions(0);
        if (missingPerms && missingPerms.length > 0) {
            this.isPermsError = true;
            this.missingPerms = missingPerms;
        }
    }
}

export class Success {
    // Class props //
    flag: FLAG;
    memberPerms: InternalPermissions;
    authorVoiceChannel?: discord.VoiceChannel;
    player?: Player;
    readonly isSuccess = true;
    readonly isError = false;
    // Class props //
    constructor(flag: FLAG, memberPerms?: InternalPermissions, authorVoiceChannel?: discord.VoiceChannel, player?: Player) {
        this.flag = flag;
        this.memberPerms = memberPerms || new InternalPermissions(0);
        this.authorVoiceChannel = authorVoiceChannel;
        this.player = player;
    }
}

export enum FLAG {
    NULL = 1 << 0,
    NO_PLAYER = 1 << 1,
    PLAYER_ALREADY_EXISTS = 1 << 2,
    NO_AUTHOR_CHANNEL_AND_PLAYER_EXISTS = 1 << 3,
    PLAYER_IN_DIFFERENT_CHANNEL = 1 << 4,
    PLAYER_ALREADY_EXISTS_SAME_CHANNEL = 1 << 5,
    NO_PERMS_AND_NOT_ALONE = 1 << 6,
    NO_VOICE_CHANNEL = 1 << 7,
    NO_PERMS_TO_SPAWN_PLAYER = 1 << 8,
    NO_PERMS_AND_NO_PLAYER = 1 << 9,
    HAS_PERMS = 1 << 10,
    NO_PERMS_BUT_ALONE = 1 << 11,
    HAS_PERMS_TO_SPAWN_PLAYER = 1 << 12,
    HAS_PERMS_AND_NO_PLAYER = 1 << 13,
    VIEW_ONLY = 1 << 14,
    NO_EMBED_PERMISSION = 1 << 15,
    RESPAWNED = 1 << 16,
    NO_BOT_PERMS_VIEW_CHANNEL = 1 << 17,
    NO_BOT_PERMS_CONNECT = 1 << 18,
    NO_BOT_PERMS_SPEAK = 1 << 19,
}

export class MusicUtil {
    private static async sendError(message: string, channel: discord.TextChannel) {
        return await channel.send(Utils.embedifyString(channel.guild, message, true));
    }
    public static canModifyPlayer(options: CanModifyPlayerOptions): Success | CustomError {
        const { guild, member, textChannel, memberPermissions, requiredPermissions, vcMemberAmtForAllPerms, noPlayerRequired, isSpawnAttempt, sendError, allowViewOnly } = Object.assign({ vcMemberAmtForAllPerms: 2, noPlayerRequired: false, isSpawnAttempt: false, sendError: true, allowViewOnly: false }, options);
        const player = GlobalCTX.lavalinkClient.players.get(guild.id);
        const { channel: botVc } = guild.me?.voice || {};
        const { channel: memberVc } = member.voice;

        if (!noPlayerRequired && !player) {
            if (sendError) this.sendError("There is nothing playing right now!", textChannel);
            return new CustomError(FLAG.NO_PLAYER, memberPermissions);
        }

        if (player && botVc) {
            if (!memberVc) {
                if (isSpawnAttempt) {
                    if (sendError) this.sendError("Already playing in a different channel!", textChannel);
                    return new CustomError(FLAG.PLAYER_ALREADY_EXISTS, memberPermissions);
                }
                if (sendError) this.sendError("You need to be in the same voice channel as the bot to use that command!", textChannel);
                return new CustomError(FLAG.NO_AUTHOR_CHANNEL_AND_PLAYER_EXISTS, memberPermissions);
            }
            else {
                if (memberVc.id !== botVc.id) {
                    if (isSpawnAttempt) {
                        if (sendError) this.sendError("Already playing in a different channel!", textChannel);
                        return new CustomError(FLAG.PLAYER_ALREADY_EXISTS, memberPermissions);
                    }
                    if (sendError) this.sendError("You need to be in the same voice channel as the bot to use that command!", textChannel);
                    return new CustomError(FLAG.PLAYER_IN_DIFFERENT_CHANNEL, memberPermissions);
                }
                else {
                    if (isSpawnAttempt) {
                        if (sendError) this.sendError("Already playing in your voice channel!", textChannel);
                        return new CustomError(FLAG.PLAYER_ALREADY_EXISTS_SAME_CHANNEL, memberPermissions);
                    }
                    const vcMemberCount = memberVc.members.filter(m => !m.user.bot).size;
                    const missingPerms = memberPermissions.missing(requiredPermissions);
                    const hasPerms = !missingPerms || missingPerms.length === 0;
                    if (hasPerms) return new Success(FLAG.HAS_PERMS, memberPermissions, memberVc, player);
                    else {
                        if (vcMemberCount > vcMemberAmtForAllPerms) {
                            if (sendError) this.sendError(`You dont have \`${missingPerms.join("`, `")}\` permission${missingPerms.length > 1 ? `s` : ``} to do that!\nBeing alone in the channel works too!`, textChannel);
                            return new CustomError(FLAG.NO_PERMS_AND_NOT_ALONE, memberPermissions);
                        }
                        return new Success(FLAG.NO_PERMS_BUT_ALONE, memberPermissions, memberVc, player);
                    }
                }
            }
        }
        else {
            const missingPerms = memberPermissions.missing(requiredPermissions);
            const hasPerms = !missingPerms || missingPerms.length === 0;
            if (hasPerms) {
                if (isSpawnAttempt && !memberVc) {
                    if (sendError) this.sendError("You need to be in a voice channel to use that command!", textChannel);
                    return new CustomError(FLAG.NO_VOICE_CHANNEL, memberPermissions);
                }
                if (isSpawnAttempt) return new Success(FLAG.HAS_PERMS_TO_SPAWN_PLAYER, memberPermissions, memberVc!);
                return new Success(FLAG.HAS_PERMS_AND_NO_PLAYER, memberPermissions);
            }
            else {
                if (isSpawnAttempt) {
                    if (!memberVc) {
                        if (sendError) this.sendError("You need to be in a voice channel to use that command!", textChannel);
                        return new CustomError(FLAG.NO_VOICE_CHANNEL, memberPermissions);
                    }
                    else {
                        const vcMemberCount = memberVc.members.filter(m => !m.user.bot).size;
                        if (vcMemberCount > vcMemberAmtForAllPerms) {
                            if (sendError) this.sendError(`You dont have \`${missingPerms.join("`, `")}\` permission${missingPerms.length > 1 ? `s` : ``} to do that!\nBeing alone in the channel works too!`, textChannel);
                            return new CustomError(FLAG.NO_PERMS_TO_SPAWN_PLAYER, memberPermissions);
                        }
                        return new Success(FLAG.NO_PERMS_BUT_ALONE, memberPermissions, memberVc);
                    }
                }
                else {
                    if (allowViewOnly) return new Success(FLAG.VIEW_ONLY, memberPermissions);
                    else {
                        if (sendError) this.sendError("There is nothing playing right now!", textChannel);
                        return new CustomError(FLAG.NO_PERMS_AND_NO_PLAYER, memberPermissions);
                    }
                }
            }
        }
    }
}
export interface CanModifyPlayerOptions {
    guild: discord.Guild,
    member: discord.GuildMember,
    textChannel: discord.TextChannel,
    memberPermissions: InternalPermissions,
    requiredPermissions: InternalPermissionResolvable,
    vcMemberAmtForAllPerms?: number,
    noPlayerRequired?: boolean,
    isSpawnAttempt?: boolean,
    sendError?: boolean,
    allowViewOnly?: boolean
}

export type CanModifyPlayerResult = {
    success?: {
        message: string,
        code: number
    },
    error?: {
        message: string,
        code: number
    },
    authorVoiceChannel?: discord.VoiceChannel,
    player?: Player
};

export interface EmojisConfig {
    [key: string]: string
}

interface limitLengthOpts {
    maxLength?: number;
    splitAt?: string;
    prepend?: string;
    append?: string;
}

export class Logger {
    // Class props //
    initiated: boolean;
    shardID?: number;
    chalk: Chalk;
    // Class props //

    constructor() {
        this.chalk = chalk;
        this.initiated = false;
    }

    init(shardID?: number): this {
        this.shardID = shardID;
        this.initiated = true;
        return this
    }

    get identifier() {
        if (!this.initiated) throw new Error("Logger is not initiated.");

        return `${chalk.blueBright(`[${typeof this.shardID !== 'undefined' ? `SHARD-${this.shardID}` : "MANAGER"}]`)} ${chalk.yellowBright(`=> `)}`
    }

    log(message: string): undefined {
        if (!this.initiated) throw new Error("Logger is not initiated.");
        if (typeof message !== 'string') throw new TypeError("Message to log must be a string.");

        console.log(this.identifier + chalk.green(message));
        return;
    }

    info(message: string): undefined {
        if (!this.initiated) throw new Error("Logger is not initiated.");
        if (typeof message !== 'string') throw new TypeError("Message to log must be a string.");

        console.log(this.identifier + chalk.cyan(message));
        return;
    }

    error(message: string): undefined {
        if (!this.initiated) throw new Error("Logger is not initiated.");
        if (typeof message !== 'string') throw new TypeError("Message to log must be a string.");

        console.trace(Utils.multiplyString(7, "\b") + this.identifier + chalk.redBright(message));
        return;
    }

    warn(message: string): undefined {
        if (!this.initiated) throw new Error("Logger is not initiated.");
        if (typeof message !== 'string') throw new TypeError("Message to log must be a string.");

        console.trace(Utils.multiplyString(7, "\b") + this.identifier + chalk.yellowBright(message));
        return;
    }
}

export default Utils;