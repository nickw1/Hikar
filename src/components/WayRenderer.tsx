
import { memo, useRef, useEffect } from 'react';
import GeoLine from './GeoLine'; //@omnidotdev/rdk/geolocation';
import type { Way } from '../../types/hikar';
import { useStore } from '../hooks/useStore';

type WayAttributes = { colour: string, width: number };
type AllWayAttributes = { [type: string]: WayAttributes };

const MemoisedLine = memo(
    function memoisedLine({ way, attrs }: { way: Way, attrs: AllWayAttributes }) {
        return (
            <GeoLine key={`${way.properties!.hikar_id}`} coordinates={way.geometry.coordinates as Array<[number, number, number]>} color={attrs[way.properties!.type]?.colour ?? 'lightgray'} lineWidth={attrs[way.properties!.type]?.width ?? 2} opacity={0.7}
                onPointerDown={() => alert(`${way.properties?.type ?? 'unknown way type'}`)} />
        );
    }
);

export default function WayRenderer() {

    const wayColours = useRef<AllWayAttributes>({
        footway: { colour: "#00ff00", width: 2 },
        path: { colour: "#00ff00", width: 2 },
        public_footpath: { colour: "#00ff00", width: 2 },
        bridleway: { colour: "#aa5500", width: 2 },
        public_bridleway: { colour: "#aa5500", width: 2 },
        byway: { colour: "red", width: 2 },
        byway_open_to_all_traffic: { colour: "red", width: 2 },
        restricted_byway:  { colour: "magenta", width: 2 },
        cycleway: { colour: "blue", width: 2 },
        track: { colour: "#ff8000", width: 3.5 },
        service: { colour: "lightgray", width: 3.5 },
        residential: { colour: "lightgray", width: 5.5 },
        unclassified: { colour: "lightgray", width: 6 },
        tertiary : { colour: "lightgray", width: 6.5 },
        secondary: { colour: "lightgray", width: 7.5 },
        primary : { colour: "lightgray", width: 7.5 },
        trunk : { colour: "lightgray", width: 7.5 }
    });

    const ways = useStore((state) => state.ways);

    return ways.map(way => (
        <MemoisedLine key={`${way.properties!.hikar_id}`} way={way} attrs={wayColours.current} />
    ))
}