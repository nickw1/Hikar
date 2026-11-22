import SignpostManager from './SignpostManager';
import RoutingNetwork from './RoutingNetwork';

import type { RoutableWay } from '../types/hikar';


let sMgr: SignpostManager | null = null, routingNetwork: RoutingNetwork | null = null;

onmessage = e => {
    
    switch (e.data.type) {
        case 'updateData':
          
            if (routingNetwork !== null) {
                routingNetwork.update(e.data.data.ways, e.data.data.pois);
              
                postMessage({ type: 'dataUpdated' });
            }
            break;

        case 'checkJunction':
            console.log('worker checkJunction: data=', e.data.data);
            if (sMgr !== null) {
                const sign = sMgr.updatePos(e.data.data);
              
                postMessage({ type: 'checkJunctionFinished', data: sign });
            }
            break;

        case 'createObjects':

            routingNetwork = new RoutingNetwork(e.data.data.routingNetworkOptions);
            sMgr = new SignpostManager({
                routingNetwork,
                juncDetectDistChange: 0.002
            });
            break;

        case 'addRoutablePoi':
            sMgr?.addRoutablePoi(e.data.data);
    }
};
