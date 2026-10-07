

import { RoutingNetworkOptions, RoutablePoi, Signpost } from '../../types/hikar';
import { useRef, useEffect } from 'react';
import type { LonLat } from 'locar';
import type { FeatureCollection, Point, LineString } from 'geojson';

export default function useRouting(options: {
    routingNetworkOptions: RoutingNetworkOptions,
    onDataUpdated: () => void,
    onSignpostFound: (signpost: Signpost | null) => void
}) {

    let worker: Worker | null = null;

    useEffect(() => {

        if (!worker) {
            worker = new Worker(new URL("../worker.ts", import.meta.url), { type: 'module' });
            //  routingNetwork.current = new RoutingNetwork(options);
            //  signpostManager.current = new SignpostManager({ routingNetwork: routingNetwork.current })

            worker.onmessage = e => {

                switch (e.data.type) {
                    case 'dataUpdated':
                        options.onDataUpdated();
                        break;
                    case 'checkJunctionFinished':
                        options.onSignpostFound(e.data.data);
                        break;
                }
            };
        }

        worker.postMessage({ type: "createObjects", "data": { routingNetworkOptions: options.routingNetworkOptions } });

    }, [options])

    return {
        updateRoutingNetwork: (allWaysForRouting: FeatureCollection<LineString>, newRoutablePois: FeatureCollection<Point>) => {

            // routingNetwork.current?.update(allWaysForRouting, newRoutablePois);
            worker?.postMessage({ type: "updateData", data: { ways: allWaysForRouting, pois: newRoutablePois } });
        },
        addRoutablePoi: (f: RoutablePoi) => {

            worker?.postMessage({ type: "addRoutablePoi", data: f });
        },
        findSignpostAtLonLat: (lonLat: LonLat) => {

            worker?.postMessage({ type: "checkJunction", data: lonLat });
        }
    }
}
