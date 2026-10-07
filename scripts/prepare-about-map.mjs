// Reproject the same pinned GRID3/geoBoundaries geometry used by the Impact page.
import {readFile,writeFile} from 'node:fs/promises';
const source=JSON.parse(await readFile('work/map-source/nga-adm1.geojson','utf8'));
const names=['Yobe','Borno','Adamawa'];
const states=names.map(name=>source.features.find(f=>f.properties.shapeName===name));
if(states.some(state=>!state))throw new Error('Missing BAY state boundary');
const polygons=g=>g.type==='Polygon'?[g.coordinates]:g.coordinates;
const project=([x,y])=>[x*Math.cos(11*Math.PI/180),-y];
const points=states.flatMap(s=>polygons(s.geometry).flat(2)).map(project);
const xs=points.map(p=>p[0]),ys=points.map(p=>p[1]);
const minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);
const scale=Math.min(400/(maxX-minX),370/(maxY-minY));
const xy=p=>{const [x,y]=project(p);return [+(20+(400-(maxX-minX)*scale)/2+(x-minX)*scale).toFixed(1),+(20+(370-(maxY-minY)*scale)/2+(y-minY)*scale).toFixed(1)];};
const path=g=>polygons(g).map(rings=>rings.map(ring=>ring.map((p,i)=>`${i?'L':'M'}${xy(p).join(',')}`).join('')+'Z').join('')).join('');
const labelPoints={Yobe:[11.68,12.02],Borno:[13.25,12.0],Adamawa:[12.46,9.40]};
await writeFile('src/data/about-map.json',JSON.stringify({source:{provider:'GRID3 via geoBoundaries',year:2022,license:'CC BY 4.0'},states:states.map(s=>({name:s.properties.shapeName,path:path(s.geometry),label:xy(labelPoints[s.properties.shapeName])}))},null,2)+'\n');
console.log('Prepared three geographically aligned state boundaries.');
