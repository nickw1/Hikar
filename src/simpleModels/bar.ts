import * as THREE from 'three';

export default function Bar(scale: number = 1, name?: string) {
    const group = new THREE.Group();
    group.scale.set(scale, scale, scale);
    if (name) {
        group.userData = {
            displayInfo: {
                name,
                type: 'bar'
            }
        };
    }

    const beerGeom = new THREE.CylinderGeometry(1, 1, 3);
    const beerMaterial = new THREE.MeshStandardMaterial({ color: 0xcc6600, transparent: true, opacity: 0.5 });
    const beerMesh = new THREE.Mesh(beerGeom, beerMaterial);
    beerMesh.userData = { name };
    group.add(beerMesh);

    const foamGeom = new THREE.CylinderGeometry(0, 1.5, 0);
    const foamMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const foamMesh = new THREE.Mesh(foamGeom, foamMaterial);
    foamMesh.position.set(0, 1.5, 0);
    foamMesh.userData = { name };
    group.add(foamMesh);

    const handleGeom = new THREE.TorusGeometry(0.5, 0.1, 16, 100, Math.PI * 1.2);
    const handleMaterial = new THREE.MeshStandardMaterial({ color: 0xc0c0c0, opacity: 0.2, metalness: 0.1, transparent: true });
    const handleMesh = new THREE.Mesh(handleGeom, handleMaterial);
    handleMesh.position.set(1, 1, 0);
    handleMesh.rotation.set(0, 0, -Math.PI * 0.5);
    group.add(handleMesh);

    return group;
}