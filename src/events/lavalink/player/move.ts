import { Player, Manager } from '6ec0bd7f/dist';
import BaseEvent from '../../../utils/structures/BaseEvent';

export class PlayerMoveEvent extends BaseEvent {
    constructor() {
        super({
            name: "playerMove",
            category: "player",
        })
    }
    async run(manager: Manager, player: Player, oldChannel: string, newChannel: string) {
        if (!newChannel) return manager.emit("playerDisconnect", player, oldChannel);
    };
}
export default PlayerMoveEvent;