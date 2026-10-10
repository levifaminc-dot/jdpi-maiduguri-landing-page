# Website and Studio audit — 10 October 2026

## Scope and limits

Reviewed the public Astro website and its Sanity schemas, raw published content, import/release tooling, link handling, contact/donation configuration, built output and live security headers. Also checked the staff workspace's unauthenticated API boundaries, cross-origin request rejection, dependency lockfile and existing local release output. No staff records, roles, credentials, database grants, SharePoint permissions, DNS or payment settings were changed. WordPress administration and malware scanning remain outside this audit, as previously agreed.

This is a bounded application review, not a penetration test or a guarantee that every vulnerability has been found. Microsoft, Neon, Sanity account roles, third-party processing and full repository history were not exhaustively audited.

## Findings and disposition

| Finding | Disposition |
| --- | --- |
| BMZ had two impact figures saved as `rootItem`; the current Studio expects `projectImpactFact`. Homepage's four original figures lacked the `impactFact` type. | Repaired only these six type labels with revision-guarded patches and before/after verification. Values, descriptions, keys and all other content are unchanged. A private recovery copy is in ignored local `artifacts/`. |
| The Sanity-hosted editor was behind the Vercel Studio and did not recognise project `profile` and `reportingYear`. | Deployed the existing hosted app from the current checked schema/bundle; 1/1 schemas and hosted Studio deployment succeeded. Retained both application IDs. No new CMS project, dataset or access grants. |
| Existing content checks did not reject incompatible saved array member types or unknown raw fields. | Added raw-schema validation and regression tests to `studio:verify`; release workflow already runs that command. Checks include required fields, array types, array keys, unknown fields and strong references. Fixed both initial-import typing and the page-seed converter's array context. |
| Current npm advisories affect `braces` and `sprintf-js` via Sanity CLI code generation/file watching and CLI YAML tooling. | Unresolved upstream risks. Root audit reports 14 affected packages: 10 high, 4 moderate, 0 critical, from these two underlying advisories and their dependency chains. No patched releases are listed. Do not apply the audit's suggested major Sanity downgrade or unreviewed replacement packages. Recheck before dependency updates. |
| Four resource downloads still point to legacy WordPress `/wp-content/uploads/` URLs. All four return HTTP 403 after redirecting to the current `www` host. The annual-report failure was also confirmed in the browser. | Availability issue, not a demonstrated data leak. Not repaired by disabling protection or inventing replacement files. Upload the approved annual/financial PDFs through Reports & publications in Sanity; matching titles replace the legacy catalogue URLs. Alternatively provide a verified approved hosting address for the original PDFs. |

The advisory descriptions and patch availability were checked against [braces GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) and [sprintf-js GHSA-hp3w-g68c-fv3c](https://github.com/advisories/GHSA-hp3w-g68c-fv3c). The public website is a static build, not a server exposing those CLI functions. The observed dependency paths are tooling paths, but this does not erase the upstream risk. Only trusted maintainers should run publishing/CLI commands; do not feed attacker-controlled patterns or format strings into tooling.

## Checks passed

- Raw published snapshot: 40 editorial documents and 57 referenced assets; all editorial structures match the freshly extracted Studio schema after repair.
- Website: 35 generated pages; local links/assets and required routes resolve. Astro/Studio type checks and content, programme, donation, story, count-up and security regressions pass.
- Rendered `content/snapshot.json` is byte-for-byte unchanged by the type repair. Raw document differences are confined to type labels and revision/update metadata on two documents.
- CMS strings are escaped; Portable Text links have a render-time guard independent of editor validation. Donation URLs have gateway-specific HTTPS/domain checks. No arbitrary HTML/script field was introduced.
- Browser check on the rebuilt BMZ detail page: content and figures intact, no broken loaded images, no executable link schemes, hashed-script CSP present.
- Website and Studio responses supply HTTPS, anti-framing, anti-sniffing, referrer and permissions policies. Public pages also have Astro's stricter per-page CSP meta policy; the weaker HTTP header alone is not the complete policy. The apex URL redirects to the protected `www` site.
- Studio CORS inventory has exact local/production origins, not a credentialed wildcard: localhost development, its Vercel host and `studio.jdpimaiduguri.org`. No origin changes made.
- Staff membership, announcements, documents and a known document-file route return 401 without a session. Responses are private/no-store, with no permissive cross-origin header. Session lookup returns 200 (normal API semantics), not permission to read private content. Production preview/sample routes return 404.
- Staff cross-origin empty POST checks on membership, announcements, documents and sign-in return 403. No data was created or modified. This tests origin boundaries, not every authenticated role/action combination.
- Staff lockfile audit reports zero known advisories at this check.
- Existing secret-value scan compared five known private values against 1,052 release text files and found no matches. The tracked environment files are examples, not live credentials. This is not a comprehensive secret/history scan.

## Operational follow-ups

1. Use `https://studio.jdpimaiduguri.org/structure` as the primary editor; keep the hosted fallback schema/bundle in sync after future structure changes.
2. Keep raw-schema and website checks required before release. Empty/removal edits should remain deliberate and must not resurrect old static fallback projects.
3. Review repository collaborator access and protected-branch settings with JDPI. A public repository allows others to view/fork it, not push production commits; write access and merge rules govern publishing. Account/branch settings were not changed during this audit.
4. Review CMS/hosting/Microsoft membership periodically and enable appropriate account MFA. These account controls require an administrator review; code checks cannot prove their configuration.
5. Keep contact enquiries non-confidential. FormSubmit is a third-party processor; its honeypot and security check do not replace a dedicated safeguarding route. JDPI's approved confidential contact is still pending.
6. Staff PDF malware scanning remains deferred for the pilot by prior instruction. Private storage/authentication is not malware scanning. Do not treat pilot uploads as a safe channel for unreviewed external files.
7. Restore the annual-report and 2025/2024/2023 financial-report downloads from approved original files. A PDF blocked by the legacy URL cannot be recovered just by validating its link syntax. Keep the historical report titles intact so Sanity uploads replace the old entries instead of duplicating them.

## Repeatable checks

Run `npm run verify`, `npm run studio:verify`, `npm audit`, `node scripts/security-live.mjs` and the bounded private `node scripts/security-secrets.mjs` check. `npm audit` is currently non-zero for the documented tooling advisories; do not describe it as clean.

`repair-legacy-figures.mjs` is an explicit one-time repair, dry-run by default, not a build step. Run only through the authorised Sanity CLI with `--with-user-token`; `--write` is required for mutations. It preserves separate drafts, refuses unexpected figure structures, backs up affected arrays locally and uses revision guards. Never commit that private backup or a CLI token.
