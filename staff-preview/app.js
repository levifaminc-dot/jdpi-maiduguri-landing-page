const icons = {
  dashboard: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
  megaphone: '<path d="m4 10 13-5v14L4 14Z"/><path d="M4 10H2v4h2m3 1 1 6h3l-1-5M20 8l2-1m-2 5h2m-2 4 2 1"/>',
  folder: '<path d="M3 6a2 2 0 0 1 2-2h5l2 3h7a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/>',
  users: '<circle cx="9" cy="7" r="3"/><path d="M3 21v-3a6 6 0 0 1 12 0v3m2-17a3 3 0 0 1 0 6m2 4a6 6 0 0 1 3 5v2"/>',
  leaf: '<path d="M20 3C8 2 1 8 5 16c4 8 15 3 15-13ZM4 21 15 10"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10v1"/>',
  refresh: '<path d="M20 8a8 8 0 1 0 0 8m0-13v5h-5"/>',
  search: '<circle cx="10" cy="10" r="6.5"/><path d="m15 15 6 6"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  arrow: '<path d="M4 12h16m-6-6 6 6-6 6"/>',
  comment: '<path d="M21 11a9 9 0 0 1-9 9H4l-2 2v-8a9 9 0 1 1 19-3Z"/>',
  heart: '<path d="M12 21 3.5 12.5a5 5 0 0 1 7-7L12 7l1.5-1.5a5 5 0 0 1 7 7Z"/>',
  bookmark: '<path d="M6 21V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v17l-6-4Z"/>',
  pin: '<path d="m9 3 6 0-1 6 4 4v2H6v-2l4-4Zm3 12v7"/>',
  location: '<path d="M19 10c0 5-7 12-7 12S5 15 5 10a7 7 0 1 1 14 0Z"/><circle cx="12" cy="10" r="2"/>',
  download: '<path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/>',
  upload: '<path d="M12 16V3m-5 5 5-5 5 5M4 16v5h16v-5"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 6 9 7 9-7"/>',
};
const icon = name => `<svg viewBox="0 0 24 24" aria-hidden="true">${icons[name] || icons.info}</svg>`;
const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[c]));
const initials = name => name.split(' ').slice(0, 2).map(part => part[0]).join('').toUpperCase();
const me = {id: 'me', name: 'Amara Yusuf', role: 'Programme Officer', department: 'Programmes', location: 'Maiduguri', email: 'amara.yusuf@example.invalid', color: 'dark'};
const people = [me,
  {id:'staff2',name:'Daniel Okoro',role:'Operations Coordinator',department:'Operations',location:'Maiduguri',email:'daniel.okoro@example.invalid',color:'sand'},
  {id:'staff3',name:'Hauwa Musa',role:'Nutrition Officer',department:'Programmes',location:'Mubi',email:'hauwa.musa@example.invalid',color:'lilac'},
  {id:'staff4',name:'Samuel Eze',role:'Monitoring & Evaluation Officer',department:'MEAL',location:'Michika',email:'samuel.eze@example.invalid',color:'blue'},
  {id:'staff5',name:'Grace Bello',role:'People & Culture Officer',department:'People & culture',location:'Maiduguri',email:'grace.bello@example.invalid',color:'lilac'},
  {id:'staff6',name:'Ibrahim Ali',role:'Finance Officer',department:'Finance',location:'Maiduguri',email:'ibrahim.ali@example.invalid',color:'sand'},
];
const initialPosts = [
  {id:'post1',author:'staff2',title:'Let’s make our field visits a little smoother',body:'A new sample field visit checklist is ready in the document library. Please review it before your next visit and share any suggestions below. Small improvements make a difference for the whole team.',category:'Operations',audience:'All staff',date:'08 Oct 2026',pinned:true,saved:false,liked:false,likes:12,comments:[{author:'staff3',text:'The checklist is a useful starting point. Could we include a space for community feedback?'}]},
  {id:'post2',author:'staff5',title:'Welcome to a workspace built around our people',body:'This is your space to share updates, find useful resources and connect with colleagues across our offices. Everyone can post an announcement, add a document and join the conversation.',category:'People & culture',audience:'All staff',date:'07 Oct 2026',pinned:false,saved:false,liked:false,likes:8,comments:[]},
  {id:'post3',author:'staff3',title:'What is working well in your programme?',body:'Let’s exchange practical ideas from the field. What has helped your team listen, adapt and work more closely with communities? Share one lesson other colleagues could put into practice.',category:'Programme updates',audience:'All staff',date:'06 Oct 2026',pinned:false,saved:false,liked:false,likes:5,comments:[{author:'staff4',text:'Short feedback conversations after activities have helped us spot improvements earlier.'}]},
];
const initialDocs = [
  {id:'doc1',title:'Field visit checklist',folder:'Templates',audience:'All staff',owner:'staff2',date:'08 Oct 2026',type:'TXT',size:'Sample',text:'SAMPLE ONLY — NOT AN APPROVED JDPI DOCUMENT\n\nField visit checklist\n1. Confirm visit objectives.\n2. Check required materials.\n3. Discuss accessibility and community participation.\n4. Record feedback and next steps.\n'},
  {id:'doc2',title:'Staff welcome guide',folder:'Policies & guidance',audience:'All staff',owner:'staff5',date:'07 Oct 2026',type:'TXT',size:'Sample',text:'SAMPLE ONLY — NOT AN APPROVED JDPI POLICY\n\nWelcome guide\nThis fictional file demonstrates a staff resource download. Real policies will be added after review and secure hosting setup.\n'},
  {id:'doc3',title:'Programme learning notes',folder:'Programme resources',audience:'Programmes',owner:'staff3',date:'06 Oct 2026',type:'TXT',size:'Sample',text:'SAMPLE ONLY — NOT A REAL JDPI REPORT\n\nProgramme learning notes\nA placeholder for reviewed learning resources.\n'},
];
initialDocs.forEach((doc, index) => {doc.sampleUrl = ['/samples/field-visit-checklist.txt','/samples/staff-welcome-guide.txt','/samples/programme-learning-notes.txt'][index];});
// Intentionally memory-only: never store staff data, messages or documents in browser storage.
let posts = structuredClone(initialPosts), documents = structuredClone(initialDocs);
let activeFilter = 'All updates', category = 'All categories', query = '', folder = 'All folders', department = 'All departments', location = 'All locations', editing = null;
const openComments = new Set();
const main = document.querySelector('main');
document.querySelector('.skip').addEventListener('click', event => {event.preventDefault(); main.focus(); main.scrollIntoView();});
const today = () => new Intl.DateTimeFormat('en-GB', {day:'2-digit',month:'short',year:'numeric'}).format(new Date());
const person = id => people.find(p => p.id === id) || me;
const avatar = p => `<span class="avatar ${p.color}">${escape(initials(p.name))}</span>`;
const options = (values, current) => values.map(v => `<option${v === current ? ' selected' : ''}>${escape(v)}</option>`).join('');
const empty = text => `<div class="empty">${escape(text)}</div>`;
function toast(message) {
  const el = document.querySelector('#toast'); el.textContent = message; el.hidden = false;
  clearTimeout(toast.timer); toast.timer = setTimeout(() => {el.hidden = true;}, 5000);
}
function heading(title, description, action = '') {
  return `<div class="page-heading"><div><p class="eyebrow">JDPI STAFF WORKSPACE</p><h1>${title}</h1><p class="muted">${description}</p></div>${action}</div>`;
}
const composeButton = `<button class="button primary" data-action="compose">${icon('plus')} New announcement</button>`;
const uploadButton = `<button class="button primary" data-action="upload">${icon('upload')} Add document</button>`;
function postCard(post) {
  const author = person(post.author), owned = post.author === me.id;
  return `<article class="feed-card" data-post="${post.id}">
    <div class="post-author">${avatar(author)}<div><strong>${escape(author.name)}</strong><small>${escape(author.department)} · ${escape(post.date)}</small></div>${post.pinned ? `<span class="tag">${icon('pin')} Pinned update</span>` : `<span class="tag ${post.category === 'People & culture' ? 'orange' : 'grey'}">${escape(post.category)}</span>`}</div>
    <h3>${escape(post.title)}</h3><p class="post-body">${escape(post.body)}</p><div class="post-meta"><span>${escape(post.category)}</span><span>Audience label: ${escape(post.audience)}</span></div>
    <div class="post-actions"><button data-action="like" data-id="${post.id}" aria-label="Appreciate ${escape(post.title)}" aria-pressed="${post.liked}">${icon('heart')} ${post.likes + Number(post.liked)}</button><button data-action="comments" data-id="${post.id}" aria-expanded="${openComments.has(post.id)}" aria-controls="comments-${post.id}">${icon('comment')} ${post.comments.length} ${post.comments.length === 1 ? 'comment' : 'comments'}</button><button data-action="save" data-id="${post.id}" aria-pressed="${post.saved}">${icon('bookmark')} ${post.saved ? 'Saved' : 'Save'}</button>${owned ? `<button class="own-edit" data-action="edit" data-id="${post.id}">Edit my post</button><button data-action="remove-post" data-id="${post.id}">Remove</button>` : ''}</div>
    <section id="comments-${post.id}" class="comments" aria-label="Comments on ${escape(post.title)}" ${openComments.has(post.id) ? '' : 'hidden'}>${post.comments.map(c => `<div class="comment">${avatar(person(c.author))}<div><strong>${escape(person(c.author).name)}</strong><p>${escape(c.text)}</p></div></div>`).join('')}<form class="comment-form" data-comment="${post.id}"><input aria-label="Comment on ${escape(post.title)}" name="comment" placeholder="Join the conversation…" maxlength="1000" required><button class="button primary" type="submit">Post</button></form></section>
  </article>`;
}
function feedFilters() {
  return `<div class="feed-tabs" aria-label="Filter announcements">${['All updates','Pinned','Saved'].map(f => `<button data-action="feed-filter" data-filter="${f}" aria-pressed="${f === activeFilter}">${f}</button>`).join('')}</div>`;
}
function filteredPosts() {
  return posts.filter(p => (activeFilter !== 'Pinned' || p.pinned) && (activeFilter !== 'Saved' || p.saved) && (category === 'All categories' || p.category === category));
}
function miniDocuments() {
  return documents.slice(0, 2).map(d => `<a class="document-mini" href="#documents"><span class="document-symbol">${d.type}</span><div><strong>${escape(d.title)}</strong><small>${escape(d.folder)} · ${d.date}</small></div></a>`).join('');
}
function dashboard() {
  return heading('Good to have you here, Amara.', 'Stay connected. Share what matters. Find what you need.', composeButton) + `
  <section class="welcome" aria-labelledby="welcome-heading"><div><p class="eyebrow">ONE TEAM. A SHARED PURPOSE.</p><h2 id="welcome-heading">The work we do together<br>starts with staying connected.</h2><p>Your people, updates and resources — all in one place.</p></div><a class="button" href="#directory">Meet your colleagues ${icon('arrow')}</a></section>
  <div class="stats"><a class="stat" href="#announcements"><span class="stat-icon">${icon('megaphone')}</span><div><strong>${posts.length}</strong><span>Sample announcements</span></div><small>Keep in the loop</small></a><a class="stat" href="#documents"><span class="stat-icon">${icon('folder')}</span><div><strong>${documents.length}</strong><span>Demo documents</span></div><small>Shared knowledge</small></a><a class="stat" href="#directory"><span class="stat-icon">${icon('users')}</span><div><strong>210</strong><span>Planned staff accounts</span></div><small>6 demo profiles</small></a></div>
  <div class="content-grid"><section aria-labelledby="updates-heading"><div class="section-heading"><h2 id="updates-heading">From your colleagues</h2><a class="text-link" href="#announcements">All announcements ${icon('arrow')}</a></div>${feedFilters()}${filteredPosts().slice(0, 3).map(postCard).join('') || empty('No updates here yet. Save an announcement to find it here later.')}</section><aside class="right-rail" aria-label="Workspace shortcuts"><section class="side-card"><h2>Recently shared</h2>${miniDocuments()}<a class="text-link" href="#documents">Open document library ${icon('arrow')}</a></section><section class="side-card"><h2>Our people, connected</h2><div class="team-stack">${people.slice(1, 5).map(avatar).join('')}<span class="avatar">+2</span></div><p class="team-note">Explore six fictional colleagues across our sample offices.</p><a class="text-link" href="#directory">Browse staff directory ${icon('arrow')}</a></section><section class="side-card help-card"><p class="eyebrow">A SPACE FOR EVERY VOICE</p><h2>You can contribute, too.</h2><p>Share an update, upload a useful resource or add your perspective to a conversation.</p></section></aside></div>`;
}
function announcements() {
  return heading('Announcements', 'Updates, ideas and conversations from across the team.', composeButton) + `<div class="tools"><label class="muted" for="category-filter">Category</label><select id="category-filter">${options(['All categories','General','Programme updates','People & culture','Operations'], category)}</select><span class="muted">${posts.length} sample updates</span></div>${feedFilters()}<div class="content-grid"><section aria-label="Announcement feed">${filteredPosts().map(postCard).join('') || empty('No announcements match this filter.')}</section><aside class="right-rail"><section class="side-card help-card"><h2>Make it a conversation.</h2><p>All staff can post and comment. Keep updates clear, respectful and useful. Never include confidential case information in general announcements.</p></section></aside></div>`;
}
function documentRows(list) {
  return list.length ? `<div class="table-wrap"><table><thead><tr><th scope="col">Document</th><th scope="col">Folder</th><th scope="col">Audience label</th><th scope="col">Shared by</th><th scope="col">Actions</th></tr></thead><tbody>${list.map(d => `<tr><td><div class="doc-title"><span class="document-symbol">${escape(d.type)}</span><div><strong>${escape(d.title)}</strong><small>${escape(d.size)} · ${escape(d.date)}</small></div></div></td><td>${escape(d.folder)}</td><td><span class="tag">${escape(d.audience)}</span></td><td>${escape(person(d.owner).name)}</td><td>${d.sampleUrl ? `<a class="text-link" href="${d.sampleUrl}" download>${icon('download')} Download sample</a>` : `<button class="text-link" data-action="download" data-id="${d.id}">${icon('download')} Download local file</button>`}${d.owner === me.id ? ` <button class="text-link" data-action="remove-document" data-id="${d.id}">Remove my file</button>` : ''}</td></tr>`).join('')}</tbody></table></div>` : empty('No documents match your search. Try another title or folder.');
}
function documentPage() {
  return heading('Document library', 'Useful resources, organised and easy to find.', uploadButton) + `<p class="demo-notice">Local preview: sample TXT downloads only. Added files stay in this tab’s memory. Audience labels demonstrate the design; access control is not implemented.</p><div class="tools"><input id="document-search" aria-label="Search documents" placeholder="Search documents…" value="${escape(query)}"><select id="folder-filter" aria-label="Filter documents by folder">${options(['All folders','Policies & guidance','Programme resources','Templates'], folder)}</select></div><div id="document-results">${documentRows(filterDocs())}</div>`;
}
function filterDocs(search = query) { return documents.filter(d => `${d.title} ${d.folder}`.toLowerCase().includes(search.toLowerCase()) && (folder === 'All folders' || d.folder === folder)); }
function personCard(p) {
  return `<article class="person-card"><div class="person-top">${avatar(p)}<div><h3>${escape(p.name)}</h3><p>${escape(p.role)}</p></div></div><span class="tag grey">${escape(p.department)}</span><div class="person-info">${icon('location')} ${escape(p.location)}</div><button class="text-link" data-action="profile" data-id="${p.id}">View sample profile ${icon('arrow')}</button></article>`;
}
function filteredPeople(search = query) { return people.filter(p => `${p.name} ${p.role} ${p.department} ${p.location}`.toLowerCase().includes(search.toLowerCase()) && (department === 'All departments' || p.department === department) && (location === 'All locations' || p.location === location)); }
function directory() {
  return heading('People behind the purpose.', 'Find a colleague by name, team or office.') + `<p class="demo-notice">Six fictional profiles demonstrate a directory intended for approximately 210 staff. No actual staff records or contact details are included.</p><div class="tools"><input id="people-search" aria-label="Search staff" placeholder="Search name, role or team…" value="${escape(query)}"><select id="department-filter" aria-label="Filter staff by department">${options(['All departments','Programmes','Operations','MEAL','People & culture','Finance'], department)}</select><select id="location-filter" aria-label="Filter staff by office">${options(['All locations','Maiduguri','Mubi','Michika'], location)}</select></div><div id="people-results" class="directory-grid">${filteredPeople().map(personCard).join('') || empty('No colleagues match these filters.')}</div>`;
}
function searchPage() {
  const term = query.toLowerCase(), foundPosts = posts.filter(p => `${p.title} ${p.body} ${person(p.author).name}`.toLowerCase().includes(term));
  const foundDocs = documents.filter(d => `${d.title} ${d.folder}`.toLowerCase().includes(term));
  const foundPeople = people.filter(p => `${p.name} ${p.role} ${p.department} ${p.location}`.toLowerCase().includes(term));
  return heading('Search your workspace', query ? `Results for “${escape(query)}”` : 'Enter a search term in the top search bar.') + (query ? `<section class="search-section"><h2>Announcements · ${foundPosts.length}</h2>${foundPosts.map(postCard).join('') || empty('No matching announcements.')}</section><section class="search-section"><h2>Documents · ${foundDocs.length}</h2>${documentRows(foundDocs)}</section><section class="search-section"><h2>People · ${foundPeople.length}</h2><div class="directory-grid">${foundPeople.map(personCard).join('') || empty('No matching colleagues.')}</div></section>` : '');
}
const views = {dashboard, announcements, documents:documentPage, directory, search:searchPage};
function currentView() { return locationHash(); }
function locationHash() { const value = window.location.hash.slice(1); return Object.hasOwn(views, value) ? value : 'dashboard'; }
function render() {
  const view = currentView();
  document.querySelector('#crumb').textContent = ({dashboard:'Overview',announcements:'Announcements',documents:'Documents',directory:'Staff directory',search:'Search'})[view];
  document.querySelectorAll('[data-view]').forEach(link => { if (link.dataset.view === view) link.setAttribute('aria-current','page'); else link.removeAttribute('aria-current'); });
  document.querySelector('#nav-count').textContent = posts.length;
  main.innerHTML = views[view]();
  document.title = `JDPI • ${{dashboard:'Overview',announcements:'Announcements',documents:'Documents',directory:'Staff directory',search:'Search'}[view]} • Local preview`;
}
window.addEventListener('hashchange', () => {query = currentView() === 'search' ? query : ''; render(); main.focus(); window.scrollTo(0, 0);});
function openCompose(post) {
  const form = document.querySelector('#compose-form'); form.reset(); editing = post?.id || null;
  document.querySelector('#compose-heading').textContent = post ? 'Edit your announcement' : 'New announcement';
  form.querySelector('[type=submit]').textContent = post ? 'Save sample changes' : 'Publish sample announcement';
  if (post) {for (const name of ['title','body','category','audience']) form.elements[name].value = post[name];}
  document.querySelector('#compose-dialog').showModal();
}
function showDetail(html) {document.querySelector('#detail-content').innerHTML = html; document.querySelector('#detail-dialog').showModal();}
function detailHeading(title, eyebrow = 'LOCAL PREVIEW') {return `<div class="dialog-heading"><div><p class="eyebrow">${eyebrow}</p><h2 id="detail-heading">${escape(title)}</h2></div><button class="icon-button" data-close aria-label="Close details">×</button></div>`;}
function guide() {
  showDetail(detailHeading('Your workspace, before we build it.') + `<p>This interactive prototype is for reviewing the design and everyday staff workflows.</p><ul><li>Post announcements, comment, appreciate and save updates.</li><li>Search documents, download sample files and select a sample file locally.</li><li>Find fictional colleagues by office, role or department.</li></ul><p class="demo-notice">There is no real authentication, server storage, department security or email delivery. All changes disappear when you reload. Do not enter real staff details, sensitive messages or confidential files.</p><p class="muted">The production workspace will be a separate secured application. Hosting approval, permissions, backups and testing are required before staff are invited.</p>`);
}
document.querySelector('#preview-guide').addEventListener('click', guide);
document.querySelector('#preview-info').addEventListener('click', guide);
document.querySelector('#reset-demo').addEventListener('click', () => showDetail(detailHeading('Reset the sample workspace?') + `<p>This clears only your demo posts, comments and selected files in this tab. No real records exist here.</p><div class="form-actions"><button class="button secondary" data-close>Cancel</button><button class="button primary" data-action="confirm-reset">Reset sample data</button></div>`));
document.addEventListener('click', event => {
  if (event.target.closest('[data-close]')) {event.target.closest('dialog').close(); return;}
  const button = event.target.closest('[data-action]'); if (!button) return;
  const {action, id} = button.dataset, post = posts.find(p => p.id === id);
  if (action === 'compose') openCompose();
  if (action === 'upload') {document.querySelector('#upload-form').reset(); document.querySelector('#file-error').textContent = ''; document.querySelector('#upload-dialog').showModal();}
  if (action === 'edit' && post?.author === me.id) openCompose(post);
  if (action === 'like' && post) {post.liked = !post.liked; render(); restoreButton(action, id);}
  if (action === 'save' && post) {post.saved = !post.saved; render(); restoreButton(action, id); toast(post.saved ? 'Saved in this preview session.' : 'Removed from saved updates.');}
  if (action === 'comments' && post) {openComments.has(id) ? openComments.delete(id) : openComments.add(id); render(); restoreButton(action, id);}
  if (action === 'feed-filter') {activeFilter = button.dataset.filter; render(); main.querySelector(`[data-filter="${activeFilter}"]`)?.focus();}
  if (action === 'remove-post' && post?.author === me.id) {showDetail(detailHeading('Remove your sample announcement?') + `<p>${escape(post.title)}</p><div class="form-actions"><button class="button secondary" data-close>Keep it</button><button class="button primary" data-action="confirm-remove-post" data-id="${id}">Remove sample post</button></div>`);}
  if (action === 'confirm-remove-post' && post?.author === me.id) {posts = posts.filter(p => p.id !== id); document.querySelector('#detail-dialog').close(); render(); toast('Your sample announcement was removed.');}
  if (action === 'profile') {
    const p = person(id);
    showDetail(detailHeading(p.name, 'FICTIONAL STAFF PROFILE') + `<div class="person-top">${avatar(p)}<div><h3>${escape(p.role)}</h3><p>${escape(p.department)}</p></div></div><dl class="profile-details"><div><dt>Office</dt><dd>${escape(p.location)}</dd></div><div><dt>Department</dt><dd>${escape(p.department)}</dd></div><div><dt>Sample email · not deliverable</dt><dd>${escape(p.email)}</dd></div><div><dt>Directory status</dt><dd>Fictional preview record</dd></div></dl><p class="demo-notice">Production profiles will contain approved work contact details only.</p>`);
  }
  if (action === 'download') {
    const doc = documents.find(d => d.id === id); if (!doc) return;
    const blob = doc.file || new Blob([doc.text], {type:'text/plain'}), url = URL.createObjectURL(blob);
    const link = document.createElement('a'); link.href = url; link.download = doc.file ? doc.file.name : `${doc.title.replace(/[^a-zA-Z0-9 -]/g,'')}-SAMPLE.txt`; link.hidden = true; document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 10000);
    toast('Sample download prepared. No server request was made.');
  }
  if (action === 'remove-document') {
    const doc = documents.find(d => d.id === id); if (doc?.owner !== me.id) return;
    showDetail(detailHeading('Remove your sample document?') + `<p>${escape(doc.title)}</p><div class="form-actions"><button class="button secondary" data-close>Keep it</button><button class="button primary" data-action="confirm-remove-document" data-id="${id}">Remove sample file</button></div>`);
  }
  if (action === 'confirm-remove-document') {documents = documents.filter(d => d.id !== id || d.owner !== me.id); document.querySelector('#detail-dialog').close(); render(); toast('Your sample document was removed from this tab.');}
  if (action === 'confirm-reset') {posts = structuredClone(initialPosts); documents = structuredClone(initialDocs); openComments.clear(); query = ''; activeFilter = 'All updates'; category = 'All categories'; folder = 'All folders'; department = 'All departments'; location = 'All locations'; document.querySelector('#global-search').value = ''; document.querySelector('#detail-dialog').close(); render(); toast('Sample workspace reset.');}
});
function restoreButton(action, id) {main.querySelector(`[data-action="${action}"][data-id="${id}"]`)?.focus();}
document.querySelector('#compose-form').addEventListener('submit', event => {
  event.preventDefault(); const form = event.currentTarget, data = Object.fromEntries(new FormData(form));
  const wasEditing = Boolean(editing);
  data.title = data.title.trim(); data.body = data.body.trim();
  if (!data.title || !data.body) {toast('Please add a title and message.'); return;}
  if (editing) {const post = posts.find(p => p.id === editing && p.author === me.id); if (post) Object.assign(post, data);}
  else posts.unshift({...data,id:crypto.randomUUID(),author:me.id,date:today(),pinned:false,liked:false,saved:false,likes:0,comments:[]});
  document.querySelector('#compose-dialog').close(); editing = null; activeFilter = 'All updates'; category = 'All categories';
  if (currentView() !== 'announcements') window.location.hash = 'announcements'; else render();
  toast(wasEditing ? 'Sample announcement updated in this tab only.' : 'Sample announcement published in this tab only.');
});
document.addEventListener('submit', event => {
  const form = event.target.closest('[data-comment]'); if (!form) return;
  event.preventDefault(); const post = posts.find(p => p.id === form.dataset.comment), text = new FormData(form).get('comment').trim();
  if (!post || !text) return; post.comments.push({author:me.id,text}); render(); main.querySelector(`[data-comment="${post.id}"] input`)?.focus(); toast('Sample comment added.');
});
document.querySelector('#upload-form').addEventListener('submit', event => {
  event.preventDefault(); const form = event.currentTarget, data = new FormData(form), file = data.get('file'), error = document.querySelector('#file-error');
  if (!data.get('title').trim()) {error.textContent = 'Please add a document title.'; return;}
  if (!file?.size || file.size > 5 * 1024 * 1024 || !/\.(pdf|docx|xlsx|pptx|txt|csv)$/i.test(file.name)) {error.textContent = 'Select a non-empty PDF, Office document, TXT or CSV up to 5 MB.'; return;}
  documents.unshift({id:crypto.randomUUID(),title:data.get('title').trim(),folder:data.get('folder'),audience:data.get('audience'),owner:me.id,date:today(),type:file.name.split('.').pop().toUpperCase(),size:`${Math.max(1,Math.round(file.size / 1024))} KB · local only`,file});
  form.reset(); document.querySelector('#upload-dialog').close(); query = ''; folder = 'All folders';
  if (currentView() !== 'documents') window.location.hash = 'documents'; else render();
  toast('Sample file added to this tab only. Nothing was uploaded.');
});
document.querySelector('#global-search-form').addEventListener('submit', event => {
  event.preventDefault(); query = document.querySelector('#global-search').value.trim();
  if (currentView() !== 'search') window.location.hash = 'search'; else render();
});
document.addEventListener('change', event => {
  if (event.target.id === 'category-filter') category = event.target.value;
  else if (event.target.id === 'folder-filter') folder = event.target.value;
  else if (event.target.id === 'department-filter') department = event.target.value;
  else if (event.target.id === 'location-filter') location = event.target.value;
  else return;
  const control = event.target.id; render(); document.getElementById(control)?.focus();
});
document.addEventListener('input', event => {
  if (event.target.id === 'document-search') {query = event.target.value; document.querySelector('#document-results').innerHTML = documentRows(filterDocs());}
  if (event.target.id === 'people-search') {query = event.target.value; document.querySelector('#people-results').innerHTML = filteredPeople().map(personCard).join('') || empty('No colleagues match these filters.');}
});
document.querySelectorAll('[data-icon]').forEach(el => {el.innerHTML = icon(el.dataset.icon);});
render();
