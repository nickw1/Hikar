import * as THREE from 'three';

export default function Building(scale: number = 4, name?: string, type?: string) {
    const group = new THREE.Group();
    group.scale.set(scale, scale, scale);
    if(name) {
        group.userData = {
            displayInfo: {
                name,
                type
            }
        };
    }

    const buildingGeom = new THREE.BoxGeometry(1.5, 1.5, 1.5);
    const buildingMaterial = new THREE.MeshStandardMaterial({ color: 0xff6060 });
    const buildingMesh = new THREE.Mesh(buildingGeom, buildingMaterial);
    buildingMesh.position.set(0, 0.75, 0);

    const windowGeom = new THREE.BoxGeometry(0.3, 0.3, 0.1);
    const windowMaterial = new THREE.MeshStandardMaterial({ color: 0x00ffff });

    const windows = [...Array(12)].map((_, idx) => {
        const mesh = new THREE.Mesh(windowGeom, windowMaterial);
        mesh.position.set(idx % 2 - 0.5, Math.floor((idx % 6) / 2) * 0.4 - 0.4, Math.floor(idx / 6) * 1.5 - 0.75);
        return mesh;
    });
    windows.push(...[...Array(12)].map((_, idx) => {
        const mesh = new THREE.Mesh(windowGeom, windowMaterial);
        mesh.position.set(Math.floor(idx / 6) * 1.5 - 0.75, Math.floor((idx % 6) / 2) * 0.4 - 0.4, idx % 2 - 0.5);
        return mesh;
    }));

    for (const window of windows) {
        buildingMesh.add(window);
    }
    group.add(buildingMesh);

    const roofGeom = new THREE.ConeGeometry(1, 1, 4);
    const roofMaterial = new THREE.MeshStandardMaterial({ color: 0x803030 });
    const roofMesh = new THREE.Mesh(roofGeom, roofMaterial);
    roofMesh.position.set(0, 2, 0);
    roofMesh.rotation.set(0, Math.PI * 0.25, 0);
    group.add(roofMesh);

    const doorGeom = new THREE.PlaneGeometry(0.2, 0.4);
    const doorMaterial = new THREE.MeshStandardMaterial({ color: 0xffff00 });
    const doorMesh = new THREE.Mesh(doorGeom, doorMaterial);
    doorMesh.position.set(0, 0.2, 1);
    group.add(doorMesh);

    return group;
}