import { MeshBasicMaterial } from "three";
import { useRef } from "react";

type MaterialMap = { [materialType: string]: MeshBasicMaterial };

export const cachedMaterials =  {} as MaterialMap;