import { Manager, Node } from '6ec0bd7f/dist';
import BaseEvent from '../../../utils/structures/BaseEvent';

export class NodeReconnectEvent extends BaseEvent {
    constructor() {
        super({
            name: "nodeReconnect",
            category: "node",
        })
    }
    async run(manager: Manager, node: Node) {
        this.globalCTX.logger?.info("Node reconnecting: " + node.options.identifier);
    };
}
export default NodeReconnectEvent;