import { ModelProps } from "../../../types/hikar";

export default function Tree({ scale,  onClick = () => {}  } : ModelProps) {
    return(
        <group scale={scale}>
            <mesh position={[0, 4, 0]}>
            <sphereGeometry args={[2.0]}/>
            <meshBasicMaterial color="green" />
            </mesh>
            <mesh position={[0, 1, 0]}>
            <cylinderGeometry args={[0.5, 0.5, 2]} />
             <meshBasicMaterial color="#aa5500" />
            </mesh>
        </group>
    )
}