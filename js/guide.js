// Section « Comprendre les notes » : les bases théoriques, avec des exemples gravés.

import { FIGURES } from './rhythm.js';
import { engraveMeasure } from './notation.js';

const N = (d, extra = {}) => ({ d, ...extra });
const R = (d) => ({ d, rest: true });

// Grave une suite de figures (une par case) ou une figure isolée dans une petite image.
function engrave(blocsSpec, { sig, width, height = 84, scale = 1.15, barline = true }) {
  let beat = 0;
  let id = 0;
  const blocs = blocsSpec.map((fig) => {
    const placed = { fig, startBeat: beat, noteIds: fig.items.filter((i) => !i.rest).map(() => id++) };
    beat += Math.max(1, fig.beats);
    return placed;
  });
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const { canvas } = engraveMeasure({ sig, blocs }, { width, height, scale, dpr, barline, ink: '#1c1414' });
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  return canvas;
}

// Une note ou un silence seul (figure ad hoc d'une seule valeur).
const single = (item) => ({ items: [{ ...item, at: 0 }], beats: Math.max(1, Math.ceil(item.d)) });

const VALUES = [
  { name: 'Ronde', silence: 'Pause', d: 4, count: '4 temps', say: '1 2 3 4' },
  { name: 'Blanche', silence: 'Demi-pause', d: 2, count: '2 temps', say: '1 2' },
  { name: 'Noire', silence: 'Soupir', d: 1, count: '1 temps', say: '1' },
  { name: 'Croche', silence: 'Demi-soupir', d: 0.5, count: '½ temps', say: '1 &' },
  { name: 'Double croche', silence: 'Quart de soupir', d: 0.25, count: '¼ temps', say: '1 e & a' },
];

const TREE = [
  ['1 ronde', [FIGURES.ronde]],
  ['= 2 blanches', [FIGURES.blanche, FIGURES.blanche]],
  ['= 4 noires', Array(4).fill(FIGURES.noire)],
  ['= 8 croches', Array(4).fill(FIGURES.croches)],
  ['= 16 doubles croches', Array(4).fill(FIGURES.quatreDoubles)],
];

const EXAMPLES = {
  point: [
    ['Noire pointée + croche : 1 temps ½ + ½ = 2 temps. On compte « 1 (2) & ».', [FIGURES.noirePointee], 2],
    ['Croche pointée + double : ¾ + ¼ = 1 temps. On compte « 1 a ».', [FIGURES.pointee], 1],
  ],
  ligatures: [
    ['Une ligature (barre) relie les notes d’un même temps : 2 croches = 1 barre…', [FIGURES.croches], 1],
    ['… 4 doubles = 2 barres. Un groupe ligaturé = un temps = une carte.', [FIGURES.quatreDoubles], 1],
    ['Mélange croche + doubles : la croche garde une barre, les doubles en ont deux.', [FIGURES.crocheDoubles], 1],
  ],
  syncope: [
    ['Contretemps : silence sur le temps, note sur le « & ».', [FIGURES.contretemps], 1],
    ['Syncope : attaquée sur un temps faible, tenue sur le temps fort suivant. « 1 & (2) & ».', [FIGURES.syncopeLongue], 2],
  ],
  triolet: [
    ['Deux croches : le temps coupé en 2 (« 1 & »).', [FIGURES.croches], 1],
    ['Triolet : le temps coupé en 3 (« 1 trip let »), signalé par le chiffre 3.', [FIGURES.triolet], 1],
  ],
};

const html = String.raw;

export function renderGuide(root) {
  root.innerHTML = html`
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
    </section>`;

  const values = root.querySelector('#g-values');
  for (const v of VALUES) {
    const row = document.createElement('div');
    row.className = 'value';
    const cellW = 74;
    row.innerHTML = `<div class="v-name"><strong>${v.name}</strong><span>${v.count}</span><span class="muted">« ${v.say} »</span></div>`;
    row.appendChild(engrave([single(N(v.d))], { sig: 1, width: cellW, barline: false }));
    row.insertAdjacentHTML('beforeend', `<div class="v-name"><strong>${v.silence}</strong><span class="muted">silence de ${v.count}</span></div>`);
    row.appendChild(engrave([single(R(v.d))], { sig: 1, width: cellW, barline: false }));
    values.appendChild(row);
  }

  const tree = root.querySelector('#g-tree');
  const treeW = Math.min(440, window.innerWidth - 150);
  for (const [label, figs] of TREE) {
    const row = document.createElement('div');
    row.className = 'tree-row';
    row.innerHTML = `<span>${label}</span>`;
    row.appendChild(engrave(figs, { sig: 4, width: treeW, height: 72, scale: 1 }));
    tree.appendChild(row);
  }

  for (const [key, list] of Object.entries(EXAMPLES)) {
    const box = root.querySelector(`#g-${key}`);
    for (const [text, figs, sig] of list) {
      const row = document.createElement('div');
      row.className = 'example';
      row.appendChild(engrave(figs, { sig, width: 110 * sig, height: 84, barline: false }));
      row.insertAdjacentHTML('beforeend', `<p>${text}</p>`);
      box.appendChild(row);
    }
  }
}
