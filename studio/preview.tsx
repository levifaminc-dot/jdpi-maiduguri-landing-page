import type {SanityDocument} from 'sanity';
import {useClient} from 'sanity';
import {useEffect,useState} from 'react';

interface Props {document:{displayed:SanityDocument}}
export function DraftPreview({document}:Props){
  const doc=document.displayed;
  const client=useClient({apiVersion:'2026-10-05'});
  const [imageUrl,setImageUrl]=useState('');
  const image=(doc.image||doc.heroImage||doc.logo) as {asset?:{_ref?:string}}|undefined;
  const ref=image?.asset?._ref;
  useEffect(()=>{let current=true;setImageUrl('');if(ref)client.fetch<string>('*[_id==$id][0].url',{id:ref}).then(url=>{if(current)setImageUrl(url);}).catch(()=>{});return()=>{current=false;};},[client,ref]);
  const body=(doc.body||[]) as {children?:{text?:string}[]}[];
  const title=String(doc.title||doc.name||doc.heroStatement||'Website settings');
  return <div style={{padding:32,maxWidth:800,margin:'auto',fontFamily:'system-ui',color:'#202020',lineHeight:1.6}}>
    <p style={{fontSize:13,color:'#08783e',textTransform:'uppercase',letterSpacing:2}}>Draft content preview</p>
    <h1 style={{fontSize:36,lineHeight:1.2}}>{title} {String(doc.heroHighlight||'')}</h1>
    {imageUrl && <img src={`${imageUrl}?auto=format&w=900`} alt="" style={{width:'100%',borderRadius:8}}/>}
    <p>{String(doc.summary||doc.heroIntro||doc.tagline||'')}</p>
    {doc.aboutIntro ? <><h2>Who we are</h2><p>{String(doc.aboutIntro)}</p></> : null}
    {body.map((block,index)=><p key={index}>{block.children?.map(span=>span.text||'').join('')}</p>)}
    <hr/><p style={{fontSize:14}}>This preview shows the current draft text and image. Publish only after checking accuracy and image permissions. The website updates after its release workflow completes.</p>
    <a href={process.env.SANITY_STUDIO_SITE_URL||'https://jdpi-maiduguri-impact.ifexls.chatgpt.site'} target="_blank" rel="noreferrer" style={{color:'#08783e'}}>Open the published website</a>
  </div>;
}
