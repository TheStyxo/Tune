import BaseEvent from '../../utils/structures/BaseEvent';
import { Client } from 'discord.js';
import { Utils } from '../../utils/Utils';

export default class ReadyEvent extends BaseEvent {
    constructor() {
        super({
            name: "ready",
            category: "client",
        })
    }

    async run(client: Client) {
        this.globalCTX.lavalinkClient.init(client);

        const presenceUpdater = {
            run: async function () {
                try {
                    await client.user?.setActivity(Utils.settings.default_activity_status.text, { type: Utils.settings.default_activity_status.type });
                } catch (err) {
                    console.error(err);
                }
                setTimeout(() => this.run(), Utils.settings.default_activity_status.updateInterval * 1000);
            }
        }
        presenceUpdater.run();

        this.globalCTX.logger?.info("Client ready!");
    }
}