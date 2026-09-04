
import { memo, useRef, useEffect } from 'react';
import { GeoLine } from '@omnidotdev/rdk/geolocation';
import type { Way } from '../../types/hikar';
import { useStore } from '../hooks/useStore';

type WayAttributes = { colour: string, width: number };
type AllWayAttributes = { [type: string]: WayAttributes };

const MemoisedLine = memo(
    function memoisedLine({ way, attrs }: { way: Way, attrs: AllWayAttributes }) {
        return (
            <GeoLine key={`${way.properties!.hikar_id}`} coordinates={way.geometry.coordinates as Array<[number, number, number]>} color={attrs[way.properties!.type]?.colour ?? 'lightgray'} lineWidth={attrs[way.properties!.type]?.width ?? 2} opacity={0.7} />
        );
    }
);

export default function WayRenderer() {

    const wayColours = useRef<AllWayAttributes>({});

    const ways = useStore((state) => state.ways);

    useEffect(() => {
        wayColours.current["footway"] = { colour: "green", width: 2 };
        wayColours.current["path"] = { colour: "green", width: 2 };
        wayColours.current["public_footpath"] = { colour: "green", width: 2 };
        wayColours.current["bridleway"] = { colour: "#aa5500", width: 2 };
        wayColours.current["public_bridleway"] = { colour: "#aa5500", width: 2 };
        wayColours.current["byway"] = { colour: "red", width: 2 };
        wayColours.current["byway_open_to_all_traffic"] = { colour: "red", width: 2 };
        wayColours.current["restricted_byway"] = { colour: "magenta", width: 2 };
        wayColours.current["cycleway"] = { colour: "blue", width: 2 };
        wayColours.current["track"] = { colour: "#ff8000", width: 2 };
        wayColours.current["service"] = { colour: "lightgray", width: 2 };
    }, []);

    return ways.map(way => (
        <MemoisedLine key={`${way.properties!.hikar_id}`} way={way} attrs={wayColours.current} />
    ))
}
