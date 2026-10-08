# Staff editing guide

Open the deployed Sanity Studio or use the website’s `/admin/` link, then sign in with your invited account.

## What to edit

| Dashboard section | Content |
|---|---|
| Site settings & donations | Organisation name, contact details, donation checkout link, social profiles, search description |
| Homepage & impact figures | Opening statement and images, introduction, verified impact figures, section headings, support text |
| Programmes | Programme title, introduction, image, full content and display order |
| Projects | Project title, location, introduction, full content and image |
| Stories & updates | Field story, blog post, news, event or publication; date, title, image and full article |
| Reports & publications | PDF upload, publication date, title and description |
| Partners & donors | Name, logo, website and display order |

For new programme, project or story pages, click **Generate** beside **Page address**. Use lowercase words separated by hyphens. Keep an existing page address stable so shared links continue to work.

The **Programmes** page at `/programmes/` shows published Programmes in their display order, using their titles, introductions and images. Desktop tabs or the labelled phone selector choose one compact panel with a key reach figure. **More details** opens a pop-up with interventions, documented locations, full reporting context and related projects. Your published **Full content** also appears inside this pop-up and on the individual programme page. Related projects use explicit programme references or reviewed report associations. The 2025 results, interventions and location examples are sourced website content, separate from editable CMS introductions; review them with the website maintainer when updating the reporting year. Location examples are not the complete programme footprint, and Economic Empowerment's WE-SING figure is a project result, not a programme-wide total. The original Nutrition winter-landscape placeholder is replaced by the report’s nutrition-project close-out photo; uploading a different image in Sanity replaces this fallback.

## Review and publish

1. Write or update the content. Sanity saves it as a draft.
2. Describe each meaningful image in **Image description**. Check image consent and credits.
3. Open **Draft preview** to check the draft’s text and image. This is a content preview; use **Open the published website** to see the current live layout.
4. Ask the designated publisher to check accuracy, dates, impact figures, contact details and image permissions.
5. The authorised publisher clicks **Publish**. The scheduled GitHub check detects published changes, snapshots them into Git and lets the connected Vercel project rebuild. GitHub schedules may be delayed; this is not instant publication.
6. To sync without waiting, open [Website checks and release](https://github.com/levifaminc-dot/jdpi-maiduguri-landing-page/actions/workflows/website.yml), click **Run workflow**, keep **Sync published Sanity content and release it** checked and select `main`. This requires repository access. Wait for the successful run and confirm the current production deployment in Vercel.

Publishing in Sanity is the approval event. Draft edits do not trigger a release. Do not paste identifying beneficiary details, case records, private phone numbers or payment credentials into public articles.

## Donations and reports

The donation destination is a link. Paste the full approved HTTPS URL in Site settings; no payment keys are needed. Leaving it blank keeps the contact-based support page.

Upload actual report PDFs to **Reports & publications**. Do not create a report entry without its file. They appear in the resource library and the Stories & Updates hub after content sync. Field stories and blog posts get their own website detail pages; choose their Update type, generate Page address, add the date, full article, optional introduction and image, then publish.

## Before launch

Replace the Canva reference’s placeholder phone and email with verified public contact details. Confirm the impact numbers, dates, partner names and photography with JDPI. The initial stories contain reference titles and images, not complete source articles; staff must supply the full approved text.
