import { BaseCommand, CommandCTX } from '../../utils/structures/BaseCommand';
import { MusicUtil } from '../../utils/Utils';
import InternalPermissions from '../../database/utils/InternalPermissions';
import credentials from '../../../config/credentials.json';
import { KSoftClient, Track } from '@ksoft/api';
const ksoft = new KSoftClient(credentials.ksoft.token);

export default class LyricsCommand extends BaseCommand {
    constructor() {
        super({
            name: "lyrics",
            aliases: ["ly"],
            category: "music",
            description: "View song lyrics for the current song or search for one."
        })
    }

    async run(ctx: CommandCTX) {
        if (!ctx.permissions.has("EMBED_LINKS")) return await ctx.channel.send("I don't have permissions to send message embeds in this channel");

        let res;
        if (!ctx.args.length) {
            res = MusicUtil.canModifyPlayer({
                guild: ctx.guild,
                member: ctx.member,
                textChannel: ctx.channel,
                requiredPermissions: ["VIEW_QUEUE"],
                memberPermissions: ctx.guildSettings.permissions.users.getFor(ctx.member.id).calculatePermissions(ctx.member) || new InternalPermissions(0),
            });
            if (res.isError) return;
        }
        const query = ctx.args.length ? ctx.args.join(" ") : res?.player?.queue.current?.title;
        const { lyrics, name, artist }: Partial<Track> = query ? await ksoft.lyrics.get(query, { textOnly: false }).catch((err: Error) => { this.globalCTX.logger?.error(err.message); return {}; }) : {};


        if (res && !res.player?.queue.current) return await ctx.channel.send(this.utils.embedifyString(ctx.guild, "There is nothing playing right now!", true));

        const lyricsEmbed = new this.utils.discord.MessageEmbed();

        if (lyrics && name && artist && artist.name) {
            lyricsEmbed.setTitle(name).setDescription(`${artist.name}\n\n` + lyrics).setFooter("Lyrics provided by KSoft.Si").setColor(this.utils.getClientColour(ctx.guild));
        }
        else {
            lyricsEmbed.setColor(this.utils.appearance.colours.error)
                .setFooter("Lyrics provided by KSoft.Si")
                .setDescription(`No lyrics found for ${query}`);
        }

        if (lyricsEmbed.description?.length || 0 >= 2048) lyricsEmbed.description = `${this.utils.limitLength(lyricsEmbed.description!)}`;

        await ctx.channel.send(lyricsEmbed);
    }
}