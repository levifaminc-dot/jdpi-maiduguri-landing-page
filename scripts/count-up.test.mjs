import test from 'node:test';
import assert from 'node:assert/strict';
import {parseCount,countFrame} from '../src/lib/count-up.ts';

test('count-up preserves approved totals, separators, units and decimal precision',()=>{
  for(const value of ['250,000+','500+','30+','3','48,016','98.5%','£1,250.00','3.5M']) {
    const count=parseCount(value);
    assert.ok(count);
    assert.equal(countFrame(count,1),value);
    assert.equal(countFrame(count,2),value);
  }
  assert.equal(countFrame(parseCount('250,000+'),0),'0+');
  assert.equal(countFrame(parseCount('98.5%'),0),'0.0%');
  assert.equal(countFrame(parseCount('3'),0.5),'2');
  assert.equal(countFrame(parseCount('3'),0.99),'2');
  for(const value of ['Not provided','20–30','2025 / 2026','-10','1,25','Infinity','99999999999999999999']) assert.equal(parseCount(value),null);
});

// Isolated browser-API doubles, never a real browser or staff database.
globalThis.document={querySelectorAll:()=>[]};
const {initCountUp}=await import('../src/scripts/count-up.ts');
function harness({reduce=false,supported=true}={}) {
  const elements=['250,000+','500+','30+','3'].map(value=>({dataset:{countFinal:value},textContent:value}));
  const callbacks=new Map();let id=0,observer,change;
  const media={matches:reduce,addEventListener:(_,callback)=>{change=callback;}};
  class Observer {
    observed=new Set();
    constructor(callback,options){this.callback=callback;this.options=options;observer=this;}
    observe(element){this.observed.add(element);}
    unobserve(element){this.observed.delete(element);}
    disconnect(){this.observed.clear();}
  }
  globalThis.window={matchMedia:()=>media,...(supported?{IntersectionObserver:Observer}:{})};
  globalThis.IntersectionObserver=Observer;
  globalThis.requestAnimationFrame=callback=>{callbacks.set(++id,callback);return id;};
  globalThis.cancelAnimationFrame=frame=>callbacks.delete(frame);
  return {elements,callbacks,root:{querySelectorAll:()=>elements},get observer(){return observer;},get change(){return change;},step(now){const pending=[...callbacks.values()];callbacks.clear();pending.forEach(callback=>callback(now));}};
}
test('counts start at zero, animate only on entry, end exactly and never replay',()=>{
  const h=harness();initCountUp(h.root);
  assert.deepEqual(h.elements.map(e=>e.textContent),['0+','0+','0+','0']);
  assert.equal(h.callbacks.size,0);
  h.observer.callback(h.elements.map(target=>({target,isIntersecting:false})));
  assert.equal(h.callbacks.size,0);
  const started=performance.now();
  h.observer.callback(h.elements.map(target=>({target,isIntersecting:true})));
  assert.equal(h.observer.observed.size,0);
  h.step(started+600);
  assert.ok(Number(h.elements[0].textContent.replace(/[, +]/g,''))>0);
  assert.notEqual(h.elements[0].textContent,'250,000+');
  h.step(started+2000);
  assert.deepEqual(h.elements.map(e=>e.textContent),['250,000+','500+','30+','3']);
  assert.ok(h.elements.every(e=>e.dataset.countState==='complete'));
  h.observer.callback(h.elements.map(target=>({target,isIntersecting:true})));
  assert.equal(h.callbacks.size,0);
});
test('reduced motion and unsupported observation keep the final totals',()=>{
  for(const options of [{reduce:true},{supported:false}]) {
    const h=harness(options);initCountUp(h.root);
    assert.deepEqual(h.elements.map(e=>e.textContent),['250,000+','500+','30+','3']);
    assert.equal(h.observer,undefined);
  }
});
test('switching to reduced motion cancels pending frames and restores totals',()=>{
  const h=harness();initCountUp(h.root);
  h.observer.callback([{target:h.elements[0],isIntersecting:true}]);
  assert.equal(h.callbacks.size,1);
  h.change({matches:true});
  assert.equal(h.callbacks.size,0);
  assert.equal(h.observer.observed.size,0);
  assert.deepEqual(h.elements.map(e=>e.textContent),['250,000+','500+','30+','3']);
});
