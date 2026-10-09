import type {Metadata} from 'next';
import './globals.css';
import './workspace.css';
import './announcements.css';
export const dynamic = 'force-dynamic';
export const metadata: Metadata = {title:'JDPI Staff Workspace',description:'Private workspace for JDPI staff.',robots:{index:false,follow:false}};
export default function RootLayout({children}:{children:React.ReactNode}) {return <html lang="en"><body>{children}</body></html>;}
