# Releases and publishing

## Code revisions

Every implementation milestone is committed and pushed to `main` in the private repository. GitHub Actions runs content validation, Astro and Studio type checks, the production build and local-link verification. A versioned `jdpi-release-<run number>` artifact contains the deployment archive and exact source commit.

## Approved Sanity updates

Configure these GitHub repository variables after creating the real project:

- `SANITY_PROJECT_ID`: exact project ID
- `SANITY_DATASET`: `production`
- `SITE_URL`: current production origin
- `SANITY_STUDIO_URL`: deployed Studio origin

For a private dataset, add `SANITY_API_READ_TOKEN` as a GitHub Actions secret, using read-only access. Public datasets do not need this token. The snapshot uses Sanity’s published perspective and exports only the site’s editorial types and assets.

Create a Sanity document webhook with create, update and delete enabled; drafts and version documents disabled. Destination:

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

The current Site remains hosted at its existing URL and owner-only audience. Sites requires pushing the exact source commit before saving and deploying its build archive. The connector gives short-lived source credentials; they should not be stored as CI secrets or treated as permanent deployment credentials.

This repository therefore automates **snapshot → Git commit → verified build artifact**. Production publication is performed through the Sites workflow with fresh authorised credentials. Do not represent a green GitHub build as a live deployment.

For immediate unattended publication after every approved CMS update, a supported persistent deployment connection must be selected and configured. That is a hosting integration decision, not solved by adding an arbitrary URL or copying an expired token. Until connected, the verified artifact is ready for publication through the existing Site workflow.

## Releasing a content snapshot manually

```sh
npm run content:snapshot
npm run verify
git add content public/assets/sanity
git commit -m "Snapshot approved JDPI content"
git push origin main
```

Then publish the build from that same commit through the authorised Site workflow. Keep the source commit and deployment version together in the release record.
