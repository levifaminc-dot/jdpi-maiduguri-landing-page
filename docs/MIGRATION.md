# Initial content import and cutover

## Source and scope

The source is the previously committed Canva replica, not a WordPress database export. `content/seed.json` retains its public text, figures, card titles and dates. Source assets are committed in `public/assets/`.

Inventory: English only; 7 programmes, 4 projects, 5 story/update cards, 8 partner names, homepage and site-settings singletons, 20 reference images plus the existing logo. There are no supplied report PDFs, complete story articles, draft versions, WordPress permalink inventory or WordPress administration credentials.

## Mapping

| Source | Sanity |
|---|---|
| Organisation, contact and donation settings | `siteSettings` singleton |
| Opening statement, introductions, impact facts and section headings | `homePage` singleton |
| Programme cards | `programme` documents |
| Featured project cards | `project` documents |
| Story cards and filters | `story` documents with category and publication date |
| Partner names | `partner` documents |
| Supplied report PDFs, when available | `report` documents and file assets |
| Image bytes and descriptions | Uploaded `editorialImage` assets and alt text |
| Future full articles and programme/project bodies | Portable Text arrays |

The import script uses source keys to recognise existing records and preserves staff edits on reruns. Sanity assigns ordinary document IDs; only the two Studio-managed singletons use fixed IDs. Imported image references use the actual asset IDs returned by upload. No legacy CDN URLs are required.

## Quality review

The Canva contact phone is a placeholder and the email must be verified. Impact figures, article dates, partner names and image permissions require JDPI’s review. Card headlines are retained exactly; missing full articles are not invented. Detail pages use the supplied summary and a contact link until approved full content is provided.

The new project, programme and story links now resolve to real pages. Existing homepage hash links continue to resolve. The old “Resources” anchor remains present for compatibility; the navigation points to a separate report page.

## Import and validation

1. Create and configure the real destination project and `production` dataset.
2. Extract schemas and generate types; deploy the Studio configuration.
3. Run the import dry run and review inventory and image rights.
4. Run the explicitly requested write mode using the server-only import token.
5. Compare imported counts with this inventory and run Studio document validation.
6. Publish reviewed content, take a snapshot, run the build checks and inspect sample pages.
7. Commit that snapshot and publish its exact build.

No remote import has been performed until real project configuration exists. The current release can be built safely from the committed snapshot.

## WordPress cutover

The existing WordPress site remains the live legacy source. Moving `jdpimaiduguri.org` is a later domain cutover: obtain the WordPress content export and permalink list, preserve complete articles and reports, prepare redirects, verify contact details and configure the production domain before changing DNS. Do not infer legacy paths from Canva card titles. Keep the WordPress site available until its content and URL coverage have been checked.
