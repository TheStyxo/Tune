import BaseEvent from '../../utils/structures/BaseEvent';
import { Client, Message } from 'discord.js';
import { MessageParser } from '../../utils/Utils';
import { CommandCTX } from '../../utils/structures/BaseCommand';

export default class MessageEvent extends BaseEvent {
    constructor() {
        super({
            name: "message",
            category: "client",
        })
    }

    async run(client: Client, message: Message) {
        if (!message.guild) return;
        if (message.author.bot) return;

        if (!this.globalCTX.DB) throw new Error("Database is not present in global CTX.");
        if (!this.globalCTX.commands) throw new Error("Commands are not loaded in global CTX.");

        const guildData = await this.globalCTX.DB.getGuild(message.guild.id);
        const guildSettings = await this.globalCTX.DB.getGuildSettings(message.guild.id);

        const parsedCommand = await MessageParser.parseCommand({ prefix: guildSettings.prefix, commandsCollection: this.globalCTX.commands, message, guildData, guildSettings });
        if (!parsedCommand) return;

        parsedCommand.guildSettings = guildSettings;

        //Check if bot has required permissions
        if (!parsedCommand.permissions.has("EMBED_LINKS")) return await message.channel.send("I don't have permissions to send message embeds in this channel!");
        const missingPerms = parsedCommand.command.additionalPermsRequired ? parsedCommand.permissions.missing(parsedCommand.command.additionalPermsRequired) : [];
        if (missingPerms.length) return message.channel.send(this.utils.embedifyString(message.guild, this.utils.generateNoPermsMessage(missingPerms), true)).catch((err: Error) => this.globalCTX.logger?.error(err.message));

        try {
            parsedCommand.command.run(parsedCommand);
        } catch (err) {
            this.globalCTX.logger?.error(err);
            message.channel.send(this.utils.embedifyString(message.guild, `There was an error executing that command, please try again.\nIf this error persists, please report this issue on our support server- [ririchiyo.xyz/support](${this.utils.settings.info.supportServerURL})`, true));
        }
    }
}