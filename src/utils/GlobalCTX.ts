import { Commands } from './Utils';
import { Logger } from '../utils/Utils';
import DB from '../database/DB';
import { Client, Collection, GuildEmoji } from 'discord.js';
import { Manager } from '6ec0bd7f/dist';
import credentials from '../../config/credentials.json';
import PlayingMessageManager from './musicUtil/PlayingMessageManager';

export const GlobalCTX = new class GlobalCTX {
    client: Client;
    commands: Commands;
    logger?: Logger = new Logger().init();
    DB?: DB;
    lavalinkClient: Manager;
    playingMessages: PlayingMessageManager;
    customEmojiCache: Collection<string, GuildEmoji>;
    heartbeat?: number;

    constructor() {
        this.client = new Client();
        this.commands = new Collection();
        this.customEmojiCache = new Collection();
        this.lavalinkClient = new Manager({
            client: this.client,
            plugins: [],
            nodes: credentials.lavalink.nodes,
            autoPlay: true,
            send
        });
        this.playingMessages = new PlayingMessageManager();
    }
}

export default GlobalCTX;

/** Send data function for lavalink */
function send(id: string, payload: any) {
    const guild = GlobalCTX.client.guilds.resolve(id);
    if (guild) guild.shard.send(payload);
}