const controls=document.querySelector<HTMLElement>('[data-updates-controls]');
const buttons=Array.from(document.querySelectorAll<HTMLButtonElement>('[data-update-filter]'));
const cards=Array.from(document.querySelectorAll<HTMLElement>('[data-update-category]'));
const search=document.querySelector<HTMLInputElement>('#updates-search');
const count=document.querySelector<HTMLElement>('#updates-count');
const empty=document.querySelector<HTMLElement>('[data-updates-empty]');
const emptyMessage=document.querySelector<HTMLElement>('[data-updates-empty-message]');
let selected='all';
function filterUpdates(){
  const query=(search?.value||'').trim().toLocaleLowerCase();
  let visible=0;
  for(const card of cards){
    card.hidden=(selected!=='all'&&card.dataset.updateCategory!==selected)||!(card.dataset.updateSearch||'').toLocaleLowerCase().includes(query);
    if(!card.hidden)visible++;
  }
  for(const button of buttons)button.setAttribute('aria-pressed',String(button.dataset.updateFilter===selected));
  const label=buttons.find(button=>button.dataset.updateFilter===selected)?.childNodes[0]?.textContent||'All updates';
  if(count)count.textContent=`${visible} ${visible===1?'update':'updates'}${selected==='all'?'':` · ${label}`}${query?` matching “${search?.value.trim()}”`:''}`;
  if(empty)empty.hidden=visible>0;
  if(emptyMessage)emptyMessage.textContent=query?'Try a different search term, or show all updates.':`There are no ${label.toLowerCase()} published here yet. Explore our other updates.`;
}
for(const button of buttons)button.addEventListener('click',()=>{selected=button.dataset.updateFilter||'all';filterUpdates();});
search?.addEventListener('input',filterUpdates);
document.querySelector('[data-updates-reset]')?.addEventListener('click',()=>{selected='all';if(search)search.value='';filterUpdates();buttons[0]?.focus();});
controls?.removeAttribute('hidden');
filterUpdates();
