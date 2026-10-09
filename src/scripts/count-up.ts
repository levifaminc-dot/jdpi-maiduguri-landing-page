import {parseCount,countFrame} from '../lib/count-up.ts';

export function initCountUp(root:ParentNode=document) {
  const elements=Array.from(root.querySelectorAll<HTMLElement>('[data-count-up]'));
  if(!elements.length) return;
  const motion=window.matchMedia('(prefers-reduced-motion: reduce)');
  // Keep the server-rendered final values if motion is reduced or observation is unavailable.
  if(motion.matches || !('IntersectionObserver' in window)) return;
  const frames=new Map<HTMLElement,number>();
  let stopped=false;
  const observer=new IntersectionObserver(entries=>{
    for(const entry of entries) {
      if(!entry.isIntersecting || stopped) continue;
      const element=entry.target as HTMLElement;
      if(element.dataset.countState!=='waiting') continue;
      observer.unobserve(element);
      const count=parseCount(element.dataset.countFinal || '');
      if(!count) continue;
      element.dataset.countState='running';
      const started=performance.now();
      const tick=(now:number)=>{
        if(stopped) return;
        const progress=Math.min(1,(now-started)/1800);
        element.textContent=countFrame(count,progress);
        if(progress<1) frames.set(element,requestAnimationFrame(tick));
        else {frames.delete(element);element.dataset.countState='complete';}
      };
      frames.set(element,requestAnimationFrame(tick));
    }
  },{threshold:0.35});
  for(const element of elements) {
    const count=parseCount(element.dataset.countFinal || '');
    if(!count || element.dataset.countState) continue;
    element.textContent=countFrame(count,0);
    element.dataset.countState='waiting';
    observer.observe(element);
  }
  motion.addEventListener('change',event=>{
    if(!event.matches) return;
    stopped=true;
    observer.disconnect();
    frames.forEach(frame=>cancelAnimationFrame(frame));
    frames.clear();
    for(const element of elements) {
      element.textContent=element.dataset.countFinal || element.textContent;
      element.dataset.countState='complete';
    }
  });
}
initCountUp();
