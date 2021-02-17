import { Client } from 'discord.js';
import BaseEvent from '../../utils/structures/BaseEvent';

export class RawEvent extends BaseEvent {
    constructor() {
        super({
            name: "raw",
            category: "client",
        })
    }
    async run(client: Client, data: any) {
        this.globalCTX.lavalinkClient.updateVoiceState(data);
    };
}
export default RawEvent;