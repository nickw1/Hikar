
import type { SignpostArm, Signpost } from '../../../types/hikar';
import { Text } from '@react-three/drei';
import SignpostModel from './SignpostModel';
import SignpostArmModel from './SignpostArmModel';
import * as THREE from 'three';
import { ThreeEvent } from '@react-three/fiber';
import { useCallback } from 'react';


type RenderedSignpostProps = { signpost: Signpost };

export default function RenderedSignpost({ signpost }: RenderedSignpostProps) {


    const armTextProps: Array<[number, number, "left" | "right"]> = [
        [-0.4, -Math.PI * 0.5, 'left'],
        [0.4, Math.PI * 0.5, 'right']
    ];

    const displayedRouteTypes: { [type: string]: string } = {
        footway: 'Path',
        path: 'Path',
        steps: 'Path (with steps)',
        bridleway: 'Bridleway',
        cycleway: 'Cycle Path',
        track: 'Track',
        public_footpath: 'Public Footpath',
        public_bridleway: 'Public Bridleway',
        byway_open_to_all_traffic: 'Byway',
        restricted_byway: 'Restricted Byway'
    };

    const displayRouteInfo = useCallback((routeInfo: { pathType: string | null, destinations: string | null}) => {
        alert(`${routeInfo.pathType ?? "Path"}${routeInfo.destinations ? ` to:\n${routeInfo.destinations}` : ""}`);
    }, []);

    function getRouteInfo(arm: SignpostArm) {
        return {
            pathType: getPathType(arm),
            destinations: (arm.destinations.length > 0) ?
                arm.destinations.slice(0, 2).map(dest => {
                    const name = dest.properties?.name ?? "";
                    return `${name.length <= 25 ? name : name.substring(0, 23) + ".."} ${dest.dist.toFixed(2)} km`
                }).join("\n") : null

        }
    }

    function getPathType(arm: SignpostArm): string | null {
        if (arm.properties?.designation) {
            return displayedRouteTypes[arm.properties.designation] || null;
        } else if (arm.properties?.highway) {
            return ['track', 'service'].indexOf(arm.properties.highway) == -1 ?
                displayedRouteTypes[arm.properties.highway] || null :
                (['yes', 'designated', 'permissive']
                    .indexOf(arm.properties.foot) >= 0 ? "Route with public access" : null);
        } else {
            return null;
        }
    }



    return (


        <group scale={0.1} onClick={displayRouteInfo}>
            <SignpostModel />

            {
                (Object.keys(signpost.arms) as any as number[]).map( (bearing: number) => {
                    const arm = signpost.arms[bearing];
                    const scaleFactor = 12 * (arm.destinations.length > 0 ? 1.8 : 2);
                    const routeInfo = getRouteInfo(arm);
                    console.log(`bearing ${bearing}`)
                    return (
                        <SignpostArmModel key={`${signpost.jKey}-arm-${bearing}`} rotation={[0, (-bearing - 180) * Math.PI / 180, 0]}
                            onClick={(e: ThreeEvent<THREE.Group>) => {
                                e.stopPropagation();
                                displayRouteInfo(routeInfo)
                            }}>
                            {armTextProps.map((armTextProp, i) => {
                                const renderedText = routeInfo.destinations || routeInfo.pathType || null;
                                return (
                                    
                                    renderedText ? <Text key={`${signpost.jKey}-txt-${bearing}-side-${i}`} position={[armTextProp[0], 30, 2]}
                                        rotation={[0, armTextProp[1], 0]}
                                        scale={scaleFactor}
                                        font="https://fonts.gstatic.com/s/roboto/v18/KFOmCnqEu92Fr1Mu4mxM.woff"
                                        color="white"
                                        anchorX={armTextProp[2]}
                                        anchorY="top"
                                        fontSize={0.3}>{renderedText}</Text> : ""
                                )
                            }
                            )}
                        </SignpostArmModel>

                    )
                })
            }
        </group>

    )
}






