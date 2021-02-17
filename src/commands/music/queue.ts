import { BaseCommand, CommandCTX } from '../../utils/structures/BaseCommand';
import { MusicUtil } from '../../utils/Utils';
import InternalPermissions from '../../database/utils/InternalPermissions';
import QueueMessage from '../../utils/musicUtil/QueueMessage';

export default class QueueCommand extends BaseCommand {
    constructor() {
        super({
            name: "queue",
            aliases: ["q"],
            category: "music",
            description: "View the music queue.",
            cooldown: 30000
        })
    }

    async run(ctx: CommandCTX) {
        if (!ctx.permissions.has("EMBED_LINKS")) return await ctx.channel.send("I don't have permissions to send message embeds in this channel");


        const res = MusicUtil.canModifyPlayer({
            guild: ctx.guild,
            member: ctx.member,
            textChannel: ctx.channel,
            requiredPermissions: ["VIEW_QUEUE"],
            memberPermissions: ctx.guildSettings.permissions.users.getFor(ctx.member.id).calculatePermissions(ctx.member) || new InternalPermissions(0),
        });
        if (res.isError) return;

        if (!res.player?.queue.totalSize) return await ctx.channel.send(this.utils.embedifyString(ctx.guild, "There is nothing playing right now!", true));

        const queueMessage = new QueueMessage(ctx.channel, res.player);
        await queueMessage.send();
    }
}