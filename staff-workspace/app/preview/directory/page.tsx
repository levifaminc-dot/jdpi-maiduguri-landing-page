import {headers} from 'next/headers';
import {notFound} from 'next/navigation';
import {localDirectoryPreview} from '../../../lib/directory-preview';
import DirectoryPreview from '../../../components/DirectoryPreview';
export const dynamic='force-dynamic';
export default async function DirectoryPreviewPage() {
  let data;
  try{data=await localDirectoryPreview((await headers()).get('host'));}catch{return <main className="ws-directory-unavailable"><h1>Directory preview unavailable</h1><p>Check the local Microsoft export. No accounts have been imported or changed.</p></main>;}
  if(!data)notFound();
  return <DirectoryPreview initialProfiles={data.profiles} summary={data.summary}/>;
}
