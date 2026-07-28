import { LonLat } from 'locar-tiler';
import type { Feature, Position, GeoJsonProperties, Point, LineString, FeatureCollection } from 'geojson';
import BoundingBox from '../src/BoundingBox';
import RoutingNetwork from '../src/RoutingNetwork';

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

export interface Poi extends OsmEntity {
    position: LonLat;
    altitude: number;
}

export interface Way extends OsmEntity {
    coordinates: Array<[number, number, number?]>;
}

export interface GeoState {
    pois: Array<Poi>;
    ways: Array<Way>;
    elev: number;

}

export interface GpsStatus {
    pos: GeolocationPosition;
    distMoved: number;
};


export interface PoiState {
    pois: Array<Poi>;
    ways: Array<Way>;
    elev: number;
    addPoi: (poi: Poi) => void;
    addWay: (way: Way) => void;
    setElev: (newElev: number) => void;
}

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
    properties: GeoJsonProperties
}