import BaseEvent from '../../utils/structures/BaseEvent';
import { Shard } from 'discord.js';

export class ShardDeathEvent extends BaseEvent {
    constructor() {
        super({
            name: "death",
            category: "shard",
        })
    }
    async run(shard: Shard) {
        this.globalCTX.logger?.info(`${shard.id} died.`);
    };
}
export default ShardDeathEvent;