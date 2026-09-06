import React, { useRef, useEffect } from 'react';
import { useGeolocationBackend } from '@omnidotdev/rdk/geolocation';
import { useThree, useFrame } from '@react-three/fiber';
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


type CameraFeedDimensions = {
    landWidth: number;
    landHeight: number;
}

export default function HikarMain({ longitude, latitude, hFov = 80 }: HikarMainProps) {


    const addGeoData = useStore((state) => state.addGeoData);
    const addSignpost = useStore((state) => state.addSignpost);
    const setLoadingMsg = useMsgStore((state) => state.setLoadingMsg);
    const setStatusMsg = useMsgStore((state) => state.setStatusMsg);

    const { updateTiler, getElevation, getDataForTile } = useTiler("/dem/{z}/{x}/{y}.png", "https://hikar.org/map/{z}/{x}/{y}.json?outProj=4326&");
    const { updateRoutingNetwork, addRoutablePoi, findSignpostAtLonLat } = useRouting({
        juncDistThreshold: 0.05
    });
    const { addIndexedFeature, indexedFeatures } = useIndexedFeatures();

    const lastPos = useRef<LonLat>({
        latitude: 0,
        longitude: 0
    });

    let cameraFeedDimensions = useRef<CameraFeedDimensions | null>(null);

    const noAccess = ["private", "no"];

    const { locar, webcam } = useGeolocationBackend();
    const { camera, gl } = useThree();

    useEffect(() => {
        onPosUpdated({ longitude, latitude });
    }, [longitude, latitude]);


    let origHfov = useRef<number>((camera as THREE.PerspectiveCamera).fov * (window.innerWidth / window.innerHeight));
    let lastIsLand = useRef<boolean>(false);


    useEffect(() => {
        (camera as THREE.PerspectiveCamera).fov = hFov * (gl.domElement.height / gl.domElement.width);
        console.log(`origHfov was ${origHfov.current}`);
        origHfov.current = hFov;
        console.log(`Set origHfov to ${origHfov.current}`);
        camera.updateProjectionMatrix();
    }, [hFov]);

    useEffect(() => {
        if (webcam && webcam.video) {
            // Store the camera feed dimensions in LANDSCAPE mode (even if original orientation was portrait)
            const isLandWebcam = webcam.video.videoWidth > webcam.video.videoHeight;
            cameraFeedDimensions.current = {
                landWidth: isLandWebcam ? webcam.video.videoWidth : webcam.video.videoHeight,
                landHeight: isLandWebcam ? webcam.video.videoHeight : webcam.video.videoWidth
            };
            lastIsLand.current = window.innerWidth > window.innerHeight;
            console.log(`Initialised camera feed dimensions to : landwidth ${cameraFeedDimensions.current.landWidth} landheight ${cameraFeedDimensions.current.landHeight}`);
            matchFovToWebcam(webcam.video.videoWidth, webcam.video.videoHeight, window.innerWidth / window.innerHeight);
            camera.updateProjectionMatrix();
        }
    }, [webcam, webcam?.video]);

    useFrame(() => {
        if (webcam && webcam.video && cameraFeedDimensions.current) {
            // Store the camera feed dimensions in LANDSCAPE mode (even if original orientation was portrait)
            const isLand = window.innerWidth > window.innerHeight;
            if (isLand != lastIsLand.current) {
                console.log("CHANGED ORIENTATION");
                lastIsLand.current = isLand;
                syncFovWithWebcam();
            }
        }
    });

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
                const pois = new Array<Poi>(),
                    ways = new Array<Way>(),
                    terrains = new Array<THREE.Mesh>();

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
                        terrains.push(terrain);
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
                                    pois.push(poiForRendering);
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
                                            ways.push({
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
                                                ways.push(splitWay);
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
                addGeoData(ways, pois, terrains);
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

    // The below are taken from the App class in locar.js, pending addition to RDK.
    /**
    * Sync the Three.js fov with the webcam.
    * It may be necessary to adjust the Three fov to match the proportion of the world currently visible through the webcam,
    * which will vary depending on orientation (portrait or landscape)
    * For example, if the device is in portrait, less of the world horizontally will be visible.
    * Mostly intended to be called internally: if you are developing a pure LocAR app you will not need to call this.
    * However it will be necessary to call this on each frame if another library/framework (typically R3F) has provided the 
    * three.js objects (i.e the threeObjects option has been provided to the constructor). 
    * 
    */
    function syncFovWithWebcam(aspectScreen?: number) {
        if (aspectScreen === undefined) aspectScreen = window.innerWidth / window.innerHeight;

        if (cameraFeedDimensions.current !== null) {
            const videoWidth = aspectScreen > 1 ? cameraFeedDimensions.current.landWidth : cameraFeedDimensions.current.landHeight;
            const videoHeight = aspectScreen > 1 ? cameraFeedDimensions.current.landHeight : cameraFeedDimensions.current.landWidth;
            matchFovToWebcam(videoWidth, videoHeight, aspectScreen);
        }
        camera.updateProjectionMatrix();
    }

    /**
     * Set the correct three.js camera field of view based on the proportion of the webcam feed currently visible.
     * 
     * @param {number} videoWidth - the current video feed width
     * @param {number} videoHeight  - the current video feed height
     * @param {number} aspectScreen  - the current screen aspect ratio
     */
    function matchFovToWebcam(videoWidth: number, videoHeight: number, aspectScreen: number) {
        console.log(`matchFovToWebcam(): video w/h ${videoWidth} ${videoHeight} aspectScreen ${aspectScreen} `)
        const cam = camera as THREE.PerspectiveCamera;
        const aspectVideo = videoWidth / videoHeight;

        // If the screen aspect ratio is less than the camera feed aspect ratio, only part of the webcam feed horizontally
        // will be visible, so the hfov of the visible world will be less than the hfov of the Three camera. So the
        // hfov of the rendered content needs to be adjusted to match.
        if (aspectScreen < aspectVideo) {
            console.log('screen is more portraity than video, doing adjustments');
            // In this case the webcam video will be scaled to touch the bottom of the screen vertically.
            // So it's scaled by a factor of screenHeight/videoHeight
            // To get the webcam video width after scaling (including the off-screen part), we multiply the original width by this factor.
            const scaledVideoWidth = videoWidth * (window.innerHeight / videoHeight);

            // the fov thus needs to be adjusted by the window width divided by this scaled camera width
            const curHfov = origHfov.current * (window.innerWidth / scaledVideoWidth);

            // Three camera uses vertical, not horizontal, fov
            cam.fov = curHfov / aspectScreen;
        } else {
            console.log('screen is NOT more portraity than video, setting fov to vfov eqiv of orighfov');
            cam.fov = origHfov.current / aspectScreen;
        }
    }
}
