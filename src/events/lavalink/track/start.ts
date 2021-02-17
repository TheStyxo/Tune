import { Player, Manager, Track } from '6ec0bd7f/dist';
import BaseEvent from '../../../utils/structures/BaseEvent';

export class TrackStartEvent extends BaseEvent {
    constructor() {
        super({
            name: "trackStart",
            category: "track",
        })
    }
    async run(manager: Manager, player: Player, track: Track) {
        await this.globalCTX.playingMessages.createMessage(player, track).send();
    };
}
export default TrackStartEvent;