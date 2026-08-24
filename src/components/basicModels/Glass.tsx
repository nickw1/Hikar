export default function Glass() {
    return(
        <group scale={2}>
            <mesh position={[0, 1.5, 0]} >
                <cylinderGeometry args={[1, 1, 3]}/>
                <meshStandardMaterial color="#cc6600" transparent opacity={0.5} />
            </mesh>
            <mesh position={[0, 3.25, 0]}>
                <cylinderGeometry args={[1, 1, 0.5]} />
                <meshBasicMaterial color="white" />
            </mesh>
            <mesh position={[1, 2.5, 0]} rotation={[0, 0, -Math.PI*0.5]}>
                <torusGeometry args={[0.5, 0.1, 16, 100, Math.PI*1.2]} />
                <meshStandardMaterial color="gray" transparent opacity={0.2} metalness={0.1} />
            </mesh>
        </group>
    )
}