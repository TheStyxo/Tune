import { BaseCommand, CommandCTX } from '../../utils/structures/BaseCommand';
import { FLAG, MusicUtil } from '../../utils/Utils';
import InternalPermissions from '../../database/utils/InternalPermissions';

export default class LoopCommand extends BaseCommand {
    constructor() {
        super({
            name: "loop",
            aliases: ["l"],
            category: "music",
            description: "Change the player loop setting."
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
            noPlayerRequired: true,
            allowViewOnly: !ctx.args.length
        });
        if (res.isError) return;

        if (!player) player = res.player;

        let loop = res.player?.loopState || ctx.guildSettings.music.loop;

        if (res.flag === FLAG.VIEW_ONLY) {
            return await ctx.channel.send(this.utils.embedifyString(ctx.guild, `The loop is currently set to ${loop}!`, true));
        }
        else {
            switch (ctx.args.length ? parseOptions(ctx.args[0]) : loop) {
                case "QUEUE":
                    loop = "TRACK";
                    res.player?.setTrackRepeat(true);
                    if (res.memberPerms.has("MANAGE_PLAYER")) ctx.guildSettings.music.setLoop("TRACK");
                    break;
                case "TRACK":
                    loop = "DISABLED";
                    res.player?.setTrackRepeat(false);
                    res.player?.setQueueRepeat(false);
                    if (res.memberPerms.has("MANAGE_PLAYER")) ctx.guildSettings.music.setLoop("DISABLED");
                    break;
                default:
                    loop = "QUEUE";
                    res.player?.setQueueRepeat(true);
                    if (res.memberPerms.has("MANAGE_PLAYER")) ctx.guildSettings.music.setLoop("QUEUE");
                    break;
            }

            const embedified = this.utils.embedifyString(ctx.guild, `${ctx.member} Set the loop to ${loop}.`);
            await ctx.channel.send(embedified);
            if (res.player?.textChannel && ctx.channel.id !== res.player.textChannel.id) await res.player.textChannel.send(embedified);
        }
    }
}

function parseOptions(option: string) {
    switch (option) {
        case "d":
        case "disable":
        case "stop":
        case "off":
        case "no":
            return "TRACK";
        case "t":
        case "track":
        case "song":
        case "this":
        case "current":
        case "one":
        case "playing":
            return "QUEUE";
        case "q":
        case "queue":
        case "entire":
        case "all":
        case "playlist":
        case "everything":
            return "DISABLED";
        default: return;
    }
}