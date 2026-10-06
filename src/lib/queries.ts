import {defineQuery} from 'groq';

export const CONTENT_QUERY = defineQuery(`{
  "schemaVersion": 1,
  "settings": *[_id == "siteSettings"][0]{organisationName,shortName,diocese,tagline,email,phone,address,country,donationUrl,socialLinks[]{_key,label,url},seoTitle,seoDescription},
  "home": *[_id == "homePage"][0]{heroKicker,heroStatement,heroHighlight,heroIntro,location,aboutIntro,programmeHeading,projectsHeading,storiesHeading,partnersHeading,partnersIntro,supportIntro,
    impactFacts[]{_key,value,label},
    "heroImage": heroImage{"url":asset->url,"assetId":asset._ref,alt},
    "aboutImage": aboutImage{"url":asset->url,"assetId":asset._ref,alt},
    "impactImage": impactImage{"url":asset->url,"assetId":asset._ref,alt},
    "supportImage": supportImage{"url":asset->url,"assetId":asset._ref,alt}},
  "programmes": *[_type == "programme" && defined(slug.current)] | order(sortOrder asc, title asc){_id,title,"slug":slug.current,summary,body,sortOrder,seoTitle,seoDescription,"image":image{"url":asset->url,"assetId":asset._ref,alt}},
  "projects": *[_type == "project" && defined(slug.current)] | order(sortOrder asc, title asc){_id,title,"slug":slug.current,summary,body,location,status,startDate,endDate,"projectProgrammes":projectProgrammes[]->{title,"slug":slug.current},impactFacts[]{_key,value,label},sortOrder,seoTitle,seoDescription,"image":image{"url":asset->url,"assetId":asset._ref,alt}},
  "stories": *[_type == "story" && defined(slug.current)] | order(publishedAt desc, title asc){_id,title,"slug":slug.current,summary,body,category,publishedAt,sortOrder,seoTitle,seoDescription,"image":image{"url":asset->url,"assetId":asset._ref,alt}},
  "reports": *[_type == "report" && defined(file.asset)] | order(publishedAt desc, title asc){_id,title,"slug":slug.current,summary,publishedAt,"fileUrl":file.asset->url,"body":[]},
  "partners": *[_type == "partner"] | order(sortOrder asc, name asc){name,website,sortOrder,"logo":logo{"url":asset->url,"assetId":asset._ref,alt}}
}`);

// Published documents only; drafts and operational case records never enter release snapshots.
export const EXPORT_QUERY = defineQuery(`*[_type in ["siteSettings","homePage","programme","project","story","report","partner"]] | order(_id asc)`);
export const RELEASE_QUERY = defineQuery(`{"content": ${CONTENT_QUERY}, "documents": ${EXPORT_QUERY}}`);
