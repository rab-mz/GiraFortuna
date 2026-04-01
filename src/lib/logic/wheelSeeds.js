import { segments as classicSegments } from './wheelSegments.js';

export const SEEDS = {
  classico: {
    id: 'classico',
    name: 'Classico',
    description: 'Il gioco standard. Premi da 100 a 1000, Passa, Bancarotta e Jolly.',
    segments: classicSegments,
  },
  jackpot: {
    id: 'jackpot',
    name: 'Jackpot',
    description: 'Premi altissimi, nessuna Bancarotta. Adatto ai principianti!',
    segments: [
      { label: '500',   value: 500,   color: '#E74C3C', textColor: '#fff' },
      { label: '700',   value: 700,   color: '#3498DB', textColor: '#fff' },
      { label: '1000',  value: 1000,  color: '#2ECC71', textColor: '#fff' },
      { label: 'PASSA', value: 'passa', color: '#7E57C2', textColor: '#fff' },
      { label: '800',   value: 800,   color: '#F39C12', textColor: '#fff' },
      { label: '1500',  value: 1500,  color: '#9B59B6', textColor: '#fff' },
      { label: '1200',  value: 1200,  color: '#1ABC9C', textColor: '#fff' },
      { label: '2000',  value: 2000,  color: '#E67E22', textColor: '#fff' },
      { label: '900',   value: 900,   color: '#2980B9', textColor: '#fff' },
      { label: 'Jolly', value: 'jolly', color: '#00897B', textColor: '#fff' },
      { label: '1100',  value: 1100,  color: '#C0392B', textColor: '#fff' },
      { label: '600',   value: 600,   color: '#27AE60', textColor: '#fff' },
      { label: '2500',  value: 2500,  color: '#5C6BC0', textColor: '#fff' },
      { label: 'Jolly', value: 'jolly', color: '#00897B', textColor: '#fff' },
    ],
  },
  rischio: {
    id: 'rischio',
    name: 'Rischio',
    description: 'Molte Bancarotte e Passa. Solo per i coraggiosi!',
    segments: [
      { label: '300',   value: 300,   color: '#E74C3C', textColor: '#fff' },
      { label: 'BANCAROTTA', value: 'bancarotta', color: '#1a1a1a', textColor: '#E74C3C' },
      { label: '500',   value: 500,   color: '#3498DB', textColor: '#fff' },
      { label: 'PASSA', value: 'passa', color: '#7E57C2', textColor: '#fff' },
      { label: '200',   value: 200,   color: '#2ECC71', textColor: '#fff' },
      { label: 'BANCAROTTA', value: 'bancarotta', color: '#1a1a1a', textColor: '#E74C3C' },
      { label: '700',   value: 700,   color: '#F39C12', textColor: '#fff' },
      { label: 'PASSA', value: 'passa', color: '#5C6BC0', textColor: '#fff' },
      { label: '400',   value: 400,   color: '#9B59B6', textColor: '#fff' },
      { label: 'BANCAROTTA', value: 'bancarotta', color: '#1a1a1a', textColor: '#E74C3C' },
      { label: '1000',  value: 1000,  color: '#1ABC9C', textColor: '#fff' },
      { label: 'PASSA', value: 'passa', color: '#7E57C2', textColor: '#fff' },
      { label: '600',   value: 600,   color: '#E67E22', textColor: '#fff' },
      { label: 'Jolly', value: 'jolly', color: '#00897B', textColor: '#fff' },
    ],
  },
};

export const SEED_LIST = Object.values(SEEDS);
