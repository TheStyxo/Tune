import { BaseCommand, CommandCTX } from '../../utils/structures/BaseCommand';
import { MusicUtil } from '../../utils/Utils';
import InternalPermissions from '../../database/utils/InternalPermissions';

export default class VolumeCommand extends BaseCommand {
    constructor() {
        super({
            name: "volume",
            aliases: ["v", "vol"],
            category: "music",
            description: "Change the player volume."
        })
    }

    async run(ctx: CommandCTX) {
        let player = this.globalCTX.lavalinkClient.players.get(ctx.guild.id);

        if (!ctx.args.length) {
            return await ctx.channel.send(this.utils.embedifyString(ctx.guild, `The current volume is set to ${player?.volume || ctx.guildSettings.music.volume.percentage}%`));
        }

        const res = MusicUtil.canModifyPlayer({
            guild: ctx.guild,
            member: ctx.member,
            textChannel: ctx.channel,
            requiredPermissions: ["MANAGE_PLAYER"],
            memberPermissions: ctx.guildSettings.permissions.users.getFor(ctx.member.id).calculatePermissions(ctx.member) || new InternalPermissions(0),
            noPlayerRequired: true
        });
        if (res.isError) return;

        const volumeRequested = parseInt(ctx.args[0].replace(/%*/g, "").replace(/(re)(?:(s|se|set)?)/, "100"));
        if (Number.isNaN(volumeRequested)) return await ctx.channel.send(this.utils.embedifyString(ctx.guild, `Please provide a numeric value between 0% and ${ctx.guildSettings.music.volume.limit}% to set the volume to!`, true));

        if (volumeRequested > ctx.guildSettings.music.volume.limit) return await ctx.channel.send(this.utils.embedifyString(ctx.guild, `The volume limit is enabled on this server, the volume cannot be set to a value above ${ctx.guildSettings.music.volume.limit}%`, true));
        else if (volumeRequested > 1000) return await ctx.channel.send(this.utils.embedifyString(ctx.guild, "Please provide a numeric value between 0% and 1000% to set the volume to!", true));

        player?.setVolume(volumeRequested);
        if (res.memberPerms.has("MANAGE_PLAYER")) await ctx.guildSettings.music.volume.setPercentage(volumeRequested);

        const embedified = this.utils.embedifyString(ctx.guild, `${ctx.member} Set the volume to ${volumeRequested}%.`);
        await ctx.channel.send(embedified);
        if (res.player?.textChannel && ctx.channel.id !== res.player.textChannel.id) await res.player.textChannel.send(embedified);
    }
}