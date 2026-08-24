
import RoutingNetwork from '../RoutingNetwork';
import SignpostManager from '../SignpostManager';
import { RoutingNetworkOptions, RoutablePoi, Signpost } from '../../types';
import { useRef, useEffect } from 'react';
import type { LonLat } from 'locar';
import type { FeatureCollection, Point, LineString } from 'geojson';

export default function useRouting(options: RoutingNetworkOptions) {

    const routingNetwork = useRef<RoutingNetwork | null>(null);
    const signpostManager = useRef<SignpostManager | null>(null);

    useEffect(() => {
        routingNetwork.current = new RoutingNetwork(options);
        signpostManager.current = new SignpostManager({ routingNetwork: routingNetwork.current })
    }, [options])

    return {
        updateRoutingNetwork: (allWaysForRouting: FeatureCollection<LineString>, newRoutablePois: FeatureCollection<Point>) => {
            routingNetwork.current?.update(allWaysForRouting, newRoutablePois);
        },
        addRoutablePoi: (f: RoutablePoi) => {
            signpostManager.current?.addRoutablePoi(f);
        },
        findSignpostAtLonLat: (lonLat: LonLat): Signpost | null => {
            return signpostManager.current?.updatePos(lonLat) ?? null
        }
    }
}
