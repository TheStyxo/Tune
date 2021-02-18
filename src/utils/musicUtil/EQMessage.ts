import { Utils } from '../Utils';
import { Player } from 'tune-lavalink-client';
import { GuildMember, Message, MessageReaction, ReactionCollector, TextChannel, User } from 'discord.js';
import GlobalCTX from '../GlobalCTX';
import GuildSettings from "../../database/structures/GuildSettings";

export interface EQMessageOptions {
    channel: TextChannel,
    player?: Player,
    guildSettings?: GuildSettings,
    viewOnly: boolean,
    requestedBy: GuildMember,
    modifyDB: boolean
}

export default class EQMessage {
    // Class props //
    channel: TextChannel;
    requestedBy: GuildMember;
    guildSettings?: GuildSettings;
    viewOnly: boolean;
    message?: Message;
    reactionCollector?: ReactionCollector;
    cursor = 0;
    modifyDB: boolean;
    // Class props //
    constructor({ channel, guildSettings, viewOnly, requestedBy, modifyDB }: EQMessageOptions) {
        this.channel = channel;
        this.requestedBy = requestedBy;
        this.guildSettings = guildSettings;
        this.viewOnly = viewOnly;
        this.modifyDB = modifyDB;
    }

    get player() {
        return GlobalCTX.lavalinkClient.players.get(this.channel.guild.id);
    }
    get bands() {
        return (this.player?.bands || this.guildSettings?.music.filters.equalizer?.map(v => v.gain)) ?? (Array(15).fill(0) as number[]);
    }

    async send() {
        this.message = await this.channel.send(convertBandsToGraph(this.bands) + (this.viewOnly ? `\n[No permission to modify]` : `\n[It may take up to 10 seconds for your changes to take effect]`), { code: true });

        if (this.viewOnly) this.message.delete({ timeout: 45000 });
        else {
            const permissions = this.channel.permissionsFor(this.channel.client.user!);
            if (!permissions?.has("SEND_MESSAGES")) return;
            if (!permissions.has("EMBED_LINKS")) return this.channel.send(Utils.embedifyString(this.channel.guild, "I don't have permissions to embed links in this channel!", true)).catch((err: Error) => GlobalCTX.logger?.error(err.message));
            if (!permissions.has("USE_EXTERNAL_EMOJIS")) return this.channel.send(Utils.embedifyString(this.channel.guild, "I don't have permissions to use external emojis in this channel!\nThis permission is required for reaction messages to work correctly", true)).catch((err: Error) => GlobalCTX.logger?.error(err.message));
            if (!permissions.has("USE_EXTERNAL_EMOJIS")) return this.channel.send(Utils.embedifyString(this.channel.guild, "I don't have permissions to use external emojis in this channel!\nThe playing message contains emojis from an external server which cannot be sent here without the permission to use external emojis!", true)).catch((err: Error) => GlobalCTX.logger?.error(err.message));

            const filter = (reaction: MessageReaction, user: User) => user.id === this.requestedBy.user.id;

            this.reactionCollector = this.message.createReactionCollector(filter, { time: 45000 });

            const reactionOptions = [
                Utils.appearance.emojis.arrow_left,
                Utils.appearance.emojis.arrow_up,
                Utils.appearance.emojis.arrow_down,
                Utils.appearance.emojis.arrow_right,
                Utils.appearance.emojis.reset
            ];

            /**
            * Reaction emojis add
            */
            for (const option of reactionOptions) {
                const emoji = await Utils.getEmoji(option);
                if (!emoji) continue;
                if (!this.message || this.message.deleted || !await this.message.react(emoji).catch((err: Error) => err.message !== "Unknown Message" ? GlobalCTX.logger?.error(err.message) : undefined)) return;
            }

            this.reactionCollector.on("collect", async (reaction: MessageReaction, user: User) => {
                const permissions = (reaction.message.channel as TextChannel).permissionsFor(user.client.user!);
                if (!permissions?.has("SEND_MESSAGES")) return;
                if (!permissions.has("EMBED_LINKS")) return this.channel.send(Utils.embedifyString(this.channel.guild, "I don't have permissions to embed links in this channel!", true)).catch((err: Error) => GlobalCTX.logger?.error(err.message));
                if (!permissions.has("USE_EXTERNAL_EMOJIS")) return this.channel.send(Utils.embedifyString(this.channel.guild, "I don't have permissions to use external emojis in this channel!\nThis permission is required for reaction messages to work correctly", true)).catch((err: Error) => GlobalCTX.logger?.error(err.message));
                if (!permissions.has("MANAGE_MESSAGES")) return this.channel.send(Utils.embedifyString(this.channel.guild, "I don't have permissions to manage messages in this channel!\nThis permission is required for reaction controls to work correctly", true)).catch((err: Error) => GlobalCTX.logger?.error(err.message));

                await reaction.users.remove(user).catch((err: Error) => GlobalCTX.logger?.error(err.message));
                this.reactionCollector?.resetTimer();

                switch (reaction.emoji.id) {
                    case Utils.appearance.emojis.arrow_left:
                        if (this.cursor - 1 >= 1) this.cursor -= 1;
                        await this.message?.edit(convertBandsToGraph(this.bands, this.cursor), { code: true });
                        break;

                    case Utils.appearance.emojis.arrow_up:
                        if (this.cursor > 0) {
                            const currentBandGain = parseFloat(parseFloat(this.bands[this.cursor - 1].toString()).toFixed(1));
                            const changedBandGain = parseFloat((currentBandGain + 0.1).toFixed(1));

                            if (changedBandGain <= 1) {
                                const newBand = { band: this.cursor - 1, gain: changedBandGain };

                                if (this.player) this.player.setEQ(newBand);
                                if (this.modifyDB) await this.guildSettings?.music.setEQ(newBand);

                                await this.message?.edit(convertBandsToGraph(this.bands, this.cursor), { code: true });
                            }
                        }
                        break;

                    case Utils.appearance.emojis.arrow_down:
                        if (this.cursor > 0) {
                            const currentBandGain = parseFloat(parseFloat(this.bands[this.cursor - 1].toString()).toFixed(1));
                            const changedBandGain = parseFloat((currentBandGain - 0.1).toFixed(1));

                            if (changedBandGain >= -0.3) {
                                const newBand = { band: this.cursor - 1, gain: changedBandGain };

                                if (this.player) this.player.setEQ(newBand);
                                if (this.modifyDB) await this.guildSettings?.music.setEQ(newBand);

                                await this.message?.edit(convertBandsToGraph(this.bands, this.cursor), { code: true });
                            }
                        }
                        break;

                    case Utils.appearance.emojis.arrow_right:
                        if (this.cursor + 1 <= 15) this.cursor += 1;
                        await this.message?.edit(convertBandsToGraph(this.bands, this.cursor), { code: true });
                        break;
                    case Utils.appearance.emojis.reset:
                        if (this.player) this.player.clearEQ();
                        if (this.modifyDB) await this.guildSettings?.music.clearEQ();

                        await this.message?.edit(convertBandsToGraph(this.bands, this.cursor), { code: true });
                        break;
                }
            })
                .on("end", () => {
                    this.message?.delete().catch((err: Error) => GlobalCTX.logger?.error(err.message));
                });
        }
    }
}

const bandLabels = ["25", "40", "63", "100", "160", "250", "400", "630", "1K", "1.6K", "2.5K", "4K", "6.3K", "10K", "16K"];
const gainLabels = ["- 0.25", "- 0.20", "- 0.10", "0.00", "+ 0.10", "+ 0.20", "+ 0.30", "+ 0.40", "+ 0.50", "+ 0.60", "+ 0.70", "+ 0.80", "+ 0.90", "+ 1.00"].reverse();

export interface bar {
    text: string,
    fill: number
}

function convertBandsToGraph(bands: number[], cursorLocation = 0) {
    let bars = bands.map((gain, index) => ({ text: bandLabels[index], fill: Math.max(1, Math.min(14, Math.floor(4 + (10 * Math.floor(gain * 100)) / 100))) }));

    let multiDimensionalArray: Array<Array<string>> = [];
    const labelsArray = makeFirstBarWithLabels(cursorLocation === 0 ? false : true);

    labelsArray.forEach((label, index) => {
        if (!multiDimensionalArray[index]) multiDimensionalArray[index] = [];
        multiDimensionalArray[index].push(label);
    })

    bars.forEach((bar, index) => {
        const renderedBar = makeVerticalBar(cursorLocation === 0 ? false : true, index === cursorLocation - 1 ? true : false, bar.fill, bar.text);
        renderedBar.forEach((value, index) => {
            if (!multiDimensionalArray[index]) multiDimensionalArray[index] = [];
            multiDimensionalArray[index].push(value)
        })
    })

    //return multiDimensionalArray
    let rows: string[] = [];
    multiDimensionalArray.forEach(array => rows.push(array.join(" ")))
    return rows.join("\n"); 7
}

function makeVerticalBar(addCursorLine: boolean, addCursor: boolean, fillHeight = 0, barText: string) {
    let elements = [];
    for (let i = 1; i <= 14; i++) elements.push(i <= 14 - fillHeight ? multiplyString(4, " ") : multiplyString(4, "▄"));
    elements.push(barText + multiplyString(4 - barText.length, " "));
    if (addCursor || addCursorLine) elements.push(multiplyString(barText.length, `${addCursor ? "^" : ` `}`) + multiplyString(4 - barText.length, " "));// bottom line
    return elements;
}

function makeFirstBarWithLabels(addCursorLine: boolean) {
    let elements = [];
    for (let i = 0; i < gainLabels.length; i++) elements.push(multiplyString(6 - gainLabels[i].length, " ") + `${gainLabels[i]}${" |"}`);
    elements.push(multiplyString(6 + (2), " "));
    if (addCursorLine) elements.push(multiplyString(6 + (2), " "));//cursor line
    return elements;
}

function multiplyString(times: number, string: string) {
    return Array(times + 1).join(string);
};