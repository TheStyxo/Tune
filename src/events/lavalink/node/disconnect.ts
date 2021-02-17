import { Manager, Node } from 'tune-lavalink-client';
import BaseEvent from '../../../utils/structures/BaseEvent';

export class NodeDisconnectEvent extends BaseEvent {
    constructor() {
        super({
            name: "nodeDisconnect",
            category: "node",
        })
    }
    async run(manager: Manager, node: Node) {
        this.globalCTX.logger?.info("Node disconnected: " + node.options.identifier);
    };
}
export default NodeDisconnectEvent;