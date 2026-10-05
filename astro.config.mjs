import {defineConfig} from 'astro/config';
import {loadEnv} from 'vite';
import sanity from '@sanity/astro';
import sitemap from '@astrojs/sitemap';

const env = {...loadEnv(process.env.NODE_ENV || 'development', process.cwd(), ''), ...process.env};
const projectId = env.PUBLIC_SANITY_PROJECT_ID;
const dataset = env.PUBLIC_SANITY_DATASET;
const origin = env.PUBLIC_SITE_URL || 'https://jdpi-maiduguri-impact.ifexls.chatgpt.site';

export default defineConfig({
  site: origin,
  output: 'static',
  integrations: [
    sitemap(),
    ...(projectId && dataset ? [sanity({projectId, dataset, apiVersion: '2026-10-05', useCdn: false})] : []),
  ],
});
