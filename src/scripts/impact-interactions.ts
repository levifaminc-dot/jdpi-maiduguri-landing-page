// Progressively enhance server-rendered content; everything is readable without JS.
document.querySelectorAll<HTMLElement>('[data-tabs]').forEach(group=>{
  const tabs=Array.from(group.querySelectorAll<HTMLButtonElement>('[data-tab]'));
  const panels=Array.from(group.querySelectorAll<HTMLElement>('[data-panel]'));
  function select(index:number,focus=false){
    tabs.forEach((tab,i)=>{tab.setAttribute('aria-selected',String(i===index));tab.tabIndex=i===index?0:-1;});
    panels.forEach((panel,i)=>panel.hidden=i!==index);
    if(focus)tabs[index]?.focus();
  }
  tabs.forEach((tab,index)=>{
    tab.addEventListener('click',()=>select(index));
    tab.addEventListener('keydown',event=>{
      const delta=event.key==='ArrowRight'||event.key==='ArrowDown'?1:event.key==='ArrowLeft'||event.key==='ArrowUp'?-1:0;
      if(delta||event.key==='Home'||event.key==='End'){event.preventDefault();select(event.key==='Home'?0:event.key==='End'?tabs.length-1:(index+delta+tabs.length)%tabs.length,true);}
    });
  });
  select(0);group.classList.add('is-enhanced');
});

document.querySelectorAll<HTMLElement>('[data-state-map]').forEach(map=>{
  const controls=Array.from(map.querySelectorAll<HTMLElement>('[data-lga]'));
  const picker=map.querySelector<HTMLSelectElement>('[data-lga-select]');
  function select(name:string){
    controls.forEach(control=>{
      const active=control.dataset.lga===name;control.classList.toggle('is-active',active);
      if(control.matches('button,[role="button"]'))control.setAttribute('aria-pressed',String(active));
    });
    const label=map.querySelector<HTMLElement>('[data-selected-lga]');if(label)label.textContent=name==='MMC'?'Maiduguri Municipal Council (MMC)':name;
    map.querySelectorAll<HTMLElement>('[data-lga-activity]').forEach(panel=>panel.hidden=panel.dataset.lgaActivity!==name);
    if(picker)picker.value=name;
  }
  controls.forEach(control=>{
    control.addEventListener('click',()=>{if(control.dataset.lga)select(control.dataset.lga);});
    if(control.tagName.toLowerCase()!=='button')control.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();if(control.dataset.lga)select(control.dataset.lga);}});
  });
  picker?.addEventListener('change',()=>select(picker.value));
  map.querySelector('[data-lga-picker]')?.removeAttribute('hidden');
  const initial=map.querySelector<HTMLElement>('.im-lga-list .is-active')?.dataset.lga;
  if(initial)select(initial);
});
