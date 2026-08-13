
import { Position } from 'geojson';
import { LonLat } from 'locar';

export default class BoundingBox {

    bottomLeft: LonLat;
    topRight: LonLat;


    constructor(w: number, s: number, e: number, n: number) {
        this.bottomLeft = { longitude: w, latitude: s };
        this.topRight = { longitude: e, latitude: n };
    }


    contains(p: Position) {
        return p[0] > this.bottomLeft.longitude && p[0] < this.topRight.longitude && p[1] > this.bottomLeft.latitude && p[1] < this.topRight.latitude;
    }


    toString() {
        return `${this.bottomLeft.longitude},${this.bottomLeft.latitude},${this.topRight.longitude},${this.topRight.latitude}`;
    }

    asArray(): [number, number, number, number] {
        return [
            this.bottomLeft.longitude,
            this.bottomLeft.latitude,
            this.topRight.longitude,
            this.topRight.latitude
        ]
    }

    static fromCoords(coords: Position[]) {
        const bbox = new BoundingBox(181, 91, -181, -91);
        coords.forEach(p => {

            if (p[0] < bbox.bottomLeft.longitude) {
                bbox.bottomLeft.longitude = p[0];
            }
            if (p[1] < bbox.bottomLeft.latitude) {
                bbox.bottomLeft.latitude = p[1];
            }
            if (p[0] > bbox.topRight.longitude) {
                bbox.topRight.longitude = p[0];
            }
            if (p[1] > bbox.topRight.latitude) {
                bbox.topRight.latitude = p[1];
            }
        });
        return bbox;
    }
}


