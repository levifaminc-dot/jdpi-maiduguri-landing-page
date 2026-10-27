import type {SanityDocument} from 'sanity';
import {useClient} from 'sanity';
import {useEffect,useState} from 'react';
import catalogue from '../content/page-fields.json';

interface Props {document:{displayed:SanityDocument}}
export function DraftPreview({document}:Props){
  const doc=document.displayed;
  const page=catalogue.find(page=>page.type===doc._type);
  const client=useClient({apiVersion:'2026-10-05'});
  const [imageUrl,setImageUrl]=useState('');
  const image=(doc.image||doc.heroImage||doc.logo||(page&&doc[page.fields.find(field=>field.kind==='image')?.name||''])) as {asset?:{_ref?:string}}|undefined;
  const ref=image?.asset?._ref;
  useEffect(()=>{let current=true;setImageUrl('');if(ref)client.fetch<string>('*[_id==$id][0].url',{id:ref}).then(url=>{if(current)setImageUrl(url);}).catch(()=>{});return()=>{current=false;};},[client,ref]);
  const body=(doc.body||[]) as {children?:{text?:string}[]}[];
  const title=String(doc.title||doc.name||doc.heroStatement||page?.title||'Website settings');
  const slug=(doc.slug as {current?:string}|undefined)?.current;
  return <div style={{padding:32,maxWidth:800,margin:'auto',fontFamily:'system-ui',color:'#202020',lineHeight:1.6}}>
    <p style={{fontSize:13,color:'#08783e',textTransform:'uppercase',letterSpacing:2}}>Draft content preview</p>
    <h1 style={{fontSize:36,lineHeight:1.2}}>{title} {String(doc.heroHighlight||'')}</h1>
    {imageUrl && <img src={`${imageUrl}?auto=format&w=900`} alt="" style={{width:'100%',borderRadius:8}}/>}
    <p>{String(doc.summary||doc.heroIntro||doc.tagline||'')}</p>
    {doc.aboutIntro ? <><h2>Who we are</h2><p>{String(doc.aboutIntro)}</p></> : null}
    {body.map((block,index)=><p key={index}>{block.children?.map(span=>span.text||'').join('')}</p>)}
    {page?.groups.map(group=><section key={group.name}><h2>{group.title}</h2>{page.fields.filter(field=>field.group===group.name&&field.kind!=='image'&&!field.name.startsWith('seo')).map(field=><div key={field.name}><small style={{color:'#666'}}>{field.title}</small><p style={{marginTop:4}}>{String(doc[field.name]??'')}</p></div>)}</section>)}
    {page&&doc.data?<><h2>Detailed content</h2><StructuredPreview value={doc.data}/></>:null}
    {doc.profile?<><h2>Project details</h2><StructuredPreview value={doc.profile}/></>:null}
    {doc.details?<><h2>Programme details</h2><StructuredPreview value={doc.details}/></>:null}
    <hr/><p style={{fontSize:14}}>This preview shows the current draft text and image. Publish only after checking accuracy and image permissions. The website updates after its release workflow completes.</p>
    <a href={`${(process.env.SANITY_STUDIO_SITE_URL||'https://www.jdpimaiduguri.org').replace(/\/$/,'')}/${page?`${page.route}/`:doc._type==='vacancy'&&slug?`careers/${slug}/`:''}`} target="_blank" rel="noreferrer" style={{color:'#08783e'}}>Open the published website</a>
  </div>;
}
function StructuredPreview({value}: {value:unknown}):import('react').ReactNode{
  if(value==null)return null;
  if(Array.isArray(value))return <ul>{value.map((item,index)=><li key={index}><StructuredPreview value={item}/></li>)}</ul>;
  if(typeof value==='object')return <dl>{Object.entries(value).filter(([key])=>!key.startsWith('_')&&!['asset','image','overviewImage'].includes(key)).map(([key,item])=><div key={key}><dt style={{fontWeight:600}}>{key.replace(/([a-z])([A-Z])/g,'$1 $2')}</dt><dd><StructuredPreview value={item}/></dd></div>)}</dl>;
  return String(value);
}
