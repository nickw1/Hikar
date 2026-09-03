import { useStore } from "../hooks/useStore"

export default function TerrainRenderer() {

    const terrains = useStore((state) => state.terrains);

    return (
        terrains.map(terrain => (
            <primitive object={terrain} key={`trn-${terrain.userData["tileKey"]}`}></primitive>
        ))
    )
}