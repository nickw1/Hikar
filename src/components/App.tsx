import React, { useState, useRef, useEffect, Suspense } from 'react';
import { GeolocationSession } from '@omnidotdev/rdk/geolocation';
import { Canvas } from '@react-three/fiber';
import * as LT from 'locar-tiler';
import GeoDataRenderer from './GeoDataRenderer';
import LoadingMsg from './LoadingMsg';
import { FeatureCollection, LineGeometry } from '../../types/hikar';
import { useStore } from '../../hooks/store';

export default function App() {

    const START_POS = { lat: 51.051384, lon: -0.728487 };
    const demApplier = useRef<LT.DemApplier | null>(null);
    const { addPoi, addWay, setElev } = useStore();
    const [status, setStatus] = useState("Waiting for GPS...");

    useEffect(() => {
        const demTiler = new LT.DemTiler("/dem/{z}/{x}/{y}.png"), jsonTiler = new LT.GeoJsonTiler("/map/{z}/{x}/{y}.json?outProj=4326");
        demApplier.current = new LT.DemApplier(demTiler, jsonTiler);
    }, []);

    return (<>
        {status != "" ? <LoadingMsg message={status} /> : ""}
        <Suspense fallback={<LoadingMsg message="Rendering data..." />}>
            <Canvas gl={{ antialias: false, powerPreference: "default" }} style={{
                width: "100%",
                height: "100%",
                position: "absolute",
                top: "0px",
                left: "0px",
                zIndex: 1
            }}>
                <ambientLight intensity={1.0} />
                <directionalLight position={[10, 10, 10]} intensity={2} />

                <GeolocationSession options={{
                    fakeLat: START_POS.lat, fakeLon: START_POS.lon,
                    onGpsUpdate: (pos, distMoved) => {
                        onPosUpdated({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }, distMoved);
                    }
                }}>
                    <GeoDataRenderer />
                </GeolocationSession>

            </Canvas>
        </Suspense>
    </>
    );

    async function onPosUpdated(pos: LT.LonLat, distMoved: number) {
        console.log(`onPosUpdated(): ${pos.longitude} ${pos.latitude} distMoved ${distMoved}`);
        if (demApplier.current === null || distMoved == 0) return;
        const lonLat = new LT.LonLat(pos.longitude, pos.latitude);
        setStatus("Downloading data...");
        const newData = await demApplier.current.updateByLonLat(
            lonLat
        );
        const elev = demApplier.current.demTiler.getElevationFromLonLat(lonLat) ?? 0;
        console.log(`elev: ${elev}`);
        setElev(elev);
        for (let tile of newData) {
            for (let poiData of (tile.data as FeatureCollection).features) {
                switch (poiData.geometry.type) {
                    case "Point":
                        addPoi({
                            position: new LT.LonLat(
                                poiData.geometry.coordinates[0],
                                poiData.geometry.coordinates[1],
                            ),
                            altitude: poiData.geometry.coordinates[2] as number ?? 0,
                            name: poiData.properties.name || "",
                            type: poiData.properties.building !== undefined ? "building" : poiData.properties.place || poiData.properties.natural || poiData.properties.amenity,
                            id: poiData.properties.osm_id
                        });
                        break;
                    case "LineString":
                        if (poiData.properties.access !== "private") {
                            const way = {
                                name: poiData.properties.name || null,
                                type: poiData.properties.designation || poiData.properties.highway,
                                id: `${tile.tile.x}:${tile.tile.y}:${poiData.properties.osm_id}`, // ways can duplicate across tiles so include tile x and y in the ID
                                coordinates: (poiData.geometry as LineGeometry).coordinates.map(
                                    (lonLat: [number, number, number?]): [number, number, number] => {
                                        return [lonLat[0], lonLat[1], lonLat[2] || 0];
                                    })
                            };
                            if (way.coordinates.length >= 2) {
                                addWay(way);
                            }
                        }
                        break;
                    default:
                        break;
                }
            }
        }
        setStatus("");
    }
}
