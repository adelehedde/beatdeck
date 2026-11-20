import { t as tr } from './i18n.js'; // « t » désigne l'instant audio dans ce fichier

// Moteur audio : lecteur d'échantillons enregistrés (batterie Salamander, guitare folk), voir CREDITS.md.

const SAMPLES = {
  'snare-mp': 3,
  stick: 3,
  kick: 3,
  'hat-p': 3,
  'hat-f': 3,
  ride: 3,
  hatfoot: 3,
  'guitar-a2': 0,
  'eguitar-e2': 0,
};

export const GUIDE_SOUNDS = {
  snare: tr('sound.snare'),
  metal: tr('sound.metal'),
  guitar: tr('sound.guitar'),
  stick: tr('sound.stick'),
};

// Courbe de saturation douce (type ampli à lampes), symétrique.
function driveCurve(amount) {
  const n = 2048;
  const curve = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const x = (i * 2) / n - 1;
    curve[i] = Math.tanh(amount * x) / Math.tanh(amount);
  }
  return curve;
}

export const CLICK_SOUNDS = {
  hatfoot: tr('sound.hatfoot'),
  stick: tr('sound.stick'),
};

// Une seconde de silence en WAV (8 kHz, 8 bits, mono), pour le contournement du mode silencieux.
function silentWavUrl() {
  const n = 8000;
  const buf = new DataView(new ArrayBuffer(44 + n));
  const str = (o, txt) => [...txt].forEach((c, i) => buf.setUint8(o + i, c.charCodeAt(0)));
  str(0, 'RIFF');
  buf.setUint32(4, 36 + n, true);
  str(8, 'WAVEfmt ');
  buf.setUint32(16, 16, true);
  buf.setUint16(20, 1, true); // PCM
  buf.setUint16(22, 1, true); // mono
  buf.setUint32(24, 8000, true);
  buf.setUint32(28, 8000, true);
  buf.setUint16(32, 1, true);
  buf.setUint16(34, 8, true);
  str(36, 'data');
  buf.setUint32(40, n, true);
  for (let i = 0; i < n; i++) buf.setUint8(44 + i, 128); // 128 = zéro en 8 bits
  return URL.createObjectURL(new Blob([buf], { type: 'audio/wav' }));
}

export class AudioEngine {
  constructor(base = 'assets/samples/') {
    this.base = base;
    this.ctx = null;
    this.volume = 0.8;
    this.buffers = {};
    this.last = {};
    this.loading = null;
  }

  // À appeler depuis un geste utilisateur (clic, touche) : contrainte des navigateurs.
  ensure() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      const ctx = new AC({ latencyHint: 'interactive' });
      this.ctx = ctx;
      this.master = ctx.createGain();
      this.master.gain.value = this.volume;
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -10;
      comp.ratio.value = 3;
      this.master.connect(comp);
      comp.connect(ctx.destination);
      this.amp = this.buildAmp();
      this.loading = this.load();
    }
    this.bypassSilentMode();
    if (this.ctx.state === 'suspended') this.ctx.resume();
    return this.ctx;
  }

  // iPhone en mode silencieux : Web Audio passe par la session audio « ambient », que le
  // bouton silencieux coupe. On demande la session « playback » (comme un lecteur de musique) :
  // directement si Safari le permet (iOS 17+), sinon en jouant en boucle un son muet
  // dans un élément <audio>, ce qui fait basculer la page en « playback ».
  bypassSilentMode() {
    if (navigator.audioSession) {
      try {
        navigator.audioSession.type = 'playback';
      } catch {
        /* type refusé : on garde le comportement par défaut */
      }
      return;
    }
    const iOS = /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    if (!iOS) return;
    if (!this.silence) {
      this.silence = document.createElement('audio');
      this.silence.src = silentWavUrl();
      this.silence.loop = true;
      this.silence.setAttribute('playsinline', '');
      this.silence.setAttribute('x-webkit-airplay', 'deny');
      // Page masquée : on lâche la session, pour ne pas occuper l'écran verrouillé.
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) this.silence.pause();
      });
    }
    if (this.silence.paused) this.silence.play().catch(() => {});
  }

  ready() {
    this.ensure();
    // En cas d'échec, on retentera au prochain lancement.
    return this.loading.catch((err) => {
      this.loading = this.load();
      throw err;
    });
  }

  async load() {
    const jobs = [];
    for (const [name, count] of Object.entries(SAMPLES)) {
      const files = count ? Array.from({ length: count }, (_, i) => `${name}-${i + 1}.wav`) : [`${name}.wav`];
      jobs.push(
        Promise.all(
          files.map(async (f) => {
            // Jusqu'à 3 tentatives : connexion mobile instable.
            for (let attempt = 1; ; attempt++) {
              try {
                const res = await fetch(this.base + f);
                if (!res.ok) throw new Error(`Son introuvable : ${f} (${res.status})`);
                return await this.ctx.decodeAudioData(await res.arrayBuffer());
              } catch (err) {
                if (attempt >= 3) throw err;
                await new Promise((r) => setTimeout(r, 300 * attempt));
              }
            }
          }),
        ).then((bufs) => (this.buffers[name] = bufs)),
      );
    }
    await Promise.all(jobs);
  }

  // Ampli de guitare simulé : la prise directe (non saturée) passe par
  // préampli → saturation → égalisation « metal » (médiums creusés) → simulation de baffle.
  buildAmp() {
    const c = this.ctx;
    const node = (type, freq, q = 0.7, gain = 0) => {
      const f = c.createBiquadFilter();
      f.type = type;
      f.frequency.value = freq;
      f.Q.value = q;
      f.gain.value = gain;
      return f;
    };
    const input = c.createGain();
    const tight = node('highpass', 110); // grave serré avant saturation
    const pre = c.createGain();
    pre.gain.value = 9;
    const shaper = c.createWaveShaper();
    shaper.curve = driveCurve(6);
    shaper.oversample = '4x';
    const shaper2 = c.createWaveShaper();
    shaper2.curve = driveCurve(2.5);
    shaper2.oversample = '4x';
    const low = node('lowshelf', 120, 0.7, 4);
    const scoop = node('peaking', 600, 0.9, -7);
    const presence = node('peaking', 2400, 1.1, 4);
    const cab = node('lowpass', 5200, 0.8);
    const cab2 = node('lowpass', 7000, 0.6);
    const sub = node('highpass', 70);
    const out = c.createGain();
    out.gain.value = 0.13;
    input.connect(tight).connect(pre).connect(shaper).connect(shaper2).connect(low).connect(scoop).connect(presence).connect(cab).connect(cab2).connect(sub).connect(out).connect(this.master);
    return { input };
  }

  // Note de guitare saturée : corde de mi grave seule, étouffée à la paume, tenue sur sa valeur.
  metalHit(t, dur) {
    const buf = this.buffers['eguitar-e2']?.[0];
    if (!buf) return;
    const at = Math.max(t, this.ctx.currentTime);
    const len = Math.max(0.08, dur * 0.9);
    const mute = this.ctx.createBiquadFilter();
    mute.type = 'lowpass';
    mute.frequency.value = 1100; // la paume sur la corde coupe les aigus
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(1, at + len);
    g.gain.linearRampToValueAtTime(0.0001, at + len + 0.04);
    mute.connect(g).connect(this.amp.input);
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    src.connect(mute);
    src.start(at);
    src.stop(at + len + 0.06);
  }

  setVolume(v) {
    this.volume = v;
    if (this.master) this.master.gain.value = v;
  }

  // Délai entre l'horloge audio et ce que l'oreille entend réellement.
  get latency() {
    const c = this.ctx;
    return c ? (c.outputLatency || 0) + (c.baseLatency || 0) : 0;
  }

  // Joue un échantillon ; plusieurs prises alternent pour éviter l'effet mitraillette.
  hit(name, t, gain, dur = 0) {
    const list = this.buffers[name];
    if (!list || !this.ctx) return;
    let k = Math.floor(Math.random() * list.length);
    if (list.length > 1 && k === this.last[name]) k = (k + 1) % list.length;
    this.last[name] = k;
    const src = this.ctx.createBufferSource();
    src.buffer = list[k];
    const g = this.ctx.createGain();
    g.gain.value = gain;
    src.connect(g).connect(this.master);
    const at = Math.max(t, this.ctx.currentTime);
    src.start(at);
    if (dur) {
      // Note étouffée à la fin de sa valeur (utile pour la guitare).
      g.gain.setValueAtTime(gain, at + dur);
      g.gain.linearRampToValueAtTime(0.0001, at + dur + 0.06);
      src.stop(at + dur + 0.08);
    }
  }

  // Le guide joue chaque note à l'identique (même hauteur, même nuance) : la partition n'indique
  // ni hauteur ni nuance. Seule la durée suit la valeur écrite.
  guide(sound, t, { dur = 0.3 } = {}) {
    if (sound === 'metal') this.metalHit(t, dur);
    else if (sound === 'guitar') this.hit('guitar-a2', t, 0.65, Math.max(0.1, dur * 0.92));
    else if (sound === 'stick') this.hit('stick', t, 0.75);
    else this.hit('snare-mp', t, 0.7);
  }

  click(sound, t, accent, loud) {
    this.hit(sound in CLICK_SOUNDS ? sound : 'hatfoot', t, (accent ? 0.85 : 0.5) * (loud ? 1 : 0.75));
  }

  drum(voice, t, v) {
    const map = { kick: ['kick', 1], snare: ['snare-mp', 0.75], hat: ['hat-p', 0.45], ride: ['ride', 0.4], rim: ['stick', 0.6] };
    const [name, g] = map[voice] || map.hat;
    this.hit(name, t, v * g);
  }
}
