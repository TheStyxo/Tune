import IGuildPermissionsData from './GuildPermissionsData';
import default_guild_settings from '../../../config/defaults/default_guild_settings.json';

export const DefaultGuildSettingsData = {
    "_id": undefined,
    "settings": {
        "prefix": default_guild_settings.prefix,
        "permissions": {
            "users": {},
            "roles": {}
        },
        "music": {
            "24_7": false,
            "loop": "DISABLED" as ILoop,
            "eq": {
                "bands": Array(15).fill(0)
            },
            "volume": {
                "percentage": 100,
                "limit": 100
            },
            "filters": {}
        }
    }
}

export interface IGuildSettingsData {
    _id: string,
    settings: {
        prefix: string,
        permissions: {
            users: {
                [key: string]: IGuildPermissionsData | undefined
            },
            roles: {
                [key: string]: IGuildPermissionsData | undefined
            }
        },
        music: {
            "24_7": boolean,
            loop: ILoop,
            eq: {
                bands: number[]
            },
            volume: {
                percentage: number,
                limit: number
            },
            filters: {
                [key: string]: object
            }
        }
    }
}

export type ILoop = "TRACK" | "QUEUE" | "DISABLED";
export interface EqualizerBand {
    band: number;
    gain: number;
}

export default IGuildSettingsData;