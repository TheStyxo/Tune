import { IUserRenewalData } from './UserRenewalData';

export const DefaultUserData = {
    "_id": undefined,
    "username": undefined,
    "discriminator": undefined,
    "avatar": undefined,
    "premium": {
        "renewals": [],
        "boostedGuilds": []
    },
    "music": {
        "playlists": []
    }
}

export interface IUserData {
    _id: string, //The userID stored as a unique primary key
    username?: string,
    discriminator?: string,
    avatar?: string,
    premium: {
        renewals: IUserRenewalData[], //Array of renewals
        boostedGuilds: string[] //Array of guild IDs or []
    },
    music: {
        playlists: string[] //Array of playlist IDs or []
    }
}

export default IUserData;