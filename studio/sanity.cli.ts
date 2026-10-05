import {defineCliConfig} from 'sanity/cli';
import settings from '../config/sanity.json';
export default defineCliConfig({
  api:{projectId:process.env.SANITY_STUDIO_PROJECT_ID||settings.projectId,dataset:process.env.SANITY_STUDIO_DATASET||settings.dataset},
  deployment:{appId:'h54itqdo1aqfvh4caz97kmun'},
  typegen:{enabled:true,path:'../src/**/*.{ts,astro}',schema:'schema.json',generates:'../sanity.types.ts',overloadClientMethods:true},
});
