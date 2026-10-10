import {reportSocials} from '../data/socials.ts';

export type SocialIconName='facebook'|'instagram'|'x'|'linkedin'|'youtube';
type SocialLink={label:string;url:string};
const platforms:Record<string,SocialIconName>={
  'facebook.com':'facebook','instagram.com':'instagram','x.com':'x',
  'twitter.com':'x','linkedin.com':'linkedin','youtube.com':'youtube','youtu.be':'youtube',
};

// Use destinations, not editable labels, to choose the correct platform icon.
export function socialPlatform(url:string):string {
  const hostname=new URL(url).hostname.replace(/^www\./,'');
  return platforms[hostname] || hostname;
}

export function socialLinks(configured:SocialLink[]=[]):(SocialLink & {icon?:SocialIconName})[] {
  const seen=new Set<string>();
  return [...configured,...reportSocials].flatMap(link=>{
    try {
      const parsed=new URL(link.url);
      if(parsed.protocol!=='https:' || parsed.username || parsed.password)return [];
      const platform=socialPlatform(parsed.href);
      if(seen.has(platform))return [];
      seen.add(platform);
      const icon=Object.values(platforms).includes(platform as SocialIconName) ? platform as SocialIconName : undefined;
      return [{...link,url:parsed.href,icon}];
    } catch {return [];}
  });
}
