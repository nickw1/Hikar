import React, { useState, useRef, Suspense } from 'react';
import { GeolocationSession } from '@omnidotdev/rdk/geolocation';
import { Canvas } from '@react-three/fiber';
import GeoDataRenderer from './GeoDataRenderer';
import LoadingMsg from './LoadingMsg';
import { FeatureCollection, LineString, Point, MultiLineString, GeoJsonProperties } from 'geojson';
import { useStore } from '../hooks/useStore';
import { Way, Poi } from '../../types/hikar';
import useTiler from '../hooks/useTiler';
import useIndexedFeatures from '../hooks/useIndexedFeatures';
import useRouting from '../hooks/useRouting';
import { LocAR, LonLat } from 'locar';
import { RoutablePoi, RoutableWay, Signpost } from '../../types/hikar';
import BoundingBox from '../BoundingBox';
import * as THREE from 'three';


export default function App() {

    const START_POS = { lat: 51.051384, lon: -0.728487 };
    const addGeoData = useStore((state) => state.addGeoData);
    const addSignpost = useStore((state) => state.addSignpost);
    const setElev = useStore((state) => state.setElev);
    const [status, setStatus] = useState("Waiting for GPS...");
    const { updateTiler, getElevation, getDataForTile } = useTiler("/dem/{z}/{x}/{y}.png", "/map/{z}/{x}/{y}.json?outProj=4326");
    const { updateRoutingNetwork, addRoutablePoi, findSignpostAtLonLat } = useRouting({
        juncDistThreshold: 0.05
    });
    const { addIndexedFeature, indexedFeatures } = useIndexedFeatures();

    const lastPos = useRef<LonLat>({
        latitude: 0,
        longitude: 0
    });

    const noAccess = ["private", "no"];

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
            }} camera={{ fov: 60, near: 0.001, far: 4000 }}>
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

    async function onPosUpdated(pos: LonLat, distMoved: number) {
        console.log(`onPosUpdated(): ${pos.longitude} ${pos.latitude} distMoved ${distMoved}`);

        if (LocAR.haversineDist(lastPos.current, pos) > 10) {
            lastPos.current.latitude = pos.latitude;
            lastPos.current.longitude = pos.longitude;
            setStatus("Downloading data...");
            const newData = await updateTiler(pos);
            const elev = getElevation(pos) ?? 0;
            console.log(`elev: ${elev}`);
            setElev(elev);
            if (newData.length > 0) {
                const geodata = {
                    pois: new Array<Poi>(),
                    ways: new Array<Way>(),
                    terrains: new Array<THREE.Mesh>()
                };
                const poisForRouting: FeatureCollection<Point> = {
                    "type": "FeatureCollection",
                    "features": new Array<Poi>()
                }, waysForRouting: FeatureCollection<LineString> = {
                    "type": "FeatureCollection",
                    "features": new Array<Way>()
                };

                for (let dataTile of newData) {
                    for (let feature of (dataTile.data as FeatureCollection).features) {
                        feature.properties ??= {};
                        const props = feature.properties;
                        const hikar_id = props.hikar_id ?? 0;
                        if (!indexedFeatures[hikar_id]) {

                            const hwy = feature.properties?.highway;



                            const accessibleHighway = hwy && hwy.indexOf("motorway") == -1 && noAccess.indexOf(props.access) == -1 && noAccess.indexOf(props.foot) == -1;
                            switch (feature.geometry.type) {
                                case "Point":

                                    feature.properties.hikar_id = `p${props.osm_id}`;
                                    const poiForRendering = structuredClone(feature) as Poi;
                                    poiForRendering.properties!.type = props.building !== undefined ? "building" : props.place || props.natural || props.amenity;
                                    geodata.pois.push(poiForRendering);
                                    if (props.name) {
                                        const routablePoi = structuredClone(feature) as RoutablePoi;

                                        routablePoi.dist = Number.MAX_VALUE;
                                        routablePoi.bearing = 720;
                                        routablePoi.path = [];
                                        routablePoi.weight = 0.0;
                                        routablePoi.split = null;

                                        poisForRouting.features.push(routablePoi);
                                        addRoutablePoi(routablePoi);
                                    }
                                    break;
                                case "LineString":
                                    feature.properties.hikar_id = `${dataTile.tile.toString()}:w${feature.properties!.osm_id}`;
                                    if (accessibleHighway) {
                                        feature.properties.type = feature.properties?.designation || feature.properties?.highway;
                                        const filteredCoords = feature.geometry.coordinates.filter(coord => coord[2] !== undefined);

                                        if (filteredCoords.length >= 2) {
                                            geodata.ways.push({
                                                type: "Feature",
                                                geometry: {
                                                    "type": "LineString",
                                                    coordinates: filteredCoords
                                                },
                                                properties: { ...feature.properties, type: feature.properties?.designation || feature.properties?.highway }
                                            });
                                            const routableWay = structuredClone(feature) as RoutableWay;
                                            routableWay.boundingBox = BoundingBox.fromCoords(routableWay.geometry.coordinates);
                                            waysForRouting.features.push(routableWay);
                                        }
                                    }
                                    break;
                                case "MultiLineString":
                                    if (accessibleHighway) {
                                        const baseId = `${dataTile.tile.toString()}:w${feature.properties!.osm_id}`;

                                        const mlsCoords = (feature.geometry as MultiLineString).coordinates;
                                        let i = 0;
                                        for (let lineCoords of mlsCoords) {
                                            const filteredCoords = lineCoords.filter(coords => coords[2] !== undefined);


                                            if (filteredCoords.length >= 2) {
                                                const splitWay: Way = {
                                                    type: "Feature",
                                                    geometry: {
                                                        "type": "LineString",
                                                        coordinates: filteredCoords
                                                    },
                                                    properties: { ...feature.properties, type: feature.properties?.designation || feature.properties?.highway } as GeoJsonProperties
                                                };
                                                splitWay.properties!.hikar_id = `${baseId}#${i++}`;
                                                geodata.ways.push(splitWay);
                                                const routableWay = structuredClone(splitWay) as RoutableWay;
                                                routableWay.boundingBox = BoundingBox.fromCoords(routableWay.geometry.coordinates);
                                                waysForRouting.features.push(routableWay);
                                            }
                                        }
                                    }
                                    break;
                            }
                            addIndexedFeature(feature.properties!.hikar_id, feature);
                        }
                    }
                }
                updateRoutingNetwork(waysForRouting, poisForRouting);
                addGeoData(geodata);
                setStatus("");
            }
            const signpost = findSignpostAtLonLat(pos);
            if (signpost !== null) {
                addSignpost(signpost);
                printSignpost(signpost);
            }
        }

    }
    function printSignpost(signpost: Signpost) {
        console.log('*** SIGNPOST:');
        Object.keys(signpost.arms).forEach(bearing => {
            console.log(`Arm: Bearing ${bearing} Destinations: ${JSON.stringify(signpost.arms[bearing as any as number].destinations)}`);
        });
    }
}
