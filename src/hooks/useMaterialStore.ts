import { create } from 'zustand';
import { Material } from 'three';
import type { MaterialStore, MaterialMap } from '../../types/hikar';

console.log("Creating a material store");
export const useMaterialStore = create<MaterialStore>((set) => ({
    materialStore: {} as MaterialMap,
    addMaterial: (key: string, material: Material) => set((state) => {
        return { materialStore: { ...state.materialStore, [key]: material } };
    })
}));