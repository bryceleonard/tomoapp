export const fonts = {
  sans: {
    regular: 'JosefinSans-Regular',
    bold: 'JosefinSans-Bold',
  },
  slab: {
    regular: 'JosefinSlab-Regular',
    bold: 'JosefinSlab-Bold',
  },
} as const;

export type FontFamily = keyof typeof fonts;
export type FontWeight = keyof typeof fonts.sans; 