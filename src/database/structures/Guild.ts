import DB from '../DB';
import { IGuildData, DefaultGuildData } from '../data_structures/GuildData';
import createInstance from '../utils/createInstance';
import merge from 'deepmerge';
import { IGuildBoostData } from '../data_structures/GuildBoostData';

/**
 * Main global guild data
 */
export default class Guild {
    // Class props //
    _DB: DB;
    _data: IGuildData;
    id: string;
    premium: GuildPremium;
    // Class props //

    constructor(DB: DB, data: IGuildData) {
        this._DB = DB;
        this._data = createInstance<IGuildData>(merge(DefaultGuildData, data));
        this.id = this._data._id;
        this.premium = new GuildPremium(this);
    }
}

/**
 * Guild Premium Data
 */
export class GuildPremium {
    // Class props //
    Guild: Guild;
    // Class props //

    constructor(Guild: Guild) {
        this.Guild = Guild;
    }

    /**
     * Renew guild premium
     * @param boost The generated boost object
     */
    async renew(boost: IGuildBoostData): Promise<IGuildBoostData> {
        if (this.isActive()) throw new Error("Already enabled.");

        if (!this.Guild._DB.collections) throw new Error("Database not connected.");

        await this.Guild._DB.collections.guilds.updateOne({ _id: this.Guild._data._id }, { $push: { "premium.renewals": boost } }, { upsert: true });
        this.Guild._data.premium.boosts.push(boost);
        return boost;
    }

    /**
     * UnRenew guild the most recent premium
     */
    async unrenew(): Promise<IGuildBoostData> {
        if (!this.isActive()) throw new Error("Not enabled.");

        if (!this.Guild._DB.collections) throw new Error("Database not connected.");

        await this.Guild._DB.collections.guilds.updateOne({ _id: this.Guild._data._id }, { $pop: { "premium.renewals": null } }, { upsert: true });
        return this.Guild._data.premium.boosts.pop()!;
    }

    /**
     * Check if the guild premium is active
     */
    isActive(): boolean {
        if (!this.Guild._data.premium.boosts.length) return false;
        return this.Guild._data.premium.boosts[this.Guild._data.premium.boosts.length - 1].expiry > Date.now();
    }

    /**
     * Check if the guild premium is expired
     */
    isExpired(): boolean {
        if (!this.Guild._data.premium.boosts.length) return false;
        return this.Guild._data.premium.boosts[this.Guild._data.premium.boosts.length - 1].expiry <= Date.now();
    }

    /**
     * Get the last renewal object
     */
    getLastBoost(): IGuildBoostData {
        return this.Guild._data.premium.boosts[this.Guild._data.premium.boosts.length - 1];
    }

    /**
     * Get all renewals in an array
     */
    getAllBoosts(): IGuildBoostData[] {
        return this.Guild._data.premium.boosts;
    }
}