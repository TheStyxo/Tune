import { Collection } from 'discord.js';
import { Player, Track } from '6ec0bd7f/dist';
import PlayingMessage from './PlayingMessage';

export default class PlayingMessageManager extends Collection<string, PlayingMessage> {
    constructor() {
        super();
    }

    createMessage(player: Player, track: Track): PlayingMessage {
        const playingMessage = new PlayingMessage(player, track);
        this.set(track.uuid, playingMessage);
        return playingMessage;
    }

    deleteMessage(uuid: string) {
        const playingMessage = this.get(uuid);
        if (!playingMessage) return;
        playingMessage.delete();
        this.delete(uuid);
    }
}