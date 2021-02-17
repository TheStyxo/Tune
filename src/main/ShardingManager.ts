import credentials from '../../config/credentials.json';
import settings from "../../config/settings.json";
import * as loader from '../utils/moduleLoader';

import { ShardingManager } from 'discord.js';

const manager = new ShardingManager('src/main/index.js', {
    token: credentials.discord.token,
    totalShards: settings.shardingManager.totalShards,
});

manager.on('shardCreate', async (shard) => {
    await loader.loadEvents(shard, "src/events/shard");
    //shard.on('')
});

manager.spawn();