import { BaseCommand, CommandCTX } from '../../utils/structures/BaseCommand';
import { MusicUtil } from '../../utils/Utils';
import InternalPermissions from '../../database/utils/InternalPermissions';

export default class DisconnectCommand extends BaseCommand {
    constructor() {
        super({
            name: "disconnect",
            aliases: ["dc"],
            category: "music",
            description: "Make the bot disconnect from your voice channel and clear the queue."
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

        if (res.player?.queue.current) this.globalCTX.playingMessages.deleteMessage(res.player?.queue.current.uuid);
        res.player?.destroy();

        const embedified = this.utils.embedifyString(ctx.guild, `${ctx.member} Successfully disconnected me from the voice channel and cleared the queue!`);
        await ctx.channel.send(embedified);
        if (res.player?.textChannel && ctx.channel.id !== res.player.textChannel.id) await res.player.textChannel.send(embedified);
    }
}