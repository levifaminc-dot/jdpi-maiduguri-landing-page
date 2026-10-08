# Stories & Updates

Local preview at `/stories/`. The header now opens this route rather than the home
carousel. Six horizontal filter buttons: All updates, Field stories, Blog posts,
News & events, Reports and Publications. Search combines with the category filter;
counts are announced, empty categories are honest, and Reset restores all items.
Without JavaScript all content and links remain available and controls stay hidden.

Existing story categories and detail URLs are preserved. `Blogs` is an additive
Sanity category, with a friendly Blog post label. No production documents were
modified. Deploy the updated Studio before editors use the new category.
The homepage shows a Blog posts button when a blog post is available.
Reports reuse `getResourceLibrary`, including its safe URLs and deduplication;
the Reports tab opens the existing annual and financial PDFs. Other PDF publications
go under Publications. Reporting years are labelled as years, not publication dates.
No extra placeholder posts, biographies or dates were invented.
The current snapshot's five existing story records have no summary/body content;
their existing detail pages retain the contact fallback. Editors should supply
the full articles in Sanity rather than treating the list as newly written stories.

The hero uses the existing authentic annual-report community-dialogue photo.
Story cards retain existing approved CMS images. Document graphics are generic
document illustrations, not fabricated publication covers.
