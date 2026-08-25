import { ModelProps } from "../../../types/hikar";

interface BuildingProps extends ModelProps {
    id: string;
}

export default function Building({ id, scale }: BuildingProps ) {
    return (
        <group scale={scale}>
            <mesh position={[0, 0.75, 0]}>
                <boxGeometry args={[1.5, 1.5, 1.5]} />
                <meshStandardMaterial color="#ff6060" />
                 { [...Array(12)].map((_, idx) => (
                // -0.75 0.75... 0 1 -> 0 1.5
                <mesh key={`${id}:${idx}`} position={[idx%2-0.5, Math.floor((idx%6)/2) * 0.4 - 0.4, Math.floor(idx/6)*1.5 -0.75]}>
                    <boxGeometry args={[0.3, 0.3, 0.1]} />
                    <meshStandardMaterial color="cyan" />
                </mesh>
             ))}
              { [...Array(12)].map((_, idx) => (
                <mesh key={`${id}:${idx+12}`} position={[Math.floor(idx/6)*1.5 -0.75, Math.floor((idx%6)/2) *0.4 - 0.4, idx%2-0.5]}>
                    <boxGeometry args={[0.1, 0.3, 0.3]} />
                    <meshStandardMaterial color="cyan" />
                </mesh>
             ))}
            </mesh>
            <mesh position={[0, 2, 0]} rotation={[0, Math.PI*0.25, 0]} >
                <coneGeometry args={[1, 1, 4]} />
                <meshStandardMaterial color="#803030" />
            </mesh>
             <mesh position={[0, 0.2, 1]}>
                <planeGeometry args={[0.2, 0.4]} />
                <meshStandardMaterial color="yellow" />
             </mesh>
        </group>
    );
}