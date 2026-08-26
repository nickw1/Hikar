import React, { useEffect, useRef, useCallback } from 'react';
import { GeolocationAnchor, GeoLine } from '@omnidotdev/rdk/geolocation';
import { useStore } from '../hooks/useStore';
import Cup from './basicModels/Cup';
import Glass from './basicModels/Glass';
import Marker from './basicModels/Marker';
import Tree from './basicModels/Tree';
import Building from './basicModels/Building';
import RenderedSignpost from './signpost/RenderedSignpost';
import { Text } from '@react-three/drei';
import type { Poi } from '../../types/hikar';
import * as THREE from 'three';
import type { ThreeEvent } from '@react-three/fiber';


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
        wayColours.current["byway_open_to_all_traffic"] = { colour: "red", width: 4 };
        wayColours.current["restricted_byway"] = { colour: "magenta", width: 4 };
        wayColours.current["cycleway"] = { colour: "blue", width: 4 };
        wayColours.current["track"] = { colour: "#ff8000", width: 4 };
        wayColours.current["service"] = { colour: "lightgray", width: 4 };
    }, []);



    const clickHandler = useCallback((poi: Poi, e: ThreeEvent<THREE.Mesh | THREE.Group>) => {
        e.stopPropagation();
        if (poi.properties?.name) {
            alert(`This is ${poi.properties.name}`);
        }
    }, []);

    return (
        <>
            {geodata.terrains.map(terrain => (
                <primitive object={terrain} key={`trn-${terrain.userData["tileKey"]}`}></primitive>
            ))}
            {geodata.pois.map(poi => {
                let element = <></>;
                console.log(`Name ${poi.properties!.name} Type ${poi.properties!.type}`)
                switch (poi.properties!.type) {
                    case "pub":
                    case "bar":
                        element = <Glass scale={4} onClick={(e: ThreeEvent<THREE.Mesh | THREE.Group>) => clickHandler(poi, e)} />;
                        break;
                    case "cafe":
                        element = <Cup scale={4} onClick={(e: ThreeEvent<THREE.Mesh | THREE.Group>) => clickHandler(poi, e)} />;
                        break;
                    case "tree":
                        element = <Tree scale={4} onClick={(e: ThreeEvent<THREE.Mesh | THREE.Group>) => clickHandler(poi, e)} />;
                        break;
                    case "peak":
                        element = <mesh scale={4} onClick={(e: ThreeEvent<THREE.Mesh | THREE.Group>) => clickHandler(poi, e)}><coneGeometry args={[8, 24]} /><meshStandardMaterial color={0xff00ff} /></mesh>;
                        break;
                    case "shop":
                    case "building":
                        element = <Building scale={4} id={`bldg-${poi.id}`} onClick={(e: ThreeEvent<THREE.Mesh | THREE.Group>) => clickHandler(poi, e)} />;
                        break;
                    default:
                        element = <Marker scale={4} onClick={(e: ThreeEvent<THREE.Mesh | THREE.Group>) => clickHandler(poi, e)} />;
                }

                return (
                    <GeolocationAnchor key={`${poi.properties!.hikar_id}`} latitude={poi.geometry.coordinates[1]} longitude={poi.geometry.coordinates[0]} altitude={poi.geometry.coordinates[2]}>
                        {element}
                        {poi.properties!.name ? <Text position={[0, -2, 0]} scale={5} font="https://fonts.gstatic.com/s/roboto/v18/KFOmCnqEu92Fr1Mu4mxM.woff" color="white" anchorX="center" anchorY="middle">{poi.properties!.name}</Text> : ""}
                    </GeolocationAnchor>
                );
            })}
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