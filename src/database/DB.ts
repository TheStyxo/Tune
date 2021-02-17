import { Db, MongoClient, MongoClientOptions, Collection as DBCollection } from 'mongodb';
import { Collection } from 'discord.js';
import dot from 'dot-prop';
import GlobalCTX from '../utils/GlobalCTX';

//Import classes
import Guild from './structures/Guild';
import GuildSettings from './structures/GuildSettings';

export default class DB {
    // Class props //
    client: MongoClient;
    clientID: string;
    connection: Db | undefined;
    cache: Cache;
    collections!: Collections;
    // Class props //

    constructor(uri: string, options: MongoClientOptions = {}, clientID: string) {
        if (!uri) throw new TypeError("No uri provided to connect.");
        if (typeof clientID !== 'string') throw new TypeError("Client ID must be a string.")

        this.client = new MongoClient(uri, Object.assign({ useUnifiedTopology: true }, options));
        this.clientID = clientID;
        this.cache = {
            users: new Collection(),
            guilds: new Collection(),
            guildSettings: new Collection(),
            playlists: new Collection(),
            premiumTokens: new Collection()
        }
    }

    async connect(databaseName: string): Promise<Db> {
        try {
            await this.client.connect();
            const connection = this.client.db(databaseName);
            this.collections = {
                users: connection.collection("users"),
                guilds: connection.collection("guilds"),
                guildSettings: connection.collection(`guildSettings-${this.clientID}`),
                playlists: connection.collection("playlists"),
                premiumTokens: connection.collection("premiumTokens")
            };
            this.connection = connection;
            GlobalCTX.logger?.info(`Database connected: ${databaseName}`);
            return connection;
        } catch {
            throw new Error("Could not connect to the database");
        }
    }

    async getGuild(id: string): Promise<Guild> {
        const cache = this.cache.guilds.get(id);
        if (cache) return cache;

        const data = await this.collections.guilds.findOne({ _id: id }) || { _id: id };
        const newInst = new Guild(this, data);

        this.cache.guilds.set(id, newInst);
        return newInst;
    }

    async getGuildSettings(id: string): Promise<GuildSettings> {
        const cache = this.cache.guildSettings.get(id);
        if (cache) return cache;

        const data = await this.collections.guildSettings.findOne({ _id: id }) || { _id: id };
        const newInst = new GuildSettings(this, data);

        this.cache.guildSettings.set(id, newInst);
        return newInst;
    }

    updateCache(inWhat: string, id: string, path: string, value: any): void {
        if (this.cache[inWhat] && this.cache[inWhat].has(id)) dot.set(this.cache[inWhat].get(id)._data, path, value);
    }
}

export interface Credentials {
    hosts?: string[],
    port?: number,
    name: string,
    username?: string,
    password?: string
}

export interface Cache {
    users: any,
    guilds: Collection<string, Guild>,
    guildSettings: Collection<string, GuildSettings>,
    playlists: any,
    premiumTokens: any,
    [key: string]: Cache["users"] | Cache["guilds"] | Cache["guildSettings"] | Cache["playlists"] | Cache["premiumTokens"] | undefined
};

export interface Collections {
    users: DBCollection,
    guilds: DBCollection,
    guildSettings: DBCollection,
    playlists: DBCollection,
    premiumTokens: DBCollection
};