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

export default class SkipCommand extends BaseCommand {
    constructor() {
        super({
            name: "skipto",
            aliases: ["st"],
            category: "music",
            description: "Skip to a specific song in the queue."
        })
    }

    async run(ctx: CommandCTX) {
        const res = MusicUtil.canModifyPlayer({
            guild: ctx.guild,
            member: ctx.member,
            textChannel: ctx.channel,
            requiredPermissions: ["MANAGE_PLAYER", "MANAGE_QUEUE"],
            memberPermissions: ctx.guildSettings.permissions.users.getFor(ctx.member.id).calculatePermissions(ctx.member) || new InternalPermissions(0),
        });
        if (res.isError) return;

        if (!res.player || !res.player.queue.current) return ctx.channel.send(this.utils.embedifyString(ctx.guild, "There is nothing playing right now!", true));

        if (!ctx.args.length) return ctx.channel.send(this.utils.embedifyString(ctx.guild, "Please provide a song name or index to skip to!", true));

        let position;
        if (ctx.args.length && ctx.args[0] && !Number.isNaN(ctx.args[0])) position = parseInt(ctx.args[0]);

        if (!position && position !== 0) {
            const queueTracksArray = res.player.queue;
            const searcher = new fuse(queueTracksArray, searchOptions);
            const searchResult = searcher.search(ctx.args.join());
            if (!searchResult[0]) return await ctx.channel.send(this.utils.embedifyString(ctx.guild, "Could not find a song in the queue with the title matching your query!", true));

            position = searchResult[0].refIndex + 1;
        }

        const skippedToTrack = res.player.queue[position - 1]
        res.player.skip(position);

        const embedified = this.utils.embedifyString(ctx.guild, `${ctx.member} Skipped to **[${this.utils.discord.Util.escapeMarkdown(skippedToTrack.title)}](${skippedToTrack.uri})**`);
        await ctx.channel.send(embedified);
        if (res.player?.textChannel && ctx.channel.id !== res.player.textChannel.id) await res.player.textChannel.send(embedified);
    }
}