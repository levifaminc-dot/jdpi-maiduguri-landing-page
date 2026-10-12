import 'server-only';
import {readFile,stat} from 'node:fs/promises';
import path from 'node:path';
import {allowLocalPreview} from './preview-policy.mjs';
import {parseDirectoryCsv,prepareDirectoryPreview} from './directory-import.mjs';

export async function localDirectoryPreview(host:string|null) {
  // Enforce before touching the private file. This cannot run on Vercel or in a
  // production build, even if an operator accidentally sets the preview path.
  if(!allowLocalPreview({nodeEnv:process.env.NODE_ENV,vercel:process.env.VERCEL,host}))return null;
  const source=process.env.STAFF_DIRECTORY_PREVIEW_CSV;
  if(!source || !path.isAbsolute(source) || path.extname(source).toLowerCase()!=='.csv')return null;
  if((await stat(source)).size>1024*1024)throw new Error('The preview export exceeds 1 MB.');
  return prepareDirectoryPreview(parseDirectoryCsv(await readFile(source,'utf8')));
}
