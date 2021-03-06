import { BaseCommand, CommandCTX } from '../../utils/structures/BaseCommand';

export default class InviteCommand extends BaseCommand {
    constructor() {
        super({
            name: "invite",
            aliases: ["iv"],
            category: "utils",
            description: "Get the invite link for the bot."
        })
    }

    async run(ctx: CommandCTX) {
        //@ts-expect-error
        const invite = await ctx.client.generateInvite({ options: this.utils.settings.default_invite_permissions });

        const inviteEmbed = new this.utils.discord.MessageEmbed({
            description: `**Add me to your server- [Invite](${invite})**\n**Join our support server- [Tuney Support](${this.utils.settings.info.supportServerURL})**`,
            color: this.utils.getClientColour(ctx.guild)
        })

        await ctx.channel.send(inviteEmbed).catch((err: Error) => this.globalCTX.logger?.error(err.message));
    }
}