import { Manager, Node } from '6ec0bd7f/dist';
import BaseEvent from '../../../utils/structures/BaseEvent';

export class NodeErrorEvent extends BaseEvent {
    constructor() {
        super({
            name: "nodeError",
            category: "node",
        })
    }
    async run(manager: Manager, node: Node, error: Error) {
        this.globalCTX.logger?.error("Error occurred while connecting to node: " + node.options.identifier + "\nError: " + error.message);
    };
}
export default NodeErrorEvent;