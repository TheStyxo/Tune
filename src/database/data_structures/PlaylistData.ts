export const DefaultPlaylistData = {
    "_id": undefined, //[playlist ID]
    "userID": undefined, //[USER ID WHO CREATED THIS]
    "name": undefined, //[NAME OF THE PLAYLIST]
    "tracks": [], //[SAVED TRACK CLASS]
    "private": true
}

export interface IPlaylistData {
    _id: string,
    userID: string,
    name: string,
    tracks: any[],
    private: boolean
}

export default IPlaylistData;