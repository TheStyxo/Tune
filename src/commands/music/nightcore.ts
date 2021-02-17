import { BaseCommand, CommandCTX } from '../../utils/structures/BaseCommand';
import { MusicUtil } from '../../utils/Utils';
import InternalPermissions from '../../database/utils/InternalPermissions';

export default class NightcoreCommand extends BaseCommand {
    constructor() {
        super({
            name: "nightcore",
            aliases: ["nc", "night"],
            category: "music",
            description: "Toggle the nightcore mode."
        })
    }

    async run(ctx: CommandCTX) {
        if (!ctx.permissions.has("EMBED_LINKS")) return await ctx.channel.send("I don't have permissions to send message embeds in this channel");

        let player = this.globalCTX.lavalinkClient.players.get(ctx.guild.id);

        const res = MusicUtil.canModifyPlayer({
            guild: ctx.guild,
            member: ctx.member,
            textChannel: ctx.channel,
            requiredPermissions: ["MANAGE_PLAYER"],
            memberPermissions: ctx.guildSettings.permissions.users.getFor(ctx.member.id).calculatePermissions(ctx.member) || new InternalPermissions(0),
            noPlayerRequired: true
        });
        if (res.isError) return;

        if (!player) player = res.player;

        const volumeRequested = parseInt(ctx.args[0].replace(/%*/g, "").replace(/(re)(?:(s|se|set)?)/, "100"));
        if (Number.isNaN(volumeRequested)) return await ctx.channel.send(this.utils.embedifyString(ctx.guild, `Please provide a numeric value between 0 and ${ctx.guildSettings.music.volume.limit} to set the volume to!`, true));

        if (volumeRequested > ctx.guildSettings.music.volume.limit) return await ctx.channel.send(this.utils.embedifyString(ctx.guild, `The volume limit is enabled on this server, the volume cannot be set to a value above ${ctx.guildSettings.music.volume.limit}%`, true));
        else if (volumeRequested > 1000) return await ctx.channel.send(this.utils.embedifyString(ctx.guild, "Please provide a numeric value between 0 and 1000 to set the volume to!", true));

        player?.setVolume(volumeRequested);

        if (ctx.guildSettings.permissions.users.getFor(ctx.member.id).calculatePermissions(ctx.member).has("MANAGE_PLAYER")) await ctx.guildSettings.music.volume.setPercentage(volumeRequested);

        const embedified = this.utils.embedifyString(ctx.guild, `${ctx.member} Set the volume to ${volumeRequested}%.`);
        await ctx.channel.send(embedified);
        if (res.player?.textChannel && ctx.channel.id !== res.player.textChannel.id) await res.player.textChannel.send(embedified);
    }
}