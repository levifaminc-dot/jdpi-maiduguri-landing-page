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
  security:{csp:{
    // Astro hashes each page's own inline scripts. No unsafe-inline/eval for JS.
    scriptDirective:{resources:["'self'"]},
    styleDirective:{resources:["'self'","'unsafe-inline'",'https://fonts.googleapis.com']},
    directives:["default-src 'self'","img-src 'self' data: https://cdn.sanity.io","font-src 'self' https://fonts.gstatic.com","connect-src 'self'","frame-src https://www.google.com","object-src 'none'","base-uri 'none'","form-action 'self' https://formsubmit.co"],
  }},
  integrations: [
    sitemap(),
    ...(projectId && dataset ? [sanity({projectId, dataset, apiVersion: '2026-10-05', useCdn: false})] : []),
  ],
});
