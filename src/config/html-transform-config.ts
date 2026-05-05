import type { Plugin } from 'vite';

export default function htmlTransformConfig(version: string): Plugin {
  return {
    name: 'html-transform',
    transformIndexHtml(html: string) {
      return html.replace(
        '<title>',
        `<meta name="app-version" content="${version}">\n\t<title>`
      );
    },
  };
}
