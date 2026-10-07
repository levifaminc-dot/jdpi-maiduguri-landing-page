// These are native section links, not tab panels: all About content stays visible.
const sectionNav=document.querySelector<HTMLElement>('.ab-section-nav');
const navTrack=sectionNav?.querySelector<HTMLElement>('.ab-shell');
const siteHeader=document.querySelector<HTMLElement>('#main-nav');
const links=Array.from(sectionNav?.querySelectorAll<HTMLAnchorElement>('a') || []);
const headings=links.map(link=>document.getElementById(link.hash.slice(1)));
let activeLink:HTMLAnchorElement|undefined;
let scheduled=false;

function updateSectionNavigation(){
  if(!sectionNav||!navTrack||!links.length)return;
  const headerHeight=siteHeader?.getBoundingClientRect().height || 76;
  const navHeight=sectionNav.getBoundingClientRect().height;
  document.body.style.setProperty('--ab-header-height',`${headerHeight}px`);
  document.body.style.setProperty('--ab-section-nav-height',`${navHeight}px`);
  const threshold=headerHeight+navHeight+24;
  let index=0;
  headings.forEach((heading,i)=>{if(heading && heading.getBoundingClientRect().top<=threshold)index=i;});
  const current=links[index];
  if(current===activeLink)return;
  links.forEach(link=>link.removeAttribute('aria-current'));
  current.setAttribute('aria-current','location');
  activeLink=current;
}
function scheduleUpdate(){
  if(scheduled)return;
  scheduled=true;
  requestAnimationFrame(()=>{scheduled=false;updateSectionNavigation();});
}
window.addEventListener('scroll',scheduleUpdate,{passive:true});
window.addEventListener('resize',scheduleUpdate);
window.addEventListener('hashchange',scheduleUpdate);
window.addEventListener('load',scheduleUpdate);
document.fonts.ready.then(scheduleUpdate);
updateSectionNavigation();
