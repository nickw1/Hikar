import React, { useState, useMemo } from 'react';
import { XR } from '@omnidotdev/rdk/engine';
import { GeolocationSession } from '@omnidotdev/rdk/geolocation';
import { KeyboardControls, type KeyboardControlsEntry } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import HikarMain from './HikarMain';
import LoadingMsg from './LoadingMsg';
import StatusMsg from './StatusMsg';
import type { LonLat } from 'locar';
import type { AppParams } from '../../types/hikar';
import { useMsgStore } from '../hooks/useMsgStore';


export default function App({ fakeLat, fakeLon }: AppParams) {



    const [lonLat, setLonLat] = useState<LonLat | null>(null);

    const setLoadingMsg = useMsgStore((state) => state.setLoadingMsg);


    if (lonLat === null) {
        setLoadingMsg("Waiting for GPS...");
    }


    const map = useMemo<KeyboardControlsEntry<string>[]>(() => [
        { name: "forward", keys: ['ArrowUp', 'KeyW'] },
        { name: 'back', keys: ['ArrowDown', 'KeyS'] },
        { name: 'left', keys: ['ArrowLeft', 'KeyA'] },
        { name: 'right', keys: ['ArrowRight', 'KeyD'] },
        { name: 'up', keys: ['KeyQ'] },
        { name: 'down', keys: ['KeyZ'] }
    ], []);


    return (<>
        <Canvas gl={{ antialias: false, powerPreference: "default" }} style={{
            width: "100%",
            height: "100%",
            position: "absolute",
            top: "0px",
            left: "0px",
            zIndex: 1
        }} camera={{ near: 0.001, far: 4000, fov: 60 }}>
            <ambientLight intensity={1.0} />
            <directionalLight position={[10, 10, 10]} intensity={2} />

            <XR>
                <GeolocationSession options={{
                    fakeLat: fakeLat === undefined || fakeLat === null ? undefined : parseFloat(fakeLat),
                    fakeLon: fakeLon === undefined || fakeLon === null ? undefined : parseFloat(fakeLon),
                    //   fakeLat: START_POS.lat,
                    // fakeLon: START_POS.lon,
                    onGpsUpdate: (pos, distMoved) => {
                        //console.log(`got a gps pos: ${pos.coords.longitude} ${pos.coords.latitude}, distMoved = ${distMoved}`);
                        if (distMoved > 5) {
                            // console.log("setting lon/lat, should trigger render...");
                            setLonLat(pos.coords);
                        }
                    }
                }}>
                    {lonLat === null ? "" : <KeyboardControls map={map}><HikarMain longitude={lonLat.longitude} latitude={lonLat.latitude} /></KeyboardControls>}

                </GeolocationSession>

            </XR>


        </Canvas>
        <StatusMsg />
        <LoadingMsg />

    </>
    );

}
