import { BaseCommand, CommandCTX } from '../../utils/structures/BaseCommand';
import { MusicUtil } from '../../utils/Utils';
import InternalPermissions from '../../database/utils/InternalPermissions';
import { convertToPercent, mainBassBand, bassBands } from './bassboost';
import { nightcoreValues } from './nightcore';
import { MessageEmbedOptions } from 'discord.js';

export default class FiltersCommand extends BaseCommand {
    constructor() {
        super({
            name: "filters",
            aliases: ["fil"],
            category: "music",
            description: "Change, view or reset the filter values."
        })
    }

    async run(ctx: CommandCTX) {
        if (!ctx.permissions.has("EMBED_LINKS")) return await ctx.channel.send("I don't have permissions to send message embeds in this channel");

        if (ctx.args.length) {
            switch (ctx.args[0].replace(/(re)(?:(s|se|set)?)/, "reset")) {
                case "nightcore":
                case "night":
                case "nc":
                    ctx.args.shift();
                    return this.globalCTX.commands.get("nightcore")!.run(ctx);
                case "speed":
                case "sp":
                    ctx.args.shift();
                    return this.globalCTX.commands.get("speed")!.run(ctx);
                case "pitch":
                case "pit":
                    ctx.args.shift();
                    return this.globalCTX.commands.get("pitch")!.run(ctx);
                case "bassboost":
                case "bb":
                    ctx.args.shift();
                    return this.globalCTX.commands.get("bassboost")!.run(ctx);
                case "equalizer":
                case "eq":
                    ctx.args.shift();
                    return this.globalCTX.commands.get("equalizer")!.run(ctx);
                case "reset":
                    const res = MusicUtil.canModifyPlayer({
                        guild: ctx.guild,
                        member: ctx.member,
                        textChannel: ctx.channel,
                        requiredPermissions: ["MANAGE_PLAYER"],
                        memberPermissions: ctx.guildSettings.permissions.users.getFor(ctx.member.id).calculatePermissions(ctx.member) || new InternalPermissions(0),
                        noPlayerRequired: true
                    });
                    if (res.isError) return;

                    res.player?.setFilters({});
                    if (res.memberPerms.has("MANAGE_PLAYER")) await ctx.guildSettings.music.setFilters({});

                    const embedified = this.utils.embedifyString(ctx.guild, `${ctx.member} Successfully reset all audio filters.`);
                    await ctx.channel.send(embedified);
                    if (res.player?.textChannel && ctx.channel.id !== res.player.textChannel.id) await res.player.textChannel.send(embedified);
                    break;
            }
        }

        const player = this.globalCTX.lavalinkClient.players.get(ctx.guild.id);
        const bassboostValue = convertToPercent(player?.bands[mainBassBand] || (ctx.guildSettings.music.filters.equalizer?.map(v => v.gain) || Array(15).fill(0))[mainBassBand]);
        const equalizerBands = player?.bands || ctx.guildSettings.music.filters.equalizer?.map(v => v.gain);
        const timescaleValues = player?.filters.timescale || ctx.guildSettings.music.filters.timescale || {};

        const embedData: MessageEmbedOptions = {
            color: this.utils.getClientColour(ctx.guild),
            title: "Audio effects",
            description: `Use \`${ctx.guildSettings.prefix + this.name} <filter-name>\` to modify these values.`,
            //description: `**Active audio filters**\n\n• Basssboost- ${bassboostValue}%\n• Equalizer- ${equalizerBands?.some((gain, index) => !bassBands.includes(index) && gain !== 0) ? "Enabled" : "Disabled"}\n• Nightcore- ${timescaleValues.speed === nightcoreValues.speed && timescaleValues.pitch === nightcoreValues.pitch && timescaleValues.rate === nightcoreValues.rate ? "Enabled" : "Disabled"}\n• Speed: ${((timescaleValues.speed || 1) * 100).toFixed(0)}%\n• Pitch: ${((timescaleValues.pitch || 1) * 100).toFixed(0)}%\n• Rate: ${((timescaleValues.rate || 1) * 100).toFixed(0)}%`,
            fields: [
                { name: "Basssboost", value: `${bassboostValue}%`, inline: true },
                { name: "Equalizer", value: `${equalizerBands?.some((gain, index) => !bassBands.includes(index) && gain !== 0) ? "Enabled" : "Disabled"}`, inline: true },
                { name: "Nightcore", value: `${timescaleValues.speed === nightcoreValues.speed && timescaleValues.pitch === nightcoreValues.pitch && timescaleValues.rate === nightcoreValues.rate ? "Enabled" : "Disabled"}`, inline: true },
                { name: "Speed", value: `${((timescaleValues.speed || 1) * 100).toFixed(0)}%`, inline: true },
                { name: "Pitch", value: `${((timescaleValues.pitch || 1) * 100).toFixed(0)}%`, inline: true },
                { name: "Rate", value: `${((timescaleValues.rate || 1) * 100).toFixed(0)}%`, inline: true }
            ],
        }

        const filtersEmbed = new this.utils.discord.MessageEmbed(embedData);
        await ctx.channel.send(filtersEmbed);
    }
}