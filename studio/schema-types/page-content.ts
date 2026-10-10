import {defineType,defineField,defineArrayMember} from 'sanity';
import {DocumentTextIcon} from '@sanity/icons';
import catalogue from '../../content/page-fields.json';
import models from '../../content/structured-fields.json';
import coverage from '../../src/data/impact-coverage.json';

type Model={kind:string;name?:string;required?:boolean;fields?:Model[];item?:Model;max?:number};
const title=(name:string)=>name.replace(/([a-z])([A-Z])/g,'$1 $2').replace(/^./,letter=>letter.toUpperCase()).replace(/Lga/g,'LGA');
const detailTitles:Record<string,string>={about:'History, values & leadership',team:'Board & management',impact:'Results & story photos','where-we-work':'LGAs & office bases',resources:'Document library'};
const https=(value:string)=>{try{const url=new URL(value);return url.protocol==='https:'&&!url.username&&!url.password;}catch{return false;}};
export function structuredField(model:Model,name:string,parent=''):ReturnType<typeof defineField>{
  const type=model.kind==='image'?'editorialImage':model.kind;
  const fields=model.fields?.map(field=>structuredField(field,field.name!,name));
  const validation=(rule:any)=>{
    let result=model.required?rule.required():rule;
    if(type==='array')result=result.max(model.max||100);
    if(type==='array'&&name==='impactOverview')result=result.min(4).max(4);
    if(type==='array'&&name==='sectorImpact')result=result.min(1).max(7);
    if(type==='array'&&name==='photos')result=result.min(4).max(4);
    if(type==='array'&&name==='leadership')result=result.max(4);
    if(type==='number')result=result.integer().min(0);
    if(['url','fileUrl','onlineUrl'].includes(name))result=result.custom((value:string|undefined)=>!value||https(value)||'Use an HTTPS link without embedded credentials.');
    if(['slug','project'].includes(name))result=result.custom((value:string|undefined)=>!value||/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)||'Use the linked page’s address, with lowercase letters and hyphens.');
    if(parent==='lgaActivities'&&name==='lga')result=result.custom((value:string|undefined,context:any)=>!value||coverage.some(region=>region.state===context.parent?.state&&region.areas.includes(value))||'Choose an LGA in the selected state from the current checked map.');
    return result;
  };
  return defineField({name,title:title(name),type,validation,
    ...(type==='text'?{rows:3}:{}),
    ...(parent==='photos'&&name==='name'?{readOnly:true,description:'This key links the photo to its existing section. Replace the image, not the key.'}:{}),
    ...(parent==='lgaActivities'&&name==='state'?{options:{list:coverage.map(region=>region.state)}}:{}),
    ...(parent==='lgaActivities'&&name==='lga'?{options:{list:coverage.flatMap(region=>region.areas)}}:{}),
    ...(parent==='legacyReports'&&name==='category'?{options:{list:['Annual reports','Financial reports','Publications']}}:{}),
    ...(fields?{fields,options:{collapsible:true,collapsed:false}}:{}),
    ...(type==='array'?{of:[model.item!.kind==='object'?defineArrayMember({type:'object',name:`${name}Item`,fields:model.item!.fields!.map(field=>structuredField(field,field.name!,name)),preview:{select:{title:model.item!.fields!.some(field=>field.name==='title')?'title':model.item!.fields!.some(field=>field.name==='name')?'name':model.item!.fields!.some(field=>field.name==='lga')?'lga':model.item!.fields!.some(field=>field.name==='label')?'label':'town',subtitle:model.item!.fields!.some(field=>field.name==='role')?'role':'source',...(model.item!.fields!.some(field=>field.name==='image')?{media:'image'}:{})}}}):defineArrayMember({type:model.item!.kind==='image'?'editorialImage':model.item!.kind})]}:{}),
  });
}
export const projectProfileField=structuredField(models.projectProfile,'profile');
export const programmeDetailsField=structuredField(models.programmeDetails,'details');
export const pageTypes=catalogue.map(page=>defineType({
  name:page.type,title:page.title,type:'document',icon:DocumentTextIcon,
  description:'Edit content without changing the design. Publish to include your changes in the next website release. Figures and staff details must retain an accurate reporting period and source.',
  groups:[...page.groups.map(group=>({...group,title:group.name==='intro'?'Search & general text':group.title,default:group.name===(page.groups.find(group=>group.name!=='intro')?.name||'intro')})),...(page.route in models.pages?[{name:'details',title:detailTitles[page.route]||'Detailed content'}]:[])],
  fields:[...page.fields.map(field=>field.kind==='image'?defineField({name:field.name,title:field.title,group:field.group,type:'editorialImage',description:'Replace the photo and describe it accurately. Use approved images with permission.'}):defineField({name:field.name,title:field.title,group:field.group,type:['paragraph','text','caption'].includes(field.kind)?'text':'string',initialValue:typeof field.initialValue==='string'?field.initialValue:'',validation:r=>r.max(field.kind==='heading'?160:3000)})),
    ...(page.route==='projects'?[defineField({name:'cmsManagedProjects',type:'boolean',hidden:true,readOnly:true})]:[]),
    ...(page.route in models.pages?[{...structuredField((models.pages as Record<string,Model>)[page.route],'data'),title:'Detailed content',group:'details'}]:[])],
  preview:{prepare:()=>({title:page.title,subtitle:`/${page.route}/`})},
}));
