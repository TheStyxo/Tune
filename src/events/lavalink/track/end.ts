import { Player, Manager, Track } from 'tune-lavalink-client';
import BaseEvent from '../../../utils/structures/BaseEvent';

export class TrackEndEvent extends BaseEvent {
    constructor() {
        super({
            name: "trackEnd",
            category: "track",
        })
    }
    async run(manager: Manager, player: Player, track: Track) {
        this.globalCTX.playingMessages.deleteMessage(track.uuid);
    };
}
export default TrackEndEvent;