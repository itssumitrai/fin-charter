import type { Preview } from '@storybook/html';
import { create } from 'storybook/theming/create';
import isChromatic from 'chromatic/isChromatic';

// Only initialize MSW during Chromatic visual testing — on GitHub Pages
// the service worker script doesn't exist and blocks all stories from rendering
let mswLoader: NonNullable<Preview['loaders']>[number] | undefined;
let mswHandlers: unknown[] | undefined;

if (isChromatic()) {
  const [mswAddon, mocks] = await Promise.all([
    import('msw-storybook-addon'),
    import('../stories/mocks/handlers'),
  ]);
  mswAddon.initialize();
  mswLoader = mswAddon.mswLoader;
  mswHandlers = mocks.handlers;
}

const darkTheme = create({
  base: 'dark',
  appBg: '#0d1117',
  appContentBg: '#0d0d1a',
  appBorderColor: '#1a2332',
  textColor: '#d1d4dc',
  textMutedColor: '#758696',
  barTextColor: '#d1d4dc',
  barSelectedColor: '#2962ff',
  barBg: '#0d1117',
});

const preview: Preview = {
  parameters: {
    backgrounds: {
      default: 'dark',
      values: [
        { name: 'dark', value: '#0d0d1a' },
        { name: 'light', value: '#ffffff' },
      ],
    },
    layout: 'fullscreen',
    docs: {
      theme: darkTheme,
    },
    ...(mswHandlers && { msw: { handlers: mswHandlers } }),
  },
  loaders: mswLoader ? [mswLoader] : [],
};
export default preview;
