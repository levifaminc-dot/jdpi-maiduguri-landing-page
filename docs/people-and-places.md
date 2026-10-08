# Team, locations and social navigation

Added 8 October 2026. Local editorial data does not overwrite Sanity documents.

- `/team/`: five trustees (p63), eleven management members (p64), portraits cropped from the supplied 2025 annual report. Names visually checked against labels, not OCR alone. No invented biographies. The roster is explicitly a 2025 snapshot, not a confirmed current directory. Wider staff: 123 staff and 47 trained (p60).
- `/where-we-work/`: three states and twenty LGAs from report p12. Same boundary geometry and accessible hotspot controls as Impact. All twenty locations have a panel. Six have locally attributed activity records; the other fourteen explicitly say the report does not itemise local activities. No statewide activity is assigned to every LGA and no LGA beneficiary totals are invented.
- Local activity evidence: Hong p17/45/51; Michika p17/47/49; Kaga p52; Magumeri p53. INTO-MAMI in Jere/Magumeri is separately attributed to the supplied brief and official closeout record. Madagali p55 and NHF brief remain separate pending award confirmation. Historical reporting does not imply present active projects.
- Boundaries remain GRID3 via geoBoundaries 2022, CC BY 4.0. Hotspots identify LGAs, not exact individual sites.
- Resources is a child of Stories; Team is under About; Where We Work is under Our Impact. Main labels remain direct page links, with separate submenu buttons for keyboard/touch. Desktop hover also opens submenus. Escape closes a submenu first.
- Footer retains four Explore links and four Programme links. Facebook supplied by organisation; Instagram and X handles from report p2; LinkedIn company page confirmed at https://www.linkedin.com/company/jdpimaiduguri/. WordPress footer icons had no href destinations. YouTube is named in the report but no channel URL was established, so no guessed link is included.
- Sanity-configured social destinations take precedence over local defaults for the same platform. Stories and existing publishing workflow are unchanged.

Source PDF: https://jdpimaiduguri.org/wp-content/uploads/2026/09/JDPI-Maiduguri-2025-Annual-Report-Protected.pdf

Next editorial checks: current roster and spellings, remaining LGA activity breakdown, official YouTube channel URL. Do not move the existing recovery tag.

## Verification

- Content validation, report and Stories tests, Astro check (42 files, zero diagnostics), Studio type check, static build and 32-page link/asset checks passed.
- Browser: state tabs, SVG Enter activation, LGA buttons, only one local-activity panel visible, project links, coverage-only fallback, submenu expanded state and Escape/focus return checked.
- At 390px: Resources submenu opens and routes correctly; mobile menu closes and releases body scrolling. Both new pages fit without horizontal overflow.
- At 320px: both new pages fit without horizontal overflow; team cards become one column. Native section jumps use immediate scrolling to avoid cancellation when selecting links in the horizontal rail.
- Footer preserves four Explore and four Programme links. Social icons retain accessible names and 44px targets.
