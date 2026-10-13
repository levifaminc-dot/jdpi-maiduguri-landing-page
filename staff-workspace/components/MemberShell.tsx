import Link from 'next/link';
import Icon from './Icon';
import {MicrosoftSignOut} from './MicrosoftSignIn';
import {workspaceNavigation} from '../lib/workspace-ui.mjs';

export default function MemberShell({name,role,page,children}:{name:string;role:string;page:string;children:React.ReactNode}) {
  const taskPilot=process.env.PLANNER_PILOT_ENABLED==='true' || (process.env.NODE_ENV==='development' && !process.env.VERCEL);
  const links=[...workspaceNavigation(role),...(taskPilot?[{href:'/workspace/tasks',label:'Operations tasks',icon:'tasks'}]:[]),...(process.env.STAFF_TAGGING_ENABLED==='true'?[{href:'/workspace/departments',label:'Departments',icon:'users'}]:[])];
  return <div className="ws-shell">
    <a className="ws-skip" href="#workspace-content">Skip to main content</a>
    <aside className="ws-sidebar">
      <Link className="ws-brand" href="/workspace" aria-label="JDPI staff workspace dashboard"><img src="/brand/jdpi-logo.avif" alt="JDPI" width="130" height="51"/><span>Staff workspace</span></Link>
      <p className="ws-nav-label">YOUR WORKSPACE</p>
      <nav className="ws-nav" aria-label="Workspace navigation">{links.map(link=><Link key={link.href} href={link.href} prefetch={false} aria-current={page===link.label?'page':undefined}><Icon name={link.icon}/><span>{link.label}</span></Link>)}</nav>
      <div className="ws-sidebar-note"><Icon name="heart"/><strong>One team. A shared purpose.</strong><p>A space for the people behind our work.</p></div>
      <div className="ws-sidebar-footer"><Icon name="shield"/><span>Private JDPI workspace<br/>Microsoft work-account sign-in</span></div>
    </aside>
    <div className="ws-main-shell">
      <header className="ws-topbar"><div><span className="ws-top-title">{page}</span><span className="ws-private-label"><Icon name="shield"/>Private workspace</span></div><div className="ws-account"><span className="ws-avatar" aria-hidden="true">{name.trim().split(/\s+/).slice(0,2).map(word=>word[0]).join('').toUpperCase()}</span><span className="ws-account-name"><strong>{name}</strong><small>{role==='ADMIN'?'Administrator':'Staff member'}</small></span><MicrosoftSignOut compact/></div></header>
      <main id="workspace-content" className="ws-content" tabIndex={-1}>{children}</main>
      <footer className="ws-footer"><span>Justice Development and Peace Initiative</span><span>Upholding the dignity of every person.</span></footer>
    </div>
  </div>;
}

export function PageHeading({eyebrow,title,description,action}:{eyebrow:string;title:string;description:string;action?:React.ReactNode}) {
  return <div className="ws-page-heading"><div><p className="ws-eyebrow">{eyebrow}</p><h1>{title}</h1><p>{description}</p></div>{action}</div>;
}
