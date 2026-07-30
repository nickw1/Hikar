import * as THREE from 'three';
import { App, GpsReceivedEvent, LocAR } from 'locar';
import { DemApplier, DemTiler, GeoJsonTiler, LonLat } from 'locar-tiler';
import type { Feature, LineString, MultiLineString, Point, FeatureCollection } from 'geojson';
import { Bar, Building, Cup, Marker, Tree } from './simpleModels';
import TerrainGenerator from './terrain';
import { Text } from 'troika-three-text';
import { RoutableWay, RoutablePoi, Signpost } from '../types';
import BoundingBox from './BoundingBox';
import RoutingNetwork from './RoutingNetwork';
import SignpostManager from './SignpostManager';
import SignpostRenderer from './SignpostRenderer';

const app = new App({ cameraOptions: { hFov: 80, near: 0.1, far: 4000 } });

const colours: Map<string, number> = new Map([
  ["path", 0x00ff00],
  ["footway", 0x00ff00],
  ["bridleway", 0xaa5500],
  ["cycleway", 0x0000ff]
]);

const widths: Map<string, number> = new Map([
  ["trunk", 7],
  ["primary", 5],
  ["secondary", 5],
  ["tertiary", 5],
  ["unclassified", 3],
  ["residential", 2]
]);

const noAccess = ["private", "no"];

let locar: LocAR | null = null;
let demTiler: DemTiler | null = null;

const indexedFeatures = new Map<String, Feature>();
const highwayMaterials = new Map<String, THREE.Material>();

const demApplier = new DemApplier(
  demTiler = new DemTiler("/dem/{z}/{x}/{y}.png"),
  new GeoJsonTiler("/map/{z}/{x}/{y}.json?outProj=4326")
);

let lastLonLat: LonLat | null = null;
let distSinceUpdate = Number.MAX_VALUE;

setMsg("Waiting for GPS...", "loadMsg");

const allWaysForRouting: FeatureCollection<LineString> = {
  "type": "FeatureCollection",
  "features": new Array<RoutableWay>()
};
const routingNetwork = new RoutingNetwork({
  juncDistThreshold: 0.05
});
const signpostManager = new SignpostManager({
  routingNetwork
});

const signpostRenderer = new SignpostRenderer(
  '/assets/nick_metal_sign_post.obj',
  '/assets/nick_metal_sign_post_arm.obj',
  '/assets/signpost_textures.png'
);

try {
  locar = await app.start();
  locar.setElevation(100);

  const ambientLight = new THREE.AmbientLight(0xffffff, 3);
  const directionalLight = new THREE.DirectionalLight(0xffffff, 6);
  directionalLight.position.set(0, 1, 0.1);
  locar.scene.add(ambientLight);
  locar.scene.add(directionalLight);


  locar.on("gpsupdate", onGpsUpdate);
  locar.startGps();

  locar.on("gpserror", (ev: GeolocationPositionError) => {
    alert(ev.code);
  });

  await signpostRenderer.loadAssets();
} catch (e: any) {
  alert(e);
}

/*
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('svcw.js')
    .then(registration => {
      let serviceWorker;
      if (registration.installing) {
        serviceWorker = registration.installing;
      } else if (registration.waiting) {
        serviceWorker = registration.waiting;
      } else if (registration.active) {
        serviceWorker = registration.active;
      }

    })

    .catch(e => {
      console.error(`Service worker registration failed: ${e}`);
    });
}
*/

function setMsg(msg: string, elementId: string = "msg") {
  document.getElementById(elementId)!.innerHTML = msg;
}

function showLocation(lonLat: LonLat) {
  setMsg(`Lon ${lonLat.longitude.toFixed(3)} lat ${lonLat.latitude.toFixed(3)} ${demTiler === null ? "" : `elev: ${Math.round(demTiler.getElevationFromLonLat(lonLat))}m`}`);
}

function handleLineMaterial(hwy: string): THREE.Material {
  if (!highwayMaterials.get(hwy)) {
    const lineMaterial = new THREE.MeshStandardMaterial({ color: colours.get(hwy) ?? 0xffffff, transparent: true, opacity: 0.7 });
    highwayMaterials.set(hwy, lineMaterial);
    return lineMaterial;
  } else {
    return highwayMaterials.get(hwy)!;
  }
}

async function onGpsUpdate(ev: GpsReceivedEvent) {

  setMsg("", "loadMsg");

  const lonLat = new LonLat(
    ev.position.coords.longitude,
    ev.position.coords.latitude
  );

  if (lastLonLat !== null) {
    distSinceUpdate = LocAR.haversineDist(lonLat, lastLonLat);
  }

  if (distSinceUpdate > 10) {
    lastLonLat = lonLat;
    setMsg("Downloading new data...", "loadMsg");
    const newTiles = await demApplier.updateByLonLat(
      lonLat
    );

    const newRoutablePois: FeatureCollection<Point> = {
      "type": "FeatureCollection",
      "features": new Array<RoutablePoi>()
    };

    setMsg("", "loadMsg");

    locar!.setElevation(demTiler!.getElevationFromLonLat(lonLat) + 2);

    for (let dataTile of newTiles) {
      const tileKey = dataTile.tile.getIndex();

      const newDem = demTiler?.dataTiles.get(tileKey)?.data;
      if (newDem) {
        const terrainGenerator = new TerrainGenerator(newDem);
        locar!.scene.add(terrainGenerator.genTerrain(locar!));
      }

      for (let feature of dataTile.data.features) {

        feature.properties ??= {};
        const props = feature.properties;

        if (!indexedFeatures.get(props.hikar_id)) {
          const hwy = props.highway;
          const width = props.width || widths.get(hwy) || 2;

          const accessibleHighway = hwy && hwy.indexOf("motorway") == -1 && noAccess.indexOf(props.access) == -1 && noAccess.indexOf(props.foot) == -1;

          let lineMaterial: THREE.Material | null = null;

          switch (feature.geometry.type) {


            case 'Point':
              feature.properties.hikar_id = `p${feature.properties.osm_id}`;
              const object = new THREE.Group();
              if (props.amenity == 'pub') {
                object.add(Bar(4));
              } else if (props.amenity == 'cafe') {
                object.add(Cup(4));
              } else if (props.natural == 'tree') {
                object.add(Tree(4));
              } else if (props.shop !== undefined || props.building !== undefined) {
                object.add(Building(4));
              } else if (props.natural == "peak") {
                const geom = new THREE.ConeGeometry(8, 24);
                const material = new THREE.MeshStandardMaterial({ color: 0xff00ff });
                object.add(new THREE.Mesh(geom, material));
              } else {
                object.add(Marker(4));
              }
              const label = props.name || props.amenity || props.place || props.natural || props.shop;
              if (label) {
                const text = new Text();
                text.text = label.replace("_", " ");
                text.position.set(0, 20, 0);
                text.fontSize = 4;
                text.anchorX = 'center';
                text.font = 'https://fonts.gstatic.com/s/roboto/v18/KFOmCnqEu92Fr1Mu4mxM.woff';
                text.color = 0xffffff;
                text.sync();
                object.add(text);
              }


              const coords = (feature.geometry as Point).coordinates;
              locar!.add(object, coords[0], coords[1], coords[2] || 0);
              indexedFeatures.set(feature.properties.hikar_id, feature);


              // Store all routable POIs - these will be inserted into the graph for routing
              // Only POIs with a name are considered routable
              if (props.name) {
                const f = feature as RoutablePoi;
                f.dist = Number.MAX_VALUE;
                f.bearing = 720;
                f.path = [];
                f.weight = 0.0;
                f.split = null;
                newRoutablePois.features.push(f);
                signpostManager.addRoutablePoi(f);
              }
              break;

            case 'LineString':
              feature.properties.hikar_id = `${dataTile.tile.toString()}:w${props.osm_id}`;
              if (accessibleHighway) {
                lineMaterial = handleLineMaterial(hwy);
                const lineCoords = (feature.geometry as LineString).coordinates.filter(coords => coords[2] !== null);
                if (lineCoords.length >= 2) {
                  locar!.addGeoLine(lineCoords as [number, number, number?][], lineMaterial, width) // TODO on locar : change param to be possibly a GeoJSON Position type
                  indexedFeatures.set(feature.properties.hikar_id, feature);


                  const f = feature as RoutableWay;
                  f.boundingBox = BoundingBox.fromCoords(f.geometry.coordinates);
                  allWaysForRouting.features.push(f);
                }
              }
              break;

            case 'MultiLineString':
              if (accessibleHighway) {
                const id = `${dataTile.tile.toString()}:w${props.osm_id}`;
                lineMaterial = handleLineMaterial(hwy);
                const mlsCoords = (feature.geometry as MultiLineString).coordinates.filter(coords => coords[2] !== null);
                let i = 0;
                for (let lineCoords of mlsCoords) {
                  const splitWay: RoutableWay = {
                    type: "Feature",
                    geometry: {
                      type: "LineString",
                      coordinates: lineCoords
                    },
                    properties: { ...feature.properties, hikar_id: `${id}#${i++}` },
                    boundingBox: BoundingBox.fromCoords(lineCoords)
                  };

                  if (lineCoords.length >= 2) {
                    locar!.addGeoLine(lineCoords as [number, number, number?][], lineMaterial, width)
                    indexedFeatures.set(splitWay.properties!.hikar_id, feature);
                    allWaysForRouting.features.push(splitWay);
                  }
                }
              }
          }
        }
      }
    }
    if (newTiles.length > 0) {
      setMsg("Updating routing network...", "loadMsg");
      routingNetwork.update(allWaysForRouting, newRoutablePois);
      setMsg("", "loadMsg");
    }

    const newSignpost = signpostManager.updatePos(ev.position.coords);
    if (newSignpost !== null) {
    
      printSignpost(newSignpost);
      const signpostModel = await signpostRenderer.renderSignpost(newSignpost);
      if (signpostModel) {
        locar?.add(signpostModel, newSignpost.position[0], newSignpost.position[1], newSignpost.position[2]);
      }
    }
  }
  showLocation(lonLat);
}

function printSignpost(signpost: Signpost) {
  console.log('*** SIGNPOST:');
  Object.keys(signpost.arms).forEach(bearing => {
    console.log(`Arm: Bearing ${bearing} Destinations: ${JSON.stringify(signpost.arms[bearing as any as number].destinations)}`);
  });
}