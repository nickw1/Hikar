import express from 'express';
import ViteExpress from 'vite-express';
import fs from 'node:fs';
import { Tile } from 'locar-tiler';

import db from './db';

import MapModel from './models/map';
import type { LayerKey } from './types/hikar';

const PORT = 3001;

const app = express();

const mapModel = new MapModel(db);

// Get local DEM tiles
app.get('/dem/:z/:x/:y.png', async(req, res) => {
    try {
        const regExp=/^\d+$/;
        if(regExp.exec(req.params.x) && regExp.exec(req.params.y) && regExp.exec(req.params.z)) {
            const filename = `${process.env.TERRARIUM_TILES}/${req.params.z}/${req.params.x}/${req.params.y}.png`;
            fs.createReadStream(filename)
                .on('error', (e: any) => {
                    const notFound = e.code == 'ENOENT';
                    res.status(notFound ? 404 : 500)
                       .json({
                            "error": notFound ?  "Can't find file": "Unknown error loading tile"
                        })
                    })
                .pipe(res);
        } else {        
            res.status(400).json({error:"x, y and z must be integers"});
        }
    } catch(e) { 
        res.status(500).json({error: e});
    }
});

// Fake the (very) old endpoint - necessary for the Hikar app to keep working
app.get(['/map/:z/:x/:y.json', '/fm/ws/tsvr.php'], async (req, res) => {
    try {
        const regex = /^\d+$/;
        const x = (req.params.x || req.query.x) as string,
              y = (req.params.y || req.query.y) as string,
              z = (req.params.z || req.query.z) as string;

        if(regex.exec(x) && regex.exec(y) && regex.exec(z)) {
            const mapData = await mapModel.getMap(
                new Tile(
                    parseInt(x),
                    parseInt(y),
                    parseInt(z)
                ),
                req.query?.layers ? (req.query.layers as string).split(",") as Array<LayerKey> : new Array<LayerKey>('ways', 'poi'), 
                req.query?.outProj ? (req.query.outProj as string): null
            );

            res.json(mapData);
        } else {
            res.status(500).json({"error": "x,y,z need to be numbers"});
        }
    } catch(e: any) {
        res.status(500).json(e);
    }    
});

app.get('/webapp/map', async(req, res) => {
    try {
        const bbox  = req.query?.bbox as string | null;
        if(bbox && /^[0-9\.\-\,]+$/.exec(bbox)) {
            const bboxArr = bbox.split(',').map(str => parseFloat(str));
            if(bboxArr.length == 4) {
                const data = await mapModel.getByBbox(
                    bboxArr as [number, number, number, number],
                    req.query?.layers ? (req.query.layers as string).split(",") as Array<LayerKey> : new Array<LayerKey>('ways', 'poi'), 
                    req.query?.outProj ? (req.query.outProj as string): null
                );
                res.json(data);
            } else {
                res.status(400).json({error: 'Bbox does not have 4 values'});
            }
        } else {
            res.status(400).json({error: 'Invalid bbox format'});
        }
    } catch(e) {
        console.log(e);
        res.status(500).json({error: e});
    }
});

ViteExpress.listen(app, PORT, () => {
    console.log(`Server listening on port ${PORT}.`);
});
