# UX refinements: review items 4, 5, 7 and 8

## Navigation

The primary menu consistently uses **Programmes** and **Stories & Updates**. Resources remains a Stories & Updates submenu. Home and the stories library share one category mapping without changing CMS categories. The expanded menu is used at widths up to 1100px to avoid cramped labels. While open, keyboard focus cycles through its visible controls and covered content is inert. Escape/close restore focus to its opener; resizing to desktop closes the overlay and clears its inert state.

## Phone discovery

Programmes uses a native select below the hero on phones, synchronized with desktop tabs, URL hashes and the same programme panels/pop-ups. Without JavaScript, original anchors and disclosure content remain available. The shared state maps use labelled LGA selects on phones, keeping selection and activity information above the supporting map. Desktop map hotspots and LGA buttons remain synchronized with these selects. Coverage-only LGAs retain their report qualification.

## Contact

JDPI confirmed on 8 October 2026 that the response timeframe is **24 hours** and that the existing Google Maps location is the correct office location. No pin or address was invented or moved. Safeguarding contact details will be supplied later; the general enquiry form is not presented as a confidential case-reporting channel.

The activated FormSubmit endpoint still forwards to `tayo@jdpimaiduguri.org`; security checks remain enabled. Its documented `_next` field returns to `/contact/thanks/` at the page's origin after successful processing. The noindex thank-you page explains the next step without claiming confirmed inbox delivery. `/contact/privacy/` explains the fields, provider forwarding and 30-day provider archive; it does not invent JDPI email-retention rules or guarantee deletion. Links to provider privacy information and a way to ask JDPI about submitted details are included.

Before publishing, review the contact notice with JDPI. A dedicated safeguarding route remains pending. The new redirect is structurally verified locally; no new message is sent as part of browser QA. The earlier activation and inbox-delivery test remain the evidence for the existing endpoint.

The default production origin now points to the current Vercel website instead of the retired Sites preview; explicit site or Vercel production URL settings still take priority.

## Verification

All 35 pages pass content, type, build and internal-link checks. Browser checks covered mobile-menu focus wrapping and Escape, desktop resizing, all seven programme choices, popup dismissal, state/LGA activity synchronization and homepage category filtering. Narrow layouts at 320px and the desktop navigation at 1110px showed no horizontal overflow. Confirmation and privacy pages were previewed locally; the new post-submission redirect still needs a live delivery check after deployment.
