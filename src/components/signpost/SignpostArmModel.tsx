
import { useGLTF } from "@react-three/drei";

const file = "/assets/nick_metal_sign_post_arm.gltf"


export default function SignpostArmModel({children,  ...rest}: any) {

    const { nodes, materials } = useGLTF(file);

 
    return(
        <group {...rest} dispose={null}>
            <mesh
            geometry={(nodes.metal_post_arm as any).geometry}
            material={materials.signpost_textures} 
            />
            {children}
        </group>
    )
}

useGLTF.preload(file);