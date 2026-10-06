// Mechanical conversion of pinned, CC-BY 4.0 GRID3/geoBoundaries data into SVG paths.
// Run after placing the source files described in docs/IMPACT-MAPS.md in work/map-source/.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
const states=JSON.parse(await readFile('work/map-source/nga-adm1.geojson','utf8')).features;
const areas=JSON.parse(await readFile('work/map-source/nga-adm2.geojson','utf8')).features;
const expectedCounts={Borno:27,Adamawa:21,Yobe:17};
const coverage=JSON.parse(await readFile('src/data/impact-coverage.json','utf8')).map(region=>({...region,expected:expectedCounts[region.state]}));
function polygons(geometry){return geometry.type==='Polygon'?[geometry.coordinates]:geometry.coordinates;}
function inRing(point,ring){let inside=false;for(let i=0,j=ring.length-1;i<ring.length;j=i++){
  const [x,y]=ring[i],[px,py]=ring[j];if((y>point[1])!==(py>point[1])&&point[0]<(px-x)*(point[1]-y)/(py-y)+x)inside=!inside;
}return inside;}
function contains(point,geometry){return polygons(geometry).some(rings=>inRing(point,rings[0])&&!rings.slice(1).some(ring=>inRing(point,ring)));}
function ringArea(ring){let area=0;for(let i=0;i<ring.length-1;i++)area+=ring[i][0]*ring[i+1][1]-ring[i+1][0]*ring[i][1];return Math.abs(area/2);}
function interiorPoint(geometry){
  const ring=polygons(geometry).sort((a,b)=>ringArea(b[0])-ringArea(a[0]))[0][0];
  let a=0,x=0,y=0;for(let i=0;i<ring.length-1;i++){const c=ring[i][0]*ring[i+1][1]-ring[i+1][0]*ring[i][1];a+=c;x+=(ring[i][0]+ring[i+1][0])*c;y+=(ring[i][1]+ring[i+1][1])*c;}
  const center=[x/(3*a),y/(3*a)];if(contains(center,geometry))return center;
  const xs=ring.map(p=>p[0]),ys=ring.map(p=>p[1]),minX=Math.min(...xs),minY=Math.min(...ys),maxX=Math.max(...xs),maxY=Math.max(...ys);
  const candidates=[];for(let i=1;i<30;i++)for(let j=1;j<30;j++){const p=[minX+(maxX-minX)*i/30,minY+(maxY-minY)*j/30];if(contains(p,geometry))candidates.push(p);}
  candidates.sort((p,q)=>Math.hypot(p[0]-center[0],p[1]-center[1])-Math.hypot(q[0]-center[0],q[1]-center[1]));
  if(!candidates.length)throw new Error('No interior point found');return candidates[0];
}
const output=coverage.map(region=>{
  const state=states.find(s=>s.properties.shapeName===region.state);if(!state)throw new Error(`Missing state ${region.state}`);
  const members=areas.filter(area=>contains(interiorPoint(area.geometry),state.geometry));
  if(members.length!==region.expected)throw new Error(`${region.state}: expected ${region.expected} LGAs, found ${members.length}`);
  const points=polygons(state.geometry).flat(2),midLat=points.reduce((n,p)=>n+p[1],0)/points.length;
  const project=p=>[p[0]*Math.cos(midLat*Math.PI/180),-p[1]];
  const projected=points.map(project),xs=projected.map(p=>p[0]),ys=projected.map(p=>p[1]);
  const minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);
  const scale=Math.min(580/(maxX-minX),480/(maxY-minY));
  const xy=p=>{const [x,y]=project(p);return [+(30+(580-(maxX-minX)*scale)/2+(x-minX)*scale).toFixed(1),+(30+(480-(maxY-minY)*scale)/2+(y-minY)*scale).toFixed(1)];};
  const path=geometry=>polygons(geometry).map(rings=>rings.map(ring=>ring.map((p,i)=>`${i?'L':'M'}${xy(p).join(',')}`).join('')+'Z').join('')).join('');
  const features=members.map(area=>{const label=area.properties.shapeName==='Maiduguri'?'MMC':area.properties.shapeName;const number=region.areas.indexOf(label)+1;return {name:label,sourceName:area.properties.shapeName,id:area.properties.shapeID,path:path(area.geometry),point:xy(interiorPoint(area.geometry)),covered:number>0,number};});
  for(const name of region.areas)if(features.filter(f=>f.name===name&&f.covered).length!==1)throw new Error(`Missing coverage match ${region.state}/${name}`);
  const labels=[];
  for(const feature of features.filter(f=>f.covered).sort((a,b)=>a.number-b.number)){
    const candidates=[feature.point];
    for(const radius of [40,60,80])for(let angle=0;angle<8;angle++)candidates.push([+(feature.point[0]+radius*Math.cos(angle*Math.PI/4)).toFixed(1),+(feature.point[1]+radius*Math.sin(angle*Math.PI/4)).toFixed(1)]);
    const position=candidates.find(p=>p[0]>15&&p[0]<625&&p[1]>15&&p[1]<525&&labels.every(q=>Math.hypot(p[0]-q[0],p[1]-q[1])>=38));
    if(!position)throw new Error(`No non-overlapping label for ${region.state}/${feature.name}`);
    feature.labelPoint=position;labels.push(position);
  }
  return {state:region.state,id:region.state.toLowerCase(),outline:path(state.geometry),areas:features,covered:features.filter(f=>f.covered).sort((a,b)=>a.number-b.number)};
});
await mkdir('src/data',{recursive:true});
await writeFile('src/data/impact-maps.json',JSON.stringify({source:{provider:'GRID3 via geoBoundaries',license:'CC BY 4.0',year:2022,revision:'9469f09',adm1:'NGA-ADM1-27671186',adm2:'NGA-ADM2-59680162',url:'https://www.geoboundaries.org/api.html'},states:output},null,2)+'\n');
console.log(`Prepared ${output.length} state maps, ${output.reduce((n,s)=>n+s.areas.length,0)} LGA boundaries and ${output.reduce((n,s)=>n+s.covered.length,0)} report-covered hotspots.`);
