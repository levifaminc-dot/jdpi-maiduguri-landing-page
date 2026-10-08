# JDPI Studio on Vercel

The public Astro website and the standalone Sanity editor use separate Vercel projects connected to the same private repository. The editor continues to use Sanity project `j2wxo4uh`, dataset `production`; this is not a new CMS project or a content migration. Keep the existing `jdpi-maiduguri-editor.sanity.studio` editor as a fallback.

## Vercel configuration

- Team: JDPI.
- Project: `jdpi-maiduguri-studio`.
- Root directory: `studio`, with access to files outside the root directory enabled. Studio imports the shared `../config/sanity.json`.
- Preset: Sanity. `studio/vercel.json` installs from the repository's existing lockfile, builds only the Studio, outputs `studio/dist`, and provides single-page-app routing for direct editor links.
- `X-Robots-Tag: noindex, nofollow` discourages indexing; it is not an access control. Sanity authentication and existing project roles control editing access.
- The `VERCEL=1` system variable selects the self-hosted CLI configuration. Local external registration uses `SANITY_STUDIO_HOSTING=vercel`. Neither changes the existing Sanity-hosted application ID. Vercel bundles the pinned Studio version rather than using the other application's automatic updates.
- No Sanity write token belongs in Vercel's browser build. Project ID, dataset, website URL and registered app ID are public identifiers.

## Domain and authentication

The branded editor address is `studio.jdpimaiduguri.org`. Only that subdomain is attached to the editor project, with the exact CNAME supplied by Vercel configured at JDPI's existing DNS provider. Do not change apex, `www`, MX, SPF, DKIM or DMARC records. Leave WordPress and email services alone.

Add only the exact production editor origin(s) to Sanity CORS, with credentials enabled for staff sign-in. Never allow `https://*.vercel.app` with credentials. Use the existing email-based Sanity account, not a new Google account. An origin does not grant project membership: staff must still have an invited account and appropriate role.

Register the external Studio with the existing authorized CLI session:

```sh
SANITY_STUDIO_HOSTING=vercel npx sanity deploy --external --url https://jdpi-maiduguri-studio.vercel.app --schema-required --yes
```

The external application ID `mhisrwfkf55grftl7a3c1gyu` is recorded in the CLI's self-hosted configuration; `SANITY_STUDIO_EXTERNAL_APP_ID` can override it. This is not the hosted fallback ID. On Windows PowerShell set the environment variable separately. When the custom domain is verified, register the same external application at the branded URL and update the public `/admin/` link. Do not switch `/admin/` to a domain before it works.

## Publishing and checks

Editor hosting does not change the publishing workflow: Sanity Publish → scheduled or manually requested GitHub content snapshot → Git commit → Vercel website deployment. Drafts remain excluded. See [PUBLISHING.md](PUBLISHING.md).

Before declaring ready, verify the Studio build, exact CORS origins, the production sign-in page, a signed-in document list, and a direct `/structure/story` reload. Check the noindex header and static assets. Verify the DNS and HTTPS configuration separately before claiming the branded subdomain is active.

References: [Sanity hosting](https://www.sanity.io/docs/studio/deployment), [Sanity CORS](https://www.sanity.io/docs/content-lake/cors), [Vercel custom domains](https://vercel.com/docs/domains/working-with-domains/add-a-domain).

## Deployment record — 8 October 2026

Vercel successfully deployed the Studio from Git. External Studio registration and 1/1 schema deployment succeeded using the already-authorized CLI session. The exact production and branded origins were added to Sanity with credentials; no wildcard origin, user, role or new credential was added. The Vercel `/structure/story` route returned HTTP 200 with the Studio shell and `X-Robots-Tag: noindex, nofollow`. Email/password sign-in was selected, not Google. The branded editor opens under the existing account over HTTPS. No content was edited or published as a test.

The domain owner added the **CNAME** name **studio**, target **b38f0e6a6f573f7b.vercel-dns-017.com**, at Namecheap. DNS resolution matches that target, and the browser opens the Studio securely on the branded hostname. No DNS records were changed by the agent. The public `/admin/` link now targets the branded editor; both fallback hosts remain available.
