// RoutingNetwork
//
// Wraps GeoJSON Path Finder (https://github.com/perliedman/geojson-path-finder)
// to provide routes to a set of POIs using a given GeoJSON network.
//
// This is based on the original PanoNetworkMgr from OpenTrailView, but has
// become quite heavily modified for optimal use in Hikar.

// Requires modified geojson-path-finder; clone from https://github.com/nickw1/geojson-path-finder.
// This requirement may be dropped in favour of vanilla geojson-path-finder in future.

import { LocAR } from 'locar';
import PathFinder from 'geojson-path-finder-nw';
import VertexDetector from './VertexDetector';
import { point as turfPoint } from '@turf/helpers';
import turfBearing from '@turf/bearing';
import { RoutablePoi, RoutableWay, RoutingNetworkOptions, RouteOptions, FoundVertex, ReducedEdgeData, Destination, Split, HaversineDistToLineResult } from '../types';
import type { Point, FeatureCollection, GeoJsonProperties, LineString, Position, Feature } from 'geojson';
import BoundingBox from './BoundingBox';

export default class RoutingNetwork {

    pathFinder: PathFinder<ReducedEdgeData, GeoJsonProperties> | null;
    vDet: VertexDetector | null;
    juncDistThreshold!: number;
    poiDistThreshold!: number;
    roadCost!: number;
    minPathProportion!: number;
    minPathProportionOverride!: number;
    ways: FeatureCollection<LineString>;

    constructor(options: RoutingNetworkOptions = {}) {
        this.vDet = null;
        this.pathFinder = null;
        this.setOptions(options);
        this.ways = {
            "type": "FeatureCollection",
            "features": []
        }
    }

    setOptions(options: RoutingNetworkOptions) {
        this.juncDistThreshold = options.juncDistThreshold || 0.02;
        this.poiDistThreshold = options.poiDistThreshold || 0.1;
        this.roadCost = options.roadCost || 1.25;
        this.minPathProportion = options.minPathProportion || 0.5;
        this.minPathProportionOverride = options.minPathProportionOverride || 1.5;
    }

    hasData() {
        return this.vDet !== null;
    }

    // Update with new geojson before attempting to route
    // POIs in the geojson will be inserted into the network, so that they can be routed to.
    update(ways: FeatureCollection<LineString>, poisToInsert: FeatureCollection<Point>) {
        this.ways = ways;
        if (this.ways.features.length > 0) {
            this.insertIntoNetwork(poisToInsert);
            this.pathFinder = new PathFinder(this.ways, {
                tolerance: 0.00001,
                weight: (a, b, props) => {
                    return LocAR.haversineDist({ longitude: a[0], latitude: a[1] }, { longitude: b[0], latitude: b[1] }) * (RoutingNetwork._isAccessiblePath(props) ? 1.0 : this.roadCost) * 0.001; // weighting is as for Hikar Android app 0.3.x
                },
                edgeDataSeed: (props) => {
                    return structuredClone(props) as ReducedEdgeData
                },
                edgeDataReducer: (seed, props) => {
                    return {
                        highway: props.highway,
                        foot: props.foot,
                        designation: props.designation,
                        isAccessiblePath: RoutingNetwork._isAccessiblePath(props)
                    };
                }
            });
            this.vDet = new VertexDetector(this.pathFinder);
        } else {
            this.vDet = null;
        }
    }

    // is a given point a junction?
    // will trigger routing for some applications, e.g. Hikar
    findJunction(p: Position): FoundVertex | null {
        console.log(`findJunction at ${p}`);
        if (this.vDet) {
            const junc = this.vDet.findNearestVertex(p, true);
            console.log(`Junc at ${junc.distance} `);
            return junc.distance < this.juncDistThreshold ? junc : null;
        }
        return null;
    }

    // Input:
    //     curPt: the current point to route from
    //     targetPois: the list of POIs to route to (JSON), typically Destinations on a Signpost
    //     options: whether to snap initial point to junction and/or final point to nearest vertex
    route(curPt: Position, targetPois: FeatureCollection<Point>, options: RouteOptions = { snapPois: false, snapToJunction: false }) {
        if (!this.vDet) return [];

        console.log(`routing from ${curPt}`)
        // NEW - once we've created the graph, snap the current and nearby panos to the nearest junction within 5m, if there is one
        let snappedStartNode: Feature<Point> = {
            "type": "Feature",
            "geometry": {
                "type": "Point",
                coordinates: options.snapToJunction ? curPt : this.vDet.snapToVertex(curPt, this.juncDistThreshold, true)
            },
            "properties": {}
        }, snappedEndNode: Feature<Point> = {
            "type": "Feature",
            "geometry": {
                "type": "Point",
                coordinates: []
            },
            "properties": {}
        };

        console.log(`Have ${targetPois.features.length} POIs to route to`);
        (targetPois.features as RoutablePoi[]).forEach(targetPoi => {

            if (targetPoi.properties?.name !== undefined && ([
                'pub',
                'cafe',
                'parking',
                'restaurant'
            ].indexOf(targetPoi.properties?.amenity) >= 0 ||
                targetPoi.properties.place !== undefined || [
                    "hostel",
                    "camp_site",
                    "alpine_hut",
                    "viewpoint"
                ].indexOf(targetPoi.properties?.tourism) >= 0 ||
                targetPoi.properties?.natural === 'peak' ||
                targetPoi.properties?.railway === 'station')) {


                targetPoi.bearing = 720;

                console.log(`Routing to potential target ${targetPoi.properties!.name}`);

                snappedEndNode.geometry.coordinates = options.snapPois ? this.vDet!.snapToVertex(targetPoi.geometry.coordinates, this.poiDistThreshold, false) : targetPoi.geometry.coordinates;

                const route = this.calcPath(snappedStartNode, snappedEndNode);
                if (route != null && route.edgeDatas !== undefined && route.edgeDatas.length >= 1 && route.path.length >= 2 && route.edgeDatas[0]!.isAccessiblePath) {
                    // calculate the real distance of the path (weight is now
                    // adjusted - see above)
                    console.log('We have a route..');
                    const dist = route.path.reduce((acc, val, index, arr) => {
                        return index == 0 ? 0 : acc + LocAR.haversineDist({
                            longitude: val[0],
                            latitude: val[1]
                        },
                            {
                                longitude: arr[index - 1][0],
                                latitude: arr[index - 1][1]
                            }
                        );
                    }, 0) * 0.001;

                    // note this uses compacted nodes so will give a less 
                    // accurate distance compared to the above. Nonetheless 
                    // it's good enough for evaluating what proportion of the
                    // route is on a road, allowing us to reject road-heavy
                    // routings to POIs.

                    const pathDist = route.edgeDatas.reduce((acc, value, index, arr) => {
                        if (value && this.vDet && value.v1 && value.v2) {
                            const w = this.vDet.findEdgeWeightByKeys(value.v1, value.v2);
                            if (w) {
                                const realDist = w / (value.isAccessiblePath ? 1 : this.roadCost);
                                return [acc[0] + realDist, acc[1] + (value.isAccessiblePath ? realDist : 0)];
                            }
                        }
                        return [0, 0];
                    }, [0, 0]);

                    if (dist < this.minPathProportionOverride || pathDist[1] / pathDist[0] >= this.minPathProportion) {
                        targetPoi.dist = dist;

                        // Initial bearing of the route (for OTV arrows, Hikar signposts, etc) - rounded to nearest degree
                        let bearing = Math.round(
                            turfBearing(
                                turfPoint(route.path[0]),
                                turfPoint(route.path[1])
                            )
                        );

                        if (bearing < 0) bearing += 360;
                        targetPoi.bearing = bearing;
                        targetPoi.weight = route.weight;

                        // save the path so we can do something with it 
                        targetPoi.path = route.path;
                    }
                }
            }
        });
        // Sort routes to each POI based on bearing
        const sorted = (targetPois.features as RoutablePoi[]).filter(p => p.bearing <= 360).sort((p1, p2) => (p1.bearing - p2.bearing));
        let lastBearing = 720;
        let curDestinationsForThisBearing: { bearing: number, destinations: Destination[] } = { bearing: 720, destinations: [] };
        const destinationsGroupedByBearing = [];

        for (let i = 0; i < sorted.length; i++) {
            // group by integer bearings
            if (sorted[i].bearing != lastBearing) { // Math.abs(sorted[i].bearing-lastBearing) >= 1) {
                // new bearing
                curDestinationsForThisBearing = {
                    bearing: sorted[i].bearing,
                    destinations: []
                };
                destinationsGroupedByBearing.push(curDestinationsForThisBearing);
            }
            curDestinationsForThisBearing.destinations.push({
                weight: sorted[i].weight,
                dist: sorted[i].dist,
                path: sorted[i].path,
                properties: sorted[i].properties
            });
            lastBearing = sorted[i].bearing;
        }

        // Return value: an array of pois grouped by bearing and
        // sorted by distance within each bearing group.
        // This could be used to generate a virtual signpost (Hikar) or
        // select the immediately linked panorama (OTV)
        const destsGroupedByBearingSortedByDistance = destinationsGroupedByBearing.map(forThisBearing => { return { bearing: forThisBearing.bearing, pois: forThisBearing.destinations.sort((n1, n2) => n1.weight - n2.weight) } });
        return destsGroupedByBearingSortedByDistance;
    }


    insertIntoNetwork(pois: FeatureCollection<Point>) {
        const newFeatures: RoutableWay[] = [];
        let k = 0, z = 0;

        pois.features.forEach(p => {
            const poi = p as RoutablePoi;
            console.log(`insertIntoNetwork(): poi name = ${p.properties!.name}`);
            (this.ways.features as RoutableWay[]).filter(way => way.boundingBox!.contains(poi.geometry.coordinates)).forEach(way => {

                let lowestDist: HaversineDistToLineResult = { distance: Number.MAX_VALUE, proportion: 0, intersection: null }, idx = -1, curDist;
                for (let j = 0; j < way.geometry.coordinates.length - 1; j++) {
                    curDist = RoutingNetwork.haversineDistToLine(
                        poi.geometry.coordinates,
                        way.geometry.coordinates[j],
                        way.geometry.coordinates[j + 1]);
                    if (curDist !== null && curDist.distance >= 0 && curDist.distance < lowestDist.distance) {
                        lowestDist = curDist;
                        idx = j;
                    }
                }


                if (idx >= 0 && lowestDist.distance < 100.0) {
                    console.log(`Way ${way.properties!.hikar_id} is near this POI`);
                    // it has to be within 10m of a way 
                    // We don't yet actually try and split the way though
                    // We need to ensure the POI is inserted into the
                    // CORRECT way (the closest) - aka the "panorama 16
                    // problem". So for the moment we
                    // just create an array of POTENTIAL splits for this
                    // POI, and take the one closest to a way later.

                    if (poi.split === null || lowestDist.distance < poi.split.distance) {
                        if (poi.split === null) {
                            poi.split = {
                                distance: lowestDist.distance,
                                idx: idx + lowestDist.proportion,
                                intersection: lowestDist.intersection!, // must be non-null if we updated the distance
                                way,
                                poi_id: parseInt(poi.properties?.osm_id)
                            };
                        } else {
                            poi.split.distance = lowestDist.distance;
                            poi.split.idx = idx + lowestDist.proportion;
                            poi.split.intersection = lowestDist.intersection!;
                            poi.split.way = way;

                        }
                    }
                    if (poi.split !== null) {
                        console.log(`Split: ${poi.split.distance} ${poi.split.idx} ${poi.split.intersection}`);
                    }
                }
            });

        });

        const allSplits: { [id: string]: Split[] } = {};

        // allSplits will now contain all COUNTED splits (one split per POI),
        // indexed by way ID, so we can then go on and consider all real splits
        // for a way, as we did before.
        // don't need this now 
        (pois.features as RoutablePoi[]).filter(poi => poi.split !== null && poi.split.intersection !== null).forEach(poi => {

            const way = poi.split!.way;
            if (allSplits[way.properties!.hikar_id] === undefined) allSplits[way.properties!.hikar_id] = [];
            allSplits[way.properties!.hikar_id].push({
                idx: poi.split!.idx, distance: poi.split!.distance, /*poi,*/ way: way, intersection: poi.split!.intersection,
                poi_id: parseInt(poi.properties!.osm_id)
            });
        });

        // now we need to loop through the ways again to actually split thm
        (this.ways.features as RoutableWay[]).forEach((way, splitWayIdx) => {
            let splits = allSplits[way.properties!.hikar_id];
            // this was originally in the ways loop
            if (splits && splits.length > 0) {
                console.log(`Splitting this way ${way.properties!.hikar_id}`);
                splits = splits.sort((a, b) => a.idx - b.idx);
                let splitIdx = 0;
                const newWay: RoutableWay = RoutingNetwork.makeNewWay(way);
                newWay.properties!.hikar_id = `${way.properties!.hikar_id}s${splitWayIdx++}`
                let i = 0;
                while (i < way.geometry.coordinates.length) {
                    newWay.geometry.coordinates.push([way.geometry.coordinates[i][0], way.geometry.coordinates[i][1]]);
                    while (splitIdx < splits.length && Math.floor(splits[splitIdx].idx) == i) {

                        //newWay.geometry.coordinates.push([splits[splitIdx].poi.lon, splits[splitIdx].poi.lat, splits[splitIdx].poi.id]);
                        newWay.geometry.coordinates.push([splits[splitIdx].intersection[0], splits[splitIdx].intersection[1], splits[splitIdx].poi_id]);
                        splitIdx++;
                    }
                    i++;
                }
                newFeatures.push(newWay);
            } else {
                newFeatures.push(way);
            }
        });
        this.ways.features = newFeatures;
    }

    calcPath(f1: Feature<Point>, f2: Feature<Point>) {
        return this.pathFinder?.findPath(f1, f2);
    }

    static makeNewWay(way: Feature<LineString>) {
        const newWay: RoutableWay = {
            type: "Feature",
            properties: way.properties,
            geometry: {
                'type': 'LineString',
                coordinates: []
            },
            boundingBox: null
        };

        return newWay;
    }

    static _isAccessiblePath(properties: GeoJsonProperties) {
        return properties?.highway && ([
            'footway',
            'bridleway',
            'cycleway',
            'path',
            'steps',
            'service',
            'track'
        ].indexOf(properties.highway) >= 0 &&
            properties.access != 'private' &&
            properties.foot != 'private') || [
                'public_footpath',
                'public_bridleway',
                'byway_open_to_all_traffic',
                'restricted_byway'
            ].indexOf(properties?.highway) >= 0;
    }

    static haversineDistToLine(pos: Position, p1: Position, p2: Position): HaversineDistToLineResult | null {
        const u = ((pos[0] - p1[0]) * (p2[0] - p1[0]) + (pos[1] - p1[1]) * (p2[1] - p1[1])) / (Math.pow(p2[0] - p1[0], 2) + Math.pow(p2[1] - p1[1], 2));
        const xintersection = p1[0] + u * (p2[0] - p1[0]), yintersection = p1[1] + u * (p2[1] - p1[1]);
        return (u >= 0 && u <= 1) ? { distance: LocAR.haversineDist({ longitude: pos[0], latitude: pos[1] }, { longitude: xintersection, latitude: yintersection }), intersection: [xintersection, yintersection], proportion: u } : null;
    }
}


