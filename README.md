# JDPI Maiduguri website

Astro public website and a standalone Sanity Studio for the Justice Development and Peace Initiative, Catholic Diocese of Maiduguri. The homepage retains the Canva reference layout. Staff manage content through named fields rather than changing the design.

## Current state

- Astro builds from `content/snapshot.json`, a committed copy of the Canva reference content.
- Sanity schemas, draft content previews, asset import, exports, and the GitHub publishing trigger are implemented.
- A real Sanity project must be connected before staff can edit remotely. No project or account is invented by this repository.
- The donation page accepts the organisation’s approved HTTPS checkout link; until one is added it directs donors to contact JDPI.
- GitHub Actions verifies and packages every code revision. Once the Sanity webhook is connected, published content is exported, committed and rebuilt automatically.
- The existing Sites deployment is retained. GitHub produces a deployable release archive; unattended production deployment still needs a supported persistent hosting connection. A successful build is not a production deployment.

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
- [Publishing and GitHub webhook](docs/PUBLISHING.md)
- [Migration scope and quality review](docs/MIGRATION.md)
- [Recovery and maintenance](docs/MAINTENANCE.md)

Do not store payment credentials, API tokens, beneficiary records or case files in this repository or this marketing CMS.
