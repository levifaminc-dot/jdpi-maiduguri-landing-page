import {copyFile,cp,mkdir} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
await mkdir(path.join(root,'public'),{recursive:true});
const pdfRoot = path.dirname(path.dirname(fileURLToPath(import.meta.resolve('pdfjs-dist/package.json'))));
const packageRoot = path.join(pdfRoot,'pdfjs-dist');
await copyFile(path.join(packageRoot,'build','pdf.worker.min.mjs'),path.join(root,'public','pdf.worker.min.mjs'));
await cp(path.join(packageRoot,'standard_fonts'),path.join(root,'public','pdf-standard-fonts'),{recursive:true});
