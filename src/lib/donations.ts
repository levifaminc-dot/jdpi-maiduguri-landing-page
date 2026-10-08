export type GatewayId='paystack'|'flutterwave';
export interface DonationConfig {paystack:{oneTimeUrl:string;monthlyUrl:string};flutterwave:{oneTimeUrl:string;monthlyUrl:string}}
export interface DonationGateway {id:GatewayId;name:string;oneTimeUrl?:string;monthlyUrl?:string}
export function donationAction(gateway:DonationGateway,frequency:'once'|'monthly',email:string){
  const monthly=frequency==='monthly';
  const url=approvedCheckout(monthly?gateway.monthlyUrl:gateway.oneTimeUrl,gateway.id);
  return url?{
    href:url,ready:true,label:`Continue with ${gateway.name}`,
    message:monthly?`Continue to ${gateway.name} to review the recurring amount, billing schedule and cancellation information before authorising monthly giving.`:`Continue to ${gateway.name} to review your gift amount, currency and available payment options.`
  }:{
    href:`mailto:${email}?subject=${encodeURIComponent(`Donation enquiry — ${monthly?'monthly':'one-time'} giving via ${gateway.name}`)}`,ready:false,label:monthly?'Ask about monthly giving':'Ask JDPI about giving',
    message:`${gateway.name}’s ${monthly?'monthly':'one-time'} donation link is not yet available. Contact JDPI for an approved way to give.`
  };
}
/** Accept hosted provider checkouts, never credentials, scripts or provider homepages. */
export function approvedCheckout(value:string|undefined,provider:GatewayId):string|undefined {
  if(!value?.trim())return undefined;
  try {
    const url=new URL(value.trim());const domain=provider==='paystack'?'paystack.com':'flutterwave.com';
    if(url.protocol!=='https:'||url.username||url.password||(url.port&&url.port!=='443')||!(url.hostname===domain||url.hostname.endsWith(`.${domain}`))||url.pathname==='/')return undefined;
    return url.href;
  }catch{return undefined;}
}
export function getDonationGateways(config:DonationConfig,env:Record<string,string|undefined>={},legacyUrl?:string):DonationGateway[] {
  return (['paystack','flutterwave'] as const).map(id=>{
    const prefix=id.toUpperCase();
    const oneTime=env[`PUBLIC_${prefix}_DONATION_URL`]||config[id].oneTimeUrl;
    const monthly=env[`PUBLIC_${prefix}_MONTHLY_DONATION_URL`]||config[id].monthlyUrl;
    for(const value of [oneTime,monthly])if(value?.trim()&&!approvedCheckout(value,id))throw new Error(`Invalid ${id} donation checkout. Use an approved HTTPS link on the provider's domain.`);
    return {id,name:id==='paystack'?'Paystack':'Flutterwave',oneTimeUrl:approvedCheckout(oneTime||legacyUrl,id),monthlyUrl:approvedCheckout(monthly,id)};
  });
}
