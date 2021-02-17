import { BaseCommand, CommandCTX } from '../../utils/structures/BaseCommand';
import { MusicUtil } from '../../utils/Utils';
import InternalPermissions from '../../database/utils/InternalPermissions';

export default class ResumeCommand extends BaseCommand {
    constructor() {
        super({
            name: "resume",
            aliases: ["res"],
            category: "music",
            description: "Resumes the player."
        })
    }

    async run(ctx: CommandCTX) {
        if (!ctx.permissions.has("EMBED_LINKS")) return await ctx.channel.send("I don't have permissions to send message embeds in this channel");

        const res = MusicUtil.canModifyPlayer({
            guild: ctx.guild,
            member: ctx.member,
            textChannel: ctx.channel,
            requiredPermissions: ["MANAGE_PLAYER"],
            memberPermissions: ctx.guildSettings.permissions.users.getFor(ctx.member.id).calculatePermissions(ctx.member) || new InternalPermissions(0),
        });
        if (res.isError) return;

        if (res.player && res.player.playing) return ctx.channel.send(this.utils.embedifyString(ctx.guild, "The player is already playing!", true));
        if (!res.player || !res.player.queue.current) return ctx.channel.send(this.utils.embedifyString(ctx.guild, "There is nothing in the queue right now!", true));

        res.player?.pause(false);

        const embedified = this.utils.embedifyString(ctx.guild, `${ctx.member} Resumed the player!`);
        await ctx.channel.send(embedified);
        if (res.player?.textChannel && ctx.channel.id !== res.player.textChannel.id) await res.player.textChannel.send(embedified);
    }
}