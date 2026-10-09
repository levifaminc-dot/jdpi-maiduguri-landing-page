# JDPI security review — 9 October 2026

## Scope and outcome

Reviewed the public Astro website, self-hosted Sanity Studio and the separate Next.js staff workspace. Confirmed application weaknesses were fixed and regression-tested. This is a targeted code/configuration review with non-destructive external checks, not a full penetration test or a guarantee that no vulnerabilities exist.

## Fixes

- **Unsafe CMS links:** Portable Text previously trusted link schemes at rendering time. Editor validation alone can be bypassed by imports/API writes. Both detail pages and programme dialogs now use a render-time guard rejecting executable schemes, control characters, protocol-relative links and credentialed URLs. Rejected links render as ordinary text.
- **Public website and Studio browser protections:** added deny-framing, content-type enforcement, referrer/privacy protections and restrictions on unused browser capabilities. The public site has Astro-generated script hashes and a restrictive CSP; the Studio has a separate policy allowing its documented Sanity connections. No script `unsafe-inline` or `unsafe-eval` allowance was added. Existing inline styles remain allowed for compatibility.
- **Staff request size enforcement:** sign-in/sign-out and membership requests now enforce a 2,048-byte limit while reading the actual stream, rather than after unbounded buffering. Authentication input also rejects unapproved fields. Staff API responses receive a deny-execution CSP and all responses restrict unused browser capabilities.
- **Dependencies:** updated Sanity 6.17.0 to 6.18.0 and applied narrow, build-tested updates for TOML/YAML/UUID dependencies. No forced downgrade was used.

## Verification

- Public security tests: 4 passed; count-up tests: 4 passed. Astro and Studio type checks passed, 35 public pages built, local links/assets verified. Studio production build passed.
- Staff workspace: 56 tests passed and production build passed. Tests cover identity/tenant checks, active membership and suspension, admin/owner authorization, CSRF/origin restrictions, request limits, SQL privilege boundaries, PDF validation, file integrity and private storage routing.
- Non-authenticated live checks: staff membership/announcements/documents/file routes return 401; invalid-origin POSTs return 403; production preview/sample routes return 404. These checks do not admit members, publish content or upload files.
- Read-only runtime database checks passed for TLS and the existing limited role. No grants, records or passwords were changed.
- Five known local secret values were compared in memory against release text files; no matches found. Tracked private-environment/key filenames were also checked. This is not an exhaustive scan of every historical credential or provider setting.
- Hardened local public navigation and programme dialogs work without console CSP errors. Studio loads; its temporary loopback origin is correctly unapproved by Sanity. No new CORS origin or account permission was granted for the test. Production editor verification must use the already approved Studio origin.

## Remaining risks / follow-up

1. **Upstream dependencies:** the latest audit during this review still reports 15 package-level findings (11 high, 4 moderate; parent packages included). Remaining underlying findings include unpatched `braces` nested-pattern stack exhaustion and `sprintf-js` precision denial of service in the Sanity CLI/build dependency tree. Do not run forced audit remediation: it suggests incompatible old Sanity releases. Treat build configuration/patterns as trusted, monitor upstream patches and rerun the audit before releases. No remotely exploitable path for these remaining findings was demonstrated in this review.
2. **Original WordPress installation:** the main domain now serves Vercel and redirects to www. The historic WordPress plugins, administrator accounts and Namecheap hosting internals were not accessible through that URL and are **not audited**. They require a separate authenticated hosting/WordPress review. The old Sites design preview returned 401 without authentication; its audience was not changed.
3. **Organization controls:** Microsoft MFA/Conditional Access, Sanity role assignments, account recovery, provider tokens, independent backups/restore exercises and full audit-log monitoring still need an organization-level review. No access expansion or secret rotation was performed here.
4. **Staff document pilot:** existing limitations remain: no malware-scanning/quarantine pipeline, confidential document audiences, retention/deletion workflow, verified independent recovery, or 210-staff load test. Do not use the library for confidential case/HR/safeguarding records until those controls are approved and implemented.
5. **Contact form:** an approved external FormSubmit service receives general enquiries. This is not an appropriate confidential reporting channel; the published warning remains in place.

Regression commands: `npm run verify`; Studio production build with `SANITY_STUDIO_HOSTING=vercel`; staff `npm test` and `npm run build`. Optional review helpers under `scripts/security-*` are read-only; the secrets comparison requires private local files and prints counts only. The static QA servers bind only to loopback and are not production services.

Primary advisory references: [braces](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm), [sprintf-js](https://github.com/advisories/GHSA-hp3w-g68c-fv3c). Guidance: [Astro CSP](https://docs.astro.build/en/reference/configuration-reference/#securitycsp), [Sanity browser security](https://www.sanity.io/docs/content-lake/browser-security-and-cors), [Next.js CSP](https://nextjs.org/docs/app/guides/content-security-policy).
