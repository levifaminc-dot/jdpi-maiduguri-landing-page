# Contact and Our Impact pages

## Contact

`/contact/` uses the existing central Sanity/settings content for public email, telephone, office address and configured social links. The form posts to FormSubmit; its temporary delivery recipient is **tayo@jdpimaiduguri.org**, selected by the user. Public email links remain **info@jdpimaiduguri.org**. `config/contact.json` holds the recipient and map links. Changing the recipient requires a fresh inbox activation with FormSubmit.

The form collects name, reply email, optional organisation, topic, message and consent. Browser-required fields, email validation and length limits are present. FormSubmit's default CAPTCHA stays enabled; a honeypot adds spam protection. Processing/30-day provider retention is disclosed. There are no attachments, auto-replies or CC recipients. FormSubmit manages security checks, activation and submission confirmation; the website never fabricates success or inbox receipt. The email field allows the team to reply to the sender.

### Required activation and end-to-end check

1. A first submission requests an activation email. Open the **tayo@jdpimaiduguri.org** inbox, check spam and activate only the expected JDPI form request.
2. Submit a clearly labelled test from the live Contact page and complete the provider security check.
3. Confirm that the message arrives in the Tayo inbox and that Reply addresses the test sender. Delivery cannot be claimed verified before this inbox check.
4. Provider errors are shown on the provider submission page. Public email and phone are available as fallback. On browser back/restore, the website's submit button re-enables without clearing the message.

Provider references: https://formsubmit.co/documentation and https://formsubmit.co/privacy.pdf.

The official Google Maps Share > Embed map URL was copied for **St. Patrick's Catholic Cathedral, Maiduguri**. It is labelled an address landmark, **not a verified JDPI office entrance**; visitors are advised to confirm with JDPI. Google resolves the landmark to Kashim Ibrahim Road, while JDPI publishes Jos Road. The legacy JDPC organisation listing returned by Google was marked permanently closed and was deliberately not embedded. Directions target the labelled church landmark. No made-up coordinates, API keys, office hours or opening-status claims were added.

Contact details were checked against https://jdpimaiduguri.org/.

## Our Impact

`/impact/` is a dated 2025 annual-report view, not an all-time reach total. Evidence is kept in `src/lib/impact.ts`. Report source:

https://jdpimaiduguri.org/wp-content/uploads/2026/09/JDPI-Maiduguri-2025-Annual-Report-Protected.pdf

- Page 10: 20,229 households supported; 10 projects implemented.
- Page 12: 3 states, 20 local government areas, 114 communities and state/LGA lists.
- Pages 6 and 11: programme results. Water access is explicitly estimated; psychosocial and protection figures describe messaging/awareness, not individual case management. Counts are not added as a unique-person total.
- Pages 17–18: 20 greenhouses and 263 households under BMZ.
- Page 16: WE-SING livelihood support. Stories and approved report photos reuse existing project content.

No Sanity schema, dataset, permissions or content documents were changed. Existing homepage all-time/undated impact figures were not substituted into these 2025 results. If the reporting year changes, update evidence and labels together, then verify the build.
