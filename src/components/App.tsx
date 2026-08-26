import React, { useState, Suspense } from 'react';
import { GeolocationSession } from '@omnidotdev/rdk/geolocation';
import { Canvas } from '@react-three/fiber';
import HikarMain from './HikarMain';
import LoadingMsg from './LoadingMsg';
import StatusMsg from './StatusMsg';
import type { LonLat } from 'locar';


export default function App() {

    const START_POS = { lat: 51.051384, lon: -0.728487 };

    const [lonLat, setLonLat] = useState<LonLat>({ longitude: 0, latitude: 0 });

    console.log("rendering App");
    return (<>
        <Canvas gl={{ antialias: false, powerPreference: "default" }} style={{
            width: "100%",
            height: "100%",
            position: "absolute",
            top: "0px",
            left: "0px",
            zIndex: 1
        }} camera={{ fov: 60, near: 0.001, far: 4000 }}>
            <ambientLight intensity={1.0} />
            <directionalLight position={[10, 10, 10]} intensity={2} />

            <GeolocationSession options={{
                fakeLat: START_POS.lat, fakeLon: START_POS.lon,
                onGpsUpdate: (pos, distMoved) => {
                    console.log(`got a gps pos: ${pos.coords}`);
                    setLonLat(pos.coords);
                }
            }}>
                <HikarMain longitude={lonLat.longitude} latitude={lonLat.latitude} />

            </GeolocationSession>


        </Canvas>
        <StatusMsg />
        <LoadingMsg />

    </>
    );

}
