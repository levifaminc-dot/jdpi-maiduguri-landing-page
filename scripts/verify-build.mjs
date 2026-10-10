import {readFile,readdir,access} from 'node:fs/promises';
import path from 'node:path';
import {pageEditor} from '../src/lib/page-editor.ts';
import {getImpact} from '../src/lib/impact.ts';
import {leadership} from '../src/data/about.ts';
import {getPublishedResources} from '../src/lib/resources.ts';
const impactCoverage=JSON.parse(await readFile('src/data/impact-coverage.json','utf8'));
const impactMaps=JSON.parse(await readFile('src/data/impact-maps.json','utf8'));
const defaultTeam=JSON.parse(await readFile('src/data/team.json','utf8'));
const defaultActivities=JSON.parse(await readFile('src/data/lga-activities.json','utf8'));
const snapshot=JSON.parse(await readFile('content/snapshot.json','utf8'));
const pages=Object.fromEntries(['about','team','where-we-work','impact','programmes','stories'].map(route=>[route,pageEditor(snapshot,route)]));
const person=item=>({...item,image:{url:`/assets/team/${item.image}.jpg`,alt:item.name}});
const team={board:pages.team.data('board',defaultTeam.board.map(person)),management:pages.team.data('management',defaultTeam.management.map(person))};
const activities=pages['where-we-work'].data('lgaActivities',defaultActivities);
const impact=getImpact(snapshot);
const escaped=value=>String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
const reportProjects=JSON.parse(await readFile('content/report-projects.json','utf8'));
const projectSlugs=new Set([...snapshot.projects,...reportProjects.projects].map(project=>project.slug));
if(defaultTeam.board.length!==5||defaultTeam.management.length!==11)throw new Error('The archived report roster must contain five trustees and eleven management members.');
for(const record of activities){
  if(!impactCoverage.some(region=>region.state===record.state&&region.areas.includes(record.lga)))throw new Error(`Activity location outside report coverage: ${record.state}/${record.lga}`);
  if(record.activities.some(activity=>!activity.source))throw new Error(`Missing LGA activity source: ${record.lga}`);
  for(const activity of record.activities)if(activity.project&&!projectSlugs.has(activity.project))throw new Error(`Invalid activity project: ${activity.project}`);
}
async function files(dir){const entries=await readdir(dir,{withFileTypes:true});return(await Promise.all(entries.map(entry=>entry.isDirectory()?files(path.join(dir,entry.name)):path.join(dir,entry.name)))).flat();}
const htmlFiles=(await files('dist')).filter(file=>file.endsWith('.html'));
const errors=[];
for(const file of htmlFiles){
  const html=await readFile(file,'utf8');
  const footer=html.match(/<footer\b[^>]*class="jdpi-footer"[\s\S]*?<\/footer>/)?.[0];
  if(!footer||!footer.includes('class="jf-logo"')||!footer.includes('src="/assets/logo.avif"'))errors.push(`${file}: missing branded footer and JDPI logo`);
  if(footer && (!footer.includes('aria-labelledby="footer-explore-heading"')||!footer.includes('aria-labelledby="footer-programmes-heading"')||!footer.includes('href="/contact/"')||!footer.includes('href="mailto:')||!footer.includes('href="tel:')))errors.push(`${file}: missing accessible footer navigation or working contact links`);
  if(!html.includes('family=DM+Sans:wght@400;500;600;700')||!html.includes('family=Montserrat:wght@400;500;600;700;800;900'))errors.push(`${file}: missing WordPress font pairing and display weights`);
  if(html.includes('family=Open+Sans'))errors.push(`${file}: legacy body font is still requested`);
  const pageName=file.replaceAll('\\','/');
  if(['dist/team/index.html','dist/where-we-work/index.html'].includes(pageName)&&((html.match(/<h1\b/g)||[]).length!==1||/href="#"/.test(html)))errors.push(`${file}: invalid page heading or placeholder link`);
  const primary=html.match(/<nav\b[^>]*id="nav-links"[\s\S]*?<\/nav>/)?.[0];
  if(!primary?.includes('id="submenu-stories"')||!primary.includes('aria-controls="submenu-stories"')||!primary.includes('href="/resources/"'))errors.push(`${file}: missing Resources submenu under Stories`);
  if(!primary?.includes('href="/programmes/"')||!/>Programmes<\/a>/.test(primary)||!/>Stories &amp; Updates<\/a>/.test(primary))errors.push(`${file}: primary navigation must use consistent Programmes and Stories & Updates labels`);
  if(!footer?.includes('href="/contact/privacy/"'))errors.push(`${file}: missing contact privacy link`);
  if(pageName==='dist/index.html'){
    const countValues=[...html.matchAll(/data-count-final="([^"]+)"/g)].map(match=>match[1]);
    if(JSON.stringify(countValues)!==JSON.stringify(snapshot.home.impactFacts.map(fact=>fact.value)))errors.push(`${file}: count-up totals must match homepage content`);
    if((html.match(/class="count-up-accessible"/g)||[]).length!==countValues.length||(html.match(/data-count-up[^>]*aria-hidden="true"/g)||[]).length!==countValues.length)errors.push(`${file}: count-up needs static accessible values and decorative animation`);
    const cardCategories=[...html.matchAll(/class="story-card"[^>]*data-type="([^"]+)"/g)].map(match=>match[1]);
    for(const category of new Set(['all',...cardCategories]))if(!html.includes(`data-filter="${category}"`))errors.push(`${file}: missing consistent homepage story filter ${category}`);
    for(const category of cardCategories)if(!['field','blog','news','publications'].includes(category))errors.push(`${file}: unsupported homepage story category ${category}`);
    if(html.includes('data-filter="Events"')||html.includes('data-filter="Stories"'))errors.push(`${file}: legacy story filter categories`);
  }
  for(const url of ['https://www.facebook.com/p/JDPI-Maiduguri-100081401777454/','https://www.instagram.com/jdpimaiduguri/','https://x.com/jdpimaiduguri','https://www.linkedin.com/company/jdpimaiduguri/'])if(!footer?.includes(url))errors.push(`${file}: missing verified footer social ${url}`);
  if(pageName==='dist/where-we-work/index.html'){
    if((html.match(/data-lga-activity=/g)||[]).length!==20)errors.push(`${file}: must explain all twenty LGAs`);
    if((html.match(/role="tab"/g)||[]).length!==3)errors.push(`${file}: missing state tabs`);
    if((html.match(/<select\b[^>]*data-lga-select/g)||[]).length!==3)errors.push(`${file}: missing mobile LGA selectors`);
    for(const region of impactCoverage)for(const name of region.areas)if(!html.includes(`data-lga-activity="${name}"`))errors.push(`${file}: missing activity panel ${region.state}/${name}`);
    if(!html.includes('CC BY 4.0'))errors.push(`${file}: missing map attribution`);
    for(const field of ['introText1','introText7'])if(!html.includes(escaped(pages['where-we-work'].text(field))))errors.push(`${file}: missing CMS location context ${field}`);
  }
  if(pageName==='dist/team/index.html'){
    for(const person of [...team.board,...team.management])if(!html.includes(escaped(person.name))||!html.includes(person.image.url))errors.push(`${file}: missing CMS team member ${person.name}`);
    for(const id of ['team-heading','board-heading','management-heading','people-heading'])if(!html.includes(`id="${id}"`))errors.push(`${file}: missing team section ${id}`);
    if(!html.includes(escaped(pages.team.text('introText1'))))errors.push(`${file}: missing CMS roster context`);
  }
  if(pageName==='dist/programmes/index.html'){
    if((html.match(/<h1\b/g)||[]).length!==1||/href="#"/.test(html))errors.push(`${file}: invalid programme page heading or placeholder link`);
    if((html.match(/data-programme=/g)||[]).length!==snapshot.programmes.length)errors.push(`${file}: programme catalogue must follow the CMS snapshot`);
    for(const programme of snapshot.programmes){
      for(const target of [`data-programme="${programme.slug}"`,`href="#programme-${programme.slug}"`,`href="/programmes/${programme.slug}/"`])if(!html.includes(target))errors.push(`${file}: missing CMS programme or navigation ${target}`);
      if(programme.summary&&!html.includes(programme.summary.replaceAll('&','&amp;')))errors.push(`${file}: missing CMS summary for ${programme.slug}`);
    }
    for(const id of ['programmes-heading','areas-heading','approach-heading','action-heading'])if(!html.includes(`id="${id}"`))errors.push(`${file}: missing programme section ${id}`);
    for(const context of ['href="/where-we-work/"','href="/impact/"','href="/projects/"'])if(!html.includes(context))errors.push(`${file}: missing programme route ${context}`);
    if(!html.includes('href="/programmes/" aria-current="page"')||!html.includes('aria-label="Programme areas"'))errors.push(`${file}: missing accessible current navigation or area links`);
    for(const result of impact.sectorImpact.filter(result=>snapshot.programmes.some(programme=>programme.slug===result.slug))){
      if(!html.includes(escaped(result.description))||!html.includes(escaped(result.value)))errors.push(`${file}: missing current CMS programme result ${result.slug}`);
      if(result.estimated&&!html.includes('· ESTIMATED'))errors.push(`${file}: estimated programme reach must be labelled`);
    }
    if(html.includes('image-6e84b0743d7530d682cf4caee43e97e94102cd1d-800x400-jpg'))errors.push(`${file}: unrelated Nutrition placeholder must not appear`);
    if((html.match(/data-programme-tab=/g)||[]).length!==snapshot.programmes.length||!html.includes('data-programme-tablist')||html.includes('class="pg-grid"'))errors.push(`${file}: missing single-panel programme tab controls`);
    if(!html.includes('id="programme-picker"')||!html.includes('data-programme-select'))errors.push(`${file}: missing mobile programme selector`);
    if((html.match(/class="pg-interventions"/g)||[]).length!==snapshot.programmes.length||(html.match(/class="pg-locations"/g)||[]).length!==snapshot.programmes.length)errors.push(`${file}: every programme needs interventions and documented location details`);
    const waiting=escaped(pages.programmes.text('areasParagraph4'));
    const reachSummaries=(html.match(/class="pg-result pg-result-summary"/g)||[]).length+(waiting?html.split(waiting).length-1:0);
    if((html.match(/<details\b[^>]*\bdata-programme-details\b/g)||[]).length!==snapshot.programmes.length||reachSummaries!==snapshot.programmes.length)errors.push(`${file}: each programme must have a compact reach summary and More details disclosure`);
    for(const programme of snapshot.programmes){
      const disclosure=html.match(new RegExp(`<details[^>]*data-dialog-id="programme-dialog-${programme.slug}"[\\s\\S]*?<\\/details>`))?.[0];
      if(!disclosure?.includes('More details')||!disclosure.includes(`id="programme-dialog-heading-${programme.slug}"`)||!disclosure.includes('data-close-programme-dialog')||!disclosure.includes('class="pg-interventions"')||!disclosure.includes('class="pg-locations"'))errors.push(`${file}: programme details must be available inside the popup/fallback ${programme.slug}`);
    }
    for(const programme of snapshot.programmes)if(programme.details?.projectReach&&!html.includes(escaped(programme.details.projectReach.description)))errors.push(`${file}: missing CMS project-reach qualification`);
  }
  if(pageName==='dist/stories/index.html'){
    for(const id of ['updates-heading','updates-library-heading','updates-search','updates-count','updates-list'])if(!html.includes(`id="${id}"`))errors.push(`${file}: missing updates section/control ${id}`);
    for(const category of ['all','field','blog','news','reports','publications'])if(!html.includes(`data-update-filter="${category}"`))errors.push(`${file}: missing updates filter ${category}`);
    if(!html.includes('href="/stories/" aria-current="page"')||!html.includes('role="status"')||!html.includes('data-updates-empty'))errors.push(`${file}: missing current navigation or accessible filter feedback`);
    if((html.match(/<h1\b/g)||[]).length!==1||/href="#"/.test(html))errors.push(`${file}: invalid main heading or placeholder link`);
    for(const report of getPublishedResources(snapshot))if(!html.includes(escaped(report.title)))errors.push(`${file}: missing CMS resource-library document ${report.title}`);
  }
  if(pageName==='dist/about/index.html'){
    for(const id of ['about-heading','who-heading','story-heading','guides-heading','identity-heading','where-heading','approach-heading','leadership-heading','accountability-heading','partnership-heading','cta-heading'])if(!html.includes(`id="${id}"`))errors.push(`${file}: missing About section ${id}`);
    const sectionNav=html.match(/<nav\b[^>]*class="ab-section-nav"[\s\S]*?<\/nav>/)?.[0];
    if(!sectionNav||!sectionNav.includes('aria-label="About page sections"')||(sectionNav.match(/<a\b/g)||[]).length!==10)errors.push(`${file}: must have ten accessible About section links`);
    for(const id of ['who-heading','story-heading','guides-heading','identity-heading','where-heading','approach-heading','leadership-heading','accountability-heading','partnership-heading','cta-heading'])if(!sectionNav?.includes(`href="#${id}"`))errors.push(`${file}: missing About section link ${id}`);
    if(html.indexOf('class="ab-section-nav"')<html.indexOf('class="ab-hero"')||html.indexOf('class="ab-section-nav"')>html.indexOf('aria-labelledby="who-heading"'))errors.push(`${file}: About section navigation must follow the hero`);
    if((html.match(/<h1\b/g)||[]).length!==1)errors.push(`${file}: About must have exactly one main heading`);
    if(/href="#"/.test(html))errors.push(`${file}: placeholder About link`);
    if(!html.includes('href="/about/" aria-current="page"'))errors.push(`${file}: missing current About navigation`);
    if(!html.includes('CC BY 4.0'))errors.push(`${file}: missing About map attribution`);
    for(const person of pages.about.data('leadership',leadership.map(person=>({...person,image:{url:`/assets/about/${person.image}.jpg`}}))))if(!html.includes(person.image.url)||!html.includes(escaped(person.name)))errors.push(`${file}: missing CMS featured leadership ${person.name}`);
    for(const state of ['Yobe','Borno','Adamawa'])if(!html.includes(`<text`)||!html.includes(`>${state}</text>`))errors.push(`${file}: missing state label ${state}`);
  }
  if(pageName==='dist/contact/index.html'||pageName==='dist/impact/index.html'){
    const sections=pageName.includes('/contact/')?['contact-heading','enquiry-heading','office-heading']:['impact-heading','overview-heading','sectors-heading','coverage-heading','stories-heading','accountability-heading'];
    for(const id of sections)if(!html.includes(`id="${id}"`))errors.push(`${file}: missing section ${id}`);
    if((html.match(/<h1\b/g)||[]).length!==1)errors.push(`${file}: must have exactly one main heading`);
    if(/href="#"/.test(html))errors.push(`${file}: placeholder link`);
    if(pageName.includes('/contact/')&&(!html.includes('href="mailto:')||!html.includes('href="tel:')))errors.push(`${file}: missing working contact channels`);
    if(pageName.includes('/contact/')){
      const config=JSON.parse(await readFile('config/contact.json','utf8'));
      if(!html.includes(`action="https://formsubmit.co/${config.recipient}"`)||!html.includes('method="POST"'))errors.push(`${file}: missing configured form delivery`);
      for(const id of ['contact-form','contact-name','contact-email','contact-topic','contact-message','contact-consent'])if(!html.includes(`id="${id}"`))errors.push(`${file}: missing contact form control ${id}`);
      if(!html.includes('https://www.google.com/maps/embed?')||!html.includes('referrerpolicy="strict-origin-when-cross-origin"'))errors.push(`${file}: missing map widget`);
      if(/name="_captcha"[^>]*value="false"/.test(html))errors.push(`${file}: contact form CAPTCHA must remain enabled`);
      if(!/name="_next"[^>]*value="https?:\/\/[^\"]+\/contact\/thanks\/"/.test(html))errors.push(`${file}: missing absolute branded confirmation destination`);
      for(const text of ['within 24 hours','JDPI has confirmed this map location','id="safe-route-heading"','href="/contact/privacy/"'])if(!html.includes(text))errors.push(`${file}: missing approved contact UX context ${text}`);
      if(html.includes('not a verified JDPI office entrance'))errors.push(`${file}: outdated unconfirmed office-map wording`);
    }
    if(pageName.includes('/impact/')){
      if((html.match(/role="tab"/g)||[]).length!==impact.sectorImpact.length+3||(html.match(/role="tabpanel"/g)||[]).length!==impact.sectorImpact.length+3)errors.push(`${file}: must include CMS programme tabs and three state map tabs`);
      for(const region of impactCoverage){
        const map=impactMaps.states.find(state=>state.state===region.state);
        if(!map||JSON.stringify(map.covered.map(area=>area.name))!==JSON.stringify(region.areas))errors.push(`${file}: map coverage differs from report-listed ${region.state} LGAs`);
        if(!html.includes(`data-state-map="${region.state.toLowerCase()}"`))errors.push(`${file}: missing ${region.state} map panel`);
        for(const name of region.areas)if(!html.includes(`aria-label="Show ${name} LGA on ${region.state} map"`))errors.push(`${file}: missing accessible ${region.state}/${name} hotspot`);
      }
      if(!html.includes('CC BY 4.0')||!html.includes('not individual project sites'))errors.push(`${file}: missing boundary attribution or coverage explanation`);
      for(const fact of [...impact.impactOverview,...impact.sectorImpact])if(!html.includes(escaped(fact.value))||!html.includes(escaped(fact.label)))errors.push(`${file}: missing CMS result ${fact.label}`);
      if(html.indexOf('id="stories-heading"')>html.indexOf('id="sectors-heading"'))errors.push(`${file}: community stories must lead programme results`);
      for(const id of ['growing-heading','women-heading','enterprise-heading'])if(!html.includes(`aria-labelledby="${id}"`))errors.push(`${file}: missing labelled community story ${id}`);
      for(const asset of pages.impact.data('photos',['bmz-greenhouse-monitoring','bmz-greenhouse-crops','bmz-greenhouse-harvest','we-sing-startup-kits'].map(name=>({name,image:{url:`/assets/projects/${name}.jpg`}}))))if(!html.includes(asset.image.url))errors.push(`${file}: missing CMS report photograph ${asset.name}`);
      for(const id of ['stories-heading','sectors-heading','coverage-heading','accountability-heading'])if(!html.includes(`href="#${id}"`))errors.push(`${file}: missing impact section navigation ${id}`);
    }
  }
  if(pageName==='dist/donate/index.html'){
    for(const id of ['donate-heading','giving-heading','purpose-heading','evidence-heading','other-ways','faq-heading'])if(!html.includes(`id="${id}"`))errors.push(`${file}: missing donation section ${id}`);
    if((html.match(/<h1\b/g)||[]).length!==1||/href="#"/.test(html))errors.push(`${file}: invalid donation heading or placeholder link`);
    for(const provider of ['paystack','flutterwave'])if(!html.includes(`name="donation-gateway" value="${provider}"`))errors.push(`${file}: missing donation provider ${provider}`);
    for(const text of ['Give once','Monthly','No card or bank details','does not create a subscription','not fixed-price','does not promise tax deductibility','<noscript>'])if(!html.includes(text))errors.push(`${file}: missing donor explanation ${text}`);
    if(!html.includes('data-donation-status')||!html.includes('aria-live="polite"'))errors.push(`${file}: missing accessible donation status`);
    if(/name="(?:card|card_number|cvv|account_number)"/.test(html))errors.push(`${file}: payment details must not be collected here`);
  }
  if(pageName==='dist/contact/thanks/index.html'&&(!html.includes('noindex,follow')||!html.includes('24 hours')||!html.includes('not an inbox delivery receipt')))errors.push(`${file}: incomplete or misleading confirmation page`);
  if(pageName==='dist/contact/privacy/index.html'){
    for(const text of ['30 days','not a promise','not a confidential safeguarding','https://formsubmit.co/privacy.pdf'])if(!html.includes(text))errors.push(`${file}: missing contact privacy explanation ${text}`);
  }
  if(/^dist[\\/]resources[\\/]index\.html$/.test(file)){
    for(const id of ['resources-heading','library-heading','resource-list','media-heading'])if(!html.includes(`id="${id}"`))errors.push(`${file}: missing resource section ${id}`);
    if((html.match(/<h1\b/g)||[]).length!==1)errors.push(`${file}: resources must have exactly one main heading`);
    if(!html.includes('data-resource-filter=')||(getPublishedResources(snapshot).length&&!html.includes('data-resource-category=')))errors.push(`${file}: missing document filtering`);
    if(/href="#"/.test(html))errors.push(`${file}: placeholder resource link`);
  }
  if(/^dist[\\/]projects[\\/][^\\/]+[\\/]index\.html$/.test(file)){
    for(const section of ['overview','context','what-we-did','results','stories','gallery','resources']){
      if(!html.includes(`id="${section}"`))errors.push(`${file}: missing project detail section ${section}`);
      if(!html.includes(`href="#${section}"`))errors.push(`${file}: missing section navigation ${section}`);
    }
    if((html.match(/<h1\b/g)||[]).length!==1)errors.push(`${file}: project detail must have exactly one main heading`);
  }
  for(const m of html.matchAll(/(?:href|src)="([^"]+)"/g)){
    const url=m[1].split('#')[0].split('?')[0];
    if(!url||!url.startsWith('/')||url.startsWith('//'))continue;
    const target=path.join('dist',decodeURIComponent(url));
    try{await access(url.endsWith('/')?path.join(target,'index.html'):target);}catch{errors.push(`${file}: missing ${url}`);}
  }
  if(/SANITY_API_(?:READ|WRITE)_TOKEN|ghp_[A-Za-z0-9]+/.test(html))errors.push(`${file}: possible credential in build output.`);
}
for(const file of ['dist/index.html','dist/about/index.html','dist/team/index.html','dist/where-we-work/index.html','dist/programmes/index.html','dist/projects/index.html','dist/stories/index.html','dist/resources/index.html','dist/contact/index.html','dist/contact/thanks/index.html','dist/contact/privacy/index.html','dist/impact/index.html','dist/donate/index.html','dist/sitemap-index.xml','dist/robots.txt'])try{await access(file);}catch{errors.push(`Missing required build output: ${file}`);}
if(errors.length)throw new Error(errors.join('\n'));
console.log(`Verified ${htmlFiles.length} HTML pages: local links and assets resolve; required routes and metadata files exist.`);
