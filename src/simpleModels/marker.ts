import * as THREE from 'three';

export default function Marker(scale: number = 1, name?: string) {

   const group = new THREE.Group();
   group.scale.set(scale, scale, scale);

   if (name) {
      group.userData = {
         displayInfo: {
            name
         }
      };
   }

   const coneGeom = new THREE.ConeGeometry(1, 3, 64);
   const transparentMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000, opacity: 0.7, transparent: true });
   const coneMesh = new THREE.Mesh(coneGeom, transparentMaterial);
   coneMesh.rotation.set(Math.PI, 0, 0);
   coneMesh.position.set(0, 1.5, 0);
   group.add(coneMesh);

   const sphereGeom = new THREE.SphereGeometry(1, 32, 16, 0, Math.PI * 2, 0, Math.PI);
   const sphereMesh = new THREE.Mesh(sphereGeom, transparentMaterial);
   sphereMesh.position.set(0, 3, 0);
   group.add(sphereMesh);

   const internalSphereGeom = new THREE.SphereGeometry(0.5, 32, 16, 0, Math.PI * 2, 0, Math.PI * 2);
   const internalSphereMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });
   const internalSphereMesh = new THREE.Mesh(internalSphereGeom, internalSphereMaterial);
   internalSphereMesh.position.set(0, 3, 0);
   group.add(internalSphereMesh);

   return group;
}