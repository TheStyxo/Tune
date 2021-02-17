import { Player, Manager, Track, UnresolvedTrack } from '6ec0bd7f/dist';
import BaseEvent from '../../../utils/structures/BaseEvent';

export class QueueEndEvent extends BaseEvent {
    constructor() {
        super({
            name: "queueEnd",
            category: "queue",
        })
    }
    async run(manager: Manager, player: Player, track: Track | UnresolvedTrack, payload: any) {
        await player.textChannel.send(this.utils.embedifyString(player.guild, "The music queue has ended."));
        player.stop();
    };
}
export default QueueEndEvent;