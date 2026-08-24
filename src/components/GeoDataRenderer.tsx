import React, { useEffect, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import { GeolocationAnchor, GeoLine } from '@omnidotdev/rdk/geolocation';
import { useStore } from '../../hooks/store';
import Cup from './basicModels/Cup';
import Glass from './basicModels/Glass';
import Marker from './basicModels/Marker';
import { Text } from '@react-three/drei';

    

export default function GeoDataRenderer() {
  
    const { camera } = useThree();
    const { pois, ways, elev } = useStore();
    const wayColours = useRef<Map<string, string>>(new Map());


    useEffect(() => {
        if(wayColours.current.size == 0) {
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
        { pois.map(poi =>  {
            let element = <></>;
            switch(poi.type) {
                case "pub":
                case "bar":
                    element = <Glass />;
                    break;
                case "cafe":
                    element = <Cup />;
                    break;
                default:
                    element = <Marker />;
            }
                
            return ( poi.name ? 
                <GeolocationAnchor key={`p${poi.id}`} latitude={poi.position.latitude} longitude={poi.position.longitude} altitude={poi.altitude}>
                   { element }
                   <Text position={[0, -1, 0]} scale={5} font="https://fonts.gstatic.com/s/roboto/v18/KFOmCnqEu92Fr1Mu4mxM.woff" color="white" anchorX="center" anchorY="middle">{poi.name}</Text>
                </GeolocationAnchor> : <></>
                );
         })}
         { ways.map(way => {
            return(
                <GeoLine key={`w${way.id}`} coordinates={way.coordinates} color={wayColours.current.get(way.type) || 'lightgray'} lineWidth={5} />
            )
         })}
        </>
    )

}