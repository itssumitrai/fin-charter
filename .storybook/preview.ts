import type { Preview } from '@storybook/html';
import { create } from 'storybook/theming/create';
import { initialize, mswLoader } from 'msw-storybook-addon';
import { handlers } from '../stories/mocks/handlers';

// Initialize MSW with the Yahoo Finance mock handlers
initialize();

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
    msw: {
      handlers,
    },
  },
  loaders: [mswLoader],
};
export default preview;
