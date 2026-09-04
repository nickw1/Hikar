
import PoiRenderer from './PoiRenderer';
import WayRenderer from './WayRenderer';
import TerrainRenderer from './TerrainRenderer';
import SignpostRenderer from './SignpostRenderer';


export default function GeoDataRenderer() {

    console.log("rendering GeoDataRenderer");

    return (
        <>
            <TerrainRenderer />
            <PoiRenderer />
            <WayRenderer />
            <SignpostRenderer />


        </>
    )
}