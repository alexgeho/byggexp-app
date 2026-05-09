import { baseColors } from './colors';

const common = {
  borderRadius: {
    small: 8,
    medium: 16,
    large: 24,
    full: 50,
  },

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

export const greenTheme = {
  ...common,

  colors: {
    background: baseColors.colors.background,

    primary: baseColors.colors.primary,

    glow: baseColors.colors.glow,

    text: baseColors.colors.text,

    hourBlockFilled: baseColors.colors.hourBlockFilled,

    hourBlockEmpty: baseColors.colors.hourBlockEmpty,

    border: baseColors.colors.border,

    card: baseColors.colors.card,

    selectorBackground: baseColors.colors.selectorBackground,

    selectorBorder: baseColors.colors.selectorBorder,

    selectorArrow: baseColors.colors.selectorArrow,

    icon: baseColors.colors.icon,
  },
};