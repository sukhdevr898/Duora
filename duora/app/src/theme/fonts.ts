/** Font families loaded by the Expo app (Plus Jakarta Sans + Great Vibes). */
export const fonts = {
  regular: 'PlusJakartaSans_400Regular',
  medium: 'PlusJakartaSans_500Medium',
  semiBold: 'PlusJakartaSans_600SemiBold',
  bold: 'PlusJakartaSans_700Bold',
  extraBold: 'PlusJakartaSans_800ExtraBold',
  script: 'GreatVibes_400Regular',
} as const;

export type FontWeightKey = keyof typeof fonts;

/** Maps a CSS-like weight to the matching Plus Jakarta Sans file. */
export function fontFor(weight?: string): string {
  switch (weight) {
    case '800':
    case '900':
      return fonts.extraBold;
    case '700':
      return fonts.bold;
    case '600':
      return fonts.semiBold;
    case '500':
      return fonts.medium;
    default:
      return fonts.regular;
  }
}
