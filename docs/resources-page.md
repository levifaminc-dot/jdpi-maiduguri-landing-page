# Resources and publications

Reviewed source: https://jdpimaiduguri.org/recources/ on 6 October 2026. The new `/resources/` page retains the source's featured annual report, annual/financial report collection and media-kit enquiry, using the JDPI green-and-white site design.

## Verified public links

HEAD requests returned HTTP 200 and PDF content types for the 2025 annual report and the 2025, 2024 and 2023 financial reports. The 2025 Heyzine reader returned HTTP 200 and HTML. These links are recorded in `src/lib/resources.ts`; files are served by their existing publishers, not copied into this repository. The financial document names and reporting labels follow JDPI's resource collection; no financial figures or fiscal-period claims have been inferred from the generic WordPress descriptions.

The original annual-report downloads for 2024 and 2023 target `#`. The original media-kit download targets the annual-report PDF, and its press-contact link targets the annual-report reader. Those buttons are not reproduced as genuine resources. Earlier annual reports and media assets instead have explicit email request links. No claim that all publications since 1971 are available is carried over.

## Existing editor integration

`getContent()` remains the single content entry point. The page combines its published `reports` with the four verified public-link records. CMS records take precedence when matching a file URL or normalised title; other published reports are retained. This is a frontend catalogue, not an import into Sanity. No dataset, schemas, editor deployment or release snapshots are modified.

Type is inferred from the title: annual, financial/audit, or other publication. Year is taken from the title, then the existing publication date, without inventing dates. All document URLs must be HTTPS without embedded credentials, or an existing local Sanity asset path. Add new resource classification fields through a reviewed schema change if finer editorial categories are needed later.

## Behaviour and checks

All documents remain visible without JavaScript; working filter buttons become visible only after enhancement runs. Filters use pressed states, retain keyboard focus and announce document counts. Links identify their report and new-tab behaviour. Unavailable older editions are only listed in the request note while absent from the current library. The media enquiry uses the existing organisation email, with no form submission or unconfigured download button.

No additional dependencies or discretionary images. Desktop/mobile preview, filter counts, public-link accessibility, CMS merge behaviour, URL safety, one main heading and build/local-link checks are verified before release.
