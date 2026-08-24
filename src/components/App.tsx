import React, { useState, useRef, useEffect, Suspense } from 'react';
import { GeolocationSession } from '@omnidotdev/rdk/geolocation';
import { Canvas } from '@react-three/fiber';
import GeoDataRenderer from './GeoDataRenderer';
import LoadingMsg from './LoadingMsg';
import { FeatureCollection, LineString, Position, Point, Feature, MultiLineString } from 'geojson';
import { useStore } from '../hooks/store';
import { Way } from '../../types/hikar';
import useTiler from '../hooks/useTiler';
import useIndexedFeatures from '../hooks/useIndexedFeatures';
import useRouting from '../hooks/useRouting';
import { LocAR, LonLat } from 'locar';
import { RoutablePoi, RoutableWay, Signpost } from '../../types';
import BoundingBox from '../BoundingBox';


export default function App() {

    const START_POS = { lat: 51.051384, lon: -0.728487 };
    const { addPoi, addWay, setElev } = useStore();
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
            }} camera={{fov: 60, near: 0.001, far: 4000}}>
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
                const poisForRouting: FeatureCollection<Point> = {
                    "type": "FeatureCollection",
                    "features": new Array<Feature<Point>>()
                }, waysForRouting: FeatureCollection<LineString> = {
                    "type": "FeatureCollection",
                    "features": new Array<Feature<LineString>>()
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
                                    addPoi({
                                        position: {
                                            longitude: feature.geometry.coordinates[0],
                                            latitude: feature.geometry.coordinates[1],
                                        },
                                        altitude: feature.geometry.coordinates[2] as number ?? 0,
                                        name: props.name || "",
                                        type: props.building !== undefined ? "building" : props.place || props.natural || props.amenity,
                                        id: feature.properties.hikar_id
                                    });
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
                                        const way = {
                                            name: feature.properties?.name || null,
                                            type: feature.properties?.designation || feature.properties?.highway,
                                            id: feature.properties.hikar_id, // ways can duplicate across tiles so include tile x and y in the ID
                                            coordinates: (feature.geometry as LineString).coordinates.map(
                                                (lonLat: Position) => {
                                                    return [lonLat[0], lonLat[1], lonLat[2] || 0];
                                                })
                                        };
                                        if (way.coordinates.length >= 2) {
                                            addWay(way);
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
                                            const filteredCoords = lineCoords.filter(coords => coords[2] !== null && coords[2] > Number.NEGATIVE_INFINITY);
                                            const splitWay: Way = {
                                                name: feature.properties?.name ?? "",
                                                type: feature.properties?.designation || feature.properties?.highway,
                                                id: `${baseId}#${i++}`,
                                                coordinates: filteredCoords
                                            };

                                            if (filteredCoords.length >= 2) {
                                                addWay(splitWay);
                                                const routableWay = structuredClone(feature) as RoutableWay;
                                                routableWay.geometry.coordinates = splitWay.coordinates;
                                                feature.properties!.hikar_id = splitWay.id;
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

            }
        }
        setStatus("");
        const signpost = findSignpostAtLonLat(pos);
        if (signpost !== null) {
            printSignpost(signpost);
        }
    }
    function printSignpost(signpost: Signpost) {
        console.log('*** SIGNPOST:');
        Object.keys(signpost.arms).forEach(bearing => {
            console.log(`Arm: Bearing ${bearing} Destinations: ${JSON.stringify(signpost.arms[bearing as any as number].destinations)}`);
        });
    }
}
