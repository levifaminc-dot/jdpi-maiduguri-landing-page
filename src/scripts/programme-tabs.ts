// Anchors and all programme panels remain readable when JavaScript is unavailable.
document.querySelectorAll<HTMLElement>('[data-programme-tabs]').forEach(group=>{
  const tabs=Array.from(group.querySelectorAll<HTMLAnchorElement>('[data-programme-tab]'));
  const panels=Array.from(group.querySelectorAll<HTMLElement>('[data-programme]'));
  if(!tabs.length||tabs.length!==panels.length)return;
  const tablist=group.querySelector<HTMLElement>('[data-programme-tablist]');
  tablist?.setAttribute('role','tablist');
  tablist?.setAttribute('aria-label','Choose a programme');
  tablist?.setAttribute('aria-orientation','horizontal');
  tabs.forEach((tab,index)=>{
    tab.setAttribute('role','tab');tab.setAttribute('aria-controls',panels[index].id);
    panels[index].setAttribute('role','tabpanel');panels[index].setAttribute('aria-labelledby',tab.id);panels[index].tabIndex=0;
  });
  function select(index:number,focus=false,updateAddress=false){
    group.querySelectorAll<HTMLDialogElement>('dialog[open]').forEach(dialog=>dialog.close());
    tabs.forEach((tab,i)=>{tab.setAttribute('aria-selected',String(i===index));tab.tabIndex=i===index?0:-1;});
    panels.forEach((panel,i)=>panel.hidden=i!==index);
    if(focus)tabs[index].focus();
    if(updateAddress)history.replaceState(null,'',tabs[index].getAttribute('href')!);
  }
  const addressIndex=()=>panels.findIndex(panel=>`#${panel.id}`===location.hash);
  tabs.forEach((tab,index)=>{
    tab.addEventListener('click',event=>{event.preventDefault();select(index,false,true);});
    tab.addEventListener('keydown',event=>{
      const delta=event.key==='ArrowRight'?1:event.key==='ArrowLeft'?-1:0;
      if(delta||event.key==='Home'||event.key==='End'){event.preventDefault();select(event.key==='Home'?0:event.key==='End'?tabs.length-1:(index+delta+tabs.length)%tabs.length,true,true);}
      if(event.key===' '){event.preventDefault();select(index,false,true);}
    });
  });
  window.addEventListener('hashchange',()=>{const index=addressIndex();if(index>=0)select(index);});
  select(Math.max(0,addressIndex()));group.classList.add('is-enhanced');
});
