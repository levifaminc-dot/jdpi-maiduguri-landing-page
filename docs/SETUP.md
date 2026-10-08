# Connect JDPI’s editor

## 1. Organisation ownership

The existing **JDPI** project is `j2wxo4uh`, with dataset `production`. It is configured in `config/sanity.json`; do not create a duplicate. The account was created using Sanity email sign-in, not Google. Use `sanity login --provider sanity` for future setup authorization. Keep at least two authorised organisation contacts able to administer the project. Review the current Growth Trial before it ends; nonprofit-plan approval is still pending.

The project ID is a public identifier, not a password. Copy the exact ID supplied by Sanity; do not use an example or placeholder ID for production.

## 2. Local configuration

Copy `.env.example` to `.env` and `studio/.env.example` to `studio/.env`. Put the real project ID in `PUBLIC_SANITY_PROJECT_ID` and `SANITY_STUDIO_PROJECT_ID`. Both dataset settings should be `production`. Use the same project in the frontend and Studio.

Keep `CONTENT_SOURCE=snapshot` for releases. It builds the exact committed content without depending on Sanity availability at visitor request time. `CONTENT_SOURCE=sanity` is available for development builds that fetch current published content directly; missing configuration or failed queries stop the build rather than silently showing old data.

## 3. Seed the existing page

Read `MIGRATION.md` before importing. Prefer the already authorized official CLI session rather than creating another token: from `studio/`, run `sanity exec ../scripts/import-content.mjs --with-user-token -- --write`. The user token is passed only to the child process and is not committed. A server-only Editor token in the ignored `.env` can alternatively be used as `SANITY_API_WRITE_TOKEN`; never use a `PUBLIC_` variable. Generate schema types and deploy the Studio before importing.

```sh
npm run typegen
npm run studio:build
npm run studio:deploy
npm run content:import
npm run content:import -- --write
npm run content:snapshot
npm run verify
```

The dry run makes no writes. The import preserves existing documents and uses `sourceKey` to recognise previously imported records. It uploads committed image bytes into Sanity. Delete or revoke the one-time import token after this step.

Use `npx sanity documents validate` from `studio/` against the configured project after importing. Check counts: 7 programmes, 4 projects, 5 stories, 8 partners, 2 singletons; initially no reports.

## 4. Staff access and editor URL

Invite designated staff through Sanity Manage. Give drafting staff the least privileged role that supports their work; use Contributor where the approved plan offers it. Give publication rights to the responsible communications lead. Verify available roles on the selected plan instead of assuming they are included.

Set the real deployed Studio URL in `PUBLIC_SANITY_STUDIO_URL` and GitHub’s `SANITY_STUDIO_URL` repository variable. The public `/admin/` page then links to the authenticated editor. Add any Studio preview origin to the project’s CORS allowlist only if required; the current draft preview runs inside Studio and needs no public draft token.

The primary editor is https://studio.jdpimaiduguri.org/ and is recorded in the committed public configuration, so the environment override is optional. The direct https://jdpi-maiduguri-studio.vercel.app/ and existing https://jdpi-maiduguri-editor.sanity.studio/ remain fallbacks; see [Studio hosting](STUDIO-HOSTING.md). The initial 26 content records passed Sanity document validation; all 20 imported image originals are included in the Git backup with checksums.

## 5. Nonprofit plan

Sanity’s current nonprofit programme offers the Growth plan within its quotas, 25 included users and 3 datasets. Eligibility and acceptance are determined by Sanity. The application needs a valid project ID and accurate organisation details.

Official information and application: https://www.sanity.io/docs/platform-management/non-profit-plan

Have JDPI’s authorised representative submit its legal name, registration details, mission and website. No application has been submitted by this codebase. Hosting, domain renewal and payment-provider fees are separate from the CMS plan.

## 6. Donation link

In **Site settings & donations**, paste the approved Paystack or Flutterwave HTTPS checkout URL into **Donation checkout link**, then publish. Leave the field blank until JDPI’s provider account and checkout are ready. Payment processing occurs on the provider’s page; the website does not collect bank-card details.
