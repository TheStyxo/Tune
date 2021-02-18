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

        if (ctx.args.length) {
            switch (ctx.args[0]) {
                case "speed":
                case "sp":
                    ctx.args.shift();
                    return this.globalCTX.commands.get("speed")!.run(ctx);
                case "pitch":
                case "pit":
                    ctx.args.shift();
                    return this.globalCTX.commands.get("pitch")!.run(ctx);
            }
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

        if (res.player?.filters.timescale || ctx.guildSettings.music.filters.timescale) {
            res.player?.setTimescale();
            await ctx.guildSettings.music.setTimescale();

            const embedified = this.utils.embedifyString(ctx.guild, `${ctx.member} Disabled the nightcore mode.`);
            await ctx.channel.send(embedified);
            if (res.player?.textChannel && ctx.channel.id !== res.player.textChannel.id) await res.player.textChannel.send(embedified);
        }
        else {
            const timescale = {
                speed: 1.09,
                pitch: 1.29
            };

            res.player?.setTimescale(timescale);
            if (res.memberPerms.has("MANAGE_PLAYER")) await ctx.guildSettings.music.setTimescale(timescale);

            const embedified = this.utils.embedifyString(ctx.guild, `${ctx.member} Enabled the nightcore mode.`);
            await ctx.channel.send(embedified);
            if (res.player?.textChannel && ctx.channel.id !== res.player.textChannel.id) await res.player.textChannel.send(embedified);
        }
    }
}