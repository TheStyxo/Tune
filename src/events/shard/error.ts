import BaseEvent from '../../utils/structures/BaseEvent';
import { Shard } from 'discord.js';

export class ShardErrorEvent extends BaseEvent {
    constructor() {
        super({
            name: "error",
            category: "shard",
        })
    }
    async run(shard: Shard, error: Error) {
        this.globalCTX.logger?.error(error.message);
    };
}
export default ShardErrorEvent;