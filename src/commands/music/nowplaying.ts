import { BaseCommand, CommandCTX } from '../../utils/structures/BaseCommand';
import { MusicUtil } from '../../utils/Utils';
import InternalPermissions from '../../database/utils/InternalPermissions';
import { Player, Track } from '6ec0bd7f/dist';
//@ts-expect-error Coz string progressbar is not for ts
import createBar from 'string-progressbar';

export default class NowPlayingCommand extends BaseCommand {
    constructor() {
        super({
            name: "nowplaying",
            aliases: ["np"],
            category: "music",
            description: "View the current playing song."
        })
    }

    async run(ctx: CommandCTX) {
        if (!ctx.permissions.has("EMBED_LINKS")) return await ctx.channel.send("I don't have permissions to send message embeds in this channel");


        const res = MusicUtil.canModifyPlayer({
            guild: ctx.guild,
            member: ctx.member,
            textChannel: ctx.channel,
            requiredPermissions: ["VIEW_QUEUE"],
            memberPermissions: ctx.guildSettings.permissions.users.getFor(ctx.member.id).calculatePermissions(ctx.member) || new InternalPermissions(0),
        });
        if (res.isError) return;

        if (!res.player?.queue.current) return await ctx.channel.send(this.utils.embedifyString(ctx.guild, "There is nothing playing right now!", true));

        const nowPlayingEmbed = new this.utils.discord.MessageEmbed()
            .setTitle(`${await this.utils.getEmoji("musical_notes")} Now playing! ${await this.utils.getEmoji("playing")}`)
            .setDescription(`**[${this.utils.discord.Util.escapeMarkdown(res.player.queue.current.title)}](${0/*res.player!.queue.current!.current.uri*/})**\n\`Added by- \`${res.player.queue.current.requester}\` \``)
            .setColor(this.utils.getClientColour(ctx.guild))
            .setFooter(getProgressBarData(res.player, res.player.queue.current as Track))

        await ctx.channel.send(nowPlayingEmbed).then(msg => msg.delete({ timeout: 15000 })).catch((err: Error) => err.message !== "Unknown Message" ? this.globalCTX.logger?.error(err.message) : undefined);
    }
}

function getProgressBarData(player: Player, currentTrack: Track) {
    const currentPosition = player.position || 1;
    const calculatedBarLength = currentTrack.title.length - 12;
    const barLength = calculatedBarLength > 20 ? 20 : (calculatedBarLength < 14 ? 14 : calculatedBarLength);

    return new Date(currentPosition).toISOString().substr(11, 8) +
        "[" +
        createBar(currentTrack.duration == 0 ? currentPosition : currentTrack.duration, currentPosition, barLength * 2, "-", "=")[0] +
        "]" +
        (currentTrack.isStream ? " ◉ LIVE" : new Date(currentTrack.duration).toISOString().substr(11, 8))
}