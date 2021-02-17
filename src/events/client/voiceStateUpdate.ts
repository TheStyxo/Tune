import { Client, VoiceState } from 'discord.js';
import BaseEvent from '../../utils/structures/BaseEvent';
import { Player } from '6ec0bd7f/dist';

export class VoiceStateUpdateEvent extends BaseEvent {
    constructor() {
        super({
            name: "voiceStateUpdate",
            category: "client",
        })
    }
    async run(client: Client, oldState: VoiceState, newState: VoiceState) {
        if (newState.member?.id === client.user?.id) {
            if (!newState.channel) return;

            const player = this.globalCTX.lavalinkClient.players.get(newState.guild.id) as Player;
            if (player) {
                if (newState.serverDeaf === false) {
                    if (newState.channel.permissionsFor(client.user!)?.has("DEAFEN_MEMBERS")) newState.setDeaf(true).catch((err: Error) => this.globalCTX.logger?.error(err.message));

                    if (player.get("undeafenCount") || 0 >= 2) {
                        if (player.get("undeafenMessage")) return;
                        else {
                            if (player.options.textChannel) {
                                const msg = await player.options.textChannel.send(this.utils.embedifyString(newState.guild, `Please do not undeafen ${client.user?.username}.\nDeafening ${client.user?.username} helps us protect your privacy and save resources on our side.`, true)).catch((err: Error) => this.globalCTX.logger?.error(err.message)) || undefined;
                                player.set("undeafenMessage", msg)
                                setTimeout(() => {
                                    try {
                                        msg?.delete();
                                        player.set("undeafenMessage", undefined);
                                        player.set("undeafenCount", 1);
                                    } catch (err) {
                                        this.globalCTX.logger?.error(err.message);
                                    }
                                }, 20000);
                            }
                        }
                    }
                    else {
                        const undeafenCount: number = player.get("undeafenCount") || 0;
                        player.set("undeafenCount", undeafenCount + 1);
                    }
                }
            }
        }
    };
}
export default VoiceStateUpdateEvent;