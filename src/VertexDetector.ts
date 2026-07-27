import turfDistance from '@turf/distance';
import { point as turfPoint } from '@turf/helpers';
import { GeoJsonProperties, Position } from 'geojson';
import PathFinder from 'geojson-path-finder-nw';
import type { FoundVertex } from '../types';

/*

Note: my interpretation of the structure of the internal graph:

compactedCoordinates:
map indexed by adjacent vertices, each entry containing
full coords along the way but NOT the destination vertex itself

compactedEdges:
the properties of each edge

compactedVertices:
the distances/weights to adjoining vertices

edgeData:
edge properties from edgeDataReduceFn

sourceCoordinates (was sourceVertices in 1.x):
the full original non-rounded coordinates for each vertex

vertices:
distance/weights to adjoining vertices (non-compacted version)

*/


class VertexDetector {

    pathFinder: PathFinder<any, GeoJsonProperties>;

    constructor(pathFinder: PathFinder<any, GeoJsonProperties>) {
        this.pathFinder = pathFinder;
    }

    findNearestVertex(p: Position, junctionOnly = false) {
        const vertex: FoundVertex = { coords: [], distance: Number.MAX_VALUE, edges: {}};

        const vertices = junctionOnly ?
            Object.keys(this.pathFinder.graph.vertices).filter(k => {
                return Object.keys(this.pathFinder.graph.vertices[k]).length >= 3
            }) : Object.keys(this.pathFinder.graph.vertices);

        vertices
            .filter(k => this.pathFinder.graph.compactedCoordinates[k] !== undefined)
            .forEach(k => {
                const dist = turfDistance(turfPoint(p), turfPoint(this.pathFinder.graph.sourceCoordinates[k]));
                if (dist < vertex.distance) {
                    vertex.distance = dist; // distance to vertex
                    vertex.coords = this.pathFinder.graph.sourceCoordinates[k].slice(0); // vertex coords
                    vertex.edges = {}; // coords of vertex and of adjoining vertices
                    // Note - the compactedCoordinates do not include the destination vertex so we have to add it
                    Object.keys(this.pathFinder.graph.compactedCoordinates[k])
                        .forEach(kk => {
                            //                            const dest = kk.split(',');
                            const dest = this.pathFinder.graph.sourceCoordinates[kk].slice(0);
                            vertex.edges[kk] = {
                                coords: this.pathFinder.graph.compactedCoordinates[k][kk]
                                    .slice(0)
                                    .concat([[
                                        dest[0],
                                        dest[1]
                                    ]]),
                                properties: Object.assign(
                                    {},
                                    this.pathFinder.graph.compactedEdges[k][kk]
                                )
                            };
                        });
                }
            });
        return vertex;
    }

    snapToVertex(p: Position, distThreshold: number, junctionOnly = false) {
        const p2 = p.slice(0);
        const junction  = this.findNearestVertex(p, junctionOnly);
        if (junction.distance < distThreshold) {
            p2[0] = junction.coords[0];
            p2[1] = junction.coords[1];
        }
        return p2;
    }

    findEdgeWeightByKeys(c1: string, c2: string) {
        return this.pathFinder.graph.compactedVertices[c1] ? this.pathFinder.graph.compactedVertices[c1][c2] : undefined;
    }
}

export default VertexDetector;
