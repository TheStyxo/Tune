import { BaseCommand, CommandCTX } from '../../utils/structures/BaseCommand';
//@ts-expect-error
import { parser as parse } from 'discord-markdown';
import { inspect } from 'util';
import { VultrexHaste } from 'vultrex.haste';
const bin = new VultrexHaste({ url: "https://pastes.styxo.codes" });

export default class InviteCommand extends BaseCommand {
    constructor() {
        super({
            name: "eval",
            aliases: ["e", "ev"],
            category: "dev",
            description: "Evaluate a code snippet.",
            hidden: true,
        })
    }

    async run(ctx: CommandCTX) {
        if (!this.utils.owners.find(e => e.id === ctx.member.id)) return await ctx.channel.send(this.utils.embedifyString(ctx.guild, `Only the bot owners can use that command!`, true)).catch((err: Error) => this.globalCTX.logger?.error(err.message));

        if (ctx.args[0]) {
            const res = await generateResult(getCodeToParse(ctx.rawContent)[0], ctx);
            return await ctx.channel.send(this.utils.embedifyString(ctx.guild, res.result, res.error)).catch((err: Error) => this.globalCTX.logger?.error(err.message));
        }
        else return await ctx.channel.send(this.utils.embedifyString(ctx.guild, `Please provide something to evaluate.`)).catch((err: Error) => this.globalCTX.logger?.error(err.message));
    }
}

function getCodeToParse(rawContent: string): string[] {
    const parsedContent: any[] = parse(rawContent, { discordOnly: true });
    const codeBlocks = parsedContent.filter((obj: any) => obj.type === 'codeBlock').map((block: any) => block.content || '');
    if (!codeBlocks.length) return [rawContent];
    else return codeBlocks;
}

async function executeCode(code: string, ctx: CommandCTX): Promise<ExecutionResult> {
    try {
        const start = process.hrtime();
        let result = await eval(code);
        if (typeof result !== "string") result = inspect(result);
        return { code, result, execTime: process.hrtime(start), error: false };
    } catch (error) { return { code, result: error.message, error: true }; }
}

async function generateResult(code: string, ctx: CommandCTX) {
    const executionResult = await executeCode(code, ctx);
    const inputCode = `\`\`\`js\n${code.replace(/`/g, "'")}\n\`\`\``;
    const formattedExecTime = !executionResult.error ? `${executionResult.execTime![0] > 0 ? `${executionResult.execTime![0]}s ` : ""}${executionResult.execTime![1] / 1e6}ms` : null;
    const outputCodeBlock = !executionResult.error ? `\`\`\`js\n${executionResult.result!.replace(/`/g, "'")}\n\`\`\`` : `\`\`\`diff\n${executionResult.result!.replace(/`/g, "'")}\`\`\``.split("\n").join("\n- ");
    let resultString = `**Input**\n${inputCode}\n${!executionResult.error ? `**Executed in ${formattedExecTime}**\n\n` : ""}${!executionResult.error ? `**Result**` : `**Error**`}\n${outputCodeBlock}`;

    if (resultString.length > 2048) {
        const hastebinString = `${multiLineComment("Input")}${executionResult.code}\n\n${!executionResult.error ? `//Executed in ${formattedExecTime}\n\n` : ""}${multiLineComment(!executionResult.error ? "Result" : "Error")}${executionResult.result}`
        const hastebinHyperlink = `**[Bin](${await bin.post(hastebinString)})**`;
        resultString = `**Input**\n${inputCode}\n${!executionResult.error ? `**Executed in ${formattedExecTime}**\n\n` : ""}${!executionResult.error ? `**Result**` : `**Error**`}\n${hastebinHyperlink}`;
        if (resultString.length > 2048) {
            resultString = `**Input was too long to be displayed here so I have added it to a bin!**\n${!executionResult.error ? `**Executed in ${formattedExecTime}**\n\n` : ""}${!executionResult.error ? `**Result**` : `**Error**`}\n${hastebinHyperlink}`;
        }
    }
    return { result: resultString, error: executionResult.error };
}

function multiLineComment(comment: string) {
    return `/**\n * ${comment}\n */\n`;
}

export interface ExecutionResult {
    code: string,
    result?: string,
    execTime?: [number, number],
    error: boolean
}