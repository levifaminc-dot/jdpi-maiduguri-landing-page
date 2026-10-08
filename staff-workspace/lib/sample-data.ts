export type WorkspaceRole = 'Staff' | 'Admin';
export type MemberStatus = 'Active' | 'Pending' | 'Invited' | 'Suspended';
export type Person = {id:string;name:string;job:string;department:string;office:string;email:string;color:string;role:WorkspaceRole;status:MemberStatus};
export type Post = {id:string;author:string;title:string;body:string;category:string;audience:string;date:string;pinned:boolean;saved:boolean;liked:boolean;likes:number;comments:{author:string;text:string}[]};
export type DocumentRecord = {id:string;title:string;folder:string;audience:string;owner:string;type:string;date:string;file?:File;url?:string;text?:string};
export const people:Person[] = [
  {id:'me',name:'Amara Yusuf',job:'Programme Officer',department:'Programmes',office:'Maiduguri',email:'amara.yusuf@example.invalid',color:'dark',role:'Staff',status:'Active'},
  {id:'p2',name:'Daniel Okoro',job:'Operations Coordinator',department:'Operations',office:'Maiduguri',email:'daniel.okoro@example.invalid',color:'sand',role:'Admin',status:'Active'},
  {id:'p3',name:'Hauwa Musa',job:'Nutrition Officer',department:'Programmes',office:'Mubi',email:'hauwa.musa@example.invalid',color:'lilac',role:'Staff',status:'Active'},
  {id:'p4',name:'Samuel Eze',job:'Monitoring & Evaluation Officer',department:'MEAL',office:'Michika',email:'samuel.eze@example.invalid',color:'blue',role:'Staff',status:'Active'},
  {id:'p5',name:'Grace Bello',job:'People & Culture Officer',department:'People & culture',office:'Maiduguri',email:'grace.bello@example.invalid',color:'lilac',role:'Staff',status:'Pending'},
  {id:'p6',name:'Ibrahim Ali',job:'Finance Officer',department:'Finance',office:'Maiduguri',email:'ibrahim.ali@example.invalid',color:'sand',role:'Staff',status:'Invited'},
];
export const samplePosts:Post[] = [
  {id:'a1',author:'p2',title:'Let’s make our field visits a little smoother',body:'A sample field visit guide is ready in the document library. Please review it and share suggestions below. Small improvements make a difference for the whole team.',category:'Operations',audience:'All staff',date:'08 Oct 2026',pinned:true,saved:false,liked:false,likes:12,comments:[{author:'p3',text:'Could we include a space for community feedback?'}]},
  {id:'a2',author:'p2',title:'Welcome to a workspace built around our people',body:'This is your space to share updates, find useful resources and connect with colleagues across our offices. Approved staff can post announcements, upload documents and join the conversation.',category:'People & culture',audience:'All staff',date:'07 Oct 2026',pinned:false,saved:false,liked:false,likes:8,comments:[]},
  {id:'a3',author:'p3',title:'What is working well in your programme?',body:'Let’s exchange practical ideas from the field. What has helped your team listen, adapt and work more closely with communities? Share one lesson other colleagues could put into practice.',category:'Programme updates',audience:'All staff',date:'06 Oct 2026',pinned:false,saved:false,liked:false,likes:5,comments:[{author:'p4',text:'Short feedback conversations help us spot improvements earlier.'}]},
];
export const sampleDocuments:DocumentRecord[] = [
  {id:'d1',title:'Staff workspace preview guide',folder:'Policies & guidance',audience:'All staff',owner:'p2',type:'PDF',date:'08 Oct 2026',url:'/api/preview-assets/guide.pdf'},
  {id:'d2',title:'Field visit checklist',folder:'Templates',audience:'All staff',owner:'p2',type:'TXT',date:'08 Oct 2026',text:'FICTIONAL SAMPLE - NOT AN APPROVED JDPI DOCUMENT\n\n1. Confirm visit objectives.\n2. Check materials.\n3. Discuss community participation.\n4. Record feedback and next steps.'},
  {id:'d3',title:'Programme learning notes',folder:'Programme resources',audience:'Programmes',owner:'p3',type:'TXT',date:'06 Oct 2026',text:'FICTIONAL SAMPLE - NOT A REAL REPORT\n\nThis placeholder demonstrates reviewed programme resources.'},
];
export const categories = ['General','Programme updates','People & culture','Operations'];
export const folders = ['Policies & guidance','Programme resources','Templates'];
export const departments = ['Programmes','Operations','MEAL','People & culture','Finance'];
export const offices = ['Maiduguri','Mubi','Michika'];
