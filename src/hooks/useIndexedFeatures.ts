import { useRef } from 'react';
import type { Feature } from 'geojson';

export default function useIndexedFeatures() {


    const indexedFeatures = useRef<{[key: string] : Feature<any>}>({});

    return {
        indexedFeatures: indexedFeatures.current,
        addIndexedFeature: (key: string, f: Feature) => indexedFeatures.current[key] = f
    };

}