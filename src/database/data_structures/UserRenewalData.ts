export const DefaultUserRenewalData = {
    "on": undefined, //Date when this was done
    "duration": undefined, //The duration of validity
    "expiry": undefined,
    "allowedBoosts": undefined, //Number of allowed boosts
    "type": undefined, //Type of the renewal [ GIFT | REWARD | PURCHASE ]
    "giftedByID": undefined //When it was gifted else undefined
}

export interface IUserRenewalData {
    on: number,
    duration: number,
    expiry: number,
    allowedBoosts: number,
    type: string,
    giftedByID: string | undefined
}

export default IUserRenewalData;