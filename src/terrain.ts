import { DEM } from 'locar-tiler';
import { LocAR } from 'locar';
import * as THREE from 'three';

export default class TerrainGenerator {
    dem: DEM;

    constructor(dem: DEM) {
        this.dem = dem;
    }

    genTerrain(locar: LocAR): THREE.Mesh {
        const vertices = [];

        const [ptWidth, ptHeight] = this.dem.getNPoints();
        const [rowSpacing, colSpacing] = this.dem.getSpacing();

        const bottomLeft = this.dem.getBottomLeft();
        const bottomLeftWorld = locar.eastNorthToWorldCoords([bottomLeft.e, bottomLeft.n]);
        const terrain = new THREE.PlaneGeometry(ptWidth * rowSpacing, ptHeight * colSpacing, ptWidth - 1, ptHeight - 1);

        const array = terrain.getAttribute("position").array;
        let i;

        for (let row = 0; row < ptHeight; row++) {
            for (let col = 0; col < ptWidth; col++) {
                i = row * ptWidth + col;
                array[i * 3] = bottomLeftWorld[0] + col * colSpacing;
                array[i * 3 + 1] = this.dem.elevs[i] - 1;
                array[i * 3 + 2] = bottomLeftWorld[1] - (ptHeight - 1 - row) * rowSpacing;
            }
        }


        const terrainMaterial = new THREE.MeshStandardMaterial({ color: 0x008000 });
        return new THREE.Mesh(terrain, terrainMaterial);

    }
}