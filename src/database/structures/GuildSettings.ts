import DB from '../DB';
import { IGuildSettingsData, DefaultGuildSettingsData, ILoop, EqualizerBand } from '../data_structures/GuildSettingsData';
import createInstance from '../utils/createInstance';
import merge from 'deepmerge';
import { Collection } from 'discord.js';
import GuildPermission from '../utils/GuildPermission';
import { Filters } from 'tune-lavalink-client';

export default class GuildSettings {
    // Class props //
    _DB: DB;
    _data: IGuildSettingsData;
    id: string;
    permissions: IGuildPermissions;
    music: GuildMusicSettings;
    // Class props //

    constructor(DB: DB, data: IGuildSettingsData) {
        this._DB = DB;
        this._data = createInstance<IGuildSettingsData>(merge(DefaultGuildSettingsData, data));
        this.id = this._data._id;
        this.permissions = {
            users: new GuildPermissions(this, true),
            roles: new GuildPermissions(this, false)
        }
        this.music = new GuildMusicSettings(this);
    }

    /**
     * Get the guild prefix for this client
     */
    get prefix(): string {
        return this._data.settings.prefix;
    }

    /**
     * Update the guild prefix for this client
     * @param newPrefix The new prefix
     */
    async setPrefix(newPrefix?: string): Promise<string> {
        if (typeof newPrefix !== 'undefined' && typeof newPrefix !== 'string') throw new TypeError(`The value of prefix must be a "string", provided "${typeof newPrefix}"`);

        if (!newPrefix) newPrefix = DefaultGuildSettingsData.settings.prefix;

        await this._DB.collections.guildSettings.updateOne({ _id: this.id }, { $set: { "settings.prefix": newPrefix } }, { upsert: true });
        return this._data.settings.prefix = newPrefix;
    }
}

export interface IGuildPermissions {
    users: GuildPermissions,
    roles: GuildPermissions
}

export class GuildPermissions {
    // Class props //
    GuildSettings: GuildSettings;
    isUser: boolean;
    _cache: Collection<string, GuildPermission>;
    // Class props //

    constructor(GuildSettings: GuildSettings, isUser: boolean = true) {
        this.GuildSettings = GuildSettings;
        this.isUser = isUser;
        this._cache = new Collection();
    }

    getAll(): Collection<string, GuildPermission> {
        for (const id in this.GuildSettings._data.settings.permissions.users) this.getFor(id);
        return this._cache;
    }

    getFor(id: string): GuildPermission {
        const cache = this._cache.get(id);
        if (cache) return cache;

        const newInst = new GuildPermission(this.GuildSettings, id, this.isUser);

        this._cache.set(id, newInst);
        return newInst;
    }

    async reset() {
        await this.GuildSettings._DB.collections.guildSettings.updateOne({ _id: this.GuildSettings.id }, { $unset: { [`settings.permissions.${this.isUser ? "users" : "roles"}`]: null } });
        this.GuildSettings._data.settings.permissions[this.isUser ? "users" : "roles"] = {};
        this._cache.clear();
    }
}

export class GuildMusicSettings {
    // Class props //
    GuildSettings: GuildSettings;
    eq: EQSettings;
    volume: GuildVolumeSettings;
    // Class props //

    constructor(GuildSettings: GuildSettings) {
        this.GuildSettings = GuildSettings;
        this.eq = new EQSettings(this.GuildSettings);
        this.volume = new GuildVolumeSettings(this.GuildSettings);
    }

    get 24_7() {
        return this.GuildSettings._data.settings.music['24_7'];
    }

    /**
     * Set the 24x7 mode to a boolean value
     * @param value Boolean for 24x7 mode
     */
    async set24_7(value: boolean): Promise<boolean> {
        await this.GuildSettings._DB.collections.guildSettings.updateOne({ _id: this.GuildSettings.id }, { $set: { "settings.music.24_7": value } }, { upsert: true });
        return this.GuildSettings._data.settings.music["24_7"] = value;
    }

    /**
     * Get the player loop value [TRACK | QUEUE | DISABLED]
     */
    get loop(): ILoop {
        return this.GuildSettings._data.settings.music.loop;
    }

    /**
     * Set the loop mode
     * @param value [TRACK | QUEUE | DISABLED]
     */
    async setLoop(value: ILoop): Promise<ILoop> {
        await this.GuildSettings._DB.collections.guildSettings.updateOne({ _id: this.GuildSettings.id }, { $set: { "settings.music.loop": value } }, { upsert: true });
        return this.GuildSettings._data.settings.music.loop = value;
    }

    get filters(): Filters {
        return this.GuildSettings._data.settings.music.filters;
    }

    /**
    * Sets the timescale filter.
    * @param {Filters["timescale"]} options Timescale options
    */
    async setTimescale({ speed, pitch, rate }: Filters["timescale"] = {}): Promise<this> {
        if (!speed && !pitch && !rate) {
            delete this.GuildSettings._data.settings.music.filters.timescale;
            await this.GuildSettings._DB.collections.guildSettings.updateOne({ _id: this.GuildSettings.id }, { $unset: { "settings.music.filters.timescale": null } }, { upsert: true });
        }
        else {
            this.GuildSettings._data.settings.music.filters.timescale = {
                "speed": speed || 1,
                "pitch": pitch || 1,
                "rate": rate || 1
            };
            await this.GuildSettings._DB.collections.guildSettings.updateOne({ _id: this.GuildSettings.id }, { $set: { "settings.music.filters.timescale": this.GuildSettings._data.settings.music.filters.timescale } }, { upsert: true });
        }
        return this;
    }

    /**
    * Sets the tremolo filter.
    * @param {Filters["tremolo"]} options Tremolo options
    */
    async setTremolo({ frequency, depth }: Filters["tremolo"] = {}): Promise<this> {
        if (!depth || !frequency) {
            delete this.GuildSettings._data.settings.music.filters.tremolo;
            await this.GuildSettings._DB.collections.guildSettings.updateOne({ _id: this.GuildSettings.id }, { $unset: { "settings.music.filters.tremolo": null } }, { upsert: true });
        }
        else {
            if (depth > 1 || depth < 0) throw new RangeError("The depth must be between 0 and 1");
            if (frequency > 0) throw new RangeError("The frequency must be grater than 0");
            this.GuildSettings._data.settings.music.filters.tremolo = {
                "frequency": frequency,
                "depth": depth
            };
            await this.GuildSettings._DB.collections.guildSettings.updateOne({ _id: this.GuildSettings.id }, { $set: { "settings.music.filters.tremolo": this.GuildSettings._data.settings.music.filters.tremolo } }, { upsert: true });
        }
        return this;
    }

    /**
    * Sets the rotation filter.
    * @param {Filters["rotation"]} options Rotation options
    */
    async setRotation({ rotationHz }: Filters["rotation"] = {}): Promise<this> {
        if (!rotationHz) {
            delete this.GuildSettings._data.settings.music.filters.rotation;
            await this.GuildSettings._DB.collections.guildSettings.updateOne({ _id: this.GuildSettings.id }, { $unset: { "settings.music.filters.rotation": null } }, { upsert: true });
        }
        else {
            if (rotationHz > 0) throw new RangeError("The rotationHz must be grater than 0");
            this.GuildSettings._data.settings.music.filters.rotation = {
                "rotationHz": rotationHz || 0
            };
            await this.GuildSettings._DB.collections.guildSettings.updateOne({ _id: this.GuildSettings.id }, { $set: { "settings.music.filters.rotation": this.GuildSettings._data.settings.music.filters.rotation } }, { upsert: true });
        }
        return this;
    }

    /** Reset all audio filters except eq */
    async setFilters(filters: Filters): Promise<this> {
        this.GuildSettings._data.settings.music.filters = filters;
        await this.GuildSettings._DB.collections.guildSettings.updateOne({ _id: this.GuildSettings.id }, { $set: { "settings.music.filters": this.GuildSettings._data.settings.music.filters } }, { upsert: true });
        return this;
    }
}

class EQSettings {
    // Class props //
    GuildSettings: GuildSettings;
    // Class props //

    constructor(GuildSettings: GuildSettings) {
        this.GuildSettings = GuildSettings;
    }

    get bands(): number[] {
        return this.GuildSettings._data.settings.music.eq.bands;
    }

    async setBands(...bands: EqualizerBand[]): Promise<this> {
        // Hacky support for providing an array
        if (Array.isArray(bands[0])) bands = bands[0] as unknown as EqualizerBand[]

        if (!bands.length || !bands.every((band) => JSON.stringify(Object.keys(band).sort()) === '["band","gain"]'))
            throw new TypeError("Bands must be a non-empty object array containing 'band' and 'gain' properties.");

        for (const { band, gain } of bands) this.GuildSettings._data.settings.music.eq.bands[band] = gain;

        await this.GuildSettings._DB.collections.guildSettings.updateOne({ _id: this.GuildSettings.id }, { $set: { "settings.music.eq.bands": this.GuildSettings._data.settings.music.eq.bands } });

        return this;
    }
}

class GuildVolumeSettings {
    // Class props //
    GuildSettings: GuildSettings;
    // Class props //

    constructor(GuildSettings: GuildSettings) {
        this.GuildSettings = GuildSettings;
    }

    get percentage(): number {
        return this.GuildSettings._data.settings.music.volume.percentage;
    }

    async setPercentage(value: number): Promise<number> {
        await this.GuildSettings._DB.collections.guildSettings.updateOne({ _id: this.GuildSettings.id }, { $set: { "settings.music.volume.percentage": value } });
        return this.GuildSettings._data.settings.music.volume.percentage = value;
    }

    get limit(): number {
        return this.GuildSettings._data.settings.music.volume.limit;
    }

    async setLimit(value: number): Promise<number> {
        await this.GuildSettings._DB.collections.guildSettings.updateOne({ _id: this.GuildSettings.id }, { $set: { "settings.music.volume.limit": value } });
        return this.GuildSettings._data.settings.music.volume.limit = value;
    }
}