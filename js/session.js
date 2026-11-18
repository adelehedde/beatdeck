// Beat Deck — séance : horloge audio, boucle de cartes, planification des sons.
// Pas de jugement : le musicien joue sur son instrument pendant que les cartes tournent.

import { DeckGen, LEVELS } from './rhythm.js';

// Batterie de Madness : grosse caisse sur les temps, charleston sur les contretemps.
const MADNESS_BACKING = { kick: 'x...x...x...x...', hat: '..x...x...x...x.' };

export class Session {
  // ex : { bpm, difficulty, randomness }
  constructor({ audio, settings, ex }) {
    this.audio = audio;
    this.settings = settings; // objet partagé : les bascules en cours de séance s'appliquent
    this.ex = ex;
    this.gen = new DeckGen({
      seed: (Math.random() * 0xffffffff) >>> 0,
      bpm: ex.bpm,
      difficulty: ex.difficulty,
      randomness: ex.randomness,
    });
    this.measures = [];
    this.notes = [];
    this.events = [];
    this.evIdx = 0;
    this.cmIdx = 0;
    this.over = false;
    this.paused = false;
    this.result = null;
  }

  get level() {
    return LEVELS[this.ex.difficulty];
  }

  get madness() {
    return this.gen.madness;
  }

  get backing() {
    return this.madness ? MADNESS_BACKING : null;
  }

  start() {
    const ctx = this.audio.ensure();
    this.lat = this.audio.latency + this.settings.offset / 1000;
    this.t0 = ctx.currentTime + 0.4;
    this.fill();
  }

  // Temps tel que l'entend le musicien (latence de sortie + calibrage compris).
  get now() {
    return this.audio.ctx.currentTime - this.t0 - this.lat;
  }

  currentMeasure(now = this.now) {
    const ms = this.measures;
    while (this.cmIdx + 1 < ms.length && ms[this.cmIdx + 1].start <= now) this.cmIdx++;
    return ms[this.cmIdx];
  }

  // Les cartes ne sont préparées qu'une boucle à l'avance : un réglage changé en direct
  // s'entend dès la boucle suivante.
  fill() {
    while (this.measures.length < this.cmIdx + 2) {
      const m = this.gen.next();
      for (const n of m.notes) {
        n.id = this.notes.length;
        this.notes.push(n);
        m.blocs[n.bloc].noteIds.push(n.id);
      }
      this.measures.push(m);
      this.events.push(...this.measureEvents(m));
    }
  }

  measureEvents(m) {
    const ev = [];
    for (let b = 0; b < m.sig; b++) ev.push({ t: m.start + b * m.beat, type: 'click', accent: b === 0, countIn: m.countIn });
    if (!m.countIn) {
      for (const n of m.notes) ev.push({ t: n.t, type: 'note', dur: n.dur });
      if (this.backing) {
        for (const [voice, grid] of Object.entries(this.backing)) {
          const step = m.sig / grid.length;
          for (let k = 0; k < grid.length; k++) if (grid[k] === 'x') ev.push({ t: m.start + k * step * m.beat, type: 'drum', voice });
        }
      }
    }
    return ev.sort((a, b) => a.t - b.t);
  }

  update() {
    if (this.over || this.paused) return;
    this.currentMeasure(this.now);
    this.fill();
    this.schedule(this.audio.ctx.currentTime + 0.15);
  }

  // Programme les sons un peu à l'avance sur l'horloge audio (précision à l'échantillon).
  schedule(horizon) {
    const ctx = this.audio.ctx;
    const s = this.settings;
    while (this.evIdx < this.events.length) {
      const e = this.events[this.evIdx];
      const at = this.t0 + e.t;
      if (at > horizon) break;
      this.evIdx++;
      if (at < ctx.currentTime - 0.01) continue;
      if (e.type === 'click' && (s.metronome || e.countIn)) this.audio.click(s.clickSound, at, e.accent, e.countIn);
      else if (e.type === 'note' && s.guide) this.audio.guide(s.guideSound, at, e);
      else if (e.type === 'drum' && s.backing) this.audio.drum(e.voice, at, 0.5);
    }
  }

  // Aléatoire et niveau en direct.
  setPlay({ randomness = this.gen.randomness, difficulty = this.gen.difficulty }) {
    if (this.over) return;
    const wasMadness = this.madness;
    this.ex.randomness = this.gen.randomness = randomness;
    this.ex.difficulty = this.gen.difficulty = difficulty;
    // En sortant de Madness, on garde le tempo atteint ; en y entrant, on part du tempo actuel.
    if (wasMadness && !this.madness) this.ex.bpm = this.gen.baseBpm = this.gen.lastBpm;
    if (!wasMadness && this.madness) this.gen.lastBpm = this.gen.baseBpm;
  }

  // Première boucle modifiable sans toucher aux sons déjà programmés.
  firstEditable() {
    const now = this.now;
    let first = this.cmIdx + 1;
    while (first < this.measures.length && this.measures[first].start - now < 0.3) first++;
    return first;
  }

  // Change le tempo à partir de la prochaine boucle. Retourne l'index de la boucle concernée.
  setTempo(bpm) {
    if (this.over || this.madness) return null;
    bpm = Math.max(40, Math.min(240, Math.round(bpm)));
    const delta = bpm - this.ex.bpm;
    if (!delta) return null;
    const first = this.firstEditable();
    if (first >= this.measures.length) return null;
    this.ex.bpm = bpm;
    this.gen.baseBpm += delta;
    const cut = this.measures[first].start - 1e-9;
    let keep = this.events.findIndex((e) => e.t >= cut);
    if (keep < 0) keep = this.events.length;
    this.events.length = Math.max(keep, this.evIdx);
    for (let k = first; k < this.measures.length; k++) {
      const m = this.measures[k];
      const prev = this.measures[k - 1];
      m.bpm = Math.max(40, Math.min(300, m.bpm + delta));
      m.beat = 60 / m.bpm;
      m.start = prev.end;
      m.end = m.start + m.sig * m.beat;
      for (const n of m.notes) {
        n.t = m.start + n.pos * m.beat;
        n.dur = n.item.d * m.beat;
      }
      this.events.push(...this.measureEvents(m));
    }
    this.gen.time = this.measures[this.measures.length - 1].end;
    this.pendingTempo = { bpm: this.measures[first].bpm, at: this.measures[first].index };
    return this.measures[first].index;
  }

  pause() {
    if (this.over || this.paused) return;
    this.paused = true;
    this.audio.ctx.suspend();
  }

  resume() {
    if (!this.paused) return;
    this.paused = false;
    this.audio.ctx.resume();
  }

  // Arrêt : le décompte et la boucle en cours ne comptent pas comme jouées.
  stop() {
    if (this.over) return;
    if (this.audio.ctx.state === 'suspended') this.audio.ctx.resume();
    this.over = true;
    const m = this.measures[this.cmIdx];
    this.result = {
      ex: this.ex,
      madness: this.madness,
      reachedBpm: Math.round(m.bpm),
      loops: Math.max(0, m.index - 1),
    };
  }
}
