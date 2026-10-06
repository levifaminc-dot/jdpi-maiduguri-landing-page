import type {ContentImage, ContentItem} from './content';

export interface ProjectProfile {
  donor: string;
  partners?: string;
  overview: string[];
  context: string;
  activities: {title:string; text:string}[];
  facts?: {value:string; label:string}[];
  resultsIntro: string;
  outcomes?: string[];
  stories: {title:string; text:string; source:string}[];
  storyNote?: string;
  overviewImage?: ContentImage;
  overviewCaption?: string;
  photoNote?: string;
  gallery: {image:ContentImage; caption:string}[];
  sources: {title:string; detail:string; url?:string}[];
  reviewNote?: string;
}
const photo = (name:string, alt:string):ContentImage => ({url:`/assets/projects/${name}.jpg`,alt});
const reportSource = (pages:string) => ({title:'JDPI Annual Report 2025', detail:`${pages}. Results relate to the 2025 reporting period unless otherwise stated.`});
const briefSource = {title:'JDPI project brief', detail:'The organisation-supplied project-page reference provides the duration, completed status and project figures. These are not separately verified annual-report totals.'};
const profiles:Record<string,ProjectProfile> = {
  'bmz-multisectoral-resilience-project': {
    donor:'BMZ, through Caritas Germany', partners:'Caritas Germany',
    overview:[
      'The BMZ-funded Multisectoral Strengthening of Resilience project supports vulnerable households in conflict-affected communities of Northeastern Nigeria and Northern Cameroon. JDPI’s reported work in Hong and Michika combines livelihood recovery with community-led approaches to nutrition, water access and peacebuilding.',
      'In 2025, community greenhouses helped households grow vegetables beyond the rainy season. Alongside agricultural support, the report highlights nutrition learning, income-generating activities and dialogue that strengthen resilience across everyday life.',
    ],
    context:'Households in Northeast Nigeria face the combined pressures of conflict, displacement, climate variability and limited livelihood opportunities. Dependence on seasonal rain makes production vulnerable to long dry periods. The project links practical support with local skills and community structures to strengthen recovery.',
    activities:[
      {title:'Climate-smart production',text:'Established 20 community greenhouses in Hong and Michika, supporting 263 households with year-round vegetable production.'},
      {title:'Post-harvest support',text:'BMZ-supported work through Caritas Germany distributed 8,000 PICS storage bags to 4,000 farmers, with training on safer crop storage.'},
      {title:'Nutrition and safe water',text:'A nutrition conference supported lead mothers and peer learning. The report also describes a solar-powered borehole improving water access in Kilamada.'},
      {title:'Livelihoods and social cohesion',text:'Income-generating support, savings-group participation and a peace conference helped communities build economic and social resilience.'},
    ],
    facts:[{value:'20',label:'Community greenhouses'},{value:'263',label:'Households supported by greenhouses'},{value:'8,000',label:'PICS storage bags distributed'},{value:'4,000',label:'Farmers receiving storage bags'}],
    resultsIntro:'Selected BMZ-supported outputs reported in 2025. The greenhouse and storage-bag figures describe different activities; they are not a combined unique-beneficiary total.',
    stories:[
      {title:'A small start, a growing livelihood',text:'In Michika, a participant used income-generating support to start a groundnut business. Reinvesting earnings and joining a savings group helped her expand from buying two bags to up to twenty at a time.',source:'Annual Report 2025, page 47'},
      {title:'Safe water, closer to home',text:'In Kilamada, Hong LGA, a solar-powered borehole reduced reliance on river water. The report describes safer water collection and less time spent searching for water.',source:'Annual Report 2025, page 51'},
    ],
    overviewImage:photo('bmz-greenhouse-crops','Vegetables growing inside a BMZ-supported community greenhouse'),
    overviewCaption:'Year-round vegetable production • Annual Report 2025, page 18',
    gallery:[
      {image:photo('bmz-greenhouse-monitoring','A farmer and JDPI staff inspecting greenhouse crops'),caption:'JDPI monitoring visit • Report, page 17'},
      {image:photo('bmz-greenhouse-exterior','A completed community greenhouse viewed from above'),caption:'Completed community greenhouse • Report, page 17'},
      {image:photo('bmz-greenhouse-harvest','Boxes of bell peppers harvested from the greenhouse'),caption:'Produce from the greenhouse • Report, page 17'},
    ],
    sources:[reportSource('Pages 15, 17–18, 24, 41, 47 and 51'),briefSource],
  },
  'echf-into-mami-project': {
    donor:'ECHF',partners:'Catholic Relief Services (CRS)',
    overview:[
      'INTO-MAMI focused on nutrition and water, sanitation and hygiene support for mothers, infants and communities in Jere and Magumeri LGAs of Borno State. JDPI implemented the ECHF-funded project with Catholic Relief Services.',
      'JDPI’s public closeout update confirms that the project concluded. Partners came together to reflect on the nutrition and WaSH work delivered in the two local government areas.',
    ],
    context:'The project addressed nutrition and WaSH needs in conflict-affected communities. Its integrated approach linked support for mothers and children with improvements in community water services.',
    activities:[
      {title:'Nutrition support',text:'Supported improved nutrition outcomes for mothers and children, as described in JDPI’s project brief and closeout update.'},
      {title:'Water and hygiene',text:'Delivered WaSH support, with 10 rehabilitated boreholes recorded in the organisation’s project brief.'},
      {title:'Learning and closeout',text:'Brought JDPI and partner representatives together to review the completed project and reflect on its work.'},
    ],
    resultsIntro:'Project figures from JDPI’s supplied brief. The annual report does not separately itemise INTO-MAMI totals; these figures are not presented as 2025-only outputs.',
    stories:[{title:'Reflecting on a completed partnership',text:'JDPI’s closeout update describes partners coming together after project activities in Jere and Magumeri. The public meeting photograph records this final project reflection.',source:'JDPI’s public INTO-MAMI closeout update'}],
    gallery:[{image:photo('echf-into-mami-closeout','JDPI and partner representatives at the INTO-MAMI closeout meeting'),caption:'INTO-MAMI closeout meeting • JDPI Facebook'}],
    sources:[briefSource,{title:'JDPI INTO-MAMI closeout update',detail:'Public post confirming project closure and describing nutrition and WaSH work with CRS. The displayed post date did not establish a year.',url:'https://www.facebook.com/permalink.php?story_fbid=pfbid0bsKzGMpabgXBVGrWGh2AZtJEhegYSNMkiVvgtrq9zykeWz8NZrCCffGw3k1fF7Grl&id=100081401777454'}],
  },
  'nhf-integrated-nutrition-and-protection': {
    donor:'Nigeria Humanitarian Fund (NHF)',
    overview:[
      'The NHF Integrated Nutrition and Protection project supported crisis-affected communities in Madagali, Adamawa State. JDPI’s supplied project brief describes an integrated approach to nutrition and protection assistance.',
      'The brief records work across four communities and 900 birth registrations. These project figures are retained separately from JDPI’s organisation-wide 2025 programme results.',
    ],
    context:'The project combines nutrition assistance with protection support in crisis-affected communities. Its community focus reflects the need to connect essential services with practical protection measures.',
    activities:[
      {title:'Integrated nutrition assistance',text:'Nutrition support is identified as a core sector in the organisation’s project brief.'},
      {title:'Protection support',text:'Community protection assistance is identified alongside nutrition in the project’s scope.'},
      {title:'Birth registration',text:'The organisation’s brief records 900 birth registrations across the project.'},
    ],
    resultsIntro:'Project figures from JDPI’s supplied brief, not independently attributed 2025 annual-report totals.',
    stories:[],storyNote:'The supplied material does not include a beneficiary story specifically attributed to this NHF award. Approved project stories can be added when available.',
    photoNote:'Illustrative image from the existing JDPI website; project-specific photography awaits confirmation.',
    gallery:[],
    sources:[briefSource,{title:'JDPI Annual Report 2025',detail:'Page 4 identifies NHF as the Nigeria Humanitarian Fund. The report does not separately itemise this award’s project figures.'}],
    reviewNote:'For review: the relationship between this award and the separately listed Madagali protection and GBV-response project remains to be confirmed by JDPI.',
  },
  'allright-project': {
    donor:'Catholic Relief Services (CRS)',partners:'CRS technical assistance',
    overview:[
      'Advancing Local Leadership in the Right Way (ALLRight) strengthens JDPI’s organisational systems, leadership, accountability and long-term sustainability. The project is funded by Catholic Relief Services, with technical assistance from CRS.',
      'By investing in the institution behind the programmes, ALLRight supports more effective services and stronger locally led development for the communities JDPI serves.',
    ],
    context:'Community impact depends on strong local institutions as well as direct assistance. ALLRight addresses the organisational systems and skills JDPI needs to sustain its work, mobilise resources and make evidence-informed decisions.',
    activities:[
      {title:'Resource mobilisation',text:'Rolled out and disseminated JDPI’s Resource Mobilisation Strategy to strengthen fundraising and diversify funding opportunities.'},
      {title:'MEAL policy development',text:'Developed a comprehensive monitoring, evaluation, accountability and learning policy with support from CRS.'},
      {title:'Staff capacity',text:'Delivered a five-day policy rollout training focused on shared approaches to data collection, analysis, reporting and use.'},
    ],
    facts:[{value:'5 days',label:'MEAL policy rollout training'}],
    resultsIntro:'Institutional-strengthening outputs documented in the 2025 report. These are staff and systems improvements, not community beneficiary totals.',
    outcomes:['Resource Mobilisation Strategy rolled out','Comprehensive MEAL policy developed','Staff trained in common data and reporting approaches'],
    stories:[{title:'Building the systems behind the services',text:'The strategy rollout brought staff and donors together around resource mobilisation. Alongside the MEAL policy, it strengthened JDPI’s shared approach to sustainability, accountability and organisational learning.',source:'Annual Report 2025, page 58'}],
    gallery:[
      {image:photo('allright-resource-mobilisation','JDPI staff and donors at the resource mobilisation strategy rollout'),caption:'Staff and donors at the strategy rollout • Report, page 58'},
      {image:photo('allright-stakeholder-workshop','Participants working together during an ALLRight stakeholder workshop'),caption:'Stakeholder engagement workshop • Report, page 58'},
    ],sources:[reportSource('Page 58')],
  },
  'echo-sahara-project': {
    donor:'ECHO',
    overview:[
      'The ECHO-funded SAHaRA project provided unrestricted cash assistance to vulnerable households across Borno and Adamawa States. It helped families obtain food and essential household supplies according to their own priorities.',
      'The 2025 report also describes cholera and hygiene kits, including menstrual hygiene supplies, distributed under the project to help households manage heightened public-health risks.',
    ],
    context:'Conflict, displacement and rising living costs put pressure on household food security. Cash support preserves families’ ability to choose what they need, while hygiene supplies complement efforts to prevent disease and strengthen community resilience.',
    activities:[
      {title:'Unrestricted cash assistance',text:'Enabled 15,466 people in Borno and Adamawa to access food and other essential household needs.'},
      {title:'Cholera and hygiene supplies',text:'Distributed 2,675 cholera and hygiene kits to vulnerable individuals.'},
      {title:'Menstrual hygiene support',text:'Reached 1,115 people with menstrual hygiene kits, complementing hygiene promotion and prevention work.'},
    ],
    facts:[{value:'15,466',label:'People receiving cash support'},{value:'2,675',label:'Cholera and hygiene kits'},{value:'1,115',label:'People receiving menstrual hygiene kits'}],
    resultsIntro:'SAHaRA outputs explicitly reported for 2025. Service counts are presented separately and should not be summed as unique beneficiaries.',
    stories:[],storyNote:'The report describes household support under SAHaRA but does not include an individually attributed project story. Its documented approach puts families’ own priorities at the centre of cash assistance.',
    photoNote:'Illustrative JDPI hygiene-promotion photo from the report; the caption does not identify a SAHaRA-specific event.',
    gallery:[{image:photo('jdpi-hygiene-promotion','A JDPI hygiene promotion session from the annual report'),caption:'Illustrative JDPI hygiene promotion • Report, page 27'}],sources:[reportSource('Pages 16 and 27')],
  },
  'we-sing-project': {
    donor:'Manos Unidas',
    overview:[
      'WE-SING supports women’s livelihoods and psychosocial wellbeing in Borno State. Participants received start-up kits tailored to their chosen trades, helping them establish or expand small enterprises.',
      'The project also provided individual counselling. Economic opportunities and tailored psychosocial support helped women rebuild confidence and strengthen their resilience.',
    ],
    context:'Limited start-up capital and economic pressures can constrain women’s livelihood opportunities. WE-SING pairs tools for income generation with support for emotional wellbeing, building on participants’ own skills, interests and aspirations.',
    activities:[
      {title:'Trade-specific start-up kits',text:'Provided livelihood kits for 100 women, covering activities such as tailoring, petty trading and food processing.'},
      {title:'Individual counselling',text:'Provided specialised one-to-one counselling for 30 women in Borno State.'},
      {title:'Supportive group spaces',text:'The report describes WE-SING psychosocial sessions where women found mutual encouragement and support.'},
    ],
    resultsIntro:'Project-specific outputs reported in 2025. The kit and counselling figures describe separate services, not an additive unique-beneficiary total.',
    stories:[{title:'Tools for women’s own ambitions',text:'The report describes women starting new businesses or expanding existing enterprises after receiving kits aligned with their chosen trades. Support was tailored to their skills, interests and livelihood aspirations.',source:'Annual Report 2025, page 16'}],
    gallery:[
      {image:photo('we-sing-startup-kits','A participant receiving a livelihood kit at the WE-SING distribution'),caption:'Livelihood start-up kit distribution • Report, page 16'},
      {image:photo('we-sing-distribution-team','Representatives at the WE-SING livelihood kit distribution'),caption:'WE-SING distribution event • Report, page 16'},
    ],sources:[reportSource('Pages 16 and 31–32'),{title:'WE-SING distribution photograph',detail:'Page 16’s project event banner identifies Manos Unidas.'}],
  },
  'gffo-food-security-humanitarian-protection-lake-chad': {
    donor:'German Federal Foreign Office (GFFO)',partners:'Caritas Germany and Caritas Nigeria',
    overview:[
      'The Food Security and Humanitarian Protection for Victims of Lake Chad project is funded by GFFO through Caritas Germany and implemented by JDPI Maiduguri in partnership with Caritas Nigeria.',
      'The report illustrates its protection work through psychosocial support in Tsallake, Kaga LGA, and child-protection interventions that helped a young person return to school.',
    ],
    context:'Conflict and household vulnerability can affect children’s wellbeing and access to education. The reported protection work connects families with counselling, caregiver engagement and practical support so children can recover and participate in everyday community life.',
    activities:[
      {title:'Psychosocial care',text:'Provided counselling and appropriate medical support in a documented child-support case in Tsallake, Kaga LGA.'},
      {title:'Caregiver engagement',text:'Used household visits and awareness sessions to discuss child labour, education and positive parenting.'},
      {title:'School reintegration',text:'Provided essential learning materials that helped a child return to school.'},
    ],
    resultsIntro:'The report documents individual case outcomes but does not provide a separate project-wide beneficiary total. No organisation-wide protection or psychosocial totals are attributed to this award.',
    outcomes:['Recovery and renewed participation in everyday life in a reported psychosocial-support case','Return to school in a reported child-protection case'],
    stories:[
      {title:'Support for recovery',text:'A family in Tsallake received psychosocial and appropriate medical support for a child affected by conflict. The report describes the child returning to play, school and daily family life. Identifying details are not reproduced.',source:'Annual Report 2025, page 52'},
      {title:'Back to learning',text:'Caregiver engagement and learning materials helped a young person leave farm work and resume daily school attendance. The account illustrates child-protection support, not a project-wide outcome rate.',source:'Annual Report 2025, page 54'},
    ],
    photoNote:'Identities are obscured exactly as in the original annual report.',
    gallery:[{image:photo('gffo-family-support-redacted','Family pictured with identity-protecting redactions in the GFFO report section'),caption:'Family support • Report, page 52. Original identity protections retained.'}],sources:[reportSource('Pages 52 and 54')],
  },
  'strengthening-protection-gbv-response-madagali': {
    donor:'Not specified for this project in the supplied report',
    overview:[
      'JDPI’s Strengthening Protection and GBV Response in Madagali project includes vocational skills training and livelihood start-up support for young people in Madagali, Adamawa State.',
      'The annual report shows how practical training and business equipment can help participants establish small enterprises and build more secure livelihoods.',
    ],
    context:'Young people with limited access to education, employment and start-up resources can struggle to find a sustainable livelihood. The documented skills component expands practical income opportunities as part of the project’s protection work.',
    activities:[
      {title:'Vocational skills',text:'Provided barbering training covering haircutting, customer service and equipment maintenance in the reported example.'},
      {title:'Business skills',text:'Included basic business management to support participants starting a small enterprise.'},
      {title:'Livelihood equipment',text:'Provided a start-up kit including a solar power station, clippers, combs, brushes and other barbering tools.'},
    ],
    resultsIntro:'The report describes an individual livelihood example, not a project-wide beneficiary total. No participant is labelled as a GBV survivor here.',
    outcomes:['Practical vocational and business skills acquired in the reported example','A small barbering enterprise established after training and start-up support'],
    stories:[{title:'Skills that become a livelihood',text:'A participant in Dar community used barbering training and start-up equipment to open a local salon. The report describes the business serving customers and contributing to household income.',source:'Annual Report 2025, page 55'}],
    gallery:[{image:photo('madagali-livelihood-kit','Start-up equipment distributed through the Madagali project’s vocational component'),caption:'Livelihood start-up equipment • Report, page 55'}],sources:[reportSource('Page 55')],
    reviewNote:'For review: JDPI has not yet confirmed whether this is the same award as the separately listed NHF Integrated Nutrition and Protection project. Both remain separate for review.',
  },
};

export function getProjectProfile(item:ContentItem):ProjectProfile {
  return profiles[item.slug] || {
    donor:'Not provided',overview:[item.summary || 'Contact JDPI for further information about this project.'],
    context:'Further project context has not yet been supplied.',activities:[],resultsIntro:'Project results have not yet been supplied.',
    stories:[],storyNote:'Approved project stories have not yet been supplied.',gallery:[],sources:[],
  };
}
