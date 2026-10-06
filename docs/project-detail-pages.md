# Project detail pages — local review

All eight entries under `/projects/` use `ProjectDetailPage.astro`, following JDPI's IMG_2715.PNG layout: photo hero, breadcrumb and status, sticky section navigation, two-column project overview with a four-cell at-a-glance panel, results strip, context, activities, stories/learning, gallery, and resources/sources. The reference's blurred results are not transcribed as evidence.

Navigation uses real section anchors, not hidden tab panels. All content remains readable without JavaScript. A small client enhancement marks the current section while scrolling. Project cards keep their existing links and status/search/filter behaviour. Programme and story pages retain their existing generic detail component; no homepage layout or remote content is changed.

## Content handling

Project-specific structured narratives live in `src/lib/project-profiles.ts`, layered on the existing project records. These are local reviewed content, not live Sanity fields. IDs, routes, published document exports and the live dataset remain intact. Before migrating this narrative content to the editor, introduce suitable fields and references, review/import as drafts, and retire the corresponding local profile entries so they do not mask editor changes.

BMZ: report pages 15, 17–18, 24, 41, 47 and 51. Detail results show 20 greenhouses, 263 greenhouse-supported households, 8,000 PICS bags and 4,000 farmers receiving storage bags. These are distinct 2025 activities, not a summed reach total. The period, completed status and contract date range are retained from JDPI's earlier project reference.

ECHF INTO-MAMI: programme scope, dates and 16,000+/10 figures remain sourced from JDPI's earlier brief; the public Facebook closeout update confirms closure and identifies CRS as partner. The annual report does not separately itemise this award's totals. No annual-report aggregate has been reassigned to it.

NHF: project scope, dates and 4/900 figures remain brief-sourced. Report page 4 identifies NHF as Nigeria Humanitarian Fund, but does not separately itemise this award. Its existing website banner is expressly labelled illustrative; no specific gallery or beneficiary story is fabricated.

ALLRight: report page 58. Organisational strengthening, CRS donor/technical support, Resource Mobilisation Strategy, MEAL policy and five-day staff training. The five-day duration is not presented as five training events or a community beneficiary figure.

SAHaRA: report pages 16 and 27, with three separately labelled 2025 figures. The existing hygiene photo is contextual, not established as a project-specific event. No individually attributed beneficiary story is invented.

WE-SING: report pages 16 and 31–32. Donor attribution uses the Manos Unidas banner in the page 16 distribution photo. Two service counts are not summed as unique beneficiaries.

GFFO: report pages 52 and 54. Individual psychosocial and school-reintegration case examples are summarised without personal names or sensitive histories. Original photo redactions are preserved. No organisation-wide MHPSS or protection total is attributed to this named grant.

Madagali protection/GBV: report page 55. Skills/start-up case example, no invented donor or project-wide figures, no assertion of a participant's survivor status. The unresolved NHF relationship stays visibly marked for review on both affected pages, following JDPI's instruction.

Unknown report-project dates stay unknown and ongoing statuses remain as directed by JDPI. Resource sections cite report pages and the organisation's brief; the original PDF has not been uploaded or given a fake public download URL.

## Additional report photos

Extracted as JPEG, without generated or retouched content. The portrait greenhouse image uses 115 dpi for a lighter download; the other crops use 230 dpi. Coordinates below use the 115-dpi review images and are doubled for 230-dpi extraction.

| Photo | Page | x/y/width/height |
| --- | --- | --- |
| bmz-greenhouse-crops.jpg | 18 | 60/60/831/1150 |
| bmz-greenhouse-exterior.jpg | 17 | 71/613/401/180 |
| bmz-greenhouse-harvest.jpg | 17 | 483/822/391/197 |
| allright-stakeholder-workshop.jpg | 58 | 475/419/381/204 |
| we-sing-distribution-team.jpg | 16 | 466/857/410/221 |

Earlier photo provenance is recorded in `annual-report-project-review.md`. The shared build verification checks all project routes, seven section targets/navigation links, one H1 per detail page, and local links/assets. Desktop and mobile previews are visually reviewed separately. Changes are committed locally, not pushed/deployed.
