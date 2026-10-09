import {sharepointStorage} from '../lib/sharepoint-storage.mjs';
try {
  const storage=sharepointStorage();
  if(!storage)throw new Error('Configuration unavailable.');
  await storage.verify();
  console.log('Verified: workspace app can read the exact JDPI Staff Documents site and document library.');
  console.log('No files created, enumerated, moved or deleted. No credentials printed.');
}catch(error){
  console.error('SharePoint verification did not complete. Check the approved app grant and private Microsoft configuration. No credentials printed.');
  if(['application-token','selected-site','document-library','target-verification'].includes(error?.stage))console.error(`Stage: ${error.stage}`);
  if(Number.isInteger(error?.status))console.error(`HTTP status: ${error.status}`);
  process.exitCode=1;
}
