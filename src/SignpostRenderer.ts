
import { Signpost } from '../types';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';

import * as THREE from 'three';

export default class SignpostRenderer {

    texLoader: THREE.TextureLoader;
    rawTexture: THREE.Texture | undefined;
    post: THREE.Group | undefined;
    textureFile: string;
    postModel: string;
    armModel: string;

    constructor(postModel: string, armModel: string, texture: string) {
        this.texLoader = new THREE.TextureLoader();
        this.textureFile = texture;
        this.postModel = postModel;
        this.armModel = armModel;
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
}