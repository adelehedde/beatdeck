// Beat Deck — rythmes : figures de notation, niveaux, et génération de la boucle de 4 cartes.

import { t } from './i18n.js';

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function rand() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------- Figures ----------
// Une figure occupe un nombre entier de temps (« beats ») ; d = durée en temps, at = position dans la figure.

const N = (d, extra = {}) => ({ d, ...extra });
const R = (d) => ({ d, rest: true });

function figure(items, extra = {}) {
  let at = 0;
  const placed = items.map((it) => {
    const p = { ...it, at };
    at += it.d;
    return p;
  });
  return { items: placed, beats: Math.round(at), ...extra };
}

const times = (n, item) => Array.from({ length: n }, () => ({ ...item }));

// Les cellules d'un temps sont celles des cartes ; les valeurs longues servent à « Comprendre les notes ».
export const FIGURES = {
  ronde: figure([N(4)]),
  pause: figure([R(4)]),
  blanchePointee: figure([N(3, { dot: true })]),
  blanche: figure([N(2)]),
  demiPause: figure([R(2)]),
  noire: figure([N(1)]),
  soupir: figure([R(1)]),
  croches: figure([N(0.5), N(0.5)]),
  crocheDemi: figure([N(0.5), R(0.5)]),
  contretemps: figure([R(0.5), N(0.5)]),
  noirePointee: figure([N(1.5, { dot: true }), N(0.5)]),
  syncopeLongue: figure([N(0.5), N(1), N(0.5)]),
  quatreDoubles: figure(times(4, N(0.25))),
  crocheDoubles: figure([N(0.5), N(0.25), N(0.25)]),
  doublesCroche: figure([N(0.25), N(0.25), N(0.5)]),
  pointee: figure([N(0.75, { dot: true }), N(0.25)]),
  lombard: figure([N(0.25), N(0.75, { dot: true })]),
  syncope: figure([N(0.25), N(0.5), N(0.25)]),
  quartSoupir: figure([R(0.25), N(0.25), N(0.25), N(0.25)]),
  doublesContre: figure([R(0.25), N(0.25), R(0.25), N(0.25)]),
  triolet: figure(times(3, N(1 / 3)), { tuplet: 3 }),
};
for (const [id, f] of Object.entries(FIGURES)) {
  f.id = id;
  f.name = t(`fig.${id}`);
}

export const hasNotes = (f) => f.items.some((i) => !i.rest);

// ---------- La boucle de 4 cartes ----------
// Une carte = un temps. La boucle tourne sans fin ; une carte peut être remplacée juste après avoir
// été jouée (on a 3 temps pour la lire avant qu'elle revienne). De nouvelles cellules se débloquent
// toutes les 4 boucles, jusqu'à couvrir le niveau.
export const CARD_COUNT = 4;
export const UNLOCK_EVERY = 4; // boucles

// Ordre de déblocage des cellules, de la plus simple à la plus dure.
export const CELL_ORDER = [
  'noire', 'croches', 'soupir', 'crocheDemi', 'contretemps', 'quatreDoubles', 'crocheDoubles',
  'doublesCroche', 'pointee', 'lombard', 'syncope', 'quartSoupir', 'doublesContre', 'triolet',
];

export const LEVELS = [
  { id: 'facile', name: t('level.facile'), desc: t('level.facile.desc'), base: 'noire', unlocked: 2, max: 5 },
  { id: 'moyen', name: t('level.moyen'), desc: t('level.moyen.desc'), base: 'croches', unlocked: 4, max: 8 },
  { id: 'difficile', name: t('level.difficile'), desc: t('level.difficile.desc'), base: 'croches', unlocked: 7, max: 14 },
  { id: 'madness', name: t('level.madness'), desc: t('level.madness.desc'), base: 'croches', unlocked: 4, max: 14, madness: true },
];

// Part d'aléatoire : nombre moyen de cartes remplacées par boucle.
export const RANDOMNESS = [
  { name: t('rand.0'), rate: 0 },
  { name: t('rand.1'), rate: 0.5 },
  { name: t('rand.2'), rate: 1 },
  { name: t('rand.3'), rate: 2 },
  { name: t('rand.4'), rate: 4 },
];

// Pièges de Madness, annoncés une boucle à l'avance.
export const EFFECTS = {
  fade: { label: t('effect.fade'), hint: t('effect.fade.hint') },
  blind: { label: t('effect.blind'), hint: t('effect.blind.hint') },
  shake: { label: t('effect.shake'), hint: t('effect.shake.hint') },
};

export class DeckGen {
  constructor({ seed, bpm, difficulty = 1, randomness = 2 }) {
    this.rng = mulberry32(seed);
    this.baseBpm = bpm;
    this.lastBpm = bpm;
    this.difficulty = difficulty;
    this.randomness = randomness;
    this.index = 0;
    this.time = 0;
    this.beatPos = 0;
    this.cards = null; // les 4 cartes posées
    this.loops = 0;
    this.unlocked = LEVELS[difficulty].unlocked;
  }

  // Madness : le tempo monte tout seul et des pièges apparaissent.
  get madness() {
    return !!LEVELS[this.difficulty].madness;
  }

  shuffle(list) {
    for (let k = list.length - 1; k > 0; k--) {
      const j = Math.floor(this.rng() * (k + 1));
      [list[k], list[j]] = [list[j], list[k]];
    }
    return list;
  }

  // Mesure vide (une boucle de 4 temps), placée à la suite de la précédente.
  shell(i, bpm) {
    const beat = 60 / bpm;
    const m = {
      index: i,
      start: this.time,
      end: this.time + CARD_COUNT * beat,
      beat,
      bpm,
      sig: CARD_COUNT,
      startBeat: this.beatPos,
      countIn: i === 0,
      effect: null,
      info: '',
      blocs: [],
      notes: [],
    };
    this.time = m.end;
    this.beatPos += CARD_COUNT;
    return m;
  }

  fillNotes(m, figs) {
    figs.forEach((fig, b) => {
      m.blocs.push({ fig, startBeat: b, noteIds: [] });
      for (const it of fig.items) {
        if (it.rest) continue;
        const pos = b + it.at;
        m.notes.push({ t: m.start + pos * m.beat, pos, dur: it.d * m.beat, measure: m.index, bloc: b, item: it });
      }
    });
  }

  // La boucle jouée = les cartes posées ; puis on prépare la suivante en remplaçant quelques
  // cartes (à l'écran, elles se retournent juste après avoir été jouées).
  next() {
    const i = this.index++;
    const lvl = LEVELS[this.difficulty];
    const bpm = i <= 1 || !lvl.madness ? this.baseBpm : Math.min(300, this.lastBpm + 2);
    this.lastBpm = bpm;
    const m = this.shell(i, bpm);
    if (m.countIn) return m;

    // Cellules disponibles : celles débloquées, bornées par le niveau (qui peut changer en direct).
    this.unlocked = Math.max(Math.min(this.unlocked, lvl.max), lvl.unlocked);
    const pool = CELL_ORDER.slice(0, this.unlocked).map((id) => FIGURES[id]);
    if (!this.cards) this.cards = Array(CARD_COUNT).fill(FIGURES[lvl.base]);
    // Cartes hors niveau (après un changement de difficulté) : remplacées par la cellule de base.
    this.cards = this.cards.map((f) => (pool.includes(f) ? f : FIGURES[lvl.base]));
    this.fillNotes(m, this.cards);

    // Préparation de la boucle suivante.
    this.loops++;
    let fresh = null;
    if (this.loops % UNLOCK_EVERY === 0 && this.unlocked < lvl.max) {
      this.unlocked++;
      fresh = FIGURES[CELL_ORDER[this.unlocked - 1]];
    }
    const rate = RANDOMNESS[this.randomness].rate;
    let changes = Math.floor(rate) + (this.rng() < rate % 1 ? 1 : 0);
    if (fresh) changes = Math.max(1, changes); // la nouvelle cellule arrive tout de suite
    const places = this.shuffle([...Array(CARD_COUNT).keys()]).slice(0, Math.min(CARD_COUNT, changes));
    const next = [...this.cards];
    const available = CELL_ORDER.slice(0, this.unlocked).map((id) => FIGURES[id]);
    places.forEach((p, j) => {
      if (j === 0 && fresh) next[p] = fresh;
      else {
        const others = available.filter((f) => f !== next[p]);
        if (others.length) next[p] = others[Math.floor(this.rng() * others.length)];
      }
    });
    if (next.every((f) => !hasNotes(f))) next[places[0] ?? 0] = FIGURES[lvl.base];
    this.cards = next;
    m.info = fresh ? t('table.newCard', { name: fresh.name.toLowerCase() }) : '';
    if (lvl.madness && i >= 6 && this.rng() < Math.min(0.5, 0.15 + (i - 6) * 0.02)) {
      const keys = Object.keys(EFFECTS);
      m.effect = keys[Math.floor(this.rng() * keys.length)];
    }
    return m;
  }
}

// Syllabe de comptage : 1 e & a, triolets « trip let ».
export function countSyllable(pos, tuplet) {
  const beat = Math.floor(pos + 1e-6);
  const frac = pos - beat;
  const near = (v) => Math.abs(frac - v) < 1e-3;
  if (near(0)) return String(beat + 1);
  if (tuplet === 3 || near(1 / 3) || near(2 / 3)) return near(1 / 3) ? 'trip' : near(2 / 3) ? 'let' : '·';
  if (near(0.5)) return '&';
  if (near(0.25)) return 'e';
  if (near(0.75)) return 'a';
  return '·';
}
