import { Manager, Node } from '6ec0bd7f/dist';
import BaseEvent from '../../../utils/structures/BaseEvent';

export class NodeCreateEvent extends BaseEvent {
    constructor() {
        super({
            name: "nodeCreate",
            category: "node",
        })
    }
    async run(manager: Manager, node: Node) {
        this.globalCTX.logger?.info("Node created: " + node.options.identifier);
    };
}
export default NodeCreateEvent;