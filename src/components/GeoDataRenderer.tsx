import React, { useEffect, useRef } from 'react';
import { GeolocationAnchor, GeoLine } from '@omnidotdev/rdk/geolocation';
import { useStore } from '../hooks/useStore';
import RenderedSignpost from './signpost/RenderedSignpost';
import RenderedPoi from './RenderedPoi';


export default function GeoDataRenderer() {

    console.log("rendering GeoDataRenderer");

    const geodata = useStore((state) => state.geodata);
    const signposts = useStore((state) => state.signposts);
    const wayColours = useRef<{ [type: string]: { colour: string, width: number } }>({});


    useEffect(() => {
        wayColours.current["footway"] = { colour: "green", width: 2 };
        wayColours.current["path"] = { colour: "green", width: 2 };
        wayColours.current["public_footpath"] = { colour: "green", width: 2 };
        wayColours.current["bridleway"] = { colour: "#aa5500", width: 3 };
        wayColours.current["public_bridleway"] = { colour: "#aa5500", width: 3 };
        wayColours.current["byway"] = { colour: "red", width: 4 };
        wayColours.current["byway_open_to_all_tIraffic"] = { colour: "red", width: 4 };
        wayColours.current["restricted_byway"] = { colour: "magenta", width: 4 };
        wayColours.current["cycleway"] = { colour: "blue", width: 4 };
        wayColours.current["track"] = { colour: "#ff8000", width: 4 };
        wayColours.current["service"] = { colour: "lightgray", width: 4 };
    }, []);

    return (
        <>
            {geodata.terrains.map(terrain => (
                <primitive object={terrain} key={`trn-${terrain.userData["tileKey"]}`}></primitive>
            ))}
            {geodata.pois.map(poi => <RenderedPoi poi={poi} />)}
            {geodata.ways.map(way => (
                <GeoLine key={`${way.properties!.hikar_id}`} coordinates={way.geometry.coordinates as Array<[number, number, number]>} color={wayColours.current[way.properties!.type]?.colour || 'lightgray'} lineWidth={wayColours.current[way.properties!.type]?.width || 6} />
            )
            )}
            {signposts.map(signpost => (
                <GeolocationAnchor key={`sp-${signpost.jKey}`} longitude={signpost.position[0]} latitude={signpost.position[1]} altitude={signpost.position[2]}>
                    <RenderedSignpost signpost={signpost} />
                </GeolocationAnchor>
            ))}

        </>
    )

}