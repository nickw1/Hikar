import { useGLTF } from "@react-three/drei";

const file = "/assets/nick_metal_sign_post.gltf"
export default function SignpostModel({ children,  ...rest}: any) {

    const { nodes, materials } = useGLTF(file);

    
    return(
        <group  {...rest} dispose={null}>
            <mesh 
          
            geometry={(nodes.metal_post as any).geometry}
            material={materials.signpost_textures} 
            />
            {children}
        </group>
    )
}

useGLTF.preload(file);