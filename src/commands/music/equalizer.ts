import { BaseCommand, CommandCTX } from '../../utils/structures/BaseCommand';
import { MusicUtil, FLAG } from '../../utils/Utils';
import InternalPermissions from '../../database/utils/InternalPermissions';
import EQMessage from '../../utils/musicUtil/EQMessage';
import { Permissions } from 'discord.js';

export default class EqualizerCommand extends BaseCommand {
    constructor() {
        super({
            name: "equalizer",
            aliases: ["eq"],
            category: "music",
            description: "Change or view the eq settings.",
            cooldown: 30000,
            additionalPermsRequired: new Permissions(["USE_EXTERNAL_EMOJIS", "ADD_REACTIONS", "MANAGE_MESSAGES"])
        })
    }

    async run(ctx: CommandCTX) {
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

        if (ctx.args.length && res.memberPerms.has("MANAGE_PLAYER") && ctx.args[0].replace(/(re)(?:(s|se|set)?)/, "reset") === "reset") {
            res.player?.clearEQ();
            await ctx.guildSettings?.music.clearEQ();

            const embedified = this.utils.embedifyString(ctx.guild, `${ctx.member} Successfully reset the equalizer settings.`);
            await ctx.channel.send(embedified);
            if (res.player?.textChannel && ctx.channel.id !== res.player.textChannel.id) await res.player.textChannel.send(embedified);
            return;
        }

        return await new EQMessage({ channel: ctx.channel, requestedBy: ctx.member, player: res.player, guildSettings: ctx.guildSettings, viewOnly: res.flag === FLAG.VIEW_ONLY, modifyDB: res.memberPerms.has("MANAGE_PLAYER") }).send();
    }
}