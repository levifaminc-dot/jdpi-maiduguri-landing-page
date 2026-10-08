// Native disclosure fallback; progressively enhance to a modal without copying
// content or changing the CMS data. Native dialogs provide focus containment.
document.querySelectorAll<HTMLDetailsElement>('[data-programme-details]').forEach(details=>{
  if(typeof HTMLDialogElement==='undefined'||typeof HTMLDialogElement.prototype.showModal!=='function')return;
  const summary=details.querySelector('summary');
  const content=details.querySelector<HTMLElement>('.pg-detail-content');
  const heading=content?.querySelector<HTMLElement>('h2');
  const group=details.closest<HTMLElement>('[data-programme-tabs]');
  if(!summary||!content||!heading||!group)return;
  const dialog=document.createElement('dialog');
  dialog.id=details.dataset.dialogId!;
  dialog.className=`pg-modal ${details.dataset.programmeTone||''}`;
  dialog.setAttribute('aria-labelledby',heading.id);
  const trigger=document.createElement('button');
  trigger.type='button';trigger.className='pg-button pg-more-trigger';
  trigger.setAttribute('aria-haspopup','dialog');trigger.setAttribute('aria-controls',dialog.id);
  trigger.append(...Array.from(summary.childNodes));
  dialog.append(content);group.append(dialog);details.replaceWith(trigger);
  const close=dialog.querySelector<HTMLButtonElement>('[data-close-programme-dialog]');
  if(close){close.hidden=false;close.addEventListener('click',()=>dialog.close());}
  trigger.addEventListener('click',()=>{
    dialog.showModal();dialog.scrollTop=0;document.body.classList.add('programme-modal-open');heading.focus({preventScroll:true});
  });
  dialog.addEventListener('close',()=>{
    document.body.classList.remove('programme-modal-open');
    if(!trigger.closest<HTMLElement>('[data-programme]')?.hidden)trigger.focus({preventScroll:true});
  });
  const outside=(event:MouseEvent)=>{
    const bounds=dialog.getBoundingClientRect();
    return event.target===dialog&&(event.clientX<bounds.left||event.clientX>bounds.right||event.clientY<bounds.top||event.clientY>bounds.bottom);
  };
  let startedOutside=false;
  dialog.addEventListener('pointerdown',event=>{startedOutside=outside(event);});
  dialog.addEventListener('click',event=>{if(startedOutside&&outside(event))dialog.close();startedOutside=false;});
});
