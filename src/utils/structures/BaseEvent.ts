import Utils from "../Utils";
import GlobalCTX from '../GlobalCTX';

export class BaseEvent {
    name: string;
    category: string;
    globalCTX = GlobalCTX;
    utils = Utils;

    constructor(options: EventProps) {
        const { name, category } = check(options);
        this.name = name;
        this.category = category;
        this.globalCTX = GlobalCTX;
    }
    async run(...args: any[]): Promise<any> { };
}

export interface EventProps {
    name: string;
    category: string;
}

function check(options: EventProps): EventProps {
    if (!options) throw new TypeError("No options provided for command.");

    if (!options.name) throw new TypeError("No name provided for command.");
    if (typeof options.name !== 'string') throw new TypeError("Command option 'name' must be of type 'string'.");

    if (!options.category) throw new TypeError("No category provided for command.");
    if (typeof options.category !== 'string') throw new TypeError("Command option 'category' must be of type 'string'.");

    return options;
}

export default BaseEvent;