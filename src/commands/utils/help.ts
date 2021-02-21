import { BaseCommand, CommandCTX } from '../../utils/structures/BaseCommand';

export default class HelpCommand extends BaseCommand {
    constructor() {
        super({
            name: "help",
            aliases: ["h"],
            category: "utils",
            description: "Display all available commands",
            cooldown: 3,
            hidden: true
        })
    }

    async run(ctx: CommandCTX) {
        if (!ctx.permissions.has("EMBED_LINKS")) return await ctx.channel.send("I don't have permissions to send message embeds in this channel");

        const helpEmbed = new this.utils.discord.MessageEmbed();

        //Get viewable commands
        const commands = (this.utils.owners.find(u => u.id === ctx.member.id) ? this.globalCTX.commands : this.globalCTX.commands.filter(cmd => !cmd.hidden)).array();

        //Get command categories
        const commandCategories: string[] = [];
        for (const command of commands) if (!commandCategories.includes(command.category)) commandCategories.push(command.category);

        const guildSettingsData = await this.globalCTX.DB?.getGuildSettings(ctx.guild.id);
        if (!guildSettingsData) return;

        if (!ctx.args[0]) {
            helpEmbed.setAuthor(`${ctx.client.user?.username || "Tune"}`, ctx.client.user?.avatarURL() || "https://cdn.discordapp.com/embed/avatars/4.png", this.utils.settings.info.websiteURL)
                .setDescription(`A feature rich and easy to use discord music bot.\n\nMy prefix on this server is \`${guildSettingsData.prefix}\`\n\n**List of all commands-**`)
                .setColor(this.utils.getClientColour(ctx.guild));

            for (const category of commandCategories) {
                const commandsInCategory = commands.filter(cmd => cmd.category === category);
                const commandNamesWithAliases: string[] = [];

                for (const command of commandsInCategory) commandNamesWithAliases.push(`\`${command.name}${command.aliases ? `(${command.aliases})` : ""}\``);

                const joinedcommandNamesWithAliases = commandNamesWithAliases.join(', ');

                helpEmbed.addField(`${this.utils.firstLetterCaps(category)}`, `${joinedcommandNamesWithAliases}`);
            }

            helpEmbed.addField(`\u200B`, `For help about a specific command or category,\nuse \`${guildSettingsData.prefix}${this.name} <category name>\` or \`${guildSettingsData.prefix}${this.name} <command name>\`\n\nFeel free to join our **[support server](${this.utils.settings.info.supportServerURL})** for more help.\nAdd me to another server- **[invite](${await ctx.client.generateInvite({ permissions: this.utils.settings.default_invite_permissions })})**`);
        }
        else {
            const processedQuery = [];
            for (const arg of ctx.args) processedQuery.push(arg.replace(guildSettingsData.prefix, '').toLowerCase());

            const query = processedQuery.join(' ');

            const command =
                this.globalCTX.commands.get(query.toLowerCase()) ||
                this.globalCTX.commands.find((cmd) => cmd.aliases ? cmd.aliases.includes(query.toLowerCase()) : false);

            //if command is not found, check categories
            const category = command ? null : commandCategories.includes(query) ? query : null;

            if (command) {
                const commandUsage = command.getUsage(guildSettingsData.prefix);
                helpEmbed
                    .setTitle(`${guildSettingsData.prefix}${command.name}${command.aliases ? ` (${command.aliases})` : ""}`)
                    .setDescription(`${command.description}\n\n${commandUsage ? "**Usage**\n" + commandUsage : ''}`)
                    .setColor(this.utils.getClientColour(ctx.guild));
            }
            else if (category) {
                const commandsInCategory = commands.filter(cmd => cmd.category === category);
                helpEmbed
                    .setDescription(`**${this.utils.firstLetterCaps(category)} commands**`)
                    .setColor(this.utils.getClientColour(ctx.guild));
                for (const command of commandsInCategory) helpEmbed.addField(`**${guildSettingsData.prefix}${command.name} ${command.aliases ? `(${command.aliases})` : ""}**`, `${command.description}`, true)
            }
            //if nothing is found
            else helpEmbed
                .setDescription('Could not find the command or category you were looking for.\nPlease check if you have typed it correctly.')
                .setColor(this.utils.appearance.colours.error);
        }

        await ctx.channel.send(helpEmbed).catch((err: Error) => this.globalCTX.logger?.error(err.message));
    }
}