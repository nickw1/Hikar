
import { memo, useRef, useEffect } from 'react';
import { GeoLine } from '@omnidotdev/rdk/geolocation';
import type { Way } from '../../types/hikar';
import { useStore } from '../hooks/useStore';

type WayAttributes = { colour: string, width: number, road?: boolean };
type AllWayAttributes = { [type: string]: WayAttributes };

const MemoisedLine = memo(
    function memoisedLine({ way, attrs }: { way: Way, attrs: AllWayAttributes }) {
        return (
            <GeoLine key={`${way.properties!.hikar_id}`} coordinates={way.geometry.coordinates as Array<[number, number, number]>} color={attrs[way.properties!.type]?.colour ?? 'lightgray'} lineWidth={attrs[way.properties!.type]?.width ?? 2} opacity={0.7}
                onPointerDown={() => alert(`This is a ${way.properties?.type?.replace('_',' ') ?? 'way of unknown type'}${attrs[way.properties!.type]?.road ? " road" : ""}`)} />
        );
    }
);

export default function WayRenderer() {

    const wayAttributes = useRef<AllWayAttributes>({
        footway: { colour: "#00ff00", width: 2 },
        path: { colour: "#00ff00", width: 2 },
        public_footpath: { colour: "#00ff00", width: 2 },
        bridleway: { colour: "#aa5500", width: 2 },
        public_bridleway: { colour: "#aa5500", width: 2 },
        byway: { colour: "red", width: 2 },
        byway_open_to_all_traffic: { colour: "red", width: 2 },
        restricted_byway:  { colour: "magenta", width: 2 },
        cycleway: { colour: "blue", width: 2 },
        track: { colour: "#ff8000", width: 2},
        service: { colour: "lightgray", width: 2, road: true },
        residential: { colour: "lightgray", width: 3, road: true },
        unclassified: { colour: "lightgray", width: 4, road: true },
        tertiary : { colour: "lightgray", width: 6, road: true },
        secondary: { colour: "lightgray", width: 6, road: true },
        primary : { colour: "lightgray", width: 6, road: true },
        trunk : { colour: "lightgray", width: 7, road: true }
    });

    const ways = useStore((state) => state.ways);

    return ways.map(way => (
        <MemoisedLine key={`${way.properties!.hikar_id}`} way={way} attrs={wayAttributes.current} />
    ))
}