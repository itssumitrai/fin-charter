import type { Preview } from '@storybook/html';

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
  },
};
export default preview;
