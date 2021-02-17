import { Manager, Node } from '6ec0bd7f/dist';
import BaseEvent from '../../../utils/structures/BaseEvent';

export class NodeDestroyEvent extends BaseEvent {
    constructor() {
        super({
            name: "nodeDestroy",
            category: "node",
        })
    }
    async run(manager: Manager, node: Node) {
        this.globalCTX.logger?.info("Node destroyed: " + node.options.identifier);
    };
}
export default NodeDestroyEvent;