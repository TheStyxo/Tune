import { BaseCommand, CommandCTX } from '../../utils/structures/BaseCommand';
import { MusicUtil, CustomError, Success, FLAG } from '../../utils/Utils';
import InternalPermissions from '../../database/utils/InternalPermissions';
import { VoiceChannel } from 'discord.js';

export default class SummonCommand extends BaseCommand {
    constructor() {
        super({
            name: "summon",
            aliases: ["j", "join"],
            category: "music",
            description: "Make the bot join your channel."
        })
    }

    async run(ctx: CommandCTX, opts?: Success | CustomError): Promise<Success | CustomError> {
        if (!ctx.permissions.has("EMBED_LINKS")) {
            await ctx.channel.send("I don't have permissions to send message embeds in this channel");
            return new CustomError(FLAG.NO_EMBED_PERMISSION);
        }

        const res = await this.testConditions(ctx, opts);
        if (res.isError) return res;


        const { channel: meVoiceChannel } = ctx.guild.me?.voice || {};
        let player = this.globalCTX.lavalinkClient.players.get(ctx.guild.id);

        if (player && !meVoiceChannel) {
            if (!opts) {
                const reconnectedEmbed = new this.utils.discord.MessageEmbed()
                    .setDescription(`**Reconnected to your voice channel!**`)
                    .addField("Player Voice Channel", `${await this.utils.getEmoji("voice_channel_icon_normal")} ${res.authorVoiceChannel?.name || "unknown"}`)
                    .addField("Player Text Channel", `<#${ctx.channel.id}>`)
                    .addField("Volume", `${player.volume}%`, true)
                    .addField("Loop", `${player.loopState}`, true)
                    .addField("Volume limit", `${ctx.guildSettings?.music.volume.limit}`, true)
                    .setColor(this.utils.getClientColour(ctx.guild))
                await ctx.channel.send(reconnectedEmbed).catch((err: Error) => this.globalCTX.logger?.error(err.message));;
            }
            player.connect();
            return new Success(FLAG.RESPAWNED);
        }

        player = this.globalCTX.lavalinkClient.create({
            guild: ctx.guild,
            voiceChannel: res.authorVoiceChannel!,
            textChannel: ctx.channel,
            inactivityTimeout: 120000,
            guildData: ctx.guildData,
            guildSettings: ctx.guildSettings,
            selfDeafen: true,
            serverDeaf: true,
            logger: this.globalCTX.logger,
            volume: ctx.guildSettings.music.volume.percentage > ctx.guildSettings.music.volume.limit ? ctx.guildSettings.music.volume.limit : ctx.guildSettings.music.volume.percentage,
            maxErrorsPer10Seconds: 3
        })

        //apply guild settings to player
        switch (ctx.guildSettings.music.loop) {
            case "QUEUE": player?.setQueueRepeat(true);
                break;
            case "TRACK": player?.setTrackRepeat(true);
                break;
            default:
                break;
        }

        player.setFilters(ctx.guildSettings.music.filters);
        player.setEQ(...ctx.guildSettings.music.eq.bands.map((gain, band) => ({ band, gain })));

        //connect to the channel
        player.connect();

        if (!opts) {
            const joinedEmbed = new this.utils.discord.MessageEmbed()
                .setDescription(`**Joined your voice channel!**`)
                .addField("Player Voice Channel", `${await this.utils.getEmoji("voice_channel_icon_normal")} ${res.authorVoiceChannel?.name || "Unknown"}`)
                .addField("Player Text Channel", `<#${ctx.channel.id}>`)
                .addField("Volume", `${player?.volume}`, true)
                .addField("Loop", `${player?.loopState}`, true)
                .addField("Volume limit", `${ctx.guildSettings?.music.volume.limit}`, true)
                .setColor(this.utils.getClientColour(ctx.guild))
            await ctx.channel.send(joinedEmbed).catch((err: Error) => this.globalCTX.logger?.error(err.message));;
        }


        return new Success(FLAG.NULL, undefined, res.authorVoiceChannel, player);
    }
    async testConditions(ctx: CommandCTX, prevRes?: Success | CustomError): Promise<Success | CustomError> {
        const res = prevRes || MusicUtil.canModifyPlayer({
            guild: ctx.guild,
            member: ctx.member,
            textChannel: ctx.channel,
            isSpawnAttempt: true,
            noPlayerRequired: true,
            requiredPermissions: ["SUMMON_PLAYER"],
            memberPermissions: ctx.guildSettings.permissions.users.getFor(ctx.member.id).calculatePermissions(ctx.member) || new InternalPermissions(0),
        });
        if (res.isError) return res;

        const authorVCperms = res.authorVoiceChannel?.permissionsFor(res.authorVoiceChannel!.client.user!);

        if (!authorVCperms || !authorVCperms.has("VIEW_CHANNEL")) {
            await ctx.channel.send(this.utils.embedifyString(ctx.guild, `${await this.utils.getEmoji("voice_channel_icon_error_locked")} I don't have permissions to view your channel!`, true));
            return new CustomError(FLAG.NO_BOT_PERMS_VIEW_CHANNEL);
        }
        if (!authorVCperms || !authorVCperms.has("CONNECT")) {
            await ctx.channel.send(this.utils.embedifyString(ctx.guild, `${await this.utils.getEmoji("voice_channel_icon_error_locked")} I don't have permissions to join your channel!`, true));
            return new CustomError(FLAG.NO_BOT_PERMS_CONNECT);
        }
        if (!authorVCperms || !authorVCperms.has("SPEAK")) {
            await ctx.channel.send(this.utils.embedifyString(ctx.guild, `${await this.utils.getEmoji("voice_channel_icon_normal_locked")} I don't have permissions to speak in your channel!`, true));
            return new CustomError(FLAG.NO_BOT_PERMS_SPEAK);
        }

        return new Success(FLAG.NULL, undefined, res.authorVoiceChannel);
    }
}