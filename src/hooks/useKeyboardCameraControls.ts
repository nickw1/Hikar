import { Camera, Vector3, MathUtils } from 'three';
import { useFrame } from '@react-three/fiber';
import { useKeyboardControls } from '@react-three/drei';


export default function useKeyboardCameraControls(camera: Camera, velocity: number = 0.1, onCameraPosUpdated: (pos: Vector3) => void) {
    const [, get] = useKeyboardControls();

    useFrame(() => {
        const key = get();

        if (key) {
            if (key.forward) {
                const vec = new Vector3(0, 0, 0);

                camera.getWorldDirection(vec);
                vec.multiplyScalar(velocity);

                camera.position.set(
                    camera.position.x + vec.x,
                    camera.position.y + vec.y,
                    camera.position.z + vec.z
                );
                onCameraPosUpdated(camera.position);

            }
            if (key.back) {
                const vec = new Vector3(0, 0, 0);

                camera.getWorldDirection(vec);
                vec.multiplyScalar(velocity);

                camera.position.set(
                    camera.position.x - vec.x,
                    camera.position.y - vec.y,
                    camera.position.z - vec.z
                );
                 onCameraPosUpdated(camera.position);
            }
            if (key.left) {

                camera.rotateY(MathUtils.degToRad(1));


            }
            if (key.right) {
                camera.rotateY(MathUtils.degToRad(-1));

            }
            if (key.up) {
                camera.translateY(velocity);
                onCameraPosUpdated(camera.position);

            }
            if (key.down) {
                camera.translateY(-velocity);
                onCameraPosUpdated(camera.position);
            }
        }
    })
}