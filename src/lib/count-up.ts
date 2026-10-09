export function parseCount(value:string) {
  const match=value.match(/^([^\d]*)(\d{1,3}(?:,\d{3})+|\d+)(\.\d+)?([^\d]*)$/);
  if(!match || match[1].includes('-')) return null;
  const target=Number(match[2].replaceAll(',','')+(match[3] || ''));
  const decimals=match[3]?.length ? match[3].length-1 : 0;
  if(!Number.isFinite(target) || decimals>6 || target*10**decimals>Number.MAX_SAFE_INTEGER) return null;
  return {target,decimals,prefix:match[1],suffix:match[4],grouped:match[2].includes(','),original:value};
}
export function countFrame(count:NonNullable<ReturnType<typeof parseCount>>,progress:number) {
  const fraction=Math.min(1,Math.max(0,progress));
  if(fraction===1) return count.original;
  const eased=1-(1-fraction)**3;
  // Floor rather than round so a small total does not finish ahead of the animation.
  const scale=10**count.decimals;
  const number=(Math.floor(count.target*eased*scale)/scale).toFixed(count.decimals);
  const [integer,decimal]=number.split('.');
  const formatted=count.grouped ? integer.replace(/\B(?=(\d{3})+(?!\d))/g,',') : integer;
  return `${count.prefix}${formatted}${decimal===undefined?'':`.${decimal}`}${count.suffix}`;
}
