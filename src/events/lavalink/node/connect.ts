import { Manager, Node } from '6ec0bd7f/dist';
import BaseEvent from '../../../utils/structures/BaseEvent';

export class NodeConnectEvent extends BaseEvent {
    constructor() {
        super({
            name: "nodeConnect",
            category: "node",
        })
    }
    async run(manager: Manager, node: Node) {
        this.globalCTX.logger?.info("Node connected: " + node.options.identifier);
    };
}
export default NodeConnectEvent;