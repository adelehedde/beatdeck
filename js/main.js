// Beat Deck — interface : menu, préparation, barre de contrôle, résultats, réglages, aide.

import { AudioEngine, GUIDE_SOUNDS, CLICK_SOUNDS } from './audio.js';
import { Session } from './session.js';
import { Renderer } from './render.js';
import { LEVELS, RANDOMNESS } from './rhythm.js';
import { fontsReady } from './notation.js';
import { renderGuide } from './guide.js';
import { t, lang, applyPage, switchLang } from './i18n.js';

applyPage();
document.documentElement.classList.remove('i18n-pending');

const DEFAULTS = {
  guideSound: 'snare',
  clickSound: 'hatfoot',
  guide: true,
  metronome: true,
  backing: true,
  counting: true,
  offset: 0,
  volume: 0.8,
};

const read = (key, fallback) => {
  try {
    return { ...fallback, ...JSON.parse(localStorage.getItem(key) || '{}') };
  } catch {
    return { ...fallback };
  }
};
const store = {
  settings: read('beatdeck.settings', DEFAULTS),
  play: read('beatdeck.play', { difficulty: 0, randomness: 2 }), // derniers réglages de la partie
  tempos: read('beatdeck.tempos', {}), // dernier tempo par niveau
  stats: read('beatdeck.stats', { madnessBpm: 0 }),
};
const save = (name) => {
  try {
    localStorage.setItem(`beatdeck.${name}`, JSON.stringify(store[name]));
  } catch {
    /* stockage indisponible : on continue sans mémoriser */
  }
};
const settings = store.settings;
if (!(settings.guideSound in GUIDE_SOUNDS)) settings.guideSound = DEFAULTS.guideSound;
if (!(settings.clickSound in CLICK_SOUNDS)) settings.clickSound = DEFAULTS.clickSound;

const $ = (s) => document.querySelector(s);
const options = (obj) => Object.entries(obj).map(([v, label]) => `<option value="${v}">${label}</option>`).join('');
const clampBpm = (v) => Math.max(40, Math.min(240, v));
const clampIdx = (v, n) => Math.max(0, Math.min(n - 1, v));

const audio = new AudioEngine();
audio.setVolume(settings.volume);
const renderer = new Renderer($('#stage'));
const fonts = Promise.all([fontsReady(), document.fonts.load("700 30px Caveat").catch(() => {})]);

let session = null;
let pending = null; // partie en préparation
let resultsShown = false;

function show(id) {
  document.querySelectorAll('.screen').forEach((el) => el.classList.toggle('visible', el.id === id));
  $('#hud').hidden = !(id === null && session);
}

const tempoKey = (difficulty) => LEVELS[difficulty].id;

// ---------- Préparation : niveau, aléatoire, tempo ----------
const setupForm = $('#setup-form');
setupForm.elements.difficulty.innerHTML = LEVELS.map((d, i) => `<option value="${i}">${t('setup.levelOption', d)}</option>`).join('');
setupForm.elements.randomness.innerHTML = RANDOMNESS.map((r, i) => `<option value="${i}">${t('setup.randOption', r)}</option>`).join('');

function prepare() {
  const { difficulty, randomness } = store.play;
  pending = { difficulty, randomness, bpm: store.tempos[tempoKey(difficulty)] ?? 70 };
  setupForm.elements.difficulty.value = String(difficulty);
  setupForm.elements.randomness.value = String(randomness);
  setupForm.elements.bpm.value = pending.bpm;
  syncSetup();
  show('setup');
}

function syncSetup() {
  $('#setup-bpm').textContent = pending.bpm;
  $('#setup-bpm-label').textContent = t(LEVELS[pending.difficulty].madness ? 'setup.startTempo' : 'setup.tempo');
}

setupForm.addEventListener('input', () => {
  const difficulty = Number(setupForm.elements.difficulty.value);
  if (difficulty !== pending.difficulty) {
    // Chaque niveau garde son dernier tempo.
    pending.difficulty = difficulty;
    pending.bpm = store.tempos[tempoKey(difficulty)] ?? 70;
    setupForm.elements.bpm.value = pending.bpm;
  } else pending.bpm = Number(setupForm.elements.bpm.value);
  pending.randomness = Number(setupForm.elements.randomness.value);
  store.play = { difficulty: pending.difficulty, randomness: pending.randomness };
  save('play');
  syncSetup();
});
document.querySelectorAll('[data-bpm-step]').forEach((b) =>
  b.addEventListener('click', () => {
    const el = setupForm.elements.bpm;
    el.value = clampBpm(Number(el.value) + Number(b.dataset.bpmStep));
    setupForm.dispatchEvent(new Event('input'));
  }),
);
$('#btn-start').addEventListener('click', () => start(pending));

// ---------- Partie ----------
async function start(ex) {
  ex = { ...ex };
  store.tempos[tempoKey(ex.difficulty)] = ex.bpm;
  save('tempos');
  pending = ex;
  const btn = $('#btn-start');
  btn.disabled = true;
  btn.textContent = t('setup.loading');
  try {
    await Promise.all([audio.ready(), fonts]);
  } catch (err) {
    btn.textContent = t('setup.loadError');
    console.error(err);
    return;
  } finally {
    btn.disabled = false;
  }
  btn.textContent = t('setup.start');
  session = new Session({ audio, settings, ex });
  session.start();
  resultsShown = false;
  $('#btn-pause').textContent = '❚❚';
  $('#hud-sound').value = settings.guideSound;
  updateHud();
  show(null);
}

function togglePause() {
  if (!session || session.over) return;
  if (session.paused) session.resume();
  else session.pause();
  $('#btn-pause').textContent = session.paused ? '▶' : '❚❚';
}

function stopSession() {
  if (session && !session.over) session.stop();
}

let lastInfo = '';
function frame() {
  if (session) {
    session.update();
    renderer.top = $('#hud').offsetHeight + 8;
    renderer.draw(session, settings);
    const m = session.measures[session.cmIdx];
    const info = m.countIn ? t('hud.countIn') : t('hud.loop', { n: m.index });
    if (info !== lastInfo) {
      $('#hud-info').textContent = lastInfo = info;
      updateHudTempo();
    }
    if (session.result && !resultsShown) {
      resultsShown = true;
      showResults(session.result);
    }
  } else renderer.drawIdle();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

window.addEventListener('keydown', (e) => {
  if (!session || session.over) return;
  if (e.code === 'Space') {
    e.preventDefault();
    togglePause();
  } else if (e.code === 'Escape') stopSession();
  else if (e.code === 'ArrowUp' || e.code === 'ArrowDown') {
    e.preventDefault();
    changeTempo(e.code === 'ArrowUp' ? 5 : -5);
  }
});
document.addEventListener('visibilitychange', () => {
  if (document.hidden && session && !session.over && !session.paused) togglePause();
});

// ---------- Barre de contrôle : réglages en direct ----------
function updateHud() {
  if (!session) return;
  $('#hud-title').textContent = `Beat Deck · ${session.level.name}`;
  $('#hud-tempo').hidden = session.madness; // en Madness, le tempo monte tout seul
  $('#btn-stop').textContent = t(session.madness ? 'hud.gaveUp' : 'hud.stop');
  $('#hud-rand').textContent = RANDOMNESS[session.ex.randomness].name;
  $('#hud-level').textContent = session.level.name;
  syncToggles();
  updateHudTempo();
}

function updateHudTempo() {
  const p = session?.pendingTempo;
  const cur = session?.measures[session.cmIdx];
  $('#hud-bpm').textContent = p && cur && cur.index < p.at ? `→ ${p.bpm}` : cur ? `${Math.round(cur.bpm)} BPM` : '';
}

function changeTempo(delta) {
  if (!session || session.over || session.madness) return;
  session.setTempo(session.ex.bpm + delta);
  store.tempos[tempoKey(session.ex.difficulty)] = session.ex.bpm;
  save('tempos');
  updateHudTempo();
}

function changePlay(dr, dl) {
  if (!session || session.over) return;
  session.setPlay({
    randomness: clampIdx(session.ex.randomness + dr, RANDOMNESS.length),
    difficulty: clampIdx(session.ex.difficulty + dl, LEVELS.length),
  });
  store.play = { difficulty: session.ex.difficulty, randomness: session.ex.randomness };
  save('play');
  updateHud();
}

document.querySelectorAll('[data-tempo]').forEach((b) => b.addEventListener('click', () => changeTempo(Number(b.dataset.tempo))));
document.querySelectorAll('[data-rand]').forEach((b) => b.addEventListener('click', () => changePlay(Number(b.dataset.rand), 0)));
document.querySelectorAll('[data-level-step]').forEach((b) => b.addEventListener('click', () => changePlay(0, Number(b.dataset.levelStep))));

$('#hud-sound').innerHTML = options(GUIDE_SOUNDS);
$('#hud-sound').addEventListener('change', (e) => {
  settings.guideSound = e.target.value;
  save('settings');
  syncSettingsForm();
  e.target.blur(); // rend la main aux raccourcis clavier
});

function syncToggles() {
  document.querySelectorAll('[data-toggle]').forEach((b) => {
    const k = b.dataset.toggle;
    b.classList.toggle('off', !settings[k]);
    b.hidden = k === 'backing' && !session?.backing;
  });
}
document.querySelectorAll('[data-toggle]').forEach((b) => {
  b.textContent = t(`toggle.${b.dataset.toggle}`);
  b.addEventListener('click', () => {
    settings[b.dataset.toggle] = !settings[b.dataset.toggle];
    save('settings');
    syncSettingsForm();
    syncToggles();
  });
});
$('#btn-pause').addEventListener('click', togglePause);
$('#btn-stop').addEventListener('click', stopSession);

// ---------- Résultats ----------
function showResults(r) {
  const ex = r.ex;
  let title;
  let body;
  const actions = [[t('res.retry'), 'retry']];
  if (r.madness) {
    const record = r.reachedBpm > (store.stats.madnessBpm || 0);
    if (record) {
      store.stats.madnessBpm = r.reachedBpm;
      save('stats');
    }
    title = t('res.madnessTitle', { bpm: r.reachedBpm });
    body = `<p>${t('res.madnessLoops', { n: r.loops })}</p><p class="${record ? 'record' : 'muted'}">${record ? t('res.newRecord') : t('res.record', { bpm: store.stats.madnessBpm })}</p>`;
    actions.push([t('res.share'), 'share']);
  } else {
    title = t('res.title');
    body = `<p>${t('res.summary', { n: r.loops, bpm: r.reachedBpm, level: LEVELS[ex.difficulty].name })}</p>`;
    actions.push([t('res.faster', { bpm: clampBpm(ex.bpm + 5) }), 'faster']);
  }
  actions.push([t('res.menu'), 'menu']);

  $('#res-title').textContent = title;
  $('#res-body').innerHTML = body;
  $('#res-actions').innerHTML = actions
    .map(([label, act], i) => `<button data-act="${act}" class="${i === 0 ? '' : 'ghost'}">${label}</button>`)
    .join('');
  $('#res-actions').querySelectorAll('[data-act]').forEach((b) =>
    b.addEventListener('click', async () => {
      const act = b.dataset.act;
      if (act === 'retry') start(ex);
      else if (act === 'faster') start({ ...ex, bpm: clampBpm(ex.bpm + 5) });
      else if (act === 'menu') goMenu();
      else if (act === 'share') {
        const text = t('res.shareText', { bpm: r.reachedBpm, url: location.href });
        try {
          if (navigator.share) await navigator.share({ text });
          else {
            await navigator.clipboard.writeText(text);
            b.textContent = t('res.copied');
          }
        } catch {
          /* partage annulé */
        }
      }
    }),
  );
  show('results');
}

function goMenu() {
  session = null;
  renderMenuStats();
  show('menu');
}

function renderMenuStats() {
  const s = store.stats;
  $('#menu-stats').textContent = s.madnessBpm ? t('menu.record', { bpm: s.madnessBpm }) : '';
}

// ---------- Réglages ----------
const form = $('#settings-form');
form.elements.guideSound.innerHTML = options(GUIDE_SOUNDS);
form.elements.clickSound.innerHTML = options(CLICK_SOUNDS);
const FORMATS = {
  offset: (v) => `${v > 0 ? '+' : ''}${v} ms`,
  volume: (v) => t('format.percent', { v: Math.round(v * 100) }),
};
function syncSettingsForm() {
  for (const [k, v] of Object.entries(settings)) {
    const el = form.elements[k];
    if (!el) continue;
    if (el.type === 'checkbox') el.checked = v;
    else el.value = v;
  }
  form.querySelectorAll('output[data-for]').forEach((o) => (o.textContent = FORMATS[o.dataset.for](settings[o.dataset.for])));
}
form.addEventListener('input', () => {
  for (const k of Object.keys(DEFAULTS)) {
    const el = form.elements[k];
    if (!el) continue;
    settings[k] = el.type === 'checkbox' ? el.checked : typeof DEFAULTS[k] === 'number' ? Number(el.value) : el.value;
  }
  save('settings');
  audio.setVolume(settings.volume);
  syncSettingsForm();
});
document.querySelectorAll('[data-test]').forEach((b) =>
  b.addEventListener('click', async () => {
    await audio.ready();
    const t0 = audio.ctx.currentTime + 0.05;
    const beat = 0.45;
    if (b.dataset.test === 'guide') [0, 1, 1.5, 2, 2.5, 3].forEach((p) => audio.guide(settings.guideSound, t0 + p * beat, { dur: (p % 1 || p === 1 ? 0.5 : 1) * beat }));
    else [0, 1, 2, 3].forEach((p) => audio.click(settings.clickSound, t0 + p * beat, p === 0, false));
  }),
);

// ---------- Navigation ----------
$('#btn-play').addEventListener('click', prepare);
$('#btn-settings').addEventListener('click', () => show('settings'));
$('#btn-howto').addEventListener('click', () => show('howto'));
function back(to = 'menu') {
  renderMenuStats();
  show(to);
}
document.querySelectorAll('.back').forEach((b) => b.addEventListener('click', () => back(b.dataset.back)));

// Fenêtres : un clic à côté du panneau, ou Échap, ferme comme « Retour » (les résultats ramènent au menu).
const visibleModal = () => document.querySelector('.screen.modal.visible');
document.querySelectorAll('.screen.modal').forEach((screen) =>
  screen.addEventListener('click', (e) => {
    if (e.target === screen) closeModal(screen);
  }),
);
window.addEventListener('keydown', (e) => {
  const screen = visibleModal();
  if (e.code === 'Escape' && screen) closeModal(screen);
});
function closeModal(screen) {
  if (screen.id === 'results') goMenu();
  else back();
}

// Langue : le bouton propose l'autre langue, dans cette langue.
const langBtn = $('#btn-lang');
langBtn.textContent = t('lang.switch');
langBtn.lang = lang === 'fr' ? 'en' : 'fr';
langBtn.setAttribute('aria-label', t('lang.switchLabel'));
langBtn.addEventListener('click', switchLang);

// « Comprendre les notes » : les bases théoriques, avec des exemples gravés.
let guideBuilt = false;
$('#btn-guide').addEventListener('click', async () => {
  await fonts;
  if (!guideBuilt) {
    renderGuide($('#guide-body'));
    guideBuilt = true;
  }
  show('guide');
  $('#guide .panel').scrollTop = 0;
});

syncSettingsForm();
renderMenuStats();
show('menu');
