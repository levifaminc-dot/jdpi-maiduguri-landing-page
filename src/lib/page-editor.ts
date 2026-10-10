import catalogue from '../../content/page-fields.json' with {type:'json'};
import type {ContentImage,SiteContent} from './content';

export interface EditorialPage {
  _id:string;
  fields:Record<string,string|ContentImage>;
  data?:Record<string,unknown>;
}
// Only the known content slots are exposed. Text is always rendered through Astro
// escaping; editors cannot inject markup, scripts, tracking or payment endpoints.
export function pageEditor(content:SiteContent,route:string){
  const definition=catalogue.find(page=>page.route===route);
  if(!definition)throw Error(`Unknown editorial page: ${route}`);
  const published=content.pages?.find(page=>page._id===definition.type);
  function text(name:string){
    const value=published?.fields?.[name];
    if(typeof value==='string')return value;
    const fallback=definition!.fields.find(field=>field.name===name)?.initialValue;
    return typeof fallback==='string'?fallback:'';
  }
  function image(name:string):ContentImage{
    const fallback=definition!.fields.find(field=>field.name===name)?.initialValue as ContentImage;
    const value=published?.fields?.[name];
    if(value&&typeof value==='object'&&typeof value.url==='string'&&typeof value.alt==='string'&&safeEditorialImage(value.url))return value;
    return fallback;
  }
  function data<T>(name:string,fallback:T):T{
    const value=published?.data?.[name];
    return value===undefined||value===null?fallback:value as T;
  }
  return {text,image,data};
}
export function safeEditorialImage(value:string){
  if(/^\/assets\/[a-zA-Z0-9_./-]+$/.test(value)&&!value.includes('..'))return true;
  try{const url=new URL(value);return url.origin==='https://cdn.sanity.io'&&url.pathname.startsWith('/images/')&&!url.username&&!url.password;}catch{return false;}
}
