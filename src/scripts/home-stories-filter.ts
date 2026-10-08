export {};
const controls=document.querySelector<HTMLElement>('[data-home-story-filters]');
const buttons=Array.from(controls?.querySelectorAll<HTMLButtonElement>('[data-filter]')||[]);
const cards=Array.from(document.querySelectorAll<HTMLElement>('#stories-carousel .story-card'));
const count=document.querySelector<HTMLElement>('[data-home-story-count]');
function select(value:string){
  let visible=0;
  cards.forEach(card=>{card.hidden=value!=='all'&&card.dataset.type!==value;if(!card.hidden)visible++;});
  buttons.forEach(button=>{const active=button.dataset.filter===value;button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active));});
  if(count)count.textContent=`${visible} ${visible===1?'update':'updates'} shown`;
  const carousel=document.querySelector<HTMLElement>('#stories-carousel');
  if(carousel)carousel.scrollLeft=0;
}
buttons.forEach(button=>button.addEventListener('click',()=>select(button.dataset.filter||'all')));
controls?.removeAttribute('hidden');
select('all');
