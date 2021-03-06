import BaseEvent from '../../utils/structures/BaseEvent';
import { WebSocketManager, GuildMember, TextChannel, Util } from 'discord.js';
import { Utils, Cooldowns } from '../../utils/Utils';
import { CommandCTX } from '../../utils/structures/BaseCommand';

export interface InteractionData {
    version: number,
    type: number,
    token: string,
    member: {
        user: {
            username: string,
            public_flags: number,
            id: string,
            discriminator: string,
            avatar: string
        },
        roles: string[],
        premium_since: number | null,
        permissions: string,
        pending: boolean,
        nick: string | null,
        mute: boolean,
        is_pending: boolean,
        deaf: boolean
    },
    id: string,
    guild_id: string,
    data: { options: InteractionOptions[], name: string, id: string },
    channel_id: string
}

export interface InteractionOptions {
    value: string,
    name: string
}

export default class SlashCommandEvent extends BaseEvent {
    constructor() {
        super({
            name: "INTERACTION_CREATE",
            category: "ws",
        })
    }

    async run(ws: WebSocketManager, interaction: InteractionData) {
        if (!this.globalCTX.DB) throw new Error("Database is not present in global CTX.");
        if (!this.globalCTX.commands) throw new Error("Commands are not loaded in global CTX.");

        const command = this.globalCTX.commands.get(interaction.data.name);
        if (!command || !command.allowInteraction) return;

        const recievedTimestamp = Date.now();
        const channel = this.globalCTX.client.channels.resolve(interaction.channel_id) as TextChannel;
        if (!channel.guild) return;

        const member = new GuildMember(this.globalCTX.client!, interaction.member, channel.guild);

        if (await Cooldowns.check(command, member.user, channel, null)) return;

        const permissions = await Utils.getClientPermissionsForChannel(channel, member.user);
        if (!permissions) return;

        //Check if bot has required permissions
        if (!permissions.has("EMBED_LINKS")) return await channel.send("I don't have permissions to send message embeds in this channel!");
        const missingPerms = command.additionalPermsRequired ? permissions.missing(command.additionalPermsRequired) : [];
        if (missingPerms.length) return channel.send(this.utils.embedifyString(channel.guild, this.utils.generateNoPermsMessage(missingPerms), true)).catch((err: Error) => this.globalCTX.logger?.error(err.message));


        const args = interaction.data.options.map(o => o.value);

        const guildData = await this.globalCTX.DB.getGuild(channel.guild.id);
        const guildSettings = await this.globalCTX.DB.getGuildSettings(channel.guild.id);

        const ctx: CommandCTX = {
            command,
            args,
            rawContent: args.join(" "),
            member,
            channel,
            guild: channel.guild,
            client: this.globalCTX.client,
            permissions,
            recievedTimestamp,
            guildData,
            guildSettings,
            isInteraction: true
        }

        try {
            command.run(ctx);
        } catch (err) {
            this.globalCTX.logger?.error(err);
            channel.send(Utils.embedifyString(channel.guild, `There was an error executing that command, please try again.\nIf this error persists, please report this issue on our support server- [ririchiyo.xyz/support](${Utils.settings.info.supportServerURL})`, true));
        }
    }
}