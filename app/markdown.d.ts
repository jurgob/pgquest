// CHANGELOG.md and other Markdown files are compiled to React components by
// @mdx-js/rollup (see vite.config.ts).
declare module "*.md" {
  import type { MDXContent } from "mdx/types";

  const MarkdownContent: MDXContent;
  export default MarkdownContent;
}
