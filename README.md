# Hikar (LocAR.js edition)

**Hikar** is a project to develop an augmented-reality navigation app for walkers. It renders [OpenStreetMap](https://openstreetmap.org) paths, roads and selected points of interest on the device camera feed and also shows virtual signposts at path junctions, showing the direction and distance to nearby points of interest. It is 100% open source and uses no proprietary cloud services; it is based on [LocAR.js](https://github.com/AR-js-org/locar.js) and [three.js](https://threejs.org).

As stated above, data is sourced from OpenStreetMap, but stored in Hikar's own [osm2pgsql](https://osm2pgsql.org) derived PostGIS database rather than being fetched directly from OpenStreetMap servers. 

The intention is for elevation data to be stored locally on Hikar's own server to reduce reliance on third-party services. Much of this data has been created already. However, there are unfortunately some gaps in coverage across Europe and limited server space, so for now the elevaton data is sourced from [**the Terrarium dataset on AWS**](https://registry.opendata.aws/terrain-tiles/), which is an open data set. Self-hosted data, when available, will be sourced from [NASA SRTM](https://earthexplorer.usgs.gov) and [Japan's ALOS](https://www.eorc.jaxa.jp/ALOS/en/dataset/aw3d30/aw3d30_e.htm) for higher latitudes.

Hikar is currently live at [https://hikar.org](hikar.org). Currently the live Hikar server **only provides data in Europe and Turkey** due to server constraints, however the software is capable of working globally. So if you wanted to set up a Hikar server for your own area of the world, you could do using the above data sources.

## Background

Hikar was originally implemented as a [native Android app](https://gitlab.com/nickw1/Hikar) and then as a web app using "classic" location-based AR.js and A-Frame (see [old repo](https://github.com/nickw1/hikar.js)).

However with the recent development of [LocAR.js](https://github.com/AR-js-org/locar.js) the decision has been made to re-implement and perform further development the Hikar webapp with LocAR.js and also likely [RDK](https://github.com/omnidotdev/rdk).

As LocAR.js supports iOS while earlier approaches did not, this should be the first version of Hikar to work on iOS devices though no confirmed testing has been done yet. 

Currently live at [hikar.org](https://hikar.org) - will only work in Europe and Turkey due to data coverage. Not optimised for urban areas, recommended for use in suburban and rural areas.

The project is intended also to be used as a test for future ideas and development such as SLAM integration (e.g. [AlvaAR](https://github.com/alanross/AlvaAR)).

## Current status

Renders paths, roads and common POIs with simple models as well as virtual signposts.

The virtual signpost functionality currently requires a modified version of `geojson-path-finder` which is installed from npm in the normal way.

## Future plans

- More extensive UI, e.g. search for and route to nearby POIs
- Show POI details by tapping rendered POIs
- Different signpost rendering styles (e.g. showing destinations by tapping on a path rather than via a virtual signpost)
- React Native support. This now looks feasible thanks to [React Native WebGPU](https://github.com/wcandillon/react-native-webgpu); a proof-of-concept combining the camera feed, rendered data and sensors (not a full AR app!) [has been produced here](https://github.com/nickw1/react-native-AR-poc/)
- Create a Docker image making it easier to create local Hikar installations covering specific parts of the globe.

## Contact details for Hikar project

If you have any questions on any aspect of this project, or want to suggest ideas and improvements, please email: hikaraugmentedreality@gmail.com
