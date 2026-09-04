import { create } from 'zustand';
import { Poi, Way, Signpost, GeoDataStore } from '../../types/hikar';
import * as THREE from 'three';

export const useStore = create<GeoDataStore>((set) => ({
    pois: new Array<Poi>(),
    ways: new Array<Way>(),
    terrains: new Array<THREE.Mesh>(),

    signposts: new Array<Signpost>(),

    addGeoData: (ways: Array<Way>, pois: Array<Poi>, terrains: Array<THREE.Mesh>) => set((state) => ({
        "pois": [...state.pois, ...pois],
        "ways": [...state.ways, ...ways],
        "terrains": [...state.terrains, ...terrains]
    })),
    addWays: (ways: Array<Way>) => set((state) => ({
        ways: [...state.ways, ...ways]
    })),
    addPois: (pois: Array<Poi>) => set((state) => ({
        pois: [...state.pois, ...pois]
    })),
    addTerrains: (terrains: Array<THREE.Mesh>) => set((state) => ({
        terrains: [...state.terrains, ...terrains]
    })),
    addSignpost: (newSignpost: Signpost) => set((state) => ({ signposts: [...state.signposts, newSignpost] })),
}));

