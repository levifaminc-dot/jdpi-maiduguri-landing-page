import catalogue from '../content/page-fields.json' with {type:'json'};
import models from '../content/structured-fields.json' with {type:'json'};
import {safeEditorialImage} from '../src/lib/page-editor.ts';
import {safeResourceUrl} from '../src/lib/resources.ts';
export function validatePageContent(content,asset){
  function shape(value,model,label){
    if(value==null){if(model.required)throw Error(`${label} is required.`);return;}
    if(model.kind==='image'){asset(value);if(!value.url||!value.alt||!safeEditorialImage(value.url))throw Error(`${label} needs an approved image and description.`);return;}
    if(model.kind==='array'){
      if(!Array.isArray(value)||value.length>100)throw Error(`${label} must be a list of up to 100 entries.`);
      value.forEach((item,index)=>shape(item,model.item,`${label}[${index}]`));return;
    }
    if(model.kind==='object'){
      if(typeof value!=='object'||Array.isArray(value))throw Error(`${label} must be structured content.`);
      for(const field of model.fields)shape(value[field.name],field,`${label}.${field.name}`);return;
    }
    if(typeof value!==(model.kind==='text'?'string':model.kind))throw Error(`${label} has the wrong content type.`);
    if(model.required&&typeof value==='string'&&!value.trim())throw Error(`${label} needs text.`);
    if(model.kind==='number'&&(!Number.isInteger(value)||value<0))throw Error(`${label} must be a non-negative whole number.`);
    if(['slug','project'].includes(model.name)&&value&&!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value))throw Error(`${label} has an invalid linked page address.`);
    if(['url','fileUrl','onlineUrl'].includes(model.name)&&value&&!safeResourceUrl(value))throw Error(`${label} has an unsafe publication link.`);
  }
  const ids=new Set();
  for(const page of content.pages||[]){
    const definition=catalogue.find(item=>item.type===page._id);
    if(!definition||ids.has(page._id))throw Error('Unknown or duplicate editorial page.');
    ids.add(page._id);
    for(const field of definition.fields){
      const value=page.fields?.[field.name];if(value==null)continue;
      if(field.kind==='image'){asset(value);if(!safeEditorialImage(value.url))throw Error(`Invalid page image: ${page._id}.${field.name}`);}
      else if(typeof value!=='string'||value.length>3000)throw Error(`Invalid page text: ${page._id}.${field.name}`);
    }
    if(page.data&&models.pages[definition.route])shape(page.data,models.pages[definition.route],page._id);
  }
  for(const project of content.projects||[])if(project.profile)shape(project.profile,models.projectProfile,`Project ${project.slug}`);
  for(const programme of content.programmes||[])if(programme.details)shape(programme.details,models.programmeDetails,`Programme ${programme.slug}`);
}
