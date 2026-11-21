import { Camera, Vector3, MathUtils } from 'three';
import { useFrame } from '@react-three/fiber';
import { useKeyboardControls } from '@react-three/drei';


export default function useKeyboardCameraControls(camera: Camera) {
    const [, get] = useKeyboardControls();

    useFrame(() => {
        const key = get();

        if (key) {
            if (key.forward) {
                const vec = new Vector3(0, 0, 0);

                camera.getWorldDirection(vec);
                vec.multiplyScalar(0.1);

                camera.position.set(
                    camera.position.x + vec.x,
                    camera.position.y + vec.y,
                    camera.position.z + vec.z
                );

            }
            if (key.back) {
                const vec = new Vector3(0, 0, 0);

                camera.getWorldDirection(vec);
                vec.multiplyScalar(0.1);

                camera.position.set(
                    camera.position.x - vec.x,
                    camera.position.y - vec.y,
                    camera.position.z - vec.z
                );

            }
            if (key.left) {

                camera.rotateY(MathUtils.degToRad(1));


            }
            if (key.right) {
                camera.rotateY(MathUtils.degToRad(-1));

            }
            if (key.up) {
                camera.translateY(0.1);

            }
            if (key.down) {
                camera.translateY(-0.1);

            }
        }
    })
}