import Utils from '../Utils';
import { Player } from '6ec0bd7f/dist';
import { Message, MessageReaction, ReactionCollector, TextChannel, User } from 'discord.js';
import GlobalCTX from '../GlobalCTX';

export class QueueMessage {
    // Class props //
    player: Player;
    channel: TextChannel;
    message?: Message;
    reactionCollector?: ReactionCollector;
    pages: string[] = [];
    currentPage = 0;
    // Class props //

    constructor(channel: TextChannel, player: Player) {
        this.player = player;
        this.channel = channel;
        this.updatePages();
    }

    async send() {
        if (this.message) return;

        const queueEmbed = new Utils.discord.MessageEmbed()
            .setTitle(`${await Utils.getEmoji("musical_notes")} Player queue! ${this.pages.length < 2 ? `` : `Page(${this.currentPage + 1} of ${this.pages.length})`}`)
            .setColor(Utils.getClientColour(this.player.guild))
            .setDescription(this.pages[this.currentPage]);

        this.message = await this.channel.send(queueEmbed);

        if (this.pages.length > 2) {
            const filter = (reaction: MessageReaction, user: User) => user.id !== user.client.user!.id;
            this.reactionCollector = this.message.createReactionCollector(filter, { time: 45000 });

            const reactionOptions = [Utils.appearance.emojis.arrow_left, Utils.appearance.emojis.arrow_right];

            for (const option of reactionOptions) {
                const emoji = await Utils.getEmoji(option);
                if (!emoji) continue;
                if (!this.message || this.message.deleted || !await this.message.react(emoji).catch((err: Error) => err.message !== "Unknown Message" ? GlobalCTX.logger?.error(err.message) : undefined)) return;
            }

            this.reactionCollector.on('collect', async (reaction: MessageReaction, user: User) => {
                const permissions = (reaction.message.channel as TextChannel).permissionsFor(user.client.user!);
                if (!permissions?.has("SEND_MESSAGES")) return;
                if (!permissions.has("EMBED_LINKS")) return this.player.textChannel.send(Utils.embedifyString(this.player.guild, "I don't have permissions to embed links in this channel!", true)).catch((err: Error) => GlobalCTX.logger?.error(err.message));
                if (!permissions.has("USE_EXTERNAL_EMOJIS")) return this.player.textChannel.send(Utils.embedifyString(this.player.guild, "I don't have permissions to use external emojis in this channel!\nThis permission is required for reaction messages to work correctly", true)).catch((err: Error) => GlobalCTX.logger?.error(err.message));
                if (!permissions.has("MANAGE_MESSAGES")) return this.player.textChannel.send(Utils.embedifyString(this.player.guild, "I don't have permissions to manage messages in this channel!\nThis permission is required for reaction controls to work correctly", true)).catch((err: Error) => GlobalCTX.logger?.error(err.message));

                await reaction.users.remove(user).catch((err: Error) => GlobalCTX.logger?.error(err.message));
                this.reactionCollector?.resetTimer();

                switch (reaction.emoji.id) {
                    case Utils.appearance.emojis.arrow_left:
                        if (this.message && !this.message.deleted) {
                            this.updatePages();//Untested
                            if (this.currentPage > this.pages.length) this.currentPage = this.pages.length - 1;//Untested
                            if (this.currentPage - 1 < 0) return;
                            else {
                                --this.currentPage;
                                await this.updateMessage();
                            }
                        }
                        break;
                    case Utils.appearance.emojis.arrow_right:
                        if (this.message && !this.message.deleted) {
                            this.updatePages();//Untested
                            if (this.currentPage > this.pages.length) this.currentPage = this.pages.length - 2;//Untested
                            if (this.currentPage + 1 > this.pages.length) return;
                            else {
                                ++this.currentPage;
                                await this.updateMessage();
                            }
                        }
                        break;
                }
            }).on('end', async () => {
                if (this.message && this.message.deletable && !this.message.deleted) await this.message.delete()
                    .then(
                        () => delete this.message,
                        (err: Error) => err.message !== "Unknown Message" ? GlobalCTX.logger?.error(err.message) : undefined
                    );
            })
        }
    }

    async updateMessage() {
        return await this.message?.edit(new Utils.discord.MessageEmbed()
            .setTitle(`${await Utils.getEmoji("musical_notes")} Player queue! ${this.pages.length < 2 ? `` : `Page(${this.currentPage + 1} of ${this.pages.length})`}`)
            .setColor(Utils.getClientColour(this.player.guild))
            .setDescription(this.pages[this.currentPage]))
            .catch((err: Error) => err.message !== "Unknown Message" ? GlobalCTX.logger?.error(err.message) : undefined)
    }

    updatePages(): string[] {
        const tracks = (this.player.queue.current ? [`=> ${Utils.discord.Util.escapeMarkdown(this.player.queue.current.title)}`] : []).concat(this.player.queue.map((track, index) => `${index + 1}. ${Utils.discord.Util.escapeMarkdown(track.title)}`));
        return this.pages = Utils.discord.Util.splitMessage(tracks, {
            maxLength: 2048,
            char: "\n",
            prepend: "",
            append: ""
        });
    }
}

export default QueueMessage;