# hikar-locar

[Hikar](https://hikar.org) is a project to develop an augmented-reality navigation app for walkers. It was originally implemented as a [native Android app](https://gitlab.com/nickw1/Hikar) and then as a web app using "classic" location-based AR.js and A-Frame (see [old repo](https://github.com/nickw1/hikar.js)).

However with the recent development of [LocAR.js](https://github.com/AR-js-org/locar.js) the decision has been made to re-implement and perform further development the Hikar webapp with LocAR.js and also likely [RDK](https://github.com/omnidotdev/rdk).

Currently live at [hikar.org](https://hikar.org) - will only work in Europe and Turkey due to data coverage. Not optimised for urban areas, recommended for use in suburban and rural areas.

The project is intended also to be used as a test for future ideas and development such as SLAM integration (e.g. [AlvaAR](https://github.com/alanross/AlvaAR)).

## Current status

Renders paths, roads and common POIs with simple models. 

The virtual signpost functionality, present in the AR.js/A-Frame version, has been largely implemented backend but is not rendered frontend yet. This currently requires a modified version of `geojson-path-finder` which is installed from npm in the normal way.

## Contact details for Hikar project

If you have any questions on any aspect of this project, or want to suggest ideas and improvements, please email: hikaraugmentedreality@gmail.com