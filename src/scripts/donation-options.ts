import {donationAction,type GatewayId} from '../lib/donations';
const giving=document.querySelector<HTMLElement>('[data-donation-panel]');
if(giving){
  const cards=Array.from(giving.querySelectorAll<HTMLElement>('[data-gateway-card]'));
  const frequencyRadios=Array.from(giving.querySelectorAll<HTMLInputElement>('[name="giving-frequency"]'));
  const gatewayRadios=Array.from(giving.querySelectorAll<HTMLInputElement>('[name="donation-gateway"]'));
  const action=giving.querySelector<HTMLAnchorElement>('[data-donation-checkout]');
  const actionText=giving.querySelector<HTMLElement>('[data-donation-action]');
  const status=giving.querySelector<HTMLElement>('[data-donation-status]');
  function refresh(){
    const monthly=frequencyRadios.find(input=>input.checked)?.value==='monthly';
    const selected=cards.find(card=>card.querySelector<HTMLInputElement>('input')?.checked)||cards[0];
    cards.forEach(card=>{
      const url=monthly?card.dataset.monthlyUrl:card.dataset.onceUrl;
      const providerState=card.querySelector<HTMLElement>('[data-provider-state]');
      if(providerState)providerState.textContent=url?'Hosted checkout':'Awaiting activation';
    });
    if(!selected||!action||!actionText||!status)return;
    const id=selected.querySelector<HTMLInputElement>('input')?.value as GatewayId;
    if(id!=='paystack'&&id!=='flutterwave')return;
    const next=donationAction({id,name:selected.dataset.providerName||id,oneTimeUrl:selected.dataset.onceUrl,monthlyUrl:selected.dataset.monthlyUrl},monthly?'monthly':'once',giving?.dataset.email||'');
    action.href=next.href;
    if(next.ready)action.rel='noopener noreferrer';else action.removeAttribute('rel');
    actionText.textContent=next.label;status.textContent=next.message;
  }
  [...frequencyRadios,...gatewayRadios].forEach(input=>input.addEventListener('change',refresh));
  refresh();giving.querySelector('[data-donation-enhancement]')?.removeAttribute('hidden');
}
