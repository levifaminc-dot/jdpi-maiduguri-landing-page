import {headers} from 'next/headers';
import {notFound} from 'next/navigation';
import {allowLocalPreview} from '../../lib/preview-policy.mjs';
import Workspace from '../../components/Workspace';
export const dynamic = 'force-dynamic';
export default async function PreviewPage({searchParams}:{searchParams:Promise<{role?:string}>}) {
  const h = await headers();
  if (!allowLocalPreview({nodeEnv:process.env.NODE_ENV,vercel:process.env.VERCEL,host:h.get('host')})) notFound();
  const params = await searchParams;
  return <Workspace initialRole={params.role === 'Admin' ? 'Admin' : 'Staff'}/>;
}
