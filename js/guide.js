// Section « Comprendre les notes » : les bases théoriques, avec des exemples gravés.

import { FIGURES } from './rhythm.js';
import { engraveMeasure } from './notation.js';
import { lang } from './i18n.js';

const N = (d, extra = {}) => ({ d, ...extra });
const R = (d) => ({ d, rest: true });

// Grave une suite de figures (une par case) ou une figure isolée dans une petite image.
// « center » : la figure est centrée dans l'image au lieu d'être placée selon le temps.
function engrave(blocsSpec, { sig, width, height = 84, scale = 1.15, barline = true, center = false }) {
  let beat = 0;
  let id = 0;
  const blocs = blocsSpec.map((fig) => {
    const placed = { fig, startBeat: beat, noteIds: fig.items.filter((i) => !i.rest).map(() => id++) };
    beat += Math.max(1, fig.beats);
    return placed;
  });
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const { canvas } = engraveMeasure({ sig, blocs }, { width, height, scale, dpr, barline, center, ink: '#1c1414' });
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  return canvas;
}

// Une note ou un silence seul (figure ad hoc d'une seule valeur).
const single = (item) => ({ items: [{ ...item, at: 0 }], beats: Math.max(1, Math.ceil(item.d)) });

const DURATIONS = [4, 2, 1, 0.5, 0.25];

const TREE_FIGS = [
  [FIGURES.ronde],
  [FIGURES.blanche, FIGURES.blanche],
  Array(4).fill(FIGURES.noire),
  Array(4).fill(FIGURES.croches),
  Array(4).fill(FIGURES.quatreDoubles),
];

// Figures des exemples, dans l'ordre des textes : [figures, nombre de temps].
const EXAMPLE_FIGS = {
  point: [[[FIGURES.noirePointee], 2], [[FIGURES.pointee], 1]],
  ligatures: [[[FIGURES.croches], 1], [[FIGURES.quatreDoubles], 1], [[FIGURES.crocheDoubles], 1]],
  syncope: [[[FIGURES.contretemps], 1], [[FIGURES.syncopeLongue], 2]],
  triolet: [[[FIGURES.croches], 1], [[FIGURES.triolet], 1]],
};

const html = String.raw;

const TEXT = {
  fr: {
    values: [
      { name: 'Ronde', silence: 'Pause', count: '4 temps', say: '1 2 3 4' },
      { name: 'Blanche', silence: 'Demi-pause', count: '2 temps', say: '1 2' },
      { name: 'Noire', silence: 'Soupir', count: '1 temps', say: '1' },
      { name: 'Croche', silence: 'Demi-soupir', count: '½ temps', say: '1 &' },
      { name: 'Double croche', silence: 'Quart de soupir', count: '¼ temps', say: '1 e & a' },
    ],
    quote: (s) => `« ${s} »`,
    restOf: (count) => `silence de ${count}`,
    tree: ['1 ronde', '= 2 blanches', '= 4 noires', '= 8 croches', '= 16 doubles croches'],
    examples: {
      point: [
        'Noire pointée + croche : 1 temps ½ + ½ = 2 temps. On compte « 1 (2) & ».',
        'Croche pointée + double : ¾ + ¼ = 1 temps. On compte « 1 a ».',
      ],
      ligatures: [
        'Une ligature (barre) relie les notes d’un même temps : 2 croches = 1 barre…',
        '… 4 doubles = 2 barres. Un groupe ligaturé = un temps = une carte.',
        'Mélange croche + doubles : la croche garde une barre, les doubles en ont deux.',
      ],
      syncope: [
        'Contretemps : silence sur le temps, note sur le « & ».',
        'Syncope : attaquée sur un temps faible, tenue sur le temps fort suivant. « 1 & (2) & ».',
      ],
      triolet: [
        'Deux croches : le temps coupé en 2 (« 1 & »).',
        'Triolet : le temps coupé en 3 (« 1 trip let »), signalé par le chiffre 3.',
      ],
    },
    body: html`
      <section>
        <h3>Pulsation, temps et mesure</h3>
        <p>La <strong>pulsation</strong> est le battement régulier qu’on tape du pied : chaque battement est un <strong>temps</strong>. Le tempo (BPM) donne le nombre de temps par minute.</p>
        <p>Les temps se regroupent en <strong>mesures</strong>, séparées par des barres verticales. En 4/4, la mesure contient 4 temps. Dans Beat Deck, <strong>une carte = un temps</strong> : chaque carte porte une seule cellule rythmique, et les 4 cartes font une mesure.</p>
      </section>
      <section>
        <h3>Les valeurs de notes et leurs silences</h3>
        <p>Chaque note a une durée, et chaque durée a son silence de même valeur : pendant un silence on continue de compter, sans jouer.</p>
        <div class="values" id="g-values"></div>
      </section>
      <section>
        <h3>L’arbre des valeurs</h3>
        <p>Chaque valeur vaut deux fois la suivante. Les cinq lignes ci-dessous durent toutes une mesure de 4 temps.</p>
        <div class="tree" id="g-tree"></div>
      </section>
      <section>
        <h3>Le point</h3>
        <p>Un point après une note l’allonge de <strong>la moitié de sa valeur</strong> : noire pointée = 1 + ½ = 1 temps et demi ; croche pointée = ½ + ¼ = ¾ de temps.</p>
        <div class="examples" id="g-point"></div>
      </section>
      <section>
        <h3>Lire les groupes : les ligatures</h3>
        <div class="examples" id="g-ligatures"></div>
      </section>
      <section>
        <h3>Contretemps et syncope</h3>
        <div class="examples" id="g-syncope"></div>
      </section>
      <section>
        <h3>Le triolet</h3>
        <p>Le triolet joue <strong>3 notes égales à la place de 2</strong>. Ce n’est pas « croche + 2 doubles » : les trois notes ont la même durée.</p>
        <div class="examples" id="g-triolet"></div>
      </section>
      <section>
        <h3>Compter à voix haute</h3>
        <table class="count">
          <tr><th>Le temps coupé en…</th><th>On dit</th></tr>
          <tr><td>1 (noire)</td><td>« 1 »</td></tr>
          <tr><td>2 (croches)</td><td>« 1 & »</td></tr>
          <tr><td>3 (triolet)</td><td>« 1 trip let »</td></tr>
          <tr><td>4 (doubles croches)</td><td>« 1 e & a »</td></tr>
        </table>
        <p>On compte tous les sous-temps, même ceux qu’on ne joue pas : c’est ce qui place les contretemps et les syncopes au bon endroit. Le comptage est écrit en bas de chaque carte pendant la partie (option dans les Réglages).</p>
      </section>`,
  },

  en: {
    values: [
      { name: 'Whole note', silence: 'Whole rest', count: '4 beats', say: '1 2 3 4' },
      { name: 'Half note', silence: 'Half rest', count: '2 beats', say: '1 2' },
      { name: 'Quarter note', silence: 'Quarter rest', count: '1 beat', say: '1' },
      { name: 'Eighth note', silence: 'Eighth rest', count: '½ beat', say: '1 &' },
      { name: 'Sixteenth note', silence: 'Sixteenth rest', count: '¼ beat', say: '1 e & a' },
    ],
    quote: (s) => `“${s}”`,
    restOf: (count) => `${count} of silence`,
    tree: ['1 whole note', '= 2 half notes', '= 4 quarter notes', '= 8 eighth notes', '= 16 sixteenth notes'],
    examples: {
      point: [
        'Dotted quarter + eighth: 1½ beats + ½ = 2 beats. Count “1 (2) &”.',
        'Dotted eighth + sixteenth: ¾ + ¼ = 1 beat. Count “1 a”.',
      ],
      ligatures: [
        'A beam joins the notes of the same beat: 2 eighth notes = 1 beam…',
        '… 4 sixteenths = 2 beams. One beamed group = one beat = one card.',
        'Eighth + sixteenths mixed: the eighth keeps one beam, the sixteenths get two.',
      ],
      syncope: [
        'Offbeat: rest on the beat, note on the “&”.',
        'Syncopation: struck on a weak beat, held over the next strong beat. “1 & (2) &”.',
      ],
      triolet: [
        'Two eighth notes: the beat split in 2 (“1 &”).',
        'Triplet: the beat split in 3 (“1 trip let”), marked with the number 3.',
      ],
    },
    body: html`
      <section>
        <h3>Pulse, beats and measures</h3>
        <p>The <strong>pulse</strong> is the steady beat you tap with your foot: each tap is a <strong>beat</strong>. The tempo (BPM) is the number of beats per minute.</p>
        <p>Beats are grouped into <strong>measures</strong> (bars), separated by vertical bar lines. In 4/4, a measure holds 4 beats. In Beat Deck, <strong>one card = one beat</strong>: each card carries a single rhythm cell, and the 4 cards make one measure.</p>
      </section>
      <section>
        <h3>Note values and their rests</h3>
        <p>Every note has a duration, and every duration has a rest of the same length: during a rest you keep counting, without playing.</p>
        <div class="values" id="g-values"></div>
      </section>
      <section>
        <h3>The note value tree</h3>
        <p>Each value is worth twice the next one. The five lines below all last one 4-beat measure.</p>
        <div class="tree" id="g-tree"></div>
      </section>
      <section>
        <h3>The dot</h3>
        <p>A dot after a note lengthens it by <strong>half its value</strong>: dotted quarter = 1 + ½ = 1½ beats; dotted eighth = ½ + ¼ = ¾ of a beat.</p>
        <div class="examples" id="g-point"></div>
      </section>
      <section>
        <h3>Reading groups: beams</h3>
        <div class="examples" id="g-ligatures"></div>
      </section>
      <section>
        <h3>Offbeats and syncopation</h3>
        <div class="examples" id="g-syncope"></div>
      </section>
      <section>
        <h3>The triplet</h3>
        <p>A triplet plays <strong>3 equal notes in the space of 2</strong>. It is not “eighth + 2 sixteenths”: all three notes have the same length.</p>
        <div class="examples" id="g-triolet"></div>
      </section>
      <section>
        <h3>Counting out loud</h3>
        <table class="count">
          <tr><th>The beat split into…</th><th>Say</th></tr>
          <tr><td>1 (quarter note)</td><td>“1”</td></tr>
          <tr><td>2 (eighth notes)</td><td>“1 &”</td></tr>
          <tr><td>3 (triplet)</td><td>“1 trip let”</td></tr>
          <tr><td>4 (sixteenth notes)</td><td>“1 e & a”</td></tr>
        </table>
        <p>Count every subdivision, even the ones you don’t play: that is what puts offbeats and syncopations in the right place. The counting is written at the bottom of each card during the game (option in Settings).</p>
      </section>`,
  },
};

export function renderGuide(root) {
  const tx = TEXT[lang];
  root.innerHTML = tx.body;

  const values = root.querySelector('#g-values');
  tx.values.forEach((v, i) => {
    const d = DURATIONS[i];
    const row = document.createElement('div');
    row.className = 'value';
    const cellW = 74;
    row.innerHTML = `<div class="v-name"><strong>${v.name}</strong><span>${v.count}</span><span class="muted">${tx.quote(v.say)}</span></div>`;
    row.appendChild(engrave([single(N(d))], { sig: 1, width: cellW, barline: false, center: true }));
    row.insertAdjacentHTML('beforeend', `<div class="v-name"><strong>${v.silence}</strong><span class="muted">${tx.restOf(v.count)}</span></div>`);
    row.appendChild(engrave([single(R(d))], { sig: 1, width: cellW, barline: false, center: true }));
    values.appendChild(row);
  });

  const tree = root.querySelector('#g-tree');
  const treeW = Math.min(440, window.innerWidth - 150);
  TREE_FIGS.forEach((figs, i) => {
    const row = document.createElement('div');
    row.className = 'tree-row';
    row.innerHTML = `<span>${tx.tree[i]}</span>`;
    row.appendChild(engrave(figs, { sig: 4, width: treeW, height: 72, scale: 1 }));
    tree.appendChild(row);
  });

  for (const [key, list] of Object.entries(EXAMPLE_FIGS)) {
    const box = root.querySelector(`#g-${key}`);
    list.forEach(([figs, sig], i) => {
      const row = document.createElement('div');
      row.className = 'example';
      row.appendChild(engrave(figs, { sig, width: 110 * sig, height: 84, barline: false }));
      row.insertAdjacentHTML('beforeend', `<p>${tx.examples[key][i]}</p>`);
      box.appendChild(row);
    });
  }
}
