import catalogue from '../../content/page-fields.json' with {type:'json'};
import models from '../../content/structured-fields.json' with {type:'json'};
type Model={kind:string;name?:string;fields?:Model[];item?:Model};
const imageProjection='{"url":asset->url,"assetId":asset._ref,alt}';
// Projection names come only from the version-controlled schema catalogue,
// never from visitor input. Do not export arbitrary Studio documents.
export function projection(model:Model):string{
  if(model.kind==='image')return imageProjection;
  if(model.kind==='array')return `[]${projection(model.item!)}`;
  if(model.kind==='object')return `{${model.fields!.map(field=>`${field.name}${projection(field)}`).join(',')}}`;
  return '';
}
export const pageDocumentTypes=catalogue.map(page=>page.type);
export const pageProjection=catalogue.map(page=>`*[_id==${JSON.stringify(page.type)}][0]{_id,"fields":{${page.fields.map(field=>field.name+(field.kind==='image'?imageProjection:'')).join(',')}},data${page.route in models.pages?projection((models.pages as Record<string,Model>)[page.route]):''}}`).join(',');
export const profileProjection=projection(models.projectProfile);
export const detailsProjection=projection(models.programmeDetails);
