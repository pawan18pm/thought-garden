export const colors = {
  paper: '#FBF7EF',
  ink: '#1C1B19',
  muted: '#5E5A52',
  soil: '#B8875A',
  seed: '#7A5230',
  leaf: '#3F9142',
  leafLight: '#7CC47F',
  ideasBed: '#FFFFFF',
  bg: '#FFFFFF',
  line: '#EFEDE8',
  restSoil: '#E3D6C6',
  restSoilLine: '#C9B8A3',
  pink: '#F28AA8',
} as const;

export type BedColorKey = 'blue' | 'orange' | 'purple' | 'yellow' | 'green' | 'pink';

export const bedColors: Record<BedColorKey, string> = {
  blue: '#D6E6FF',
  orange: '#FFE0C7',
  purple: '#E8DDFF',
  yellow: '#FFF1B8',
  green: '#DDF2D1',
  pink: '#FFD9E4',
};

export const flowerColors: Record<BedColorKey | 'ideas', string> = {
  blue: '#7FA8E8',
  orange: '#F2A36B',
  purple: '#B49AF0',
  yellow: '#F2CF4A',
  green: '#8ACB72',
  pink: '#F28AA8',
  ideas: '#F28AA8',
};

export const BED_COLOR_ORDER: BedColorKey[] = ['blue', 'orange', 'purple', 'yellow', 'green', 'pink'];

export const radius = { card: 22 } as const;
export const border = 2;
export const shadowOffset = 4;

export const fonts = {
  titleXBold: 'BricolageGrotesque_800ExtraBold',
  titleBold: 'BricolageGrotesque_700Bold',
  body: 'Inter_400Regular',
  bodySemi: 'Inter_600SemiBold',
  bodyBold: 'Inter_700Bold',
} as const;
