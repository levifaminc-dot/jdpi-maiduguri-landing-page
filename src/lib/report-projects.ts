import report from '../../content/report-projects.json' with {type:'json'};
import type {PortableTextBlock} from '@portabletext/types';
import type {ContentItem, SiteContent} from './content';

function blocks(paragraphs: string[], prefix: string): PortableTextBlock[] {
  return paragraphs.map((text, index) => ({
    _type:'block', _key:`${prefix}-${index}`, style:'normal', markDefs:[],
    children:[{_type:'span', _key:`text-${index}`, text, marks:[]}],
  }));
}

// An explicit, reviewable local supplement. Never writes to the live CMS.
// Apply to both content sources so taking a fresh CMS snapshot cannot erase it.
export function applyReportProjects(content: SiteContent): SiteContent {
  // Once migrated, Sanity owns deletions as well as edits. Never resurrect
  // an intentionally removed or unpublished report-derived project.
  if(content.projectsManaged)return content;
  const projects = [...content.projects];
  for (const entry of report.projects) {
    const {paragraphs, appendParagraphs, reportPages, clearDates, ...fields} = entry;
    const index = projects.findIndex(project => project.slug === entry.slug);
    const previous = index >= 0 ? projects[index] : undefined;
    // Once seeded into Sanity, the editor owns the full project. The historical
    // report supplement is only a fallback, never an override of CMS publication.
    if(previous?.profile) continue;
    // Corrections must not accidentally create incomplete existing projects.
    if (!previous && !entry.title) continue;
    const project = {
      ...previous, ...fields,
      reportingYear: reportPages ? report.reportYear : previous?.reportingYear,
      body: paragraphs ? blocks(paragraphs, `report-${entry.slug}`) : [
        ...(previous?.body || []).filter(block => !String(block._key || '').startsWith(`report-${entry.slug}-`)),
        ...blocks(appendParagraphs || [], `report-${entry.slug}`),
      ],
    } as ContentItem;
    if (clearDates) {delete project.startDate; delete project.endDate;}
    if (index >= 0) projects[index] = project;
    else projects.push(project);
  }
  return {...content, projects};
}
