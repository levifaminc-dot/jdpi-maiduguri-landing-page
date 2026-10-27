const listing=document.querySelector<HTMLElement>('[data-career-listing]');
if(listing){
  const controls=listing.querySelector<HTMLElement>('[data-career-controls]');
  const search=listing.querySelector<HTMLInputElement>('[data-career-search]');
  const location=listing.querySelector<HTMLSelectElement>('[data-career-location]');
  const engagement=listing.querySelector<HTMLSelectElement>('[data-career-engagement]');
  const count=listing.querySelector<HTMLElement>('[data-career-count]');
  const empty=listing.querySelector<HTMLElement>('[data-career-filter-empty]');
  const cards=[...listing.querySelectorAll<HTMLElement>('[data-career-job]')];
  const lagosParts=Object.fromEntries(new Intl.DateTimeFormat('en-GB',{timeZone:'Africa/Lagos',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date()).map(part=>[part.type,part.value]));
  const today=`${lagosParts.year}-${lagosParts.month}-${lagosParts.day}`;
  const available=cards.filter(card=>(card.dataset.deadline||'')>=today).length;
  function update(){
    const query=(search?.value||'').trim().toLowerCase();
    let visible=0;
    for(const card of cards){
      card.hidden=(card.dataset.deadline||'')<today || !!query&&!card.dataset.search?.includes(query) || !!location?.value&&card.dataset.location!==location.value || !!engagement?.value&&card.dataset.engagement!==engagement.value;
      if(!card.hidden)visible++;
    }
    if(count)count.textContent=`${visible} open ${visible===1?'opportunity':'opportunities'}`;
    if(empty){
      empty.hidden=visible!==0;
      if(!available){
        const title=empty.querySelector('h3');
        const message=empty.querySelector('p');
        if(title)title.textContent='No open roles right now.';
        if(message)message.textContent='New opportunities will appear here when JDPI publishes them.';
        empty.querySelector('button')?.remove();
      }
    }
  }
  search?.addEventListener('input',update);
  location?.addEventListener('change',update);
  engagement?.addEventListener('change',update);
  listing.querySelector('[data-career-reset]')?.addEventListener('click',()=>{if(search)search.value='';if(location)location.value='';if(engagement)engagement.value='';update();search?.focus();});
  if(controls&&available)controls.hidden=false;
  update();
}
