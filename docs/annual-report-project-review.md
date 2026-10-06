# Annual-report project review — local preview

Source: JDPI Annual Report 2025, supplied by JDPI as a 68-page scanned PDF. The original PDF is not included in the repository or publicly uploaded. Entries and photo selections are in `content/report-projects.json`.

## Status and evidence

JDPI instructed that projects without confirmed closure in the report should be listed as **ongoing**. This is an editorial instruction, not a claim that the 2025 report proves their current status. No contractual start/end dates have been inferred. Undated records display “Reported in 2025”.

| Entry | Evidence | Decision |
| --- | --- | --- |
| ECHO SAHaRA | pp. 16, 27: 15,466 people receiving cash support; 2,675 cholera/hygiene kits; 1,115 people receiving menstrual hygiene kits | Added, ongoing; metrics explicitly labelled 2025 |
| WE-SING | pp. 16, 31: 100 women receiving livelihood kits; 30 receiving individual counselling | Added, ongoing; do not add service counts as unique beneficiaries |
| GFFO Food Security and Humanitarian Protection for Victims of Lake Chad | pp. 52, 54: named award, donor/partners, psychosocial and child-protection examples | Added, ongoing; no invented project-wide totals or full coverage claims |
| Strengthening Protection and GBV Response in Madagali | p. 55: named project and vocational training/start-up equipment example | Added, ongoing; no invented beneficiary total |
| ALLRight | p. 58: Advancing Local Leadership in the Right Way, CRS organisational-strengthening support | Corrected summary, programmes, location and photo; ongoing; removed unsupported livelihood totals and dates |
| BMZ Multisectoral Resilience | p. 17: 20 community greenhouses serving 263 households in Hong/Michika | Replaced card figures with those explicitly 2025-scoped outputs; authentic photo |
| ECHF INTO-MAMI | JDPI's public Facebook closeout post confirms project ended | Retained completed; authentic public closeout photo |

BMZ and NHF completed statuses and contract date ranges remain from JDPI's supplied project template, not inferred from the annual report. ECHF dates/16,000+/10 figures likewise remain template-sourced, while closure is additionally supported by the public Facebook post. These are separate sources and reporting periods.

Potential relationship to resolve during editor import: the Madagali protection/GBV entry may be related to the existing NHF integrated nutrition/protection award. The report alone does not establish that they are the same project. JDPI replied “Not sure yet — keep for review”, so entries remain separate. Do not sum them or claim eight distinct grant awards without confirming with JDPI.

## Photo provenance

Report photos were extracted as JPEG rectangles at 230 dpi; no content was generated or retouched. Crop coordinates below reference the 115-dpi page previews (double each coordinate for extraction). Source captions are excluded from image crops and their meaning is preserved in alt text/copy.

| File under `public/assets/projects/` | Source and crop x/y/width/height | Use |
| --- | --- | --- |
| bmz-greenhouse-monitoring.jpg | p. 17; 71/822/401/197 | BMZ greenhouse monitoring, also directory hero |
| we-sing-startup-kits.jpg | p. 16; 78/857/381/221 | Explicit WE-SING distribution banner |
| allright-resource-mobilisation.jpg | p. 58; 475/690/381/237 | Staff/donors at strategy rollout |
| madagali-livelihood-kit.jpg | p. 55; 592/976/312/226 | Equipment, not an identifying survivor portrait |
| jdpi-hygiene-promotion.jpg | p. 27; 77/1036/273/192 | Contextual JDPI WaSH photo; not captioned SAHaRA-specific. Clearly labelled illustrative on card/detail |
| gffo-family-support-redacted.jpg | p. 52; 95/1008/373/214 | Original identity-obscuring redactions preserved; names and sensitive histories omitted |
| echf-into-mami-closeout.jpg | JDPI public Facebook photo 1110683474988368 | Adults at project closeout meeting |

Facebook source: [JDPI INTO-MAMI closeout post](https://www.facebook.com/permalink.php?story_fbid=pfbid0bsKzGMpabgXBVGrWGh2AZtJEhegYSNMkiVvgtrq9zykeWz8NZrCCffGw3k1fF7Grl&id=100081401777454), [selected photo](https://www.facebook.com/photo/?fbid=1110683474988368&set=pcb.1110870268303022). Displayed post date was 29 September; no year was visibly established, so the post's year is not inferred. Older posts required sign-in; JDPI approved report photos instead.

## CMS / release handling

The supplement is applied by `applyReportProjects` to snapshot and live-Sanity reads. It does not write to Sanity, change schema, export private documents, or publish a release. Existing IDs and other content are preserved; the explicit corrections take priority over the old project content. Applying the supplement twice is idempotent.

These corrections are currently versioned in Git, **not editable through Sanity**. Before migrating them to the editor, review the potential NHF/Madagali relationship, create/associate programme references, upload approved assets, import with stable IDs, and then retire the matching local overrides. Otherwise the local supplement would mask subsequent editor edits for those fields. Do not run an automatic import on this preview request.

All changes remain local for JDPI review. Push/deployment and remote editor changes require the next user instruction.
