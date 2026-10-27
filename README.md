# JDPI Maiduguri website

Astro public website and a standalone Sanity Studio for the Justice Development and Peace Initiative, Catholic Diocese of Maiduguri. The homepage retains the Canva reference layout. Staff manage content through named fields rather than changing the design.

## Current state

- Astro builds from `content/snapshot.json`, a committed copy of the Canva reference content.
- Sanity schemas, draft content previews, asset import, exports, and the GitHub publishing trigger are implemented.
- Sanity project `j2wxo4uh`, dataset `production`, is connected. The standalone editor is hosted on Vercel at https://studio.jdpimaiduguri.org/. The direct https://jdpi-maiduguri-studio.vercel.app/ address and former https://jdpi-maiduguri-editor.sanity.studio/ remain fallbacks.
- The donation page accepts the organisation’s approved HTTPS checkout link; until one is added it directs donors to contact JDPI.
- GitHub Actions verifies and packages every code revision. Once the Sanity webhook is connected, published content is exported, committed and rebuilt automatically.
- Vercel project `jdpi-maiduguri-landing-page` in the JDPI team is connected to the GitHub repository. Pushes to `main` trigger production builds. The older, owner-only Sites version is retired; its recoverable source is in `backups/legacy-sites-2026-10-27/`.
- The story-led `/impact/` page uses approved annual-report photographs, project-profile narratives and curated 2025 results from `src/lib/impact.ts`. These dedicated report highlights are distinct from the homepage’s CMS impact fields. When updating the reporting year, review dates, units, photo captions and source pages together; do not sum programme counts as unique people reached or attribute a photographed person to a separate case story.
- `/programmes/` is the Programmes hub, with horizontal desktop tabs and a labelled phone selector choosing one compact, full-width programme panel. Panels show an introduction and key reach figure; **More details** opens a native modal containing full CMS article content (when provided), interventions, documented location examples, report context and related projects. Escape, the close button and backdrop dismissal restore focus to the opener; without JavaScript, native disclosures keep the details readable. Its catalogue, images and summaries follow published Sanity programme content through the existing snapshot workflow. Interventions and documented location examples are sourced in `src/data/programme-interventions.json`; related projects use explicit CMS references or reviewed report associations. Outcome highlights are separately curated in `src/lib/impact.ts`. Economic Empowerment shows WE-SING's 2025 project reach, explicitly not a programme-wide total. Review report highlights, units and location sources together when changing the reporting year. Individual programme articles remain editable through their existing Sanity documents.

## Vercel deployment

Use the Astro preset, repository root `./`, build command `npm run build`, and output directory `dist`. Keep `CONTENT_SOURCE=snapshot` so deployments use the published content recorded in Git. The existing GitHub content refresh workflow commits updated Sanity snapshots; Vercel deploys those commits through the same Git connection.

Leave `PUBLIC_SITE_URL` unset on Vercel: canonical links, the sitemap, and robots.txt use `VERCEL_PROJECT_PRODUCTION_URL`. Set `PUBLIC_SITE_URL` only when an explicit domain override is required. Keep Vercel's access to system environment variables enabled. The Sanity editor is already deployed separately; do not add a duplicate Sanity project through the optional Vercel integration.

## Development

Requires Node 22.12 or later (CI uses Node 24).

```sh
npm ci
npm run dev
npm run verify
```

Run `npm run studio:dev` after configuring `studio/.env`. Use `npm run studio:build` to verify the real configured editor and `npm run studio:deploy` to host it with Sanity.

## Content and version history

`content/seed.json` is the initial source for import. `content/snapshot.json` is the exact content used by the public build. Published Sanity content can be exported with `npm run content:snapshot`; images and PDFs are copied into `public/assets/sanity/`, with raw document IDs and an asset checksum manifest retained in `content/`.

Code and release snapshots are committed to the private GitHub repository. Editor drafts stay in Sanity. Treat staff publication as approval: contributors prepare drafts, designated publishers review and publish. The bot snapshots published documents only.

## Handover

- [Account and project setup](docs/SETUP.md)
- [Staff editing guide](docs/EDITOR-GUIDE.md)
- [Standalone Studio hosting and subdomain](docs/STUDIO-HOSTING.md)
- [Publishing and GitHub webhook](docs/PUBLISHING.md)
- [Migration scope and quality review](docs/MIGRATION.md)
- [Recovery and maintenance](docs/MAINTENANCE.md)
- [Donation page and checkout activation](docs/donations-page.md)

Do not store payment credentials, API tokens, beneficiary records or case files in this repository or this marketing CMS.
