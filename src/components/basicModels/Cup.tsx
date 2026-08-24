export default function Cup() {
    return(
        <group scale={1}>
            <mesh position={[0, 2.7, 0]} rotation={[0, 0,  Math.PI]}>
                <sphereGeometry args={[3, 32, 16, 0, Math.PI*2, 0, Math.PI /2]} />
                <meshBasicMaterial color="#8080ff" />
            </mesh>
             <mesh position={[0, 0, 0]}>
                <cylinderGeometry args={[3 ,3, 0.5]} />
                <meshBasicMaterial color="#4040ff" />
            </mesh>
            <mesh position={[3, 2.2, 0]} rotation={[0, 0, -Math.PI*0.6]}>
                <torusGeometry args={[0.5, 0.1, 16, 100, Math.PI*1.2]} />
                <meshBasicMaterial color="#4040ff" />
            </mesh>
        </group>
    )
}