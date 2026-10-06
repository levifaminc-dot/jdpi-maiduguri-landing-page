# Our Projects page

The `/projects/` directory follows JDPI's supplied IMG_2713.PNG reference: a green photo hero, three-column project cards, status filters, client-side search and sorting, and an impact banner. It uses existing published project records and images. The mockup's extra WaSH Infrastructure Support and Social Cohesion and Peacebuilding projects are not fabricated as new records or broken links.

Dates, locations, programme labels and figures for the four existing projects are transcribed from the supplied reference in `src/lib/project-directory.ts`. They are template-supplied figures, not independently audited impact claims. The month-only reference dates are normalized to date strings for ordering; only month and year are displayed. Review these details before approving publication.

Optional Sanity Project fields are prepared for `status`, `startDate`, `endDate`, `projectProgrammes` (programme references), and `impactFacts`. The query projects these fields; published editor values override the template defaults. Explicit empty arrays clear programme tags or figures. New projects without these fields receive no invented dates, status or impact figures.

This local change does not deploy the Studio or modify remote content. Deploy the updated Studio when this design is approved so editors can access the new fields. Publishing editor content continues through the existing snapshot workflow; do not replace the published snapshot with template content.

Filters work with search, and sorting preserves featured order by default. Empty results offer a reset. Result counts are announced to screen readers. Without JavaScript, all cards and their links remain available and inactive controls are hidden. The shared Projects navigation now links directly to the directory. Other homepage styling is unchanged.
