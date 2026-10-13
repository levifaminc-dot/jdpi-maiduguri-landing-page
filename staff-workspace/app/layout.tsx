import type {Metadata} from 'next';
import {DM_Sans, Montserrat} from 'next/font/google';
import './globals.css';
import './workspace.css';
import './announcements.css';
import './documents.css';
import './directory.css';
import './planner.css';
import './workspace-refresh.css';
import './typography.css';
const dmSans = DM_Sans({subsets:['latin'],weight:['400','500','600','700'],variable:'--font-dm-sans',display:'swap'});
const montserrat = Montserrat({subsets:['latin'],weight:['400','500','600','700','800','900'],variable:'--font-montserrat',display:'swap'});
export const dynamic = 'force-dynamic';
export const metadata: Metadata = {title:'JDPI Staff Workspace',description:'Private workspace for JDPI staff.',robots:{index:false,follow:false}};
export default function RootLayout({children}:{children:React.ReactNode}) {return <html lang="en" className={`${dmSans.variable} ${montserrat.variable}`}><body>{children}</body></html>;}
