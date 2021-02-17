export const DefaultGuildBoostData = {
    "on": undefined, //Date when this was done
    "duration": undefined, //The duration of validity
    "expiry": undefined,
    "type": undefined, //Type of the renewal [ GIFT | REWARD | PURCHASE ]
    "byID": undefined //When it was gifted else undefined
}

export interface IGuildBoostData {
    on: number,
    duration: number,
    expiry: number,
    type: string,
    byID: string | undefined
}

export default IGuildBoostData;