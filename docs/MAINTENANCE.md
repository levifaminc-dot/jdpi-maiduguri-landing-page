# Maintenance and recovery

## Ownership

JDPI should own its domain, CMS project and payment-provider account, with documented administrator contacts. The GitHub repository is currently under `levifaminc-dot`; agree long-term ownership and access with the organisation. A maintainer remains responsible for dependency updates and layout changes.

## Routine maintenance

- Review CMS usage against plan quotas monthly and check application status before relying on nonprofit benefits.
- Review GitHub build failures, hosting availability, contact details and the donation link.
- Apply dependency updates in a branch and run `npm run verify` before publication.
- Renew the domain and review staff access when responsibilities change.

## Recover a released website

Every code release includes its rendered content snapshot. After a checkout of the chosen release commit, run `npm ci` and `npm run verify`; `dist/` is the reproducible public site. Snapshot mode requires no live Sanity API call. The GitHub release artifact also contains the ready-to-deploy site and source SHA.

For CMS releases, `content/documents.ndjson` retains original published document IDs and asset references. `content/assets.json` maps asset IDs to backed-up local bytes and SHA-256 checksums. These copies are committed in the private repository. They contain published marketing content, not staff drafts or a full organisational backup.

Before restoring Sanity, export the current destination dataset and work in a separate recovery dataset. Reupload the saved original asset bytes first, preserving the content hashes; compare returned asset IDs with the manifest. Import published documents only after assets exist, then validate counts and references. Do not overwrite a live dataset without explicit agreement. A full Sanity dataset export, including drafts and history as supported by the chosen plan, is a separate backup procedure.

## Failures

If a Sanity query or asset export fails, the CMS-triggered workflow fails and does not commit a partial release. The existing static website continues serving the previous published build. Investigate the failing workflow, correct configuration or content, then rerun.

If donation checkout fails, remove its URL from Site settings and release the update; the website will return to its contact-based support page.

If a build succeeds but production is unchanged, check the actual hosting deployment status. A saved artifact is not evidence of production publication.
