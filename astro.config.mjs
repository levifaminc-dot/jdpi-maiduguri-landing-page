import {defineConfig} from 'astro/config';
import {loadEnv} from 'vite';
import sanity from '@sanity/astro';
import sitemap from '@astrojs/sitemap';
import {readFileSync} from 'node:fs';
const settings=JSON.parse(readFileSync(new URL('./config/sanity.json',import.meta.url),'utf8'));

const env = {...loadEnv(process.env.NODE_ENV || 'development', process.cwd(), ''), ...process.env};
const projectId = env.PUBLIC_SANITY_PROJECT_ID || settings.projectId;
const dataset = env.PUBLIC_SANITY_DATASET || settings.dataset;
const vercelOrigin = env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${env.VERCEL_PROJECT_PRODUCTION_URL}` : undefined;
const origin = env.PUBLIC_SITE_URL || vercelOrigin || 'https://jdpi-maiduguri-landing-page.vercel.app';

export default defineConfig({
  site: origin,
  output: 'static',
  integrations: [
    sitemap(),
    ...(projectId && dataset ? [sanity({projectId, dataset, apiVersion: '2026-10-05', useCdn: false})] : []),
  ],
});
