import {readFile} from 'node:fs/promises';
import {structuralIssues} from './content-structure.mjs';
const documents=(await readFile('content/documents.ndjson','utf8')).trim().split('\n').filter(Boolean).map(JSON.parse);
const schema=JSON.parse(await readFile('studio/schema.json','utf8'));
const issues=structuralIssues(documents,schema);
if(issues.length)throw Error(`Content structure check failed:\n${issues.join('\n')}`);
console.log(`Raw content structure valid: ${documents.filter(doc=>!doc._type.startsWith('sanity.')).length} editorial documents; array types, fields, keys and references checked.`);
