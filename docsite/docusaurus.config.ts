import { themes as prismThemes } from 'prism-react-renderer';
import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'Taion Expression',
  tagline:
    'A safe, sandboxed expression language for evaluating untrusted user input',
  favicon: 'img/favicon.ico',

  future: {
    v4: true,
  },

  url: 'https://taioncom.github.io',
  baseUrl: '/taion-expression/',

  organizationName: 'taioncom',
  projectName: 'taion-expression',

  onBrokenLinks: 'throw',

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  plugins: [require.resolve('./plugins/webpack-taion-expression')],

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          editUrl:
            'https://github.com/taioncom/taion-expression/tree/main/docsite/',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    colorMode: {
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: 'Taion Expression',
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'docsSidebar',
          position: 'left',
          label: 'Docs',
        },
        { to: '/playground', label: 'Playground', position: 'left' },
        {
          href: 'https://github.com/taioncom/taion-expression',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Documentation',
          items: [
            {
              label: 'Getting Started',
              to: '/docs/getting-started',
            },
            {
              label: 'Language Reference',
              to: '/docs/language-reference/data-types',
            },
            {
              label: 'Security',
              to: '/docs/security/overview',
            },
            {
              label: 'For AI Agents (llms.md)',
              to: '/docs/llms',
            },
          ],
        },
        {
          title: 'Tools',
          items: [
            {
              label: 'Playground',
              to: '/playground',
            },
          ],
        },
        {
          title: 'More',
          items: [
            {
              label: 'GitHub',
              href: 'https://github.com/taioncom/taion-expression',
            },
            {
              label: 'npm',
              href: 'https://www.npmjs.com/package/@taioncom/taion-expression',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Taion Oy. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['bash', 'json'],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
