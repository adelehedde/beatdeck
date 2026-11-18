// Beat Deck — rendu canvas : la table, les 4 cartes en papier, la carte en cours en rose.

import { EFFECTS, countSyllable } from './rhythm.js';
import { engraveMeasure } from './notation.js';

// Palette « Table & papier » (voir aussi les variables CSS).
const ROOM = '#181212';
const WOOD_TOP = '#53301f';
const WOOD_BOTTOM = '#2e1912';
const PAPER = '#f6f0e4';
const INK = '#1c1414';
const ROSE = '#e05a7c';
const CREAM = '#f4ece0';
const HAND = "Caveat, 'Bradley Hand', 'Segoe Print', cursive";
const TILTS = [-1.5, 1, -0.6, 1.3]; // degrés : des cartes posées à la main

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

export class Renderer {
  constructor(canvas) {
    this.c = canvas;
    this.g = canvas.getContext('2d');
    this.cardCache = new Map();
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.W = window.innerWidth;
    this.H = window.innerHeight;
    this.c.width = Math.round(this.W * this.dpr);
    this.c.height = Math.round(this.H * this.dpr);
    this.c.style.width = `${this.W}px`;
    this.c.style.height = `${this.H}px`;
    this.g.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  }

  room(light = 0) {
    const { g, W, H } = this;
    const grad = g.createRadialGradient(W / 2, H * 0.55, 0, W / 2, H * 0.55, Math.hypot(W, H) * 0.6);
    grad.addColorStop(0, `hsl(10, 22%, ${11 + light}%)`);
    grad.addColorStop(1, ROOM);
    g.fillStyle = grad;
    g.fillRect(-30, -30, W + 60, H + 60);
  }

  // Écran d'accueil : la pièce sombre, éclairée au centre.
  drawIdle() {
    this.room();
  }

  // Image gravée d'une carte (encre noire, cellule centrée), mise en cache par taille.
  cardImage(fig, w, h) {
    const key = `${fig.id}|${Math.round(w)}|${Math.round(h)}`;
    let img = this.cardCache.get(key);
    if (!img) {
      if (this.cardCache.size > 200) this.cardCache.clear();
      const blocs = [{ fig, startBeat: 0, noteIds: fig.items.filter((i) => !i.rest).map((_, k) => k) }];
      img = engraveMeasure({ sig: 1, blocs }, { width: w, height: h, scale: w / 62, dpr: this.dpr, ink: INK, staff: false, barline: false, center: true }).canvas;
      this.cardCache.set(key, img);
    }
    return img;
  }

  draw(session, settings) {
    const { g } = this;
    const now = session.now;
    const m = session.currentMeasure(now);
    const phase = now >= m.start ? (now - m.start) % m.beat : m.beat;
    const pulse = Math.exp(-phase * 8);

    g.save();
    if (session.madness) {
      const shake = pulse * (m.effect === 'shake' ? 14 : 1.5);
      g.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);
    }
    // En Madness, la pièce s'allume un peu sur chaque temps.
    this.room(session.madness ? pulse * 6 : 0);
    const top = this.top || 64; // sous la barre de contrôle HTML
    this.drawTable(session, settings, now, top);
    this.drawBanner(session, now, m);
    g.restore();
  }

  drawTable(session, settings, now, top) {
    const { g, W, H } = this;
    if (this.cardSession !== session) {
      this.cardSession = session;
      this.cardState = [];
    }
    const m = session.measures[session.cmIdx];
    const next = session.measures[session.cmIdx + 1];
    const portrait = W < 640 && H > W;
    const cols = portrait ? 2 : 4;
    const rows = 4 / cols;
    const gap = portrait ? 14 : 24;
    let cw = (Math.min(W - 48, 1040) - gap * (cols - 1)) / cols;
    let ch = cw * 1.4;
    const availH = H - top - 150;
    if (ch * rows + gap * (rows - 1) > availH) {
      ch = (availH - gap * (rows - 1)) / rows;
      cw = ch / 1.4;
    }
    const gridW = cw * cols + gap * (cols - 1);
    const gridH = ch * rows + gap * (rows - 1);
    const x0 = (W - gridW) / 2;
    const y0 = top + (H - top - gridH) / 2 + 10;

    // La table en bois.
    const pad = portrait ? 18 : 36;
    const wood = g.createLinearGradient(0, y0 - pad, 0, y0 + gridH + pad);
    wood.addColorStop(0, WOOD_TOP);
    wood.addColorStop(1, WOOD_BOTTOM);
    g.save();
    g.shadowColor = 'rgba(0,0,0,.6)';
    g.shadowBlur = 44;
    g.shadowOffsetY = 18;
    g.fillStyle = wood;
    g.beginPath();
    g.roundRect(x0 - pad, y0 - pad, gridW + pad * 2, gridH + pad * 2, 48);
    g.fill();
    g.restore();
    g.strokeStyle = 'rgba(255,255,255,.06)';
    g.lineWidth = 2;
    g.beginPath();
    g.roundRect(x0 - pad + 1, y0 - pad + 1, gridW + pad * 2 - 2, gridH + pad * 2 - 2, 47);
    g.stroke();

    // Au-dessus de la table, à la main : décompte, ou nouvelle carte annoncée.
    g.textAlign = 'center';
    if (m.countIn && now >= m.start) {
      const b = clamp(Math.floor((now - m.start) / m.beat), 0, m.sig - 1);
      g.fillStyle = ROSE;
      g.font = `700 46px ${HAND}`;
      g.fillText(b === m.sig - 1 ? 'Go !' : String(b + 1), W / 2, y0 - pad - 16);
    } else if (m.info || next?.info) {
      g.fillStyle = CREAM;
      g.font = `700 26px ${HAND}`;
      g.fillText(m.info || next.info, W / 2, y0 - pad - 18);
    }

    const t = performance.now();
    for (let b = 0; b < 4; b++) {
      const t0 = m.start + b * m.beat;
      const played = !m.countIn && now >= t0 + m.beat;
      const active = !m.countIn && now >= t0 && now < t0 + m.beat;
      // Une carte jouée montre déjà celle de la boucle suivante : elle se retourne juste après son temps.
      const src = m.countIn ? next : played && next ? next : m;
      const fig = src?.blocs[b]?.fig;
      if (!fig) continue;
      const st = (this.cardState[b] ||= { fig, prev: null, at: 0 });
      if (st.fig !== fig) Object.assign(st, { prev: st.fig, fig, at: t });
      const k = clamp((t - st.at) / 280, 0, 1); // retournement
      const showPrev = k < 0.5 && st.prev;
      const sx = Math.abs(Math.cos(k * Math.PI)) || 0.02;

      const cx = x0 + (b % cols) * (cw + gap) + cw / 2;
      const cy = y0 + Math.floor(b / cols) * (ch + gap) + ch / 2 - (active ? 10 : 0);
      g.save();
      g.translate(cx, cy);
      g.rotate((TILTS[b] * Math.PI) / 180);
      g.scale(st.prev ? sx : 1, 1);
      g.shadowColor = 'rgba(0,0,0,.5)';
      g.shadowBlur = active ? 28 : 14;
      g.shadowOffsetY = active ? 14 : 6;
      g.fillStyle = active ? ROSE : PAPER;
      g.beginPath();
      g.roundRect(-cw / 2, -ch / 2, cw, ch, 7);
      g.fill();
      g.shadowColor = 'transparent';

      // Pièges de Madness : carte face cachée, ou face effacée juste avant d'être jouée.
      const effect = src.effect;
      const hidden = effect === 'blind' && now < (src === m ? t0 : next.start + b * next.beat) - m.beat;
      const faded = effect === 'fade' && src === m && now >= t0 - m.beat && now < t0;
      if (hidden) {
        g.fillStyle = '#8a3a52';
        g.beginPath();
        g.roundRect(-cw / 2 + 8, -ch / 2 + 8, cw - 16, ch - 16, 4);
        g.fill();
        g.strokeStyle = 'rgba(246,240,228,.28)';
        g.lineWidth = 2;
        for (let d = -ch; d < ch; d += 14) {
          g.beginPath();
          g.moveTo(-cw / 2 + 8, d);
          g.lineTo(cw / 2 - 8, d + cw * 0.6);
          g.stroke();
        }
      } else if (!faded) {
        const face = showPrev ? st.prev : fig;
        g.drawImage(this.cardImage(face, cw, ch * 0.8), -cw / 2, -ch / 2 + ch * 0.07, cw, ch * 0.8);
        if (settings.counting) {
          g.fillStyle = active ? 'rgba(61,20,32,.8)' : 'rgba(92,74,68,.85)';
          g.font = `600 ${Math.round(cw / 7.5)}px ${HAND}`;
          g.textAlign = 'center';
          const syl = face.items.map((it) => (it.rest ? '·' : countSyllable(b + it.at, face.tuplet))).join('  ');
          g.fillText(syl, 0, ch / 2 - ch * 0.08);
        }
      }
      g.restore();
    }
  }

  // Annonce des pièges de Madness, sous la table.
  drawBanner(session, now, m) {
    const { g, W } = this;
    const next = session.measures[session.cmIdx + 1];
    let text = null;
    if (next?.effect && now > next.start - next.beat * next.sig) {
      if (Math.floor(now * 4) % 2 === 0) text = `${EFFECTS[next.effect].label} ! ${EFFECTS[next.effect].hint}`;
    } else if (m.effect) text = EFFECTS[m.effect].label;
    if (!text) return;
    g.fillStyle = ROSE;
    g.font = `700 26px ${HAND}`;
    g.textAlign = 'center';
    g.fillText(text, W / 2, this.H - 28);
  }
}
