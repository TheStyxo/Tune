import { Player, Manager, Track, TrackExceptionEvent } from '6ec0bd7f/dist';
import BaseEvent from '../../../utils/structures/BaseEvent';

export class TrackErrorEvent extends BaseEvent {
    constructor() {
        super({
            name: "trackError",
            category: "track",
        })
    }
    async run(manager: Manager, player: Player, track: Track, payload: TrackExceptionEvent) {
        this.globalCTX.playingMessages.deleteMessage(track.uuid);
        await player.textChannel.send(this.utils.embedifyString(player.guild, `**[${this.utils.discord.Util.escapeMarkdown(track.title)}](${track.uri})**\n\`Added by - \`${track.requester}\` \`\nAn error occured while playing track: \`${payload?.error ?? "UNKNOWN_ERROR"}\``, true))
    };
}
export default TrackErrorEvent;