# Releases and publishing

## Code revisions

Every implementation milestone is committed and pushed to `main` in the private repository. GitHub Actions runs content validation, Astro and Studio type checks, the production build and local-link verification. A versioned `jdpi-release-<run number>` artifact contains the deployment archive and exact source commit.

## Approved Sanity updates

The committed public configuration already selects project `j2wxo4uh` and dataset `production`. Optional GitHub repository variables override it:

- `SANITY_PROJECT_ID`: exact project ID
- `SANITY_DATASET`: `production`
- `SITE_URL`: current production origin
- `SANITY_STUDIO_URL`: deployed Studio origin

For a private dataset, add `SANITY_API_READ_TOKEN` as a GitHub Actions secret, using read-only access. Public datasets do not need this token for content or image renditions. Exact original image-byte backups require authenticated `dlRaw` access; without it new images are backed up as their public CDN rendition. The asset manifest records `originalBytes` and a SHA-256 checksum, so these modes are never confused. Already backed-up originals are reused. See Sanity’s image parameters: https://www.sanity.io/docs/content-lake/image-urls . The snapshot exports only published website documents and referenced assets.

An hourly GitHub check compares published document revisions with the committed backup. Only changes trigger the full snapshot and build, keeping checks lightweight. GitHub schedules may run late; this is not instant publication. Drafts do not trigger a changed-content build. It runs at minute 15 of each hour (Africa/Lagos is UTC+1).

For immediate builds, optionally create a Sanity document webhook with create, update and delete enabled; drafts and version documents disabled. Destination:

```text
https://api.github.com/repos/levifaminc-dot/jdpi-maiduguri-landing-page/dispatches
```

Method: `POST`. Headers: `Accept: application/vnd.github+json`, `Content-Type: application/json`, and an `Authorization: Bearer ...` header containing a narrowly scoped GitHub credential that can dispatch to this one repository. Store that credential in Sanity’s webhook settings, never in Studio source or browser configuration. The repository-dispatch API requires repository Contents write permission. An authorised account owner must create and rotate this persistent credential.

Filter:

```groq
_type in ["siteSettings", "homePage", "programme", "project", "story", "report", "partner"]
&& !(_id in path("drafts.**"))
&& !(_id in path("versions.**"))
```

Projection:

```groq
{
  "event_type": "sanity-publish",
  "client_payload": {"source": "sanity"}
}
```

The workflow exports the published content and original asset bytes, verifies the release, commits changed snapshots, and uploads its build artifact. Deleting or unpublishing records is reflected in the next snapshot; the build does not reinsert deleted seed records. Bot commits use GitHub’s own token and do not recursively trigger more workflow runs.

## Current production host

Production is now [Vercel](https://jdpi-maiduguri-landing-page.vercel.app/), connected to the private GitHub repository's `main` branch. New source and content-snapshot commits trigger Vercel builds. Verify the Vercel deployment is Ready and the changed public page is visible; a green GitHub check alone is not proof of publication.

The content path is **Sanity Publish → scheduled/manual snapshot → verified Git commit → connected Vercel build**. Scheduled checks request an hourly run, but GitHub can delay them. No instant publish webhook is configured or promised by this repository. Immediate unattended syncing would require an explicitly authorised webhook credential/setup; do not add broad GitHub or Vercel credentials for convenience.

For an on-demand sync with existing repository access, open **Actions → Website checks and release → Run workflow**, choose `main` and leave **Sync published Sanity content and release it** checked. Unlike the former manual workflow, this fetches current published content before verification. Drafts remain excluded. Check both the workflow and Vercel before announcing the content is live.

## Releasing a content snapshot manually

```sh
npm run content:snapshot
npm run verify
git add content public/assets/sanity
git commit -m "Snapshot approved JDPI content"
git push origin main
```

The connected Vercel project then deploys that commit. Keep the source commit and successful deployment together in the release record. The existing recovery tag remains unchanged.
