import { baseColors } from './colors';

const common = {
  borderRadius: 8,
  spacing: {
    small: 8,
    medium: 16,
    large: 24,
  },
  text: {
    fontFamily: {
      regular: 'DMSans-Regular',
      medium: 'DMSans-Medium',
      semiBold: 'DMSans-SemiBold',
      bold: 'DMSans-Bold',
    },
    sizes: {
      small: 12,
      medium: 16,
      large: 20,
    },
  },
};

export const lightTheme = {
  ...common,
  colors: {
    primary: baseColors.primary,
    background: baseColors.background.light,
    card: '#FFFFFF',
    text: baseColors.text.light,
    border: '#CCCCCC',
  },
};

export const darkTheme = {
  ...common,
  colors: {
    primary: baseColors.primary,
    background: baseColors.background.dark,
    card: '#1C1C1E',
    text: baseColors.text.dark,
    border: '#444444',
  },
};

