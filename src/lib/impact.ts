// Curated from the supplied JDPI Annual Report 2025, pages 6 and 10–12.
// Counts are kept in their original units; never summed as unique people reached.
import reportCoverage from '../data/impact-coverage.json';
export const impactYear=2025;
export const impactOverview=[
  {value:'20,229',label:'Households supported',source:'Page 10'},
  {value:'114',label:'Communities reached',source:'Page 12'},
  {value:'10',label:'Projects implemented',source:'Page 10'},
  {value:'3',label:'States covered',source:'Page 12'},
];
export const sectorImpact=[
  {title:'Food Security & Livelihoods',slug:'food-security-and-livelihoods',value:'48,016',label:'People reached',description:'Agricultural support, livelihoods and food assistance helped households meet immediate needs and build resilience.',source:'Pages 6 and 11'},
  {title:'Nutrition',slug:'nutrition',value:'10,317',label:'Children and caregivers supported',description:'Lifesaving nutrition support included community-based care, referrals and nutrition education.',source:'Pages 6 and 11'},
  {title:'Water, Sanitation & Hygiene',slug:'water-sanitation-and-hygiene',value:'22,000',label:'People with improved safe-water access',description:'An estimated 22,000 people gained improved access to safe water. JDPI completed 22 boreholes: 15 constructed and 7 rehabilitated.',source:'Pages 6 and 11',estimated:true},
  {title:'Mental Health & Psychosocial Support',slug:'mental-health-and-psychosocial-support',value:'21,729',label:'People reached through messaging',description:'Mental health and psychosocial support messages expanded awareness. This figure is not a count of people receiving individual counselling.',source:'Pages 6 and 11'},
  {title:'Protection',slug:'protection',value:'22,182',label:'People reached through awareness activities',description:'Awareness sessions and messages shared information on safety, dignity, rights and available support services.',source:'Pages 6 and 11'},
  {title:'Social Cohesion & Peacebuilding',slug:'peacebuilding-and-social-cohesion',value:'13',label:'Community conflicts resolved',description:'Community-led peacebuilding mechanisms helped resolve conflicts and strengthen peaceful coexistence.',source:'Page 11'},
];
export const impactCoverage=reportCoverage;
