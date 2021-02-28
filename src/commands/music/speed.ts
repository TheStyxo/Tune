import { BaseCommand, CommandCTX } from '../../utils/structures/BaseCommand';
import { MusicUtil } from '../../utils/Utils';
import InternalPermissions from '../../database/utils/InternalPermissions';

export default class SpeedCommand extends BaseCommand {
    constructor() {
        super({
            name: "speed",
            aliases: ["sp"],
            category: "music",
            description: "Change the player speed."
        })
    }

    async run(ctx: CommandCTX) {
        let player = this.globalCTX.lavalinkClient.players.get(ctx.guild.id);

        const currentTimescale = (player?.filters.timescale || ctx.guildSettings.music.filters.timescale || {});
        if (!currentTimescale.speed) currentTimescale.speed = 1;

        if (!ctx.args.length) {
            return await ctx.channel.send(this.utils.embedifyString(ctx.guild, `The current player speed is set to ${(currentTimescale.speed * 100).toFixed(2)}%`));
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

        const speedRequested = parseInt(ctx.args[0].replace(/%*/g, "").replace(/(re)(?:(s|se|set)?)/, "100"));
        if (Number.isNaN(speedRequested) || speedRequested > 300 || speedRequested < 50) return await ctx.channel.send(this.utils.embedifyString(ctx.guild, `Please provide a numeric value between 50% and 300% to set the player speed to!`, true));

        const newTimescale = speedRequested === 100 && (!Object.keys(currentTimescale).length || !Object.values(currentTimescale).some(v => v !== 1)) ? undefined : Object.assign(currentTimescale, { speed: speedRequested / 100 });

        player?.setTimescale(newTimescale);
        if (res.memberPerms.has("MANAGE_PLAYER")) await ctx.guildSettings.music.setTimescale(newTimescale);

        const embedified = this.utils.embedifyString(ctx.guild, `${ctx.member} Set the player speed to ${speedRequested}%.`);
        await ctx.channel.send(embedified);
        if (res.player?.textChannel && ctx.channel.id !== res.player.textChannel.id) await res.player.textChannel.send(embedified);
    }
}