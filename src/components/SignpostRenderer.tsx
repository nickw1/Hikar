
import { GeolocationAnchor } from '@omnidotdev/rdk/geolocation';
import RenderedSignpost from './signpost/RenderedSignpost';
import { useStore } from '../hooks/useStore';

export default function SignpostRenderer() {

    const signposts = useStore((state) => state.signposts);
    console.log('Number of signposts: ', signposts.length);
    console.log('Signposts: ', signposts);
    return (
        signposts.map(signpost => (
            <GeolocationAnchor key={`sp-${signpost.jKey}`} longitude={signpost.position[0]} latitude={signpost.position[1]} altitude={signpost.position[2]} isBillboard={false}>
                <RenderedSignpost signpost={signpost} />
            </GeolocationAnchor>
        ))
    );
}