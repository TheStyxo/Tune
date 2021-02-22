import { BaseCommand, CommandCTX } from '../../utils/structures/BaseCommand';
import { MusicUtil } from '../../utils/Utils';
import InternalPermissions from '../../database/utils/InternalPermissions';
export const mainBassBand = 1;
export const bassBands = [0, 1, 2, 3];
const effectivenessOnBand = [50, 100, 80, 60];

export default class BassboostCommand extends BaseCommand {
    constructor() {
        super({
            name: "bassboost",
            aliases: ["bb", "bass"],
            category: "music",
            description: "Change the bassboost value."
        })
    }

    async run(ctx: CommandCTX) {
        let player = this.globalCTX.lavalinkClient.players.get(ctx.guild.id);

        if (!ctx.args.length) {
            return await ctx.channel.send(this.utils.embedifyString(ctx.guild, `The current bassboost is set to ${convertToPercent(player?.bands[mainBassBand] || (ctx.guildSettings.music.filters.equalizer?.map(v => v.gain) || Array(15).fill(0))[mainBassBand])}% `));
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

        if (!player) player = res.player;

        const bassboostString = ctx.args[0].replace(/%*/g, "").replace(/(re)(?:(s|se|set)?)/, "0");
        const bassboostRequested = Number.isNaN(bassboostString) ? null : parseInt(bassboostString);
        if (bassboostRequested === null || bassboostRequested < -100 || bassboostRequested > 400) return await ctx.channel.send(this.utils.embedifyString(ctx.guild, "Please provide a numeric value between -100 and 400 to set the bassboost to!", true));
        const bassboostGain = convertFromPercent(bassboostRequested);

        const bandsArray = [];
        for (const index in bassBands) {
            bandsArray.push({ band: bassBands[index], gain: parseFloat(((effectivenessOnBand[index] / 100) * bassboostGain).toFixed(2)) });
        }

        player?.setEQ(...bandsArray);

        if (res.memberPerms.has("MANAGE_PLAYER")) await ctx.guildSettings.music.setEQ(...bandsArray);

        const embedified = this.utils.embedifyString(ctx.guild, `${ctx.member} Set the bassboost to ${bassboostRequested}%.`);
        await ctx.channel.send(embedified);
        if (res.player?.textChannel && ctx.channel.id !== res.player.textChannel.id) await res.player.textChannel.send(embedified);
    }
}

export const convertToPercent = (gain: number) => (gain * 100) / 0.25;
export const convertFromPercent = (percent: number) => (percent / 100) * 0.25;