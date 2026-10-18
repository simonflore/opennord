// The OpenNord documentation site: Astro Starlight over the Markdown in
// src/content/docs/. It is served under /docs/ next to the app (the app uses
// hash routing, so the path is free), and is part of the public AGPL tree.
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import starlightLinksValidator from 'starlight-links-validator';

// Where the site is published. Absolute links (sitemap, canonical URLs, llms.txt)
// are built from it; override it per deployment with DOCS_SITE.
const site = process.env.DOCS_SITE ?? 'https://opennord.gigmeister.app';

export default defineConfig({
  site,
  base: '/docs',
  trailingSlash: 'always',
  integrations: [
    starlight({
      title: 'OpenNord docs',
      description: 'How to use OpenNord, the open companion for Nord keyboards, and how to work on it.',
      favicon: '/favicon.svg',
      social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/simonflore/opennord' }],
      // Pages are edited in the public repository, where the site lives at docs-site/.
      editLink: { baseUrl: 'https://github.com/simonflore/opennord/edit/main/docs-site/' },
      lastUpdated: true,
      // A link to a page that doesn't exist fails the build.
      plugins: [starlightLinksValidator()],
      // The app is dark-only (Studio Dark), so the docs are too.
      components: {
        ThemeProvider: './src/components/ForceDarkTheme.astro',
        ThemeSelect: './src/components/Empty.astro',
        SiteTitle: './src/components/SiteTitle.astro',
      },
      customCss: [
        '@fontsource/ibm-plex-sans-condensed/latin-400.css',
        '@fontsource/ibm-plex-sans-condensed/latin-600.css',
        '@fontsource/ibm-plex-mono/latin-400.css',
        './src/styles/studio-dark.css',
      ],
      sidebar: [
        {
          label: 'Start here',
          items: ['start/what-is-opennord', 'start/quickstart', 'start/platforms'],
        },
        { label: 'Using OpenNord', items: [{ autogenerate: { directory: 'guide' } }] },
        { label: 'Reference', items: [{ autogenerate: { directory: 'reference' } }] },
        { label: 'Develop', items: [{ autogenerate: { directory: 'develop' } }] },
      ],
    }),
  ],
});
