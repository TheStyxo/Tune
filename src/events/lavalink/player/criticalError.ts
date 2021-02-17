import { Player, Manager, Track, UnresolvedTrack } from '6ec0bd7f/dist';
import BaseEvent from '../../../utils/structures/BaseEvent';

export class CriticalPlayerErrorEvent extends BaseEvent {
    constructor() {
        super({
            name: "criticalPlayerError",
            category: "player",
        })
    }
    async run(manager: Manager, player: Player, type: string, track: Track | UnresolvedTrack, payload: any) {
        if (player.guild) await player.textChannel.send(this.utils.embedifyString(player.guild, `**Too many errors occurred!**\nStopped the player...\nIf this error continues please contact the developers.`, true))
        this.globalCTX.logger?.error("CriticalError occured on player, info:\n" + { Guild: { id: player.guild.id, name: player.guild.name }, "error": { type }, track }.toString());
    };
}
export default CriticalPlayerErrorEvent;