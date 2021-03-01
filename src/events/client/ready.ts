import BaseEvent from '../../utils/structures/BaseEvent';
import { Client } from 'discord.js';
import { Utils } from '../../utils/Utils';
import { Api } from '@top-gg/sdk';
const topgg = new Api(Utils.credentials.topgg.token);

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

        //Upload stats to Top.gg
        postStats(client);
        setInterval(() => postStats(client), 1800000) // post every 30 minutes

        this.globalCTX.logger?.info("Client ready!");
    }
}

//Upload stats to Top.gg
async function postStats(client: Client) {
    topgg.postStats({
        serverCount: client.guilds.cache.size,
        shardId: client.shard?.ids[0], // if you're sharding
        shardCount: client.options.shardCount
    });
}