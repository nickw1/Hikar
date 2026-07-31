
import type { Signpost, SignpostArm } from '../types';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { Text  as TroikaText } from 'troika-three-text';

import * as THREE from 'three';

type ArmTextProps = [number, number, string];
type DisplayedRouteTypes = { [type: string]: string };

export default class SignpostRenderer {



    texLoader: THREE.TextureLoader;
    rawTexture: THREE.Texture | undefined;
    post: THREE.Group | undefined;
    arm: THREE.Group | undefined;
    textureFile: string;
    postModel: string;
    armModel: string;
    armTextProps: [ArmTextProps, ArmTextProps];
    displayedRouteTypes: DisplayedRouteTypes;

    constructor(postModel: string, armModel: string, texture: string) {
        this.texLoader = new THREE.TextureLoader();
        this.textureFile = texture;
        this.postModel = postModel;
        this.armModel = armModel;
        this.armTextProps = [
            [-0.4, -Math.PI * 0.5, 'left'],
            [0.4, Math.PI * 0.5, 'right']
        ];

        this.displayedRouteTypes = {
            footway: 'Path',
            path: 'Path',
            steps: 'Path (with steps)',
            bridleway: 'Bridleway',
            cycleway: 'Cycle Path',
            track: 'Track',
            public_footpath: 'Public Footpath',
            public_bridleway: 'Public Bridleway',
            byway_open_to_all_traffic: 'Byway',
            restricted_byway: 'Restricted Byway'
        };
    }

    async loadAssets() {
        this.rawTexture = await this.texLoader.loadAsync(this.textureFile);
        this.post = await this.#doLoadObject(this.postModel, this.rawTexture);
    }

    renderSignpost(signpost: Signpost) {


        if (this.rawTexture && this.post) {

            const group = new THREE.Group();
            group.add(this.post);


            (Object.keys(signpost.arms) as any as number[]).forEach(async (bearing: number) => {

                const arm = signpost.arms[bearing];
                const armObj = await this.#doLoadObject(this.armModel, this.rawTexture!);
                armObj.rotation.y = (-bearing - 180) * Math.PI / 180;
                group.add(armObj);

                const scaleFactor = 12 * (arm.destinations.length > 0 ? 1.8 : 2);
                for (let i = 0; i < 2; i++) {
                    const renderedText = this.#getRenderedText(arm);
                    if (renderedText) {
                        console.log(`renderedText: ${renderedText}`);
                        const text = new TroikaText();
                        text.font = 'https://fonts.gstatic.com/s/roboto/v18/KFOmCnqEu92Fr1Mu4mxM.woff';
                        text.text = renderedText;
                        text.position.set(
                            this.armTextProps[i][0],
                            30,
                            2
                        );
                        text.rotation.set(
                            0,
                            this.armTextProps[i][1],
                            0
                        );
                        text.scale.set(
                            scaleFactor,
                            scaleFactor,
                            scaleFactor
                        );
                        text.anchorX = this.armTextProps[i][2];
                        text.fontSize = 0.3;
                        text.color = 0xffffff;
                        text.sync();
                        armObj.add(text);
                    }
                }
            });
            group.scale.set(0.1, 0.1, 0.1);
            return group;
        }
        return null;
    }



    async #doLoadObject(objFile: string, rawTexture: THREE.Texture) {
        const objLoader = new OBJLoader();
        const rawObj = await objLoader.loadAsync(objFile);


        const group = new THREE.Group();


        rawObj.traverse((child: THREE.Object3D) => {
            if (child instanceof THREE.Mesh) {
                const mesh = child as THREE.Mesh;
                mesh.material = new THREE.MeshBasicMaterial();
                (mesh.material as THREE.MeshBasicMaterial).map = rawTexture;
                mesh.geometry.computeVertexNormals();
                group.add(child);
            }
        })

        return group;

    }

    #getRenderedText(arm: SignpostArm) {
        if (arm.destinations.length > 0) {
            return arm.destinations.slice(0, 2).map(dest => {
                const name = dest.properties?.name ?? "";
                return `${name.length <= 25 ? name : name.substring(0, 23) + ".."} ${dest.dist.toFixed(2)} km`
            }).join("\n");
        } else if (arm.properties?.designation) {
            return this.displayedRouteTypes[arm.properties.designation] || null;
        } else if (arm.properties?.highway) {
            return ['track', 'service'].indexOf(arm.properties.highway) == -1 ?
                this.displayedRouteTypes[arm.properties.highway] || null :
                (['yes', 'designated', 'permissive']
                    .indexOf(arm.properties.foot) >= 0 ? "Route with public access" : null);
        }
        return null;
    }
}