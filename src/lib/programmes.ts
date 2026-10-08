import type {ContentItem,ContentImage} from './content';

// The initial Nutrition reference asset is a winter landscape, not a nutrition
// activity. Correct only that known placeholder; replacement CMS images win.
export function programmeImage(programme:ContentItem):ContentImage|undefined {
  const placeholder='image-6e84b0743d7530d682cf4caee43e97e94102cd1d-800x400-jpg';
  if(programme.slug==='nutrition'&&(programme.image?.assetId===placeholder||programme.image?.url.includes(placeholder))){
    return {url:'/assets/projects/echf-into-mami-closeout.jpg',alt:'Participants at the ECHF INTO-MAMI nutrition project close-out meeting, pictured in JDPI’s 2025 Annual Report'};
  }
  return programme.image;
}
