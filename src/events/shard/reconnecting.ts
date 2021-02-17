import BaseEvent from '../../utils/structures/BaseEvent';
import { Shard } from 'discord.js';

export class ShardReconnectingEvent extends BaseEvent {
    constructor() {
        super({
            name: "reconnecting",
            category: "shard",
        })
    }
    async run(shard: Shard) {
        this.globalCTX.logger?.info(`${shard.id} reconnecting.`);
    };
}
export default ShardReconnectingEvent;