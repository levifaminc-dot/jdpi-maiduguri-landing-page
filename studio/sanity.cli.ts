import {defineCliConfig} from 'sanity/cli';
export default defineCliConfig({
  api:{projectId:process.env.SANITY_STUDIO_PROJECT_ID,dataset:process.env.SANITY_STUDIO_DATASET||'production'},
  typegen:{enabled:true,path:'../src/**/*.{ts,astro}',schema:'schema.json',generates:'../sanity.types.ts',overloadClientMethods:true},
});
