import React, { useState, useRef, useEffect } from 'react';
import { useGeolocationBackend } from '@omnidotdev/rdk/geolocation';
import { useThree } from '@react-three/fiber';
import GeoDataRenderer from './GeoDataRenderer';
import TerrainGenerator from '../terrain';
import { FeatureCollection, LineString, Point, MultiLineString, GeoJsonProperties } from 'geojson';
import { useStore } from '../hooks/useStore';
import { useMsgStore } from '../hooks/useMsgStore';
import { Way, Poi } from '../../types/hikar';
import useTiler from '../hooks/useTiler';
import useIndexedFeatures from '../hooks/useIndexedFeatures';
import useRouting from '../hooks/useRouting';
import { LocAR, LonLat } from 'locar';
import { RoutablePoi, RoutableWay, Signpost, HikarMainProps } from '../../types/hikar';
import BoundingBox from '../BoundingBox';
import * as THREE from 'three';


export default function HikarMain({ longitude, latitude, hFov = 80 }: HikarMainProps) {


    const addGeoData = useStore((state) => state.addGeoData);
    const addSignpost = useStore((state) => state.addSignpost);
    const setLoadingMsg = useMsgStore((state) => state.setLoadingMsg);
    const setStatusMsg = useMsgStore((state) => state.setStatusMsg);

    const { updateTiler, getElevation, getDataForTile } = useTiler("/dem/{z}/{x}/{y}.png", "/map/{z}/{x}/{y}.json?outProj=4326&");
    const { updateRoutingNetwork, addRoutablePoi, findSignpostAtLonLat } = useRouting({
        juncDistThreshold: 0.05
    });
    const { addIndexedFeature, indexedFeatures } = useIndexedFeatures();

    const lastPos = useRef<LonLat>({
        latitude: 0,
        longitude: 0
    });

    const noAccess = ["private", "no"];

    const { locar } = useGeolocationBackend();
    const { camera, gl } = useThree();

    useEffect(() => {
        onPosUpdated({ longitude, latitude });
    }, [longitude, latitude]);


    
    useEffect(() => {
        (camera as THREE.PerspectiveCamera).fov = hFov * (gl.domElement.height / gl.domElement.width);
        camera.updateProjectionMatrix();
    }, [hFov]);
    

    console.log("Rendering HikarMain");

    return (
        <GeoDataRenderer />
    );


    async function onPosUpdated(pos: LonLat) {
        console.log(`onPosUpdated(): ${pos.longitude} ${pos.latitude}`);

        if (LocAR.haversineDist(lastPos.current, pos) > 10) {
            lastPos.current.latitude = pos.latitude;
            lastPos.current.longitude = pos.longitude;
            setLoadingMsg("Downloading data...");
            const newData = await updateTiler(pos);
            const elev = getElevation(pos) ?? 0;
            console.log(`elev: ${elev}`);
            setStatusMsg(`Lat: ${pos.latitude.toFixed(2)} Lon: ${pos.longitude.toFixed(2)} Elev: ${Math.round(elev)}m`);
            camera.position.setY(elev + 2);
            if (newData.length > 0) {
                setLoadingMsg("Rendering data...");
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
                    const tileKey = dataTile.tile.getIndex();
                    const newDem = getDataForTile(tileKey);
                    if (newDem) {
                        const terrainGenerator = new TerrainGenerator(newDem);
                        const terrain = terrainGenerator.genTerrain(locar!);
                        terrain.userData["tileKey"] = tileKey;
                        terrain.renderOrder = -1;
                        (terrain.material as THREE.MeshStandardMaterial).colorWrite = false;
                        geodata.terrains.push(terrain);
                    }
                    for (let feature of (dataTile.data as FeatureCollection).features) {
                        feature.properties ??= {};
                        const props = feature.properties;
                        const hikar_id = props.hikar_id ?? 0;
                        if (!indexedFeatures[hikar_id]) {

                            const hwy = feature.properties?.highway;



                            const accessibleHighway = hwy && hwy.indexOf("motorway") == -1 && noAccess.indexOf(props.access) == -1 && noAccess.indexOf(props.foot) == -1;
                            switch (feature.geometry.type) {
                                case "Point":

                                    feature.properties.hikar_id = `poi-${props.osm_id}`;
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
                                    feature.properties.hikar_id = `way-${dataTile.tile.toString()}:w${feature.properties!.osm_id}`;
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
                                                splitWay.properties!.hikar_id = `way-${baseId}#${i++}`;
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
                setLoadingMsg("Updating routing...");
                updateRoutingNetwork(waysForRouting, poisForRouting);
                console.log("triggering render of geodata");
                addGeoData(geodata);
            }
            const signpost = findSignpostAtLonLat(pos);
            if (signpost !== null) {
                console.log("triggering render of signpost");
                addSignpost(signpost);
                printSignpost(signpost);
            }
            setLoadingMsg("");
        }

    }
    function printSignpost(signpost: Signpost) {
        console.log('*** SIGNPOST:');
        Object.keys(signpost.arms).forEach(bearing => {
            console.log(`Arm: Bearing ${bearing} Destinations: ${JSON.stringify(signpost.arms[bearing as any as number].destinations)}`);
        });
    }
}
