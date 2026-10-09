// Content Lake writes can bypass Studio validation. Validate at rendering too.
export function editorialUrl(value:unknown):string|undefined {
  if(typeof value!=='string' || !value || /[\u0000-\u0020\u007f\\]/.test(value) || /%0[ad]/i.test(value))return;
  if(value.startsWith('/') && !value.startsWith('//'))return value;
  if(value.startsWith('#'))return value;
  try{
    const url=new URL(value);
    if(url.protocol==='https:' && !url.username && !url.password && (!url.port || url.port==='443'))return url.href;
    if(url.protocol==='mailto:' && /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(url.pathname))return url.href;
  }catch{}
}
