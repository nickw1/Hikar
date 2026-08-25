
import { EventEmitter } from 'locar';
import { LocAR } from 'locar';
import type { LonLat } from 'locar-tiler';
import type { Point, FeatureCollection } from 'geojson';
import { point as turfPoint } from '@turf/helpers';
import turfBearing from '@turf/bearing';
import type { SignpostManagerOptions, Signpost, SignpostArm, Destination, RoutablePoi } from '../types/hikar';
import RoutingNetwork from './RoutingNetwork';


class SignpostManager extends EventEmitter {

    lastPos: LonLat;
    juncDetectDistChange: number;
    signposts: { [key: string]: Signpost };
    routingNetwork: RoutingNetwork;
    poisForSignposts: FeatureCollection<Point>;

    constructor(options: SignpostManagerOptions) {
        super();
        this.signposts = {};
        this.lastPos = { longitude: -181, latitude: -91 };
        this.juncDetectDistChange = options.juncDetectDistChange || 0.005;
        this.routingNetwork = options.routingNetwork;
        this.poisForSignposts = {
            type: "FeatureCollection",
            features: new Array<RoutablePoi>()
        }
    }

    addRoutablePoi(poi: RoutablePoi) {
        this.poisForSignposts.features.push(poi);
    }

    updatePos(p: LonLat): Signpost | null {

        // Only try to detect a junction if we've moved a certain distance
        if (!this.routingNetwork.hasData() || LocAR.haversineDist(p, this.lastPos) < this.juncDetectDistChange) {
            return null;
        }
        this.lastPos = p;
        const j = this.routingNetwork.findJunction([p.longitude, p.latitude]);
        if (j !== null) {
            console.log(`junction found: ${j}`)
            const jKey = `${j.coords[0].toFixed(5)},${j.coords[1].toFixed(5)}`;
            if (this.signposts[jKey]) {
                return null; // existing signpost present 
            } else {
                if (this.eventHandlers["startProcessing"]) {
                    this.emit("startProcessing");
                }

                const nearestPois: FeatureCollection<Point> = {
                    type: "FeatureCollection",
                    features: this.poisForSignposts.features.filter(poi => {
                        const pt = poi.geometry;
                       
                        const dist = LocAR.haversineDist({ longitude: pt.coordinates[0], latitude: pt.coordinates[1] }, p);
                        return dist <= 3000 || (dist <= 5000 && poi.properties?.amenity === undefined && poi.properties?.place !== 'locality');
                    })
                };

                const groupedPois = this.routingNetwork.route(
                    j.coords,
                    nearestPois, {
                    snapToJunction: false,
                    snapPois: true
                });

                const curPoint = turfPoint(j.coords);

                let signpost = { position: j.coords, arms: {} as { [bearing: number]: SignpostArm } };
                Object.keys(j.edges)
                    .filter(k => j.edges[k].properties?.isAccessiblePath == true)
                    .forEach(k => {
                        let bearing = Math.round(turfBearing(curPoint, turfPoint(
                            j.edges[k].coords[1]
                        )));
                        if (bearing < 0) bearing += 360;
                        signpost.arms[bearing] = {
                            properties: j.edges[k].properties,
                            destinations: []
                        }
                    });
                groupedPois
                    .filter(group => signpost.arms[group.bearing] !== undefined)
                    .forEach(group => {
                        signpost.arms[group.bearing].destinations = group.pois
                            .slice(0)
                            .sort((a: Destination, b: Destination) => a.dist * SignpostManager._getWeighting(a) - b.dist * SignpostManager._getWeighting(b));
                    });


                this.signposts[jKey] = signpost;
                return Object.keys(signpost.arms).length > 0 ? signpost : null;
            }
        }
        return null; // not a junction
    }

    static _getWeighting(destination: Destination) {
        if (["city", "town"].indexOf(destination.properties?.place) >= 0) {
            return 0.75;
        } else if (destination.properties?.place == "village") {
            return 1.0;
        } else if (destination.properties?.natural == "peak" && destination.properties?.peak == "minor") {
            return 2.0;
        } else if (destination.properties?.natural == "peak") {
            return 1.25;
        } else if (["alpine_hut", "hostel"].indexOf(destination.properties?.tourism) >= 0) {
            return 1.25;
        } else if (destination.properties?.tourism == "camp_site") {
            return 1.5;
        } else if (["hamlet", "suburb"].indexOf(destination.properties?.place) >= 0) {
            return 1.5;
        } else if (["pub", "cafe"].indexOf(destination.properties?.amenity) >= 0) {
            return 2.0;
        } else if (["restaurant"].indexOf(destination.properties?.amenity) >= 0) {
            return 3.0;
        } else if (destination.properties?.place) {
            return 2.0;
        } else if (destination.properties?.tourism == "viewpoint") {
            return 2.0;
        } else if (destination.properties?.railway == "station") {
            return 1.25;
        }
        return 10.0;
    }
}

export default SignpostManager;
