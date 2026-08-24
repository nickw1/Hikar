import { DemApplier, DemTiler, GeoJsonTiler } from 'locar-tiler';
import type { LonLat } from 'locar';
import { useRef, useEffect } from 'react';

export default function useTiler(demUrl: string, jsonUrl: string) {

    const demApplier = useRef<DemApplier | null>(null);
    const demTiler = useRef<DemTiler | null>(null);

    useEffect(() => {
        console.log(`effect for useTiler() running: urls: ${demUrl} ${jsonUrl}`)
        demApplier.current = new DemApplier(
            demTiler.current = new DemTiler(demUrl),
            new GeoJsonTiler(jsonUrl)
        )
    }, [demUrl, jsonUrl]);

    return {
        updateTiler: async (lonLat: LonLat) => {

            console.log(`updateTiler: ${JSON.stringify(lonLat)}`)
            if(demApplier.current !== null) {
                return await demApplier.current.updateByLonLat(lonLat);
            } else {
                throw new Error("Error: Tiler not initialised yet!");
            }

        },
        getElevation: (lonLat: LonLat) => {
            console.log(`getElevation(): lonLat=${JSON.stringify(lonLat)}, tiler = ${demTiler.current}}`)
            return demTiler.current?.getElevationFromLonLat(lonLat) ?? Number.NEGATIVE_INFINITY
        },

        getDataForTile: (tileKey: string) => {
            return demTiler.current?.dataTiles.get(tileKey)?.data ?? null;
        }
    }
}