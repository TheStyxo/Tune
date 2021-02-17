import 'source-map-support/register';
import credentials from '../../config/credentials.json';
import * as loader from '../utils/moduleLoader';
import DB from '../database/DB';
import { Logger } from '../utils/Utils';
import GlobalCTX from '../utils/GlobalCTX';

async function run() {
    GlobalCTX.logger = new Logger().init(GlobalCTX.client.shard?.ids[0]);
    await loader.loadEvents(GlobalCTX.client, "src/events/client");
    await GlobalCTX.client.login();
    GlobalCTX.DB = new DB(credentials.mongodb.uri, undefined, GlobalCTX.client.user!.id);
    await GlobalCTX.DB.connect(credentials.mongodb.dbName);
    await loader.loadEvents(GlobalCTX.lavalinkClient, "src/events/lavalink");
    await loader.loadEvents(GlobalCTX.client.ws, "src/events/ws");
    await loader.loadCommands("src/commands");
}
run();