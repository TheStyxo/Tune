import { BaseCommand, CommandCTX } from '../../utils/structures/BaseCommand';
import { MusicUtil } from '../../utils/Utils';
import InternalPermissions from '../../database/utils/InternalPermissions';
export const rotationValues = { rotationHz: 0.3 };

export default class NightcoreCommand extends BaseCommand {
    constructor() {
        super({
            name: "8d",
            category: "music",
            description: "Toggle the 8d audio filter."
        })
    }

    async run(ctx: CommandCTX) {
        const res = MusicUtil.canModifyPlayer({
            guild: ctx.guild,
            member: ctx.member,
            textChannel: ctx.channel,
            requiredPermissions: ["MANAGE_PLAYER"],
            memberPermissions: ctx.guildSettings.permissions.users.getFor(ctx.member.id).calculatePermissions(ctx.member) || new InternalPermissions(0),
            noPlayerRequired: true
        });
        if (res.isError) return;

        if (res.player?.filters.rotation || ctx.guildSettings.music.filters.rotation) {
            res.player?.setRotation();
            if (res.memberPerms.has("MANAGE_PLAYER")) await ctx.guildSettings.music.setRotation();

            const embedified = this.utils.embedifyString(ctx.guild, `${ctx.member} Disabled the 8d audio filter.`);
            await ctx.channel.send(embedified);
            if (res.player?.textChannel && ctx.channel.id !== res.player.textChannel.id) await res.player.textChannel.send(embedified);
        }
        else {
            res.player?.setRotation(rotationValues);
            if (res.memberPerms.has("MANAGE_PLAYER")) await ctx.guildSettings.music.setRotation(rotationValues);

            const embedified = this.utils.embedifyString(ctx.guild, `${ctx.member} Enabled the 8d audio filter.`);
            await ctx.channel.send(embedified);
            if (res.player?.textChannel && ctx.channel.id !== res.player.textChannel.id) await res.player.textChannel.send(embedified);
        }
    }
}