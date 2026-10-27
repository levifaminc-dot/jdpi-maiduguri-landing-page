import type {StructureResolver,DefaultDocumentNodeResolver} from 'sanity/structure';
import {CogIcon,HomeIcon,UsersIcon} from '@sanity/icons';
import {DraftPreview} from './preview';
import catalogue from '../content/page-fields.json';
export const singletonTypes=new Set(['siteSettings','homePage',...catalogue.map(page=>page.type)]);
export const structure:StructureResolver=S=>S.list().title('JDPI website').items([
  S.listItem().title('Site settings & donations').icon(CogIcon).child(S.document().schemaType('siteSettings').documentId('siteSettings')),
  S.listItem().title('Homepage & impact figures').icon(HomeIcon).child(S.document().schemaType('homePage').documentId('homePage')),
  S.listItem().title('Website pages').icon(HomeIcon).child(S.list().title('Website pages').items(catalogue.map(page=>S.listItem().title(page.title).child(S.document().schemaType(page.type).documentId(page.type))))),
  S.divider(),
  S.documentTypeListItem('programme').title('Programmes'),S.documentTypeListItem('project').title('Projects'),
  S.documentTypeListItem('story').title('Stories & updates'),S.documentTypeListItem('report').title('Reports & publications'),S.documentTypeListItem('partner').title('Partners & donors'),
  S.documentTypeListItem('vacancy').title('Job vacancies').icon(UsersIcon),
]);
export const defaultDocumentNode:DefaultDocumentNodeResolver=S=>S.document().views([S.view.form().title('Edit'),S.view.component(DraftPreview).title('Draft preview')]);
