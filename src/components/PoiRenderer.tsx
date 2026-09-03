import RenderedPoi from './RenderedPoi';
import { useStore } from '../hooks/useStore';

export default function PoiRenderer() {
    const pois = useStore((state) => state.pois);
    return (
        <>{pois.map(poi => <RenderedPoi poi={poi} key={poi.properties!.hikar_id} />)}</>
      
    );
}