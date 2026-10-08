import type {Metadata} from 'next';
import './globals.css';
export const metadata: Metadata = {title:'JDPI Staff Workspace',description:'JDPI staff workspace - Microsoft sign-in setup pending.',robots:{index:false,follow:false}};
export default function RootLayout({children}:{children:React.ReactNode}) {return <html lang="en"><body>{children}</body></html>;}
