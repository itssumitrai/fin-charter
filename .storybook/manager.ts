import { addons } from 'storybook/manager-api';
import { create } from 'storybook/theming/create';

const theme = create({
  base: 'dark',
  brandTitle: 'fin-charter',
  brandUrl: '/',
  brandImage: '/logo.svg',
  brandTarget: '_self',

  colorPrimary: '#2962ff',
  colorSecondary: '#00bcd4',

  appBg: '#0d1117',
  appContentBg: '#0d0d1a',
  appBorderColor: '#1a2332',
  appBorderRadius: 8,

  textColor: '#d1d4dc',
  textMutedColor: '#758696',
  textInverseColor: '#0d1117',

  barTextColor: '#d1d4dc',
  barSelectedColor: '#2962ff',
  barBg: '#0d1117',
});

addons.setConfig({ theme });
