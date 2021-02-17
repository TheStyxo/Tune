import { BaseCommand, CommandCTX } from '../../utils/structures/BaseCommand';
import { CustomError, MusicUtil, Success } from '../../utils/Utils';
import { VoiceChannel } from 'discord.js';
import InternalPermissions from '../../database/utils/InternalPermissions';

export default class PlayCommand extends BaseCommand {
    constructor() {
        super({
            name: "play",
            aliases: ["p"],
            category: "music",
            description: "Play a song using link or query."
        })
    }

    async run(ctx: CommandCTX) {
        if (!ctx.permissions.has("EMBED_LINKS")) return await ctx.channel.send("I don't have permissions to send message embeds in this channel");

        let player = this.globalCTX.lavalinkClient.players.get(ctx.guild.id);

        if (!ctx.args.length) {
            if (player && !player.playing && player.queue && player.queue.current) {
                const res = MusicUtil.canModifyPlayer({
                    guild: ctx.guild,
                    member: ctx.member,
                    textChannel: ctx.channel,
                    requiredPermissions: ["MANAGE_PLAYER"],
                    memberPermissions: ctx.guildSettings.permissions.users.getFor(ctx.member.id).calculatePermissions(ctx.member) || new InternalPermissions(0),
                });
                if (res.isError) return;
                player.pause(false);
                const embedified = this.utils.embedifyString(ctx.guild, `${ctx.member} Resumed the player!`);
                await ctx.channel.send(embedified);
                if (ctx.channel.id != player.textChannel.id) await player.textChannel.send(embedified);
                return;
            }
            else if (player && player.playing && !player.paused) {
                const res = MusicUtil.canModifyPlayer({
                    guild: ctx.guild,
                    member: ctx.member,
                    textChannel: ctx.channel,
                    requiredPermissions: ["MANAGE_PLAYER"],
                    memberPermissions: ctx.guildSettings.permissions.users.getFor(ctx.member.id).calculatePermissions(ctx.member) || new InternalPermissions(0),
                });
                if (res.isError) return;
                player.pause(true);
                const embedified = this.utils.embedifyString(ctx.guild, `${ctx.member} Paused the player!`);
                await ctx.channel.send(embedified);
                if (ctx.channel.id != player.textChannel.id) await player.textChannel.send(embedified);
                return;
            }
            else return await ctx.channel.send(this.utils.embedifyString(ctx.guild, `${ctx.member} Please provide a song title or link to search for!`, true));
        }

        let res: Success | CustomError | null = null;

        if (!player || !ctx.guild.me?.voice) {
            res = MusicUtil.canModifyPlayer({
                guild: ctx.guild,
                member: ctx.member,
                textChannel: ctx.channel,
                noPlayerRequired: true,
                isSpawnAttempt: true,
                requiredPermissions: ["SUMMON_PLAYER", "ADD_TO_QUEUE"],
                memberPermissions: ctx.guildSettings.permissions.users.getFor(ctx.member.id).calculatePermissions(ctx.member) || new InternalPermissions(0),
            });
            if (res.isError) return;
        }
        else {
            res = MusicUtil.canModifyPlayer({
                guild: ctx.guild,
                member: ctx.member,
                textChannel: ctx.channel,
                requiredPermissions: ["ADD_TO_QUEUE"],
                memberPermissions: ctx.guildSettings.permissions.users.getFor(ctx.member.id).calculatePermissions(ctx.member) || new InternalPermissions(0),
            });
            if (res.isError) return;
        }

        //If no player summon one
        if (!player || !ctx.guild.me?.voice) {
            const summonCommand = this.globalCTX.commands.get("summon")!;
            res = await summonCommand.run(ctx, res) as Success | CustomError;
            if (res.isError) return res;
        }

        player = res.player || this.globalCTX.lavalinkClient.players.get(ctx.guild.id);
        if (!player) return res;

        const searchRes = await player.search(ctx.args.join(" "), ctx.member);

        if (!searchRes) {
            return await ctx.channel.send(this.utils.embedifyString(ctx.guild, "An error occured while searching the track: `404 RESPONSE_TIMED_OUT`", true));
        }
        else if (searchRes.loadType === "NO_MATCHES") {
            return await ctx.channel.send(this.utils.embedifyString(ctx.guild, "Could not find any tracks matching your query!", true));
        }
        else if (searchRes.loadType === "LOAD_FAILED") {
            return await ctx.channel.send(this.utils.embedifyString(ctx.guild, `An error occured while searching the track: \`${searchRes.exception?.message ?? "UNKNOWN_ERROR"}\``, true));
        }

        const addedTracks = searchRes.loadType == "SEARCH_RESULT" ? [searchRes.tracks[0]] : searchRes.tracks;

        player.queue.add(addedTracks);

        const queuedEmbed = new this.utils.discord.MessageEmbed().setColor(this.utils.getClientColour(ctx.guild));

        if (player.queue.length > 0) {
            switch (searchRes.loadType) {
                case "PLAYLIST_LOADED":
                    queuedEmbed.setDescription(`**[${searchRes.playlist ? this.utils.discord.Util.escapeMarkdown(searchRes.playlist.name) : "Unknown Playlist"}](${/*searchRes.playlist?.uri*/0}) \n(${addedTracks.length} Tracks)**\n\`Added playlist to the queue by - \`${addedTracks[0].requester}\` \``);
                    await ctx.channel.send(queuedEmbed);
                    if (ctx.channel.id !== player.textChannel.id) player.textChannel.send(queuedEmbed);
                    break;
                default:
                    queuedEmbed.setDescription(`**[${this.utils.discord.Util.escapeMarkdown(addedTracks[0].title)}](${/*searchRes.playlist?.uri*/0}) \n(${addedTracks.length} Tracks)**\n\`Added track to the queue by - \`${addedTracks[0].requester}\` \``);
                    await ctx.channel.send(queuedEmbed);
                    if (ctx.channel.id !== player.textChannel.id) player.textChannel.send(queuedEmbed);
                    break;
            }
        }

        if (!player.playing && !player.paused) await player.play();
    }
}