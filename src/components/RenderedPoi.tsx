
import { useCallback } from 'react';
import * as THREE from 'three';
import { ThreeEvent } from '@react-three/fiber';
import type { Poi } from '../../types/hikar';
import Glass from './basicModels/Glass';
import Cup from './basicModels/Cup';
import Tree from './basicModels/Tree';
import Building from './basicModels/Building';
import Marker from './basicModels/Marker';
import { GeolocationAnchor } from '@omnidotdev/rdk/geolocation';
import { Text } from '@react-three/drei';

export default function RenderedPoi({ poi }: { poi: Poi }) {

    const clickHandler = useCallback((e: ThreeEvent<THREE.Mesh | THREE.Group>) => {
        e.stopPropagation();
        if (poi.properties?.name) {
            alert(`This is ${poi.properties.name}`);
        }
    }, [poi]);


    let element = <></>;
    console.log(`Name ${poi.properties!.name} Type ${poi.properties!.type}`)
    switch (poi.properties!.type) {
        case "pub":
        case "bar":
            element = <Glass scale={4} onClick={clickHandler} />;
            break;
        case "cafe":
            element = <Cup scale={4} onClick={clickHandler} />;
            break;
        case "tree":
            element = <Tree scale={4} onClick={clickHandler} />;
            break;
        case "peak":
            element = <mesh scale={4} onClick={clickHandler}><coneGeometry args={[8, 24]} /><meshStandardMaterial color={0xff00ff} /></mesh>;
            break;
        case "shop":
        case "building":
            element = <Building scale={4} id={`bldg-${poi.id}`} onClick={clickHandler} />;
            break;
        default:
            element = <Marker scale={4} onClick={clickHandler} />;
    }

    return (
        <GeolocationAnchor key={`${poi.properties!.hikar_id}`} latitude={poi.geometry.coordinates[1]} longitude={poi.geometry.coordinates[0]} altitude={poi.geometry.coordinates[2]}>
            {element}
            {poi.properties!.name ? <Text position={[0, -2, 0]} scale={5} font="https://fonts.gstatic.com/s/roboto/v18/KFOmCnqEu92Fr1Mu4mxM.woff" color="white" anchorX="center" anchorY="middle">{poi.properties!.name}</Text> : ""}
        </GeolocationAnchor>
    );

}