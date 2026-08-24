export default function Marker() {

   const colour = "red";
  
   return (
        <group scale={2}>
            <mesh rotation={[Math.PI, 0, 0]} position={[0, 1.5, 0]}>
                <coneGeometry args={[1, 3, 64]} />
                <meshStandardMaterial transparent={true} color={colour} opacity={0.7} />
            </mesh>
            <mesh position={[0, 3, 0]}>
                <sphereGeometry args={[1, 32, 16, 0, Math.PI*2, 0, Math.PI]} />
                <meshStandardMaterial transparent={true} color={colour} opacity={0.7} />
            </mesh>
             <mesh position={[0, 3, 0]}>
                <sphereGeometry args={[0.5, 32, 16, 0, Math.PI*2, 0, Math.PI*2]} />
                <meshStandardMaterial color="black" />
            </mesh>
        </group>
    );
}