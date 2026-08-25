import React, { useEffect, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import { GeolocationAnchor, GeoLine } from '@omnidotdev/rdk/geolocation';
import { useStore } from '../hooks/useStore';
import Cup from './basicModels/Cup';
import Glass from './basicModels/Glass';
import Marker from './basicModels/Marker';
import Tree from './basicModels/Tree';
import Building from './basicModels/Building';
import { Text } from '@react-three/drei';



export default function GeoDataRenderer() {

    const { camera } = useThree();
    const geodata = useStore((state) => state.geodata);
    const signposts = useStore((state) => state.signposts);
    const elev = useStore((state) => state.elev);
    const wayColours = useRef<Map<string, string>>(new Map());


    useEffect(() => {
        if (wayColours.current.size == 0) {
            wayColours.current.set("footway", "green");
            wayColours.current.set("path", "green");
            wayColours.current.set("bublic_footpath", "green");
            wayColours.current.set("bridleway", "#aa5500");
            wayColours.current.set("public_bridleway", "#aa5500");
            wayColours.current.set("byway", "red");
            wayColours.current.set("byway_open_to_all_traffic", "red");
            wayColours.current.set("restricted_byway", "magenta");
            wayColours.current.set("cycleway", "blue");
        }
        console.log(`Setting elev to ${elev}`)
        camera.position.setY(elev + 2);
    }, [elev]);

    return (
        <>
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
            {geodata.ways.map(way => {
                return (
                    <GeoLine key={`w${way.properties!.hikar_id}`} coordinates={way.geometry.coordinates as Array<[number, number, number]>} color={wayColours.current.get(way.properties!.type) || 'lightgray'} lineWidth={5} />
                )
            })}
        </>
    )

}