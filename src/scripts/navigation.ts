// The full-screen mobile navigation acts as a modal while it is open.
export {};
const menuButton=document.querySelector<HTMLButtonElement>('#menu-toggle');
const nav=document.querySelector<HTMLElement>('#nav-links');
const desktop=matchMedia('(min-width:1101px)');
const previousInert=new Map<HTMLElement,boolean>();
const menuIsOpen=()=>nav?.classList.contains('open')===true;
function focusableControls(){
  return [...(nav?.querySelectorAll<HTMLElement>('a[href],button:not([disabled])')||[]),...(menuButton?[menuButton]:[])]
    .filter(element=>element.getClientRects().length>0&&!element.closest('[inert]'));
}
function closeMenu(restoreFocus=true){
  nav?.classList.remove('open');
  menuButton?.setAttribute('aria-expanded','false');
  menuButton?.setAttribute('aria-label','Open navigation');
  if(menuButton)menuButton.textContent='☰';
  document.body.classList.remove('menu-open');
  previousInert.forEach((wasInert,element)=>element.inert=wasInert);
  previousInert.clear();
  nav?.querySelectorAll<HTMLElement>('[data-nav-group]').forEach(group=>{
    group.dataset.open='false';group.querySelector('button')?.setAttribute('aria-expanded','false');
  });
  if(restoreFocus&&!desktop.matches)menuButton?.focus({preventScroll:true});
}
function openMenu(){
  if(!nav||!menuButton||desktop.matches)return;
  nav.classList.add('open');menuButton.setAttribute('aria-expanded','true');
  menuButton.setAttribute('aria-label','Close navigation');menuButton.textContent='×';
  document.body.classList.add('menu-open');
  document.querySelectorAll<HTMLElement>('body>main,body>footer,body>.skip,#main-nav .brand,#main-nav .donate-btn').forEach(element=>{
    previousInert.set(element,element.inert);element.inert=true;
  });
  focusableControls()[0]?.focus({preventScroll:true});
}
menuButton?.addEventListener('click',()=>menuIsOpen()?closeMenu():openMenu());
nav?.querySelectorAll('a').forEach(link=>link.addEventListener('click',()=>{if(menuIsOpen())closeMenu(false);}));
document.addEventListener('keydown',event=>{
  if(!menuIsOpen())return;
  if(event.key==='Escape'){event.preventDefault();closeMenu();return;}
  if(event.key!=='Tab')return;
  const controls=focusableControls();const first=controls[0],last=controls.at(-1);
  if(!first||!last)return;
  if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
  else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
});
document.addEventListener('focusin',event=>{
  if(menuIsOpen()&&event.target!==menuButton&&!nav?.contains(event.target as Node))focusableControls()[0]?.focus();
});
desktop.addEventListener('change',()=>{if(desktop.matches&&menuIsOpen()){
  closeMenu(false);nav?.querySelector<HTMLAnchorElement>('a[href]')?.focus({preventScroll:true});
}});
