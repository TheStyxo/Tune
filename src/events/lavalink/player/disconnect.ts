import { Player, Manager, Track, UnresolvedTrack } from '6ec0bd7f/dist';
import BaseEvent from '../../../utils/structures/BaseEvent';

export class PlayerDisconnectEvent extends BaseEvent {
    constructor() {
        super({
            name: "playerDisconnect",
            category: "player",
        })
    }
    async run(manager: Manager, player: Player, oldChannel: string) {
        if (player.queue.current) this.globalCTX.playingMessages.deleteMessage(player.queue.current.uuid);
        await player.textChannel.send(this.utils.embedifyString(player.guild, "I got disconnected from the voice channel!\nCleared the music queue.", false, this.utils.appearance.colours.warn));
        player.destroy();
    };
}
export default PlayerDisconnectEvent;