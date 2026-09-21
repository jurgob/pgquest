import lastmodByPath from "../sql/sitemap-lastmod.generated.json";
import { lessons } from "../sql/lesson-catalog";

const SITE_URL = "https://pgquest.dev";

const STATIC_PATHS = ["/", "/playground", "/search", "/feedback", "/license"];

export function loader() {
  const paths = [...STATIC_PATHS, ...lessons.map((lesson) => lesson.href)];
  const lastmod = lastmodByPath as Record<string, string>;

  const urls = paths
    .map((urlPath) => {
      const loc = `${SITE_URL}${urlPath}`;
      const date = lastmod[urlPath];
      const lastmodTag = date ? `\n    <lastmod>${date}</lastmod>` : "";

      return `  <url>\n    <loc>${loc}</loc>${lastmodTag}\n  </url>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;

  return new Response(xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}
