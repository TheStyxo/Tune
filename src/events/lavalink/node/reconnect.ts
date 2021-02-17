import { Manager, Node } from 'tune-lavalink-client';
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