import * as THREE from 'three';

export default function Cup(scale: number = 1, name?: string) {
    const group = new THREE.Group();
    group.scale.set(scale, scale, scale);
    if (name) {
        group.userData = {
            displayInfo: {
                name,
                type: 'cafe'
            }
        };
    }

    const cupGeom = new THREE.SphereGeometry(3, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
    const cupMaterial = new THREE.MeshBasicMaterial({ color: 0x8080ff });
    const cupMesh = new THREE.Mesh(cupGeom, cupMaterial);
    cupMesh.position.set(0, 2.7, 0);
    cupMesh.rotation.set(0, 0, Math.PI);
    group.add(cupMesh);

    const saucerGeom = new THREE.CylinderGeometry(3, 3, 0.5);
    const saucerMaterial = new THREE.MeshBasicMaterial({ color: 0x4040ff });
    const saucerMesh = new THREE.Mesh(saucerGeom, saucerMaterial);
    group.add(saucerMesh);

    const handleGeom = new THREE.TorusGeometry(0.5, 0.1, 16, 100, Math.PI * 1.2);
    const handleMesh = new THREE.Mesh(handleGeom, saucerMaterial);
    handleMesh.position.set(3, 2.2, 0);
    handleMesh.rotation.set(0, 0, -Math.PI * 0.6);
    group.add(handleMesh);

    return group;
}