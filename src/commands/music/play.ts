import { BaseCommand, CommandCTX } from '../../utils/structures/BaseCommand';
import { CustomError, MusicUtil, Success } from '../../utils/Utils';
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
        let player = this.globalCTX.lavalinkClient.players.get(ctx.guild.id);

        if (!ctx.args.length) {
            if (player && !player.playing && player.queue && player.queue.current) {
                return this.globalCTX.commands.get('resume')!.run(ctx);
            }
            else if (player && player.playing && !player.paused) {
                return this.globalCTX.commands.get('pause')!.run(ctx);
            }
            else return await ctx.channel.send(this.utils.embedifyString(ctx.guild, `${ctx.member} Please provide a song title or link to search for!`, true));
        }


        const noPlayerExists = !player || !ctx.guild.me?.voice;
        let res = MusicUtil.canModifyPlayer({
            guild: ctx.guild,
            member: ctx.member,
            textChannel: ctx.channel,
            noPlayerRequired: noPlayerExists,
            isSpawnAttempt: noPlayerExists,
            requiredPermissions: noPlayerExists ? ["SUMMON_PLAYER", "ADD_TO_QUEUE"] : ["ADD_TO_QUEUE"],
            memberPermissions: ctx.guildSettings.permissions.users.getFor(ctx.member.id).calculatePermissions(ctx.member) || new InternalPermissions(0),
        });
        if (res.isError) return;

        //If no player summon one
        if (noPlayerExists) {
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