import snapshot from '../../content/snapshot.json';
import type {PortableTextBlock} from '@portabletext/types';
import {createClient} from '@sanity/client';
import {CONTENT_QUERY} from './queries';
import settings from '../../config/sanity.json';

export interface ContentImage {url: string; alt: string; assetId?: string}
export interface ContentItem {
  _id?: string; title: string; slug: string; summary?: string; image?: ContentImage;
  body: PortableTextBlock[]; sortOrder?: number; publishedAt?: string; category?: string;
  location?: string; fileUrl?: string; seoTitle?: string; seoDescription?: string;
}
export interface SiteContent {
  schemaVersion: number;
  settings: {organisationName: string; shortName: string; diocese: string; tagline: string;
    email: string; phone: string; address: string; country: string; donationUrl: string;
    socialLinks: {label: string; url: string}[]; seoTitle: string; seoDescription: string};
  home: {heroKicker: string; heroStatement: string; heroHighlight: string; heroIntro: string;
    heroImage: ContentImage; location: string; aboutIntro: string; aboutImage: ContentImage;
    impactImage: ContentImage; impactFacts: {_key: string; value: string; label: string}[];
    programmeHeading: string; projectsHeading: string; storiesHeading: string;
    partnersHeading: string; partnersIntro: string; supportIntro: string; supportImage: ContentImage};
  programmes: ContentItem[]; projects: ContentItem[]; stories: ContentItem[]; reports: ContentItem[];
  partners: {name: string; sortOrder?: number; logo?: ContentImage; website?: string}[];
}

let contentPromise: Promise<SiteContent> | undefined;
export function getContent(): Promise<SiteContent> {
  return contentPromise ??= loadContent();
}
async function loadContent(): Promise<SiteContent> {
  if (import.meta.env.CONTENT_SOURCE !== 'sanity') return snapshot as unknown as SiteContent;
  const projectId = import.meta.env.PUBLIC_SANITY_PROJECT_ID || settings.projectId;
  const dataset = import.meta.env.PUBLIC_SANITY_DATASET || settings.dataset;
  if (!projectId || !dataset) throw new Error('CONTENT_SOURCE=sanity requires the Sanity project ID and dataset.');
  const client = createClient({projectId, dataset, apiVersion:'2026-10-05', useCdn:false,
    perspective:'published', token:import.meta.env.SANITY_API_READ_TOKEN || undefined});
  const content = await client.fetch(CONTENT_QUERY);
  if (!content.settings || !content.home) throw new Error('Publish Site settings and Homepage in Sanity before building.');
  return content as unknown as SiteContent;
}
export function itemUrl(type: 'programmes' | 'projects' | 'stories', slug: string) {
  return `/${type}/${encodeURIComponent(slug)}/`;
}
export function formatDate(value?: string) {
  return value ? new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(value)) : '';
}
export function safeExternalUrl(value?: string): string | undefined {
  if (!value) return undefined;
  try {const parsed = new URL(value); return parsed.protocol === 'https:' && !parsed.username && !parsed.password ? parsed.href : undefined;} catch {return undefined;}
}
export function safeDownloadUrl(value?: string): string | undefined {
  return value?.startsWith('/assets/sanity/') && /^\/assets\/sanity\/[a-zA-Z0-9.-]+$/.test(value) ? value : safeExternalUrl(value);
}
