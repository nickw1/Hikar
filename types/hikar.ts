

import type { Feature, Position, GeoJsonProperties, Point, LineString, FeatureCollection } from 'geojson';
import BoundingBox from '../src/BoundingBox';
import RoutingNetwork from '../src/RoutingNetwork';
import * as THREE from 'three';
import type { ThreeEvent } from '@react-three/fiber';



export interface LayerInfo {
    cols: string;
    table: string;
    conditions: string;
    geomCol?: string;
    idCol?: string;
}

export interface LayerData {
    ways: LayerInfo;
    poi: LayerInfo;
}

export type LayerKey = keyof LayerData;

export interface OsmEntity {
    id: string;
    name: string;
    type: string;
}

export type Poi = Feature<Point>;
export type Way = Feature<LineString>;

export interface GpsStatus {
    pos: GeolocationPosition;
    distMoved: number;
};

export interface RoutingNetworkOptions {
    poiDistThreshold?: number,
    roadCost?: number,
    minPathProportion?: number,
    minPathProportionOverride?: number,
    juncDistThreshold?: number,
}

export interface SignpostManagerOptions {
    routingNetwork: RoutingNetwork,
    juncDetectDistChange?: number,
}

export interface RouteOptions {
    snapToJunction: boolean;
    snapPois: boolean;
}

export interface Signpost {
    jKey: string,
    position: Position,
    arms: { [bearing: number]: SignpostArm }
};

export interface SignpostArm {
    properties: GeoJsonProperties,
    destinations: Destination[];
}

export type Split = { distance: number, idx: number, intersection: Position, way: RoutableWay, poi_id: number };
export type HaversineDistToLineResult = { distance: number, proportion: number, intersection: Position | null };
export type RoutablePoi = Feature<Point> & { dist: number, bearing: number, path: Position[], weight: number, split: Split | null };
export type RoutableWay = Feature<LineString> & { boundingBox: BoundingBox | null }
export type FoundVertex = { coords: number[], distance: number, edges: { [key: string]: { coords: Position[], properties: GeoJsonProperties } } };

export interface ReducedEdgeData {
    highway: string,
    foot: string,
    designation: string,
    isAccessiblePath: boolean,
    v1?: string,
    v2?: string
}

export interface Destination {
    weight: number,
    dist: number,
    path: Position[],
    properties: GeoJsonProperties,
}


export interface ModelProps {
    scale: number,
    onClick?: (e: ThreeEvent<THREE.Mesh | THREE.Group>) => void
}

export interface Geodata {
    pois: Array<Poi>;
    ways: Array<Way>;
    terrains: Array<THREE.Mesh>;
}
export interface GeoDataStore {
    geodata: Geodata;
    signposts: Array<Signpost>;
    addGeoData: (newGeodata: Geodata) => void;
    addSignpost: (newSignpost: Signpost) => void;
}

export interface HikarMainProps {
    longitude: number;
    latitude: number;
    hFov?: number;
}

export interface MsgStore {
    loadingMsg: string;
    statusMsg: string;
    setLoadingMsg: (msg: string) => void;
    setStatusMsg: (msg: string) => void;
}