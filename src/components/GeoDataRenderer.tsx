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