import BaseEvent from '../../utils/structures/BaseEvent';
import { Shard } from 'discord.js';

export class ShardDisconnectEvent extends BaseEvent {
    constructor() {
        super({
            name: "disconnect",
            category: "shard",
        })
    }
    async run(shard: Shard) {
        this.globalCTX.logger?.info(`${shard.id} disconnected.`);
    };
}
export default ShardDisconnectEvent;