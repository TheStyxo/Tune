import { BaseCommand, CommandCTX } from '../../utils/structures/BaseCommand';
import { MusicUtil } from '../../utils/Utils';
import InternalPermissions from '../../database/utils/InternalPermissions';
import fuse from 'fuse.js';
const searchOptions = {
    isCaseSensitive: false,
    keys: [
        {
            name: 'title',
            weight: 2
        },
        'uri',
    ]
}

export default class RemoveCommand extends BaseCommand {
    constructor() {
        super({
            name: "remove",
            aliases: ["rem"],
            category: "music",
            description: "Remove a track/ multiple tracks from the queue."
        })
    }

    async run(ctx: CommandCTX) {
        if (!ctx.permissions.has("EMBED_LINKS")) return await ctx.channel.send("I don't have permissions to send message embeds in this channel");

        const res = MusicUtil.canModifyPlayer({
            guild: ctx.guild,
            member: ctx.member,
            textChannel: ctx.channel,
            requiredPermissions: ["MANAGE_QUEUE"],
            memberPermissions: ctx.guildSettings.permissions.users.getFor(ctx.member.id).calculatePermissions(ctx.member) || new InternalPermissions(0),
        });
        if (res.isError) return;

        if (!res.player?.queue.current) return ctx.channel.send(this.utils.embedifyString(ctx.guild, "The player queue is currently empty!", true));

        let start = null, end;

        if (!ctx.args.length) return await ctx.channel.send(this.utils.embedifyString(ctx.guild, "Please provide the position or name of the song to remove from the queue!", true));

        if (ctx.args.length && ctx.args[0] && !Number.isNaN(ctx.args[0]) && (!ctx.args[1] || !Number.isNaN(ctx.args[1]))) {
            start = parseInt(ctx.args[0]);
            if (ctx.args[1] && !Number.isNaN(ctx.args[1])) end = parseInt(ctx.args[1]);
        }

        if (start == null) {
            const queueTracksArray = res.player.queue;
            const searcher = new fuse(queueTracksArray, searchOptions);
            const searchResult = searcher.search(ctx.args.join());
            if (!searchResult[0]) return await ctx.channel.send(this.utils.embedifyString(ctx.guild, "Could not find a song in the queue with the title matching your query!", true));

            const removedTrack = res.player.queue.remove(searchResult[0].refIndex);

            const embedified = this.utils.embedifyString(ctx.guild, `**[${this.utils.discord.Util.escapeMarkdown(removedTrack[0].title)}](${removedTrack[0].uri})**\nRemoved from the queue by - ${ctx.member}`);
            await ctx.channel.send(embedified);
            if (res.player?.textChannel && ctx.channel.id !== res.player.textChannel.id) await res.player.textChannel.send(embedified);
            return removedTrack;
        }

        if (start - 1 < 0 || start > res.player.queue.size) return await ctx.channel.send(this.utils.embedifyString(ctx.guild, "The position given does not exist in the queue!", true));

        if (!end) {
            const removedTrack = res.player.queue.remove(start - 1);
            const embedified = this.utils.embedifyString(ctx.guild, `**[${this.utils.discord.Util.escapeMarkdown(removedTrack[0].title)}](${removedTrack[0].uri})**\nRemoved from the queue by - ${ctx.member}`);
            await ctx.channel.send(embedified);
            if (res.player?.textChannel && ctx.channel.id !== res.player.textChannel.id) await res.player.textChannel.send(embedified);
            return removedTrack;
        }

        if (end - 1 < 0 || end > res.player.queue.size) return await ctx.channel.send(this.utils.embedifyString(ctx.guild, "The end position given does not exist in the queue!", true));

        const removedTrack = res.player.queue.remove(start - 1, end);
        const embedified = this.utils.embedifyString(ctx.guild, `${ctx.member} Removed ${end - start} track${end - start > 1 ? 's' : ''} from the player queue.`);
        await ctx.channel.send(embedified);
        if (res.player?.textChannel && ctx.channel.id !== res.player.textChannel.id) await res.player.textChannel.send(embedified);
        return removedTrack;
    }
}