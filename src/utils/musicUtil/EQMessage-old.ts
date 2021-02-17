import { Player } from "6ec0bd7f/dist";
import { Message, ReactionCollector, TextChannel } from "discord.js";
import GuildSettings from "../../database/structures/GuildSettings";
import { Graph } from 'bar-graphify';

const bandsArray = ["25", "40", "63", "100", "160", "250", "400", "630", "1K", "1.6K", "2.5K", "4K", "6.3K", "10K", "16K"];
const gainLevels = ["- 0.25", "- 0.20", "- 0.10", "0.00", "+ 0.10", "+ 0.20", "+ 0.30", "+ 0.40", "+ 0.50", "+ 0.60", "+ 0.70", "+ 0.80", "+ 0.90", "+ 1.00"];

export default class EQMessage {
    // Class props //
    channel: TextChannel;
    player?: Player;
    guildSettings?: GuildSettings;
    viewOnly: boolean;
    message?: Message;
    reactionCollector?: ReactionCollector;
    cursor = 0;
    graph: Graph;
    // Class props //

    constructor(channel: TextChannel, player?: Player, guildSettings?: GuildSettings, viewOnly: boolean = false) {
        this.channel = channel;
        this.player = player;
        this.guildSettings = guildSettings;
        this.viewOnly = viewOnly;
        this.graph = new Graph({ xLabels: gainLevels, yLabels: bandsArray, fillHeights: convertBandsToFillHeights(player ? player.bands : guildSettings?.music.eq.bands ?? Array(15).fill(0)) });
    }

    refreshMessage() {
        if (!this.message) return;
        this.graph._setCollumnHeightArray(convertBandsToFillHeights(this.player ? this.player.bands : this.guildSettings?.music.eq.bands || Array(15).fill(0)))
        this.message.edit(this.graph.toString());
    }

    sendMessage() {
        if (this.message) return this.message;

        console.log(convertBandsToFillHeights(this.player ? this.player.bands : this.guildSettings?.music.eq.bands || Array(15).fill(0)));
        this.channel.send(this.graph.toString(), { code: true });
    }
}

function convertBandsToFillHeights(bands: number[]) {
    return bands.map((gain) => Math.max(1, Math.min(14, Math.floor(4 + (10 * Math.floor(gain * 100)) / 100))));
}

/* ORIGINAL SOLUTION
function convertBandsToFillHeights(bands) {
  return bands.map((gain) => {
    const value = Math.floor(4 + (10 * Math.floor(gain * 100)) / 100);
    return Math.max(1, Math.min(14, value));
  });
}
*/

/* OLD
function convertBandsToFillHeights(bands: number[]) {
    return bands.map((gain) => {
        if (gain >= 1.00) return 14;
        else if (gain >= 0.90) return 13;
        else if (gain >= 0.80) return 12;
        else if (gain >= 0.70) return 11;
        else if (gain >= 0.60) return 10;
        else if (gain >= 0.50) return 9;
        else if (gain >= 0.40) return 8;
        else if (gain >= 0.30) return 7;
        else if (gain >= 0.20) return 6;
        else if (gain >= 0.10) return 5;
        else if (gain >= 0.00) return 4;
        else if (gain >= -0.10) return 3;
        else if (gain >= -0.20) return 2;
        else return 1;
    });
}
*/