import Utils, { Utils as Util } from '../Utils';
import { Player, Track } from 'tune-lavalink-client';
import { Guild, Message, MessageReaction, ReactionCollector, TextChannel, User } from 'discord.js';
import GlobalCTX from '../GlobalCTX';
import { CommandCTX } from '../structures/BaseCommand';

export default class PlayingMessage {
    // Class props //
    player: Player;
    track: Track;
    message?: Message;
    doNotSend: boolean = false;
    reactionCollector?: ReactionCollector;
    // Class props //

    constructor(player: Player, track: Track) {
        this.player = player;
        this.track = track;
    }

    async send() {
        if (this.message) return this.message;

        const playingEmbed = new Util.discord.MessageEmbed({
            title: `${await Util.getEmoji("musical_notes")} Started playing! ${await Util.getEmoji("playing")}`,
            description: `**[${Util.discord.Util.escapeMarkdown(this.track.title)}](${this.track.uri})**\n\`Added by - \`${this.track.requester}\` \``,
            image: {
                url: "https://cdn.discordapp.com/attachments/756541902202863740/780739509704327198/1920x1_TP.png"
            },
            color: Util.getClientColour(this.player.guild)
        });

        const permissions = this.player.textChannel.permissionsFor(this.player.textChannel.client.user!);
        if (!permissions?.has("SEND_MESSAGES")) return;
        if (!permissions.has("EMBED_LINKS")) return this.player.textChannel.send(Util.embedifyString(this.player.guild, "I don't have permissions to embed links in this channel!", true)).catch((err: Error) => GlobalCTX.logger?.error(err.message));
        if (!permissions.has("USE_EXTERNAL_EMOJIS")) return this.player.textChannel.send(Util.embedifyString(this.player.guild, "I don't have permissions to use external emojis in this channel!\nThis permission is required for reaction messages to work correctly", true)).catch((err: Error) => GlobalCTX.logger?.error(err.message));
        if (!permissions.has("USE_EXTERNAL_EMOJIS")) return this.player.textChannel.send(Util.embedifyString(this.player.guild, "I don't have permissions to use external emojis in this channel!\nThe playing message contains emojis from an external server which cannot be sent here without the permission to use external emojis!", true)).catch((err: Error) => GlobalCTX.logger?.error(err.message));

        /**
        * Send message
        */
        if (this.doNotSend) return;
        this.message = await this.player.textChannel.send(playingEmbed).catch((err: Error) => GlobalCTX.logger?.error(err.message));


        if (!this.message) return;


        if (this.doNotSend) return this.delete();

        if (!permissions.has("ADD_REACTIONS")) return this.player.textChannel.send(Util.embedifyString(this.player.guild, "I don't have permissions to add reactions in this channel!\nThis permission is required for reaction controls to work correctly", true)).catch((err: Error) => GlobalCTX.logger?.error(err.message));

        /**
        * Reaction options and collector
        */
        const reactionOptions = [
            Util.appearance.emojis.like,
            Util.appearance.emojis.shuffle,
            Util.appearance.emojis.previous_track,
            Util.appearance.emojis.play_or_pause,
            Util.appearance.emojis.next_track,
            Util.appearance.emojis.loop,
            Util.appearance.emojis.stop,
            Util.appearance.emojis.disconnect
        ];
        const filter = (reaction: MessageReaction, user: User) => user.id !== user.client.user!.id;

        this.reactionCollector = this.message.createReactionCollector(filter);//, { dispose: true }

        this.reactionCollector.on("collect", async (reaction: MessageReaction, user: User) => {
            const permissions = (reaction.message.channel as TextChannel).permissionsFor(user.client.user!);
            if (!permissions?.has("SEND_MESSAGES")) return;
            if (!permissions.has("EMBED_LINKS")) return this.player.textChannel.send(Util.embedifyString(this.player.guild, "I don't have permissions to embed links in this channel!", true)).catch((err: Error) => GlobalCTX.logger?.error(err.message));
            if (!permissions.has("USE_EXTERNAL_EMOJIS")) return this.player.textChannel.send(Util.embedifyString(this.player.guild, "I don't have permissions to use external emojis in this channel!\nThis permission is required for reaction messages to work correctly", true)).catch((err: Error) => GlobalCTX.logger?.error(err.message));
            if (!permissions.has("MANAGE_MESSAGES")) return this.player.textChannel.send(Util.embedifyString(this.player.guild, "I don't have permissions to manage messages in this channel!\nThis permission is required for reaction controls to work correctly", true)).catch((err: Error) => GlobalCTX.logger?.error(err.message));

            await reaction.users.remove(user).catch((err: Error) => GlobalCTX.logger?.error(err.message));

            switch (reaction.emoji.id) {
                case Util.appearance.emojis.like:
                    await runCommand("like", user, reaction.message.channel as TextChannel, reaction.message.guild!);
                    break;
                case Util.appearance.emojis.shuffle:
                    await runCommand("shuffle", user, reaction.message.channel as TextChannel, reaction.message.guild!);
                    break;
                case Util.appearance.emojis.previous_track:
                    await runCommand("back", user, reaction.message.channel as TextChannel, reaction.message.guild!);
                    break;
                case Util.appearance.emojis.play_or_pause:
                    await runCommand("play", user, reaction.message.channel as TextChannel, reaction.message.guild!);
                    break;
                case Util.appearance.emojis.next_track:
                    await runCommand("skip", user, reaction.message.channel as TextChannel, reaction.message.guild!);
                    break;
                case Util.appearance.emojis.loop:
                    await runCommand("loop", user, reaction.message.channel as TextChannel, reaction.message.guild!);
                    break;
                case Util.appearance.emojis.stop:
                    await runCommand("stop", user, reaction.message.channel as TextChannel, reaction.message.guild!);
                    break;
                case Util.appearance.emojis.disconnect:
                    await runCommand("disconnect", user, reaction.message.channel as TextChannel, reaction.message.guild!);
                    break;
            }
        });

        /**
        * Reaction emojis add
        */
        for (const option of reactionOptions) {
            const emoji = await Utils.getEmoji(option);
            if (!emoji) continue;
            if (!this.message || this.message.deleted || !await this.message.react(emoji).catch((err: Error) => err.message !== "Unknown Message" ? GlobalCTX.logger?.error(err.message) : undefined)) return;
        }
    }

    delete() {
        if (!this.message) return this.doNotSend = true;

        if (this.reactionCollector) this.reactionCollector.stop();

        if (this.message.deletable && !this.message.deleted) this.message.delete().catch((err: Error) => GlobalCTX.logger?.error(err.message));
        delete this.message;
    }
}

async function runCommand(commandName: string, user: User, channel: TextChannel, guild: Guild) {
    const command = GlobalCTX.commands.get(commandName);
    if (!command) return;

    const ctx: CommandCTX = {
        command,
        args: [],
        member: guild.member(user)!,
        channel,
        guild, guildData: await GlobalCTX.DB!.getGuild(guild.id),
        guildSettings: await GlobalCTX.DB!.getGuildSettings(guild.id),
        client: guild.client, recievedTimestamp: Date.now(),
        permissions: channel.permissionsFor(GlobalCTX.client.user!) || new Util.discord.Permissions(0)
    }
    return await command.run(ctx);
}