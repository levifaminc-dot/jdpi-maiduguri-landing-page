# Impact coverage maps

The maps highlight only the 20 LGAs named in JDPI Annual Report 2025, page 12. They do not locate beneficiaries or individual project sites, imply complete state coverage, or assign project/programme totals to an LGA.

## Source and licence

State and LGA polygons are GRID3 Nigeria boundaries representing 2022, distributed by geoBoundaries gbOpen under Creative Commons Attribution 4.0 International. Pinned revision: `9469f09`. Boundary IDs: `NGA-ADM1-27671186`, `NGA-ADM2-59680162`.

- [State metadata](https://www.geoboundaries.org/api/current/gbOpen/NGA/ADM1/)
- [LGA metadata](https://www.geoboundaries.org/api/current/gbOpen/NGA/ADM2/)
- [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)
- Source files: `https://github.com/wmgeolab/geoBoundaries/raw/9469f09/releaseData/gbOpen/NGA/ADM1/geoBoundaries-NGA-ADM1_simplified.geojson` and `https://github.com/wmgeolab/geoBoundaries/raw/9469f09/releaseData/gbOpen/NGA/ADM2/geoBoundaries-NGA-ADM2_simplified.geojson`.

The source data's `Maiduguri` municipal polygon is labelled `MMC` to match the report; the selection panel expands this to Maiduguri Municipal Council. Other names are matched exactly. State membership is checked spatially, with 27 Borno, 21 Adamawa and 17 Yobe LGAs. Report-highlight counts must be 7, 5 and 8 respectively.

## Reproduction

Download the two pinned files into ignored `work/map-source/nga-adm1.geojson` and `work/map-source/nga-adm2.geojson`. Run `node scripts/prepare-impact-maps.mjs`. The generator writes `src/data/impact-maps.json`; commit that derived data with any reviewed changes.

Boundaries are projected with a local latitude-adjusted equirectangular projection, scaled uniformly into a 640 × 540 viewBox and rounded to 0.1 display units. Hotspots anchor to interior points of LGA polygons, not geographic coordinates of project sites. Closely spaced numbered labels are offset to prevent overlaps and connected to their true LGA anchor with a leader line. State maps are independently fitted, so their visual sizes are not area comparisons. The source geometry is already simplified. No paid map API, cookies, tracking, external map script or runtime network request is required.

## Editing and accessibility

When coverage changes, update the shared report list in `src/data/impact-coverage.json`, regenerate, and review the report source. `src/lib/impact.ts` exports that same list; build verification ensures the hotspot maps match it. Do not infer coverage from the existence of a boundary. Map polygons support click, Enter and Space; equivalent 44-pixel-minimum LGA buttons are provided beside each map. Tab groups support arrow keys, Home and End. Without JavaScript, all programme panels, state maps and report-listed LGA names remain visible.
