import {defineConfig} from 'sanity';
import {structureTool} from 'sanity/structure';
import {schemaTypes} from './schema-types';
import {structure,defaultDocumentNode,singletonTypes} from './structure';

const projectId=process.env.SANITY_STUDIO_PROJECT_ID;
const dataset=process.env.SANITY_STUDIO_DATASET||'production';
if(!projectId)throw new Error('Set SANITY_STUDIO_PROJECT_ID in studio/.env to connect JDPI’s Sanity project. See docs/SETUP.md.');
export default defineConfig({
  name:'jdpi',title:'JDPI Maiduguri · Website editor',projectId,dataset,
  plugins:[structureTool({structure,defaultDocumentNode})],schema:{types:schemaTypes,templates:templates=>templates.filter(template=>!singletonTypes.has(template.schemaType))},
  document:{actions:(actions,context)=>singletonTypes.has(context.schemaType)?actions.filter(action=>!['delete','duplicate','unpublish'].includes(action.action||'')):actions},
});
