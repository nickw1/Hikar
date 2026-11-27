

import { RoutingNetworkOptions, RoutablePoi, Signpost, SignpostWithErrorInfo } from '../../types/hikar';
import { useRef, useEffect } from 'react';
import type { LonLat } from 'locar';
import type { FeatureCollection, Point, LineString } from 'geojson';


export default function useRouting(options: {
    routingNetworkOptions: RoutingNetworkOptions,
    onDataUpdated: (status: string[]) => void,
    onSignpostFound: (signpost: SignpostWithErrorInfo) => void
}) {
  
    let worker = useRef<Worker | null>(null); 
    useEffect(() => {

        if (!worker.current) {
            worker.current = new Worker(new URL("../worker.ts", import.meta.url), { type: 'module' });
            console.log("Worker initialised");

            worker.current.onmessage = e => {

                switch (e.data.type) {
                    case 'dataUpdated':
                        console.log('useRouting(): received dataUpdated message');
                        options.onDataUpdated(e.data.data);
                        break;
                    case 'checkJunctionFinished':
                        console.log('useRouting(): received onSignpostFound message');
                        options.onSignpostFound(e.data.data);
                        break;
                }
            };
            console.log("useRouting(): Sending createObjects message to worker");
            worker.current.postMessage({ type: "createObjects", "data": { routingNetworkOptions: options.routingNetworkOptions } });
        }
    }, [])

    return {
        updateRoutingNetwork: (allWaysForRouting: FeatureCollection<LineString>, newRoutablePois: FeatureCollection<Point>) => {
            if(!worker.current) console.warn("No worker!");
            worker.current?.postMessage({ type: "updateData", data: { ways: allWaysForRouting, pois: newRoutablePois } });
        },
        addRoutablePoi: (f: RoutablePoi) => {
         if(!worker.current) console.warn("No worker!");
            worker.current?.postMessage({ type: "addRoutablePoi", data: f });
        },
        findSignpostAtLonLat: (lonLat: LonLat) => {
            if(!worker.current) console.warn("No worker!");
            console.log('useRouting(): findSignpostAtLonLat: ', lonLat);
            worker.current?.postMessage({ type: "checkJunction", data: lonLat });
        }
    }
}
