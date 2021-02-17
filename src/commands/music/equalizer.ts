import { BaseCommand, CommandCTX } from '../../utils/structures/BaseCommand';
import { MusicUtil, FLAG } from '../../utils/Utils';
import InternalPermissions from '../../database/utils/InternalPermissions';
import EQMessage from '../../utils/musicUtil/EQMessage';

export default class EqualizerCommand extends BaseCommand {
    constructor() {
        super({
            name: "equalizer",
            aliases: ["eq"],
            category: "music",
            description: "Change or view the eq settings."
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
            allowViewOnly: true
        });
        if (res.isError) return;

        if (!player) player = res.player;

        return await new EQMessage({ channel: ctx.channel, requestedBy: ctx.member, player, guildSettings: ctx.guildSettings, viewOnly: res.flag === FLAG.VIEW_ONLY, modifyDB: res.memberPerms.has("MANAGE_PLAYER") }).send();
    }
}