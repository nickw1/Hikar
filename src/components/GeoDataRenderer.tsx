import React, { useEffect, useRef } from 'react';
import { GeolocationAnchor, GeoLine } from '@omnidotdev/rdk/geolocation';
import { useStore } from '../hooks/useStore';
import Cup from './basicModels/Cup';
import Glass from './basicModels/Glass';
import Marker from './basicModels/Marker';
import Tree from './basicModels/Tree';
import Building from './basicModels/Building';
import RenderedSignpost from './signpost/RenderedSignpost';
import { Text } from '@react-three/drei';


export default function GeoDataRenderer() {

    console.log("rendering GeoDataRenderer");
    const geodata = useStore((state) => state.geodata);
    const signposts = useStore((state) => state.signposts);
    const wayColours = useRef<{ [type: string]: string }>({});


    useEffect(() => {
        wayColours.current["footway"] = "green";
        wayColours.current["path"] = "green";
        wayColours.current["public_footpath"] = "green";
        wayColours.current["bridleway"] = "#aa5500";
        wayColours.current["public_bridleway"] = "#aa5500";
        wayColours.current["byway"] = "red";
        wayColours.current["byway_open_to_all_traffic"] = "red";
        wayColours.current["restricted_byway"] = "magenta";
        wayColours.current["cycleway"] = "blue";
        wayColours.current["track"] = "#ff8000";
    }, []);

    return (
        <>
            {geodata.terrains.map(terrain => (
                <primitive object={terrain} key={`trn-${terrain.userData["tileKey"]}`}></primitive>
            ))}
            {geodata.pois.map(poi => {
                let element = <></>;
                switch (poi.properties!.type) {
                    case "pub":
                    case "bar":
                        element = <Glass scale={4} />;
                        break;
                    case "cafe":
                        element = <Cup scale={4} />;
                        break;
                    case "tree":
                        element = <Tree scale={4} />;
                    case "peak":
                        element = <mesh scale={4}><coneGeometry args={[8, 24]} /><meshStandardMaterial color={0xff00ff} /></mesh>;
                    case "shop":
                    case "building":
                        element = <Building scale={4} id={`bldg-${poi.id}`} />;
                    default:
                        element = <Marker scale={4} />;
                }

                return (poi.properties!.name ?
                    <GeolocationAnchor key={`${poi.properties!.hikar_id}`} latitude={poi.geometry.coordinates[1]} longitude={poi.geometry.coordinates[0]} altitude={poi.geometry.coordinates[2]}>
                        {element}
                        <Text position={[0, -1, 0]} scale={5} font="https://fonts.gstatic.com/s/roboto/v18/KFOmCnqEu92Fr1Mu4mxM.woff" color="white" anchorX="center" anchorY="middle">{poi.properties!.name}</Text>
                    </GeolocationAnchor> : ""
                );
            })}
            {geodata.ways.map(way => (
                <GeoLine key={`${way.properties!.hikar_id}`} coordinates={way.geometry.coordinates as Array<[number, number, number]>} color={wayColours.current[way.properties!.type] || 'lightgray'} lineWidth={5} />
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