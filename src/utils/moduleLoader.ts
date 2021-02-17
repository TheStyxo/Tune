import path from 'path';
import fs from 'fs';
import merge from 'deepmerge';
import BaseCommand from './structures/BaseCommand';
import BaseEvent from './structures/BaseEvent';
import GlobalCTX from './GlobalCTX';
import { EventEmitter } from 'events';

interface CommandLoaderOpts {
    exclude?: {
        commands?: string[],
        categories?: string[]
    }
}

interface EventLoaderOpts {
    exclude?: {
        events?: string[],
        categories?: string[]
    }
}

export async function loadCommands(dir: string = "", opts: CommandLoaderOpts = {}) {
    const defaultOpts = { exclude: { commands: [], categories: [] } };
    const options = merge(defaultOpts, opts);

    const filePath = path.join(path.resolve(".", dir)); //The path for the command folder
    const directory = fs.readdirSync(filePath, { withFileTypes: true }) //This may be a file or a folder

    for (const index in directory) {
        const file = directory[index];
        if (file.isDirectory()) loadCommands(path.join(dir, file.name), options); //If it is a folder then load commands inside it
        if (file.name.endsWith('.js')) {
            const { default: Command } = require(path.join(filePath, file.name));
            if (Command && Command.prototype instanceof BaseCommand) {
                const cmd = new Command();
                if (options.exclude && options.exclude.commands && options.exclude.commands.includes(cmd.name) || options.exclude && options.exclude.categories && options.exclude.categories.includes(cmd.category)) continue;
                GlobalCTX.commands.set(cmd.name, cmd);
                //GlobalCTX.logger?.info(`Loaded command from ${GlobalCTX.logger?.chalk.underline(dir)} -> [${cmd.category}|${cmd.name}]`);
            }
        }
    }
}

export async function loadEvents(client: EventEmitter, dir: string, opts: EventLoaderOpts = {}) {
    const defaultOpts = { exclude: { events: [], categories: [] } };
    const options = merge(defaultOpts, opts);

    const filePath = path.join(path.resolve(".", dir)); //The path for the command folder
    const directory = fs.readdirSync(filePath, { withFileTypes: true }) //This may be a file or a folder

    for (const index in directory) {
        const file = directory[index];
        if (file.isDirectory()) loadEvents(client, path.join(dir, file.name), options); //If it is a folder then load commands inside it
        if (file.name.endsWith('.js')) {
            const { default: Event } = require(path.join(filePath, file.name));
            if (Event && Event.prototype instanceof BaseEvent) {
                const evt = new Event();
                if (options.exclude && options.exclude.events && options.exclude.events.includes(evt.name) || options.exclude && options.exclude.categories && options.exclude.categories.includes(evt.category)) continue;
                client.on(evt.name, evt.run.bind(evt, client));
                //GlobalCTX.logger?.info(`Loaded event from ${GlobalCTX.logger?.chalk.underline(dir)} -> [${evt.category}|${evt.name}]`);
            }
        }
    }
}