import {defineCliConfig} from 'sanity/cli';
import settings from '../config/sanity.json';
// Keep the existing Sanity-hosted editor intact when building/registering Vercel's Studio.
const selfHosted=process.env.VERCEL==='1'||process.env.SANITY_STUDIO_HOSTING==='vercel';
export default defineCliConfig({
  api:{projectId:process.env.SANITY_STUDIO_PROJECT_ID||settings.projectId,dataset:process.env.SANITY_STUDIO_DATASET||settings.dataset},
  deployment:{appId:selfHosted?process.env.SANITY_STUDIO_EXTERNAL_APP_ID:'h54itqdo1aqfvh4caz97kmun',autoUpdates:!selfHosted},
  typegen:{enabled:true,path:'../src/**/*.{ts,astro}',schema:'schema.json',generates:'../sanity.types.ts',overloadClientMethods:true},
});
