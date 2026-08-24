import { create } from 'zustand';
import { Poi, Way, PoiState } from '../types/hikar';

export const useStore = create<PoiState>((set) => ({
    pois: new Array<Poi>(),
    ways: new Array<Way>(),
    elev: 0,
    addPoi: (poi: Poi) => set((state) => ({pois :[...state.pois, poi]})),
    addWay: (way: Way) =>  set((state) => ({ways: [...state.ways, way]})),
    setElev: (elev: number) => set(() => ({elev}))
}));

