import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const config: Config = {
  title: 'PlayerAnimationLibrary & Emotecraft Documentation',
  favicon: 'img/favicon.ico',

  // Set the production url of your site here
  url: 'https://docs.zigythebird.com',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'PlayerAnimationLibrary', // Usually your GitHub org/user name.
  projectName: 'Documentation', // Usually your repo name.

  onBrokenLinks: 'throw',

  markdown: {
    hooks: {
      onBrokenMarkdownLinks: 'throw',
    },
  },

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: false,
        theme: {
          customCss: './src/css/custom.css',
        },
        blog: {
          path: 'blog',
          onUntruncatedBlogPosts: 'throw',
          feedOptions: {
            createFeedItems: async (params) => {
              const {blogPosts, defaultCreateFeedItems, ...rest} = params;
              return defaultCreateFeedItems({
                // keep only the 10 most recent blog posts in the feed
                blogPosts: blogPosts.filter((item, index) => index < 10),
                ...rest,
              });
            },
          },
        },
      } satisfies Preset.Options,
    ],
  ],
  
  plugins: [
    './plugins/maven-versions-plugin',
    [
      '@docusaurus/plugin-content-docs',
      {
        id: 'emotecraft',
        path: "emotecraft",
        routeBasePath: "emotecraft",
        sidebarPath: './sidebars.ts',
      },
    ],
    [
      '@docusaurus/plugin-content-docs',
      {
        id: 'pal',
        path: "pal",
        routeBasePath: "pal",
        sidebarPath: './sidebars.ts',
      },
    ],
  ],
  
  themeConfig: {
    image: 'img/logo.png',
    metadata: [{name: 'twitter:card', content: 'summary'}],
    colorMode: {
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: 'Homepage',
      logo: {
        alt: 'Documentation Logo',
        src: 'img/logo.svg',
      },
      items: [
        {
          to: 'blog',
          label: 'Blog',
          position: 'left'
        },
        {
          type: "docSidebar",
          sidebarId: "mainSidebar",
          position: "left",
          docsPluginId: "pal",
          label: "PlayerAnimationLibrary Documentation",
        },
        {
          type: "docSidebar",
          sidebarId: "mainSidebar",
          position: "left",
          docsPluginId: "emotecraft",
          label: "Emotecraft Documentation",
        },
        {
          href: "https://github.com/PlayerAnimationLibrary/Documentation",
          label: "GitHub",
          position: "right",
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: "Docs",
          items: [
            {
              to: "/pal/intro",
              label: "PlayerAnimationLibrary Documentation",
            },
            {
              to: "/emotecraft/gettingstarted",
              label: "Emotecraft Documentation",
            }
          ],
        },
        {
          title: "Links",
          items: [
            {
              label: "Discord",
              href: "https://discord.com/invite/PSW2t4Ujm6",
            },
            {
              label: "GitHub",
              href: "https://github.com/PlayerAnimationLibrary/Documentation",
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} under the MIT license. Built with Docusaurus.<br>NOT AN OFFICIAL MINECRAFT SERVICE. NOT APPROVED BY OR ASSOCIATED WITH MOJANG OR MICROSOFT.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ["java", "gradle", "toml", "groovy", "kotlin", "javascript", "json", "json5", "properties"],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
