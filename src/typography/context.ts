import { createContext, useContext } from 'react';
import type { TextStyle } from 'react-native';

import { fontNames } from './model';
import type { FontFamily } from './model';

export const TypographyContext = createContext({
  family: 'satoshi' as FontFamily, ready: false, error: null as 'load' | 'save' | null,
  setFamily: (_family: FontFamily) => {},
});
export const useTypography = () => useContext(TypographyContext);
export function useTypographyStyle(): TextStyle | undefined {
  const { family } = useTypography();
  return family === 'system' ? undefined : { fontFamily: fontNames[family] };
}
