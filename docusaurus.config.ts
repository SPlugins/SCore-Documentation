import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';
import type {PluginOptions} from '@docusaurus/plugin-content-docs';

type SidebarItemsGenerator = PluginOptions['sidebarItemsGenerator'];
type SidebarItems = Awaited<ReturnType<SidebarItemsGenerator>>;
type SidebarItem = SidebarItems[number];

const collator = new Intl.Collator(undefined, {
  numeric: true, // "Step 2" before "Step 10"
  sensitivity: 'base', // case-insensitive
});

const sidebarItemsGenerator: SidebarItemsGenerator = async ({
  defaultSidebarItemsGenerator,
  docs,
  ...args
}) => {
  const items = await defaultSidebarItemsGenerator({docs, ...args});

  // Generated doc items often have no label, so fall back to the doc title
  const docTitles = new Map(docs.map((doc) => [doc.id, doc.title]));

  const getLabel = (item: SidebarItem): string => {
    if (item.type === 'doc' || item.type === 'ref') {
      return item.label ?? docTitles.get(item.id) ?? item.id;
    }
    if (item.type === 'link' || item.type === 'category') {
      return item.label;
    }
    return '';
  };

  const byLabel = (a: SidebarItem, b: SidebarItem) =>
    collator.compare(getLabel(a), getLabel(b));

  // Plain items A-Z first, then categories A-Z (applied recursively)
  const reorder = (list: SidebarItems): SidebarItems => {
    const mapped = list.map((item) =>
      item.type === 'category'
        ? {...item, items: reorder(item.items)}
        : item,
    );
    return [
      ...mapped.filter((item) => item.type !== 'category').sort(byLabel),
      ...mapped.filter((item) => item.type === 'category').sort(byLabel),
    ];
  };

  return reorder(items);
};


const config: Config = {
  title: 'SCore Documentation',
  tagline: 'Documentation solely for SCore and other Ssomar Plugins',
  favicon: 'assets/score.png',

  // Future flags, see https://docusaurus.io/docs/api/docusaurus-config#future
  future: {
    v4: true, // Improve compatibility with the upcoming Docusaurus v4
  },

  // Set the production url of your site here
  url: 'https://splugins.github.io',
  baseUrl: '/SCore-Documentation/',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'SPlugins', // the GitHub org/user name
  projectName: 'SCore-Documentation',      // the repo name

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  markdown: {
    mermaid: true,
  },
  themes: ['@docusaurus/theme-mermaid'],
  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          sidebarItemsGenerator,
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl:
            'https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/',
        },
        theme: {
          customCss: './src/css/custom.css',
        },
        
      } satisfies Preset.Options,
    ],
  ],

  plugins: [require.resolve('docusaurus-lunr-search')],

  themeConfig: {
      mermaid: {
      options: {
        securityLevel: 'loose',
      },
      },
    // Replace with your project's social card
    image: 'img/docusaurus-social-card.jpg',
    tableOfContents: {
      minHeadingLevel: 2,
      maxHeadingLevel: 6
    },
    navbar: {
      title: 'SCore Development',
      logo: {
        alt: 'My Site Logo',
        src: '/assets/score.png',
      },
      // ==============================================================================================================================================================
      // 
      // Add new items here if you want to add a dedicated page for other plugins
      // 
      // ==============================================================================================================================================================
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'SCore',
          position: 'left',
          label: 'SCore',
        },
        
        {
          type: 'docSidebar',
          sidebarId: 'ExecutableBlocks',
          position: 'left',
          label: 'ExecutableBlocks',
        },
        {
          type: 'docSidebar',
          sidebarId: 'ExecutableItems',
          position: 'left',
          label: 'ExecutableItems',
        },
        {
          type: 'docSidebar',
          sidebarId: 'ExecutableCrafting',
          position: 'left',
          label: 'ExecutableCrafting',
        },
        {
          type: 'docSidebar',
          sidebarId: 'MyFurniture',
          position: 'left',
          label: 'MyFurniture',
        },
        {
          type: 'docSidebar',
          sidebarId: 'CustomPiglinTrades',
          position: 'left',
          label: 'CustomPiglinTrades',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            {
              label: 'SCore',
              to: '/docs/score/intro',
            },
          ],
        },
        {
          title: 'Community',
          items: [
            {
              label: 'Stack Overflow',
              href: 'https://stackoverflow.com/questions/tagged/docusaurus',
            },
            {
              label: 'Discord',
              href: 'https://discordapp.com/invite/docusaurus',
            },
            {
              label: 'X',
              href: 'https://x.com/docusaurus',
            },
          ],
        }
      ],
      copyright: `Copyright © ${new Date().getFullYear()} My Project, Inc. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['java']
      
    },

  } satisfies Preset.ThemeConfig,
};



export default config;
