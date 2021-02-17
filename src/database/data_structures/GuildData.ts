import { IGuildBoostData } from './GuildBoostData';

export const DefaultGuildData = {
    "_id": undefined,
    "premium": {
        "boosts": [], //Array of boost objects
    }
}

export interface IGuildData {
    _id: string,
    premium: {
        boosts: IGuildBoostData[]
    }
}

export default IGuildData;