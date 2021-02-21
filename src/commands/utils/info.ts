import { BaseCommand, CommandCTX } from '../../utils/structures/BaseCommand';
import time from 'ms';

export default class InfoCommand extends BaseCommand {
    constructor() {
        super({
            name: "info",
            aliases: ["i"],
            category: "utils",
            description: "Get some info about the bot."
        })
    }

    async run(ctx: CommandCTX) {
        if (!ctx.permissions.has("EMBED_LINKS")) return await ctx.channel.send("I don't have permissions to send message embeds in this channel");

        const owner = this.utils.owners[0];
        const uptime = time(ctx.client.uptime || 0);
        const numberOfGuildsArray = await ctx.client.shard?.fetchClientValues('guilds.cache.size') || [0];
        const totalGuilds = await numberOfGuildsArray.reduce((prev, val) => prev + val, 0);
        //@ts-expect-error
        const invite = await ctx.client.generateInvite({ options: this.utils.settings.default_invite_permissions });

        const infoEmbed = new this.utils.discord.MessageEmbed({
            author: {
                name: ctx.client.user?.username || "Tune",
                iconURL: ctx.client.user?.avatarURL() || "https://cdn.discordapp.com/embed/avatars/2.png"
            },
            fields: [
                { name: "Version", value: this.utils.settings.info.version, inline: true },
                { name: "Library", value: this.utils.settings.info.library, inline: true },
                { name: "Made by", value: `${owner.username} [${await this.utils.getEmoji("animated_panda_happy")}](${owner.profileURL})`, inline: true },
                { name: "Guilds", value: totalGuilds, inline: true },
                { name: "Commands", value: this.globalCTX.commands.size, inline: true },
                { name: "Invite", value: `**[Invite](${invite})**`, inline: true }
            ],
            footer: {
                text: `${this.utils.settings.info.hosting} | Shard [${ctx.guild.shard.id + 1}/${ctx.client.shard?.count || 1}] | Uptime ${uptime}`
            },
            color: this.utils.getClientColour(ctx.guild)
        })

        await ctx.channel.send(infoEmbed).catch((err: Error) => this.globalCTX.logger?.error(err.message));
    }
}