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

The intended branded editor address is `studio.jdpimaiduguri.org`. Add only that subdomain to the editor project, then configure the exact CNAME supplied by Vercel at JDPI's DNS provider. Do not change apex, `www`, MX, SPF, DKIM or DMARC records. Leave WordPress and email services alone.

Add only the exact production editor origin(s) to Sanity CORS, with credentials enabled for staff sign-in. Never allow `https://*.vercel.app` with credentials. Use the existing email-based Sanity account, not a new Google account. An origin does not grant project membership: staff must still have an invited account and appropriate role.

Register the external Studio with the existing authorized CLI session:

```sh
SANITY_STUDIO_HOSTING=vercel npx sanity deploy --external --url https://jdpi-maiduguri-studio.vercel.app --schema-required --yes
```

Set the returned external application ID in `SANITY_STUDIO_EXTERNAL_APP_ID` for the editor build and future registrations, not the hosted fallback ID. On Windows PowerShell set the environment variable separately. When the custom domain is verified, register the same external application at the branded URL and update the public `/admin/` link. Do not switch `/admin/` to a domain before it works.

## Publishing and checks

Editor hosting does not change the publishing workflow: Sanity Publish → scheduled or manually requested GitHub content snapshot → Git commit → Vercel website deployment. Drafts remain excluded. See [PUBLISHING.md](PUBLISHING.md).

Before declaring ready, verify the Studio build, exact CORS origins, the production sign-in page, a signed-in document list, and a direct `/structure/story` reload. Check the noindex header and static assets. Verify the DNS and HTTPS configuration separately before claiming the branded subdomain is active.

References: [Sanity hosting](https://www.sanity.io/docs/studio/deployment), [Sanity CORS](https://www.sanity.io/docs/content-lake/cors), [Vercel custom domains](https://vercel.com/docs/domains/working-with-domains/add-a-domain).
