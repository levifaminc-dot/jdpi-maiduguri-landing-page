// Non-invasive, unauthenticated checks of the organisation's own sites only.
// Never print cookies, tokens, response bodies, private files or account names.
const origins=['https://jdpi-maiduguri-landing-page.vercel.app','https://studio.jdpimaiduguri.org','https://staff.jdpimaiduguri.org','https://jdpimaiduguri.org','https://www.jdpimaiduguri.org'];
const keys=['content-security-policy','x-frame-options','x-content-type-options','referrer-policy','permissions-policy','strict-transport-security','cache-control'];
for(const origin of origins){
  try{
    const response=await fetch(origin,{redirect:'manual',signal:AbortSignal.timeout(20000)});
    const headers=Object.fromEntries(keys.map(key=>[key,response.headers.get(key)]));
    console.log(JSON.stringify({origin,status:response.status,headers}));
    await response.body?.cancel();
  }catch{console.log(JSON.stringify({origin,check:'unavailable'}));}
}
for(const pathname of ['/api/membership','/api/announcements','/api/documents','/api/documents/fdd89c0c-e6b2-46b7-b4e9-eb824d9139f1/file','/api/auth/get-session','/preview','/api/preview-assets/sample.pdf']){
  try{
    const response=await fetch(`https://staff.jdpimaiduguri.org${pathname}`,{redirect:'manual',signal:AbortSignal.timeout(20000)});
    console.log(JSON.stringify({staffPath:pathname,status:response.status,cache:response.headers.get('cache-control'),crossOrigin:response.headers.get('access-control-allow-origin')}));
    await response.body?.cancel();
  }catch{console.log(JSON.stringify({staffPath:pathname,check:'unavailable'}));}
}
// Cross-origin writes must be refused BEFORE authentication or mutation.
for(const pathname of ['/api/membership','/api/announcements','/api/documents','/api/auth/sign-in/social']){
  const response=await fetch(`https://staff.jdpimaiduguri.org${pathname}`,{method:'POST',headers:{origin:'https://invalid.example','content-type':'application/json'},body:'{}',redirect:'manual',signal:AbortSignal.timeout(20000)});
  console.log(JSON.stringify({crossOriginWrite:pathname,status:response.status}));await response.body?.cancel();
  if(response.ok)throw new Error('Unexpected cross-origin success; stop further checks.');
}
