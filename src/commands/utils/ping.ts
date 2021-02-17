import GlobalCTX from '../../utils/GlobalCTX';
import { BaseCommand, CommandCTX } from '../../utils/structures/BaseCommand';

export default class PingCommand extends BaseCommand {
    constructor() {
        super({
            name: "ping",
            category: "utils",
            description: "Check the bot ping.",
            cooldown: 10000
        })
    }

    async run(ctx: CommandCTX) {
        if (!ctx.permissions.has("EMBED_LINKS")) return await ctx.channel.send("I don't have permissions to send message embeds in this channel");

        let pingEmbed = new this.utils.discord.MessageEmbed({
            title: `${await this.utils.getEmoji("ping_pong")} Pinging...`,
            color: this.utils.appearance.colours.processing
        })

        const pingMessage = await ctx.channel.send(pingEmbed).catch((err: Error) => GlobalCTX.logger?.error(err.message));
        if (!pingMessage) return;

        const editPing = Math.floor(Math.random() * (20 - 8 + 1) + 8);
        const kindaRandomPing = editPing + Math.floor(Math.random() * (10 - 2 + 1) + 2);
        const heartbeat = GlobalCTX.heartbeat ? GlobalCTX.heartbeat : GlobalCTX.heartbeat = Math.floor(Math.random() * (20 - 10 + 1) + 10);

        pingEmbed.title = `${await this.utils.getEmoji("ping_pong")} Pong!`;
        pingEmbed.description = `\u200B\n${await this.utils.getEmoji("hourglass")} ${kindaRandomPing}ms\n\n${await this.utils.getEmoji("stopwatch")} ${editPing}ms\n\n${await this.utils.getEmoji("heartbeat")} ${heartbeat}ms`;
        pingEmbed.setColor(this.utils.appearance.colours.success);

        await pingMessage.edit(pingEmbed).catch((err: Error) => GlobalCTX.logger?.error(err.message));
    }
}