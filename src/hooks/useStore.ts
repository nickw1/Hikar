import { create } from 'zustand';
import { Poi, Way, Signpost, Geodata, GeoDataStore } from '../../types/hikar';
import * as THREE from 'three';

export const useStore = create<GeoDataStore>((set) => ({
    geodata: {
        pois: new Array<Poi>(),
        ways: new Array<Way>(),
        terrains: new Array<THREE.Mesh>()
    },
    signposts: new Array<Signpost>(),
    addGeoData: (geodata: Geodata) => set((state) => ({
        "geodata": {
            "pois": [...state.geodata.pois, ...geodata.pois],
            "ways": [...state.geodata.ways, ...geodata.ways],
            "terrains": [...state.geodata.terrains, ...geodata.terrains]
        }
    })),
    addSignpost: (newSignpost: Signpost) => set((state) => ({ signposts: [...state.signposts, newSignpost] })),
}));

