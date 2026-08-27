// Temi grafici della ruota — le 4 varianti del canvas di rebrand (design-rebrand/RuotaA-D.dc.html).
// Il tema cambia solo la resa (cornice, colori spicchi, etichette, LED, mozzo, puntatore):
// la geometria e i segmenti di gioco restano quelli di wheelSeeds.js.

export const WHEEL_THEMES = {
  mezzanotte: {
    id: 'mezzanotte',
    tag: 'A',
    label: 'Mezzanotte',
    rim: { kind: 'disc', stops: [[0, '#b9860f'], [0.5, '#F5B63F'], [1, '#8a6d00']] },
    leds: { kind: 'dots', colors: ['#ffffff', '#F5B63F'] },
    hub: { fill: '#141A3D', stroke: '#F5B63F', strokeWidth: 2.5, logo: ['#F5B63F', '#EDE9FF'], pin: '#F5B63F' },
    pointer: { from: '#F5B63F', to: '#b9860f', stroke: '#8a6d00' },
    glow: 'rgba(245,182,63,0.10)',
    gradientSegments: true,
    amountColors: ['#7C6CFF', '#2FB9E8', '#33D6B5', '#F5B63F', '#FF8A5C', '#9F5CFF', '#FF5D73', '#4F8DFF', '#48C78E', '#FFC24D'],
    special: { passa: '#3A4266', bancarotta: '#0B0616', jolly: '#EDE9FF' },
    segStroke: 'rgba(245,182,63,0.5)',
    segStrokeWidth: 1.5,
    labels: {
      fill: '#F4F2FF',
      halo: 'rgba(10,14,35,0.45)',
      haloWidth: 3,
      overrides: {
        bancarotta: { fill: '#FF5D73' },
        jolly: { fill: '#5B48E8', haloWidth: 1 },
      },
    },
  },

  notte: {
    id: 'notte',
    tag: 'B',
    label: 'Notte e ambra',
    rim: { kind: 'rings', ring: '#F5B63F', ringWidth: 3, halo: 'rgba(245,182,63,0.25)' },
    leds: { kind: 'ticks', color: 'rgba(245,182,63,0.6)' },
    hub: { fill: '#F5B63F', stroke: null, strokeWidth: 0, logo: ['#141A3D', '#FFFDF6'], pin: '#141A3D' },
    pointer: { from: '#F5B63F', to: '#b9860f', stroke: '#8a6d00' },
    glow: 'rgba(245,182,63,0.10)',
    gradientSegments: false,
    amountColors: ['#161D45', '#1B2352'],
    special: { passa: '#3A4266', bancarotta: '#0B0616', jolly: '#F5B63F' },
    segStroke: 'rgba(244,242,255,0.08)',
    segStrokeWidth: 1,
    labels: {
      fill: '#F5B63F',
      halo: null,
      haloWidth: 0,
      overrides: {
        passa: { fill: 'rgba(244,242,255,0.85)' },
        bancarotta: { fill: '#FF5D73' },
        jolly: { fill: '#14102A' },
      },
    },
  },

  classica: {
    id: 'classica',
    tag: 'C',
    label: 'Classica piatta',
    rim: { kind: 'disc', color: '#141A3D' },
    leds: { kind: 'dots', colors: ['#ffffff', 'rgba(255,255,255,0.35)'] },
    hub: { fill: '#141A3D', stroke: '#0A0E23', strokeWidth: 2, logo: ['#141A3D', '#FFFDF6'], pin: '#FFFDF6' },
    pointer: { from: '#F7F3E8', to: '#cfc8b4', stroke: '#141A3D' },
    glow: 'rgba(245,182,63,0.08)',
    gradientSegments: false,
    amountColors: null, // usa i colori originali dei segmenti
    special: {},
    segStroke: '#0A0E23',
    segStrokeWidth: 2,
    labels: {
      fill: '#ffffff',
      halo: 'rgba(0,0,0,0.35)',
      haloWidth: 3,
      overrides: {
        bancarotta: { fill: '#E74C3C' },
      },
    },
  },

  neon: {
    id: 'neon',
    tag: 'D',
    label: 'Neon arcade',
    rim: { kind: 'neon', color: '#2EE6FF' },
    leds: { kind: 'none' },
    hub: { fill: '#0D0B16', stroke: '#FF3DBE', strokeWidth: 2, logo: ['#FF3DBE', '#2EE6FF'], pin: '#FF3DBE' },
    pointer: { from: '#2EE6FF', to: '#1590a5', stroke: '#0B0616' },
    glow: 'rgba(46,230,255,0.08)',
    gradientSegments: false,
    neon: true, // spicchi scuri con solo il bordo colorato
    amountColors: ['#FF3DBE', '#2EE6FF', '#B14BFF', '#FFE84D', '#35F2A8'],
    special: { passa: '#6E7BD9', bancarotta: '#FF3355', jolly: '#FFE84D' },
    segStroke: null, // per-spicchio, dal colore del segmento
    segStrokeWidth: 1.5,
    labels: {
      fill: 'segment', // stesso colore del bordo dello spicchio
      halo: null,
      haloWidth: 0,
      glow: true,
    },
  },
};

export const WHEEL_THEME_LIST = Object.values(WHEEL_THEMES);
export const DEFAULT_WHEEL_THEME = 'mezzanotte';

// Colore "di ruolo" di un segmento nel tema: per i premi cicla amountColors
// (amountIndex = posizione del segmento tra quelli numerici), per gli speciali usa special.
export function themeSegmentColor(theme, seg, amountIndex) {
  const specialColor = theme.special?.[seg.value];
  if (specialColor) return specialColor;
  if (theme.amountColors && typeof seg.value === 'number') {
    return theme.amountColors[amountIndex % theme.amountColors.length];
  }
  return seg.color;
}
