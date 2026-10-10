import {defineType,defineField,defineArrayMember,type ConditionalPropertyCallbackContext} from 'sanity';
import {CogIcon,HomeIcon,DocumentTextIcon,DocumentsIcon,UsersIcon,EarthGlobeIcon,ProjectsIcon} from '@sanity/icons';
import {contentFields,editorialImage} from './shared';
import {pageTypes,projectProfileField,programmeDetailsField} from './page-content';

const siteSettings=defineType({name:'siteSettings',title:'Site settings',type:'document',icon:CogIcon,fields:[
  defineField({name:'organisationName',title:'Organisation name',type:'string',validation:r=>r.required()}),
  defineField({name:'shortName',title:'Short name',type:'string',validation:r=>r.required()}),
  defineField({name:'diocese',title:'Diocese',type:'string',validation:r=>r.required()}),
  defineField({name:'tagline',title:'Tagline',type:'string'}),
  defineField({name:'email',title:'Public contact email',type:'string',validation:r=>r.required().email()}),
  defineField({name:'phone',title:'Public phone number',type:'string'}),
  defineField({name:'address',title:'Office address',type:'string'}),defineField({name:'country',type:'string'}),
  defineField({name:'donationUrl',title:'Donation checkout link',type:'url',description:'Paste JDPI’s approved Paystack or Flutterwave donation page. Leave empty until it is ready.',validation:r=>r.uri({scheme:['https']})}),
  defineField({name:'socialLinks',title:'Social media',type:'array',of:[defineArrayMember({type:'object',name:'socialLink',fields:[defineField({name:'label',title:'Platform name',type:'string',validation:r=>r.required()}),defineField({name:'url',title:'Profile URL',type:'url',validation:r=>r.required().uri({scheme:['https']})})]})]}),
  defineField({name:'seoTitle',title:'Homepage search title',type:'string',validation:r=>r.required()}),
  defineField({name:'seoDescription',title:'Homepage search description',type:'text',rows:3,validation:r=>r.required().max(200)}),
],preview:{prepare:()=>({title:'Site settings'})}});

const homePage=defineType({name:'homePage',title:'Homepage',type:'document',icon:HomeIcon,groups:[{name:'intro',title:'Introduction',default:true},{name:'impact',title:'Our impact'},{name:'sections',title:'Section headings'},{name:'support',title:'Support our work'}],fields:[
  defineField({name:'heroKicker',title:'Opening line',type:'string',group:'intro'}),
  defineField({name:'heroStatement',title:'Main statement',type:'string',group:'intro',validation:r=>r.required()}),
  defineField({name:'heroHighlight',title:'Highlighted ending',type:'string',group:'intro',validation:r=>r.required()}),
  defineField({name:'heroIntro',title:'Opening introduction',type:'text',rows:3,group:'intro',validation:r=>r.required()}),
  defineField({name:'heroImage',title:'Opening image',type:'editorialImage',group:'intro',validation:r=>r.required()}),
  defineField({name:'location',title:'Communities served',type:'string',group:'intro'}),
  defineField({name:'aboutIntro',title:'Who we are',type:'text',rows:6,group:'intro',validation:r=>r.required()}),
  defineField({name:'aboutImage',title:'Who we are image',type:'editorialImage',group:'intro',validation:r=>r.required()}),
  defineField({name:'impactImage',title:'Impact image',type:'editorialImage',group:'impact',validation:r=>r.required()}),
  defineField({name:'impactFacts',title:'Impact figures',type:'array',group:'impact',description:'Use verified figures. Include a reporting period in the label when appropriate.',validation:r=>r.required().min(1).max(4),of:[defineArrayMember({type:'object',name:'impactFact',fields:[defineField({name:'value',title:'Figure',type:'string',validation:r=>r.required()}),defineField({name:'label',title:'What it measures',type:'string',validation:r=>r.required()})]})]}),
  ...['programmeHeading','projectsHeading','storiesHeading','partnersHeading','partnersIntro'].map(name=>defineField({name,title:({programmeHeading:'Programmes heading',projectsHeading:'Projects heading',storiesHeading:'Stories heading',partnersHeading:'Partners heading',partnersIntro:'Partners introduction'} as Record<string,string>)[name],type:'string',group:'sections',validation:r=>r.required()})),
  defineField({name:'supportIntro',title:'Support introduction',type:'text',rows:4,group:'support',validation:r=>r.required()}),
  defineField({name:'supportImage',title:'Support image',type:'editorialImage',group:'support',validation:r=>r.required()}),
],preview:{prepare:()=>({title:'Homepage'})}});

const programme=defineType({name:'programme',title:'Programme',type:'document',icon:EarthGlobeIcon,groups:[{name:'basic',title:'Overview & image',default:true},{name:'details',title:'Interventions & locations'}],fields:[...contentFields().map(field=>({...field,group:'basic'})),{...programmeDetailsField,group:'details'}],preview:{select:{title:'title',media:'image'}}});
const project=defineType({name:'project',title:'Project',type:'document',icon:ProjectsIcon,groups:[{name:'basic',title:'Summary & metadata',default:true},{name:'details',title:'Full project page'}],fields:[
  {...projectProfileField,group:'details'},
  defineField({name:'reportingYear',title:'Results reporting year',type:'number',group:'basic',description:'The year of the source report, not the project’s end date.',validation:r=>r.integer().min(1900).max(2100)}),
  defineField({name:'imageCaption',title:'Main photo caption',type:'string',group:'basic'}),
  ...contentFields().map(field=>({...field,group:'basic',...(field.name==='body'?{hidden:({document}:ConditionalPropertyCallbackContext)=>Boolean(document?.profile),description:'For projects with a full profile, edit Overview under Full project page instead.'}:{})})),defineField({name:'location',title:'Project location',type:'string',group:'basic'}),
  defineField({name:'status',title:'Project status',type:'string',group:'basic',options:{list:[{title:'Ongoing',value:'ongoing'},{title:'Completed',value:'completed'}],layout:'radio'}}),
  defineField({name:'startDate',title:'Start date',type:'date',group:'basic'}),
  defineField({name:'endDate',title:'End date',type:'date',group:'basic',validation:r=>r.custom((value,context)=>!value || !context.document?.startDate || value>=String(context.document.startDate) ? true : 'End date must be on or after the start date.')}),
  defineField({name:'projectProgrammes',title:'Programme areas',type:'array',group:'basic',of:[defineArrayMember({type:'reference',to:[{type:'programme'}]})],validation:r=>r.unique()}),
  defineField({name:'impactFacts',title:'Project card figures',group:'basic',description:'Verified figures shown on the project directory card. Full-page results are edited under Full project page → Facts.',type:'array',validation:r=>r.max(2),of:[defineArrayMember({type:'object',name:'projectImpactFact',fields:[defineField({name:'value',title:'Figure',type:'string',validation:r=>r.required()}),defineField({name:'label',title:'What it measures',type:'string',validation:r=>r.required()})]})]}),
],preview:{select:{title:'title',media:'image'}}});
const story=defineType({name:'story',title:'Story or update',type:'document',icon:DocumentTextIcon,fields:[...contentFields(),defineField({name:'category',title:'Update type',type:'string',initialValue:'Stories',description:'Field stories, blog posts and other updates appear on Stories & Updates. Upload PDF reports under Reports instead.',options:{list:[{title:'Field story',value:'Stories'},{title:'Blog post',value:'Blogs'},{title:'News',value:'News'},{title:'Event',value:'Events'},{title:'Publication',value:'Publications'}]},validation:r=>r.required()}),defineField({name:'publishedAt',title:'Publication date',type:'datetime',validation:r=>r.required()})],preview:{select:{title:'title',subtitle:'category',media:'image'}}});
const report=defineType({name:'report',title:'Report or publication',type:'document',icon:DocumentsIcon,fields:[defineField({name:'title',type:'string',validation:r=>r.required()}),defineField({name:'slug',title:'Reference name',type:'slug',options:{source:'title'}}),defineField({name:'summary',title:'Description',type:'text',rows:3}),defineField({name:'publishedAt',title:'Publication date',type:'date',validation:r=>r.required()}),defineField({name:'file',title:'PDF report',type:'file',options:{accept:'application/pdf'},validation:r=>r.required()}),defineField({name:'sourceKey',type:'string',hidden:true,readOnly:true})]});
const partner=defineType({name:'partner',title:'Partner or donor',type:'document',icon:UsersIcon,fields:[defineField({name:'name',type:'string',validation:r=>r.required()}),defineField({name:'logo',type:'editorialImage'}),defineField({name:'website',type:'url',validation:r=>r.uri({scheme:['https']})}),defineField({name:'sortOrder',title:'Display order',type:'number',initialValue:0}),defineField({name:'sourceKey',type:'string',hidden:true,readOnly:true})],preview:{select:{title:'name',media:'logo'}}});
export const schemaTypes=[editorialImage,siteSettings,homePage,...pageTypes,programme,project,story,report,partner];
