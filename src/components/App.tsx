import React, { useState, useRef, useEffect, Suspense } from 'react';
import { GeolocationSession } from '@omnidotdev/rdk/geolocation';
import { Canvas } from '@react-three/fiber';
import * as LT from 'locar-tiler';
import GeoDataRenderer from './GeoDataRenderer';
import LoadingMsg from './LoadingMsg';
import { FeatureCollection, LineString, Position, Point, Feature, MultiLineString } from 'geojson';
import { useStore } from '../../hooks/store';
import { Way } from '../../types/hikar';

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
        const poisForRouting = {
            "type": "FeatureCollection",
            "features": new Array<Feature<Point>>()
        }, waysForRouting = {
            "type": "FeatureCollection",
            "features": new Array<Feature<LineString>>()
        };

        for (let tile of newData) {
            for (let geoData of (tile.data as FeatureCollection).features) {
                switch (geoData.geometry.type) {
                    case "Point":
                        addPoi({
                            position: new LT.LonLat(
                                geoData.geometry.coordinates[0],
                                geoData.geometry.coordinates[1],
                            ),
                            altitude: geoData.geometry.coordinates[2] as number ?? 0,
                            name: geoData.properties?.name || "",
                            type: geoData.properties?.building !== undefined ? "building" : geoData.properties?.place || geoData.properties?.natural || geoData.properties?.amenity,
                            id: geoData.properties?.osm_id
                        });
                        poisForRouting.features.push(structuredClone(geoData) as Feature<Point>);
                        break;
                    case "LineString":
                        if (geoData.properties?.access !== "private") {
                            const way = {
                                name: geoData.properties?.name || null,
                                type: geoData.properties?.designation || geoData.properties?.highway,
                                id: `${tile.tile.x}:${tile.tile.y}:${geoData.properties?.osm_id}`, // ways can duplicate across tiles so include tile x and y in the ID
                                coordinates: (geoData.geometry as LineString).coordinates.map(
                                    (lonLat: Position) => {
                                        return [lonLat[0], lonLat[1], lonLat[2] || 0];
                                    })
                            };
                            if (way.coordinates.length >= 2) {
                                addWay(way);
                                waysForRouting.features.push(structuredClone(geoData) as Feature<LineString>);
                            }
                        }
                        break;
                    case "MultiLineString":
                        if (geoData.properties?.access !== "private") {
                            const id = `${tile.tile.x}:${tile.tile.y}:${geoData.properties?.osm_id}`;

                            const mlsCoords = (geoData.geometry as MultiLineString).coordinates;
                            let i = 0;
                            for (let lineCoords of mlsCoords) {
                                const filteredCoords = lineCoords.filter(coords => coords[2] !== null && coords[2] > Number.NEGATIVE_INFINITY);
                                const splitWay: Way = {
                                    name: geoData.properties?.name ?? "",
                                    type: geoData.properties?.designation || geoData.properties?.highway,
                                    id: `${id}#${i++}`,
                                    coordinates: filteredCoords
                                };

                                if (filteredCoords.length >= 2) {
                                    addWay(splitWay);
                                    waysForRouting.features.push(structuredClone(geoData) as Feature<LineString>);
                                }
                            }
                        }
                        break;
                }
            }
        }
        setStatus("");
    }
}
