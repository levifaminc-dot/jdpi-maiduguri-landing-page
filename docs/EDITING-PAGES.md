# Editing JDPI’s public website

Open https://studio.jdpimaiduguri.org/structure with your invited Sanity account.

## Where to edit

| Website content | Studio section |
| --- | --- |
| Homepage statements, images and animated totals | Homepage & impact figures |
| About, Team, Impact, Where We Work, Programmes, Projects, Stories, Resources, Donate and Contact introductions | Website pages → choose the page |
| Mission, vision and section copy | About Us → the relevant section tab |
| Timeline, values, approach and featured leadership | About Us → History, values & leadership |
| Board and management names, roles and portraits | Our Team → Board & management |
| Impact reporting year, figures, programme results and story photographs | Our Impact → Results & story photos |
| Office bases and activities for each mapped LGA | Where We Work → LGAs & office bases |
| Existing WordPress-linked reports: titles, years, descriptions and document links | Resources → Document library |
| Programme overview, interventions, locations and project-specific reach | Programmes → choose the programme → Overview & image / Interventions & locations |
| Project status, dates, locations, sectors and card figures | Projects → choose the project |
| Project overview, activities, results, community stories, photographs and sources | Projects → choose the project → Full project page |
| Field stories, blog posts, news and events | Stories & updates |
| Downloadable PDF reports | Reports & publications |
| Partner names, logos and links | Partners & donors |
| Public address, contact details and social profiles | Site settings & donations |

Page sections have tabs and labelled fields showing the original text as a cue. Page photos include their screen-reader description. List entries can be edited and reordered. Empty lists remain empty rather than silently returning the old list.

The featured leadership on About is a separate selection from the full Team roster; update both when a person’s role changes. The initial roster remains explicitly the 2025 report snapshot. Update its period, captions and source notes together if publishing a newly approved roster.

## Publishing

Save changes, inspect **Draft preview**, then click **Publish**. The preview displays draft content, not a pixel-perfect rendering of the website. Unpublished drafts do not appear on the public website.

The existing release workflow checks published content hourly. Publishing is not instant: the snapshot, validation and Vercel deployment must finish. For an immediate sync, an authorised repository member can run **Actions → Website checks and release → Run workflow**, on `main`, with content syncing checked. A failed check preserves the last successful live deployment.

All ten page documents and detailed programme/project content are included in revision detection, published-content export, asset backup and frontend rendering.

## Accuracy and protected functionality

Use approved images and keep descriptions accurate. Preserve reporting periods, units and evidence. A household count is not a person count; sector results may overlap and must not be added as unique beneficiaries. Change report figures and all associated period/source copy together.

LGA activity entries use the map’s existing canonical state and LGA names (including `MMC`). Geometry and hotspot placement are maintained in code; adding a new mapped LGA requires a checked map update. Editors can update activities and source details for the existing locations without touching map code.

Layouts, navigation behavior, accessibility interactions, the contact-form recipient, map integration, payment routing, consent and safety disclosures remain protected implementation settings. They are not unrestricted CMS HTML fields. Donation checkout URLs must still pass the existing provider validation.

## Developer notes

`content/page-fields.json` defines named text/image slots and their approved fallbacks. `content/structured-fields.json` defines structured editing models; `content/page-data.json` contains approved initial values. After changing a model, run `node scripts/generate-page-projections.mjs`, then `npm run studio:verify` and `npm run verify`. Generated projections are static so Sanity TypeGen can infer all release queries.

The explicit migration is `sanity exec ../scripts/seed-page-content.mjs --with-user-token -- --write` from the Studio workspace. It creates missing singleton documents, adds missing detail fields and preserves drafts and existing edits. It is never called by builds. Existing project corrections use revision checks; concurrent CMS edits win. New project IDs are stable and linked programme references resolve real existing document IDs. Never commit local credentials.
