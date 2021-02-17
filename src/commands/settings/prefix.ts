import GlobalCTX from '../../utils/GlobalCTX';
import { BaseCommand, CommandCTX } from '../../utils/structures/BaseCommand';
import GuildDefaults from '../../../config/defaults/default_guild_settings.json';

export default class InviteCommand extends BaseCommand {
    constructor() {
        super({
            name: "prefix",
            aliases: ["pf"],
            category: "settings",
            description: "Change the bot prefix for the server."
        })
    }

    async run(ctx: CommandCTX) {
        if (!ctx.permissions.has("EMBED_LINKS")) return await ctx.channel.send("I don't have permissions to send message embeds in this channel");

        if (ctx.args[0]) {
            if (!ctx.channel.permissionsFor(ctx.member)?.has("MANAGE_GUILD")) return await ctx.channel.send(this.utils.embedifyString(ctx.guild, `You need to have the permission to manage this guild on discord in order to change the server prefix!`, true)).catch((err: Error) => GlobalCTX.logger?.error(err.message));

            if (["reset", "remove", "delete", GuildDefaults.prefix].includes(ctx.args[0])) {
                await ctx.guildSettings.setPrefix().catch((err: Error) => GlobalCTX.logger?.error(err.message));
                return await ctx.channel.send(this.utils.embedifyString(ctx.guild, `Successfully ${ctx.args[0] === GuildDefaults.prefix ? `set` : `reset`} the server prefix to \`${ctx.guildSettings.prefix}\``)).catch((err: Error) => GlobalCTX.logger?.error(err.message));
            }

            if (ctx.args[0].length > 5) return await ctx.channel.send(this.utils.embedifyString(ctx.guild, `The guild prefix cannot be more than 5 characters long!`, true)).catch((err: Error) => GlobalCTX.logger?.error(err.message));

            await ctx.guildSettings.setPrefix(ctx.args[0]).catch((err: Error) => GlobalCTX.logger?.error(err.message));

            return await ctx.channel.send(this.utils.embedifyString(ctx.guild, `Successfully set the server prefix to \`${ctx.guildSettings.prefix}\``)).catch((err: Error) => GlobalCTX.logger?.error(err.message));
        }
        else return await ctx.channel.send(this.utils.embedifyString(ctx.guild, `The prefix for this server is \`${ctx.guildSettings.prefix}\``)).catch((err: Error) => GlobalCTX.logger?.error(err.message));
    }
}