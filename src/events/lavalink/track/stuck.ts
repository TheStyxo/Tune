import { Player, Manager, Track, TrackExceptionEvent } from '6ec0bd7f/dist';
import BaseEvent from '../../../utils/structures/BaseEvent';

export class TrackStuckEvent extends BaseEvent {
    constructor() {
        super({
            name: "trackStuck",
            category: "track",
        })
    }
    async run(manager: Manager, player: Player, track: Track, payload: TrackExceptionEvent) {
        this.globalCTX.playingMessages.deleteMessage(track.uuid);
        await player.textChannel.send(this.utils.embedifyString(player.guild, `**[${this.utils.discord.Util.escapeMarkdown(track.title)}](${track.uri})**\n\`Added by - \`${track.requester}\` \`\nAn error occured while playing track: \`The track got stuck while playing\``, true))
    };
}
export default TrackStuckEvent;