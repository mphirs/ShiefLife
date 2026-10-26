// Light + dark palettes. Every screen uses useTheme() so dark mode "just works".
import { useColorScheme } from 'react-native';

export const GREEN = '#237A4B';

const light = {
  dark: false,
  bg: '#F7F8F2', card: '#FFFFFF', text: '#1E3024', sub: '#566358', muted: '#7B857C',
  border: '#E9EEE6', input: '#F8FAF6', placeholder: '#A0A89F',
  chip: '#F3F5F0', chipActive: '#E0F2E5',
  green: GREEN, greenSoft: '#E4F1E6', amberSoft: '#FFF0D8', redSoft: '#FCE8E5',
  hero: '#1D5E3C', track: '#E6EBE3', overlay: 'rgba(0,0,0,0.4)', tabBar: '#FFFFFF',
};

const dark: typeof light = {
  dark: true,
  bg: '#0F1A13', card: '#17251C', text: '#EAF3EC', sub: '#B5C4B8', muted: '#8C9C8F',
  border: '#243629', input: '#1C2D22', placeholder: '#6E7F72',
  chip: '#1E3024', chipActive: '#1F4430',
  green: '#3FB877', greenSoft: '#1B3A28', amberSoft: '#3A2D14', redSoft: '#3B1D1A',
  hero: '#16442C', track: '#2A3C2F', overlay: 'rgba(0,0,0,0.6)', tabBar: '#121F17',
};

export type Theme = typeof light;

export function useTheme(): Theme {
  return useColorScheme() === 'dark' ? dark : light;
}
