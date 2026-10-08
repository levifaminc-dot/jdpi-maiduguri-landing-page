import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {allowLocalPreview} from '../../../../lib/preview-policy.mjs';
export const runtime = 'nodejs';
export async function GET(request:Request,{params}:{params:Promise<{asset:string}>}) {
  if (!allowLocalPreview({nodeEnv:process.env.NODE_ENV,vercel:process.env.VERCEL,host:request.headers.get('host')})) return new Response('Not found',{status:404});
  const {asset} = await params;
  const assets:Record<string,[string,string]> = {
    'guide.pdf':[path.join(process.cwd(),'..','output','pdf','staff-workspace-sample.pdf'),'application/pdf'],
    'logo.avif':[path.join(process.cwd(),'..','public','assets','logo.avif'),'image/avif'],
  };
  const match = assets[asset]; if (!match) return new Response('Not found',{status:404});
  // Development-only source fixtures must not pull the whole marketing repo into a deployment.
  try {const body = await readFile(/* turbopackIgnore: true */ match[0]); return new Response(body,{headers:{'Content-Type':match[1],'Cache-Control':'private, no-store','Content-Disposition':'inline','X-Content-Type-Options':'nosniff'}});}
  catch {return new Response('Sample unavailable',{status:404});}
}
