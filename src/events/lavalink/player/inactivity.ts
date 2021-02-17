import { Player, Manager, Track, UnresolvedTrack } from '6ec0bd7f/dist';
import BaseEvent from '../../../utils/structures/BaseEvent';
import GuildSettings from '../../../database/structures/GuildSettings';

export class PlayerInactivityEvent extends BaseEvent {
    constructor() {
        super({
            name: "playerInactivity",
            category: "player",
        })
    }
    async run(manager: Manager, player: Player) {
        if (player.queue.current) this.globalCTX.playingMessages.deleteMessage(player.queue.current.uuid);
        await player.textChannel.send(this.utils.embedifyString(player.guild, `I left the voice channel due to inactivity!\nIf you have **[premium](${this.utils.settings.info.premiumURL})**, you can disable this by using \`${(player.options.guildSettings as GuildSettings).prefix}24/7\``, false, this.utils.appearance.colours.warn)).catch((err: Error) => this.globalCTX.logger?.error(err.message));
        player.destroy();
    };
}
export default PlayerInactivityEvent;