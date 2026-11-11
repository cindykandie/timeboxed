import type { FontFamilyDefinition } from 'expo-font';

// Original, unmodified local variable files. Leave weight unset to expose the
// entire wght axis; Text explicitly supplies its existing weight or regular 400.
export const localFonts: FontFamilyDefinition[] = [
  { fontFamily: 'TimeBoxed Satoshi', fontDefinitions: [
    { path: require('../../assets/fonts/satoshi/Fonts/TTF/Satoshi-Variable.ttf'), style: 'normal' },
    { path: require('../../assets/fonts/satoshi/Fonts/TTF/Satoshi-VariableItalic.ttf'), style: 'italic' },
  ] },
  { fontFamily: 'TimeBoxed Clash Display', fontDefinitions: [
    { path: require('../../assets/fonts/clash-display/Fonts/TTF/ClashDisplay-Variable.ttf'), style: 'normal' },
  ] },
  { fontFamily: 'TimeBoxed Cabinet Grotesk', fontDefinitions: [
    { path: require('../../assets/fonts/cabinet-grotesk/Fonts/TTF/CabinetGrotesk-Variable.ttf'), style: 'normal' },
  ] },
];
