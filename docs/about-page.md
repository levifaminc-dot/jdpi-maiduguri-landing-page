# About page: local preview

Reference: the organisation's supplied IMG_2718.PNG. Route: `/about/`.
The page follows its photo hero, introduction, history, mission/vision, values,
identity, coverage, approach, leadership, accountability, partnerships and CTA layout.
Existing shared header/footer and WordPress font pairing are preserved.

## Verified content

- WordPress About JDPI: https://jdpimaiduguri.org/about-jdpi/ — March 1971 foundation,
  Social Welfare Apostolate and 1988 transition to JDPC.
- JDPI 2025 Annual Report, pages 8–9: organisation, mission, vision and Catholic
  Social Teaching principles. Values on the page are editorial summaries, not a
  verbatim replacement for the report's full principles.
- Page 61: CAC name recognised since 2015; public identity aligned in **2025**.
  WordPress homepage states 2024, but this page follows the explicit report chronology.
- Pages 2, 60, 64: Maiduguri headquarters; Mubi and Potiskum office bases.
  Michika is a programme location, not presented as a verified office.
- Pages 63–64: leadership is labelled **2025 Annual Report**. These are not the
  illustrative names in the reference, and no current-2026 roster is asserted.
- Accountability: annual-report sections (pages 58–59), public resources and
  general contact form. No invented policy downloads or confidential safeguarding
  intake channel. The contact form's existing caution is repeated.

## Photo provenance

`public/assets/about/` images are unretouched photo-region extracts from rendered
report pages: community-dialogue (39), peace-conference (38), maiduguri-team (60),
oliver-dashe-doeme (63), vincent-okoye / adowuyi-farindo / chioma-onuoha (64).
Existing ALLRight workshop photograph is from the same report's earlier extraction.
Faces are matched from labelled report portraits, not guessed.
The report is an organisation-supplied publication authorised for website use.

## Map

`src/data/about-map.json` uses the same pinned 2022 GRID3/geoBoundaries ADM1 source
as the Impact page. The three state boundaries are projected together, preserving
their relative geographical positions. `scripts/prepare-about-map.mjs` regenerates
the data. CC BY 4.0 attribution is displayed. This shows state coverage, not site pins.

No Sanity schema was changed. This is a local committed preview pending approval;
deploy only when requested. Mission/vision and other new editorial sections are
currently maintained in the page and `src/data/about.ts`.
