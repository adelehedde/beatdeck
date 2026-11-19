// Beat Deck — traductions français / anglais.
// Langue : ?lang= dans l'URL, sinon le dernier choix mémorisé, sinon la langue du navigateur, sinon l'anglais.
// Changer de langue recharge la page : tous les textes sont posés au démarrage.

export const LANGS = ['fr', 'en'];
const KEY = 'beatdeck.lang';
const pick = (v) => (v ? LANGS.find((l) => String(v).toLowerCase().startsWith(l)) : undefined);

function detect() {
  if (typeof window === 'undefined') return 'en';
  const url = new URL(window.location.href);
  const fromUrl = pick(url.searchParams.get('lang'));
  if (fromUrl) {
    try {
      localStorage.setItem(KEY, fromUrl);
    } catch {
      /* stockage indisponible : la langue tient le temps de la page */
    }
    url.searchParams.delete('lang');
    history.replaceState(null, '', url);
    return fromUrl;
  }
  try {
    const saved = pick(localStorage.getItem(KEY));
    if (saved) return saved;
  } catch {
    /* stockage indisponible */
  }
  const prefs = navigator.languages?.length ? navigator.languages : [navigator.language];
  for (const p of prefs) {
    const l = pick(p);
    if (l) return l;
  }
  return 'en';
}

export const lang = detect();

// Français : singulier jusqu'à 1 (0 boucle) ; anglais : singulier pour 1 seulement (0 loops).
const plural = (n, one, many) => (n > 1 ? many : one);
const pluralEn = (n, one, many) => (n === 1 ? one : many);

const DICT = {
  fr: {
    'meta.description': 'Beat Deck : quatre cartes rythmiques posées sur la table, une par temps, qui tournent en boucle et changent au fil du jeu. Joue-les sur ton instrument.',
    'lang.switch': 'English',
    'lang.switchLabel': 'Switch to English',

    'hud.slower': 'Ralentir de 5 BPM',
    'hud.faster': 'Accélérer de 5 BPM',
    'hud.lessRandom': 'Moins d’aléatoire',
    'hud.moreRandom': 'Plus d’aléatoire',
    'hud.easier': 'Niveau plus facile',
    'hud.harder': 'Niveau plus difficile',
    'hud.sound': 'Son du guide',
    'hud.pause': 'Pause (espace)',
    'hud.stop': 'Stop',
    'hud.gaveUp': 'J’ai décroché',
    'hud.countIn': 'on y va…',
    'hud.loop': ({ n }) => `boucle ${n}`,
    'toggle.guide': 'Guide',
    'toggle.metronome': 'Clic',
    'toggle.backing': 'Batterie',

    'menu.tagline': 'Quatre cartes, quatre temps. Joue-les sur ton instrument.',
    'menu.play': 'Jouer',
    'menu.guide': 'Comprendre les notes',
    'menu.settings': 'Réglages',
    'menu.howto': 'Comment ça marche',
    'menu.record': ({ bpm }) => `Record en Madness : ${bpm} BPM`,
    back: 'Retour',

    'setup.title': 'Nouvelle partie',
    'setup.intro': 'Quatre cartes, une par temps, tournent en boucle. Une carte peut être remplacée juste après avoir été jouée : tu as 3 temps pour la lire. De nouvelles cartes arrivent au fil des boucles. Aléatoire, niveau et tempo se règlent aussi en pleine partie.',
    'setup.level': 'Niveau',
    'setup.randomness': 'Aléatoire',
    'setup.tempo': 'Tempo :',
    'setup.startTempo': 'Tempo de départ :',
    'setup.levelOption': ({ name, desc }) => `${name} : ${desc}`,
    'setup.randOption': ({ name, rate }) =>
      `${name} : ${!rate ? 'les cartes ne changent pas' : rate < 1 ? '1 carte toutes les 2 boucles' : `${rate} ${plural(rate, 'carte', 'cartes')} par boucle`}`,
    'setup.start': 'Distribuer les cartes',
    'setup.loading': 'Chargement des sons…',
    'setup.loadError': 'Les sons n’ont pas pu être chargés. Réessaie.',

    'settings.title': 'Réglages',
    'settings.guideSound': 'Son du guide',
    'settings.clickSound': 'Son du métronome',
    'settings.listen': 'Écouter',
    'settings.guide': 'Guide : entendre le rythme à jouer',
    'settings.metronome': 'Métronome',
    'settings.backing': 'Batterie en Madness',
    'settings.counting': 'Comptage en bas des cartes (1 e & a)',
    'settings.offset': 'Synchro son / image',
    'settings.offsetHelp': 'Si la carte s’allume après le son, augmente la valeur. Avec un casque Bluetooth, c’est souvent +100 à +200 ms.',
    'settings.volume': 'Volume',
    'format.percent': ({ v }) => `${v} %`,

    'howto.title': 'Comment ça marche',
    'howto.body': `<p>Beat Deck est fait pour les <strong>musiciens</strong> : quatre cartes rythmiques sont posées sur la table, une par temps, et tu les joues sur ton instrument (ou en frappant dans tes mains).</p>
        <p>Les cartes tournent en boucle sans fin. La carte en cours devient rose. Une carte peut être remplacée <strong>juste après avoir été jouée</strong> : elle se retourne, et tu as 3 temps pour la lire avant qu’elle revienne.</p>
        <p>Une nouvelle cellule arrive toutes les 4 boucles, jusqu’à couvrir le niveau choisi. Règle en pleine partie l’<strong>aléatoire</strong> (de « fixe » à « chaos »), le <strong>niveau</strong> et le <strong>tempo</strong> (il s’applique à la boucle suivante).</p>
        <p><strong>Madness</strong> : toutes les cellules, +2 BPM à chaque boucle, une batterie, et des pièges annoncés (carte effacée juste avant d’être jouée, cartes face cachée, table qui tremble). Arrête quand tu décroches : ton record est le tempo atteint.</p>
        <p>Pendant la partie : <kbd>Espace</kbd> pour pause, <kbd>Échap</kbd> pour arrêter, <kbd>↑</kbd> <kbd>↓</kbd> pour le tempo. Les boutons du haut coupent le guide, le clic ou la batterie.</p>
        <p class="muted small-print">Sons : Salamander Drumkit (CC-BY-SA 3.0) et tonejs-instruments (CC-BY 3.0). Gravure : VexFlow (MIT). Police : Caveat (OFL). Code sous licence MIT. Détails dans <a href="https://github.com/adelehedde/beatdeck/blob/main/CREDITS.md" target="_blank" rel="noopener">CREDITS.md</a>.</p>`,

    'res.retry': 'Rejouer',
    'res.share': 'Partager',
    'res.menu': 'Menu',
    'res.copied': 'Copié !',
    'res.madnessTitle': ({ bpm }) => `Tenu jusqu’à ${bpm} BPM`,
    'res.madnessLoops': ({ n }) => `${n} ${plural(n, 'boucle', 'boucles')} en Madness.`,
    'res.newRecord': 'Nouveau record !',
    'res.record': ({ bpm }) => `Record : ${bpm} BPM`,
    'res.title': 'Bien joué !',
    'res.summary': ({ n, bpm, level }) => `${n} ${plural(n, 'boucle', 'boucles')} à ${bpm} BPM, niveau ${level}.`,
    'res.faster': ({ bpm }) => `Rejouer à ${bpm} BPM`,
    'res.shareText': ({ bpm, url }) => `Beat Deck, niveau Madness : j’ai tenu jusqu’à ${bpm} BPM. Tu fais mieux ?\n${url}`,

    'table.go': 'Go !',
    'table.newCard': ({ name }) => `Nouvelle carte : ${name}`,
    'effect.banner': ({ label, hint }) => `${label} ! ${hint}`,
    'effect.fade': 'Fondu',
    'effect.fade.hint': 'chaque carte s’efface juste avant d’être jouée : retiens-la',
    'effect.blind': 'Face cachée',
    'effect.blind.hint': 'les cartes ne se dévoilent qu’au dernier moment',
    'effect.shake': 'Séisme',
    'effect.shake.hint': 'la table tremble',

    'level.facile': 'Facile',
    'level.facile.desc': 'noires, croches, soupirs, contretemps',
    'level.moyen': 'Moyen',
    'level.moyen.desc': '+ doubles croches',
    'level.difficile': 'Difficile',
    'level.difficile.desc': '+ rythmes pointés, syncopes, triolets',
    'level.madness': 'Madness',
    'level.madness.desc': 'tout, +2 BPM à chaque boucle, et des pièges',
    'rand.0': 'Fixe',
    'rand.1': 'Calme',
    'rand.2': 'Normal',
    'rand.3': 'Vif',
    'rand.4': 'Chaos',

    'sound.snare': 'Caisse claire',
    'sound.metal': 'Guitare saturée (mi grave étouffé)',
    'sound.guitar': 'Guitare folk (la grave)',
    'sound.stick': 'Rim-click',
    'sound.hatfoot': 'Charleston au pied',

    'fig.ronde': 'Ronde',
    'fig.pause': 'Pause',
    'fig.blanchePointee': 'Blanche pointée',
    'fig.blanche': 'Blanche',
    'fig.demiPause': 'Demi-pause',
    'fig.noire': 'Noire',
    'fig.soupir': 'Soupir',
    'fig.croches': '2 croches',
    'fig.crocheDemi': 'Croche, ½ soupir',
    'fig.contretemps': 'Contretemps',
    'fig.noirePointee': 'Noire pointée, croche',
    'fig.syncopeLongue': 'Syncope',
    'fig.quatreDoubles': '4 doubles',
    'fig.crocheDoubles': 'Croche, 2 doubles',
    'fig.doublesCroche': '2 doubles, croche',
    'fig.pointee': 'Croche pointée, double',
    'fig.lombard': 'Double, croche pointée',
    'fig.syncope': 'Double, croche, double',
    'fig.quartSoupir': '¼ soupir, 3 doubles',
    'fig.doublesContre': 'Doubles à contretemps',
    'fig.triolet': 'Triolet',
  },

  en: {
    'meta.description': 'Beat Deck: four rhythm cards on the table, one per beat, looping and changing as you play. Play them on your instrument.',
    'lang.switch': 'Français',
    'lang.switchLabel': 'Passer en français',

    'hud.slower': 'Slow down by 5 BPM',
    'hud.faster': 'Speed up by 5 BPM',
    'hud.lessRandom': 'Less randomness',
    'hud.moreRandom': 'More randomness',
    'hud.easier': 'Easier level',
    'hud.harder': 'Harder level',
    'hud.sound': 'Guide sound',
    'hud.pause': 'Pause (space)',
    'hud.stop': 'Stop',
    'hud.gaveUp': 'I lost it',
    'hud.countIn': 'here we go…',
    'hud.loop': ({ n }) => `loop ${n}`,
    'toggle.guide': 'Guide',
    'toggle.metronome': 'Click',
    'toggle.backing': 'Drums',

    'menu.tagline': 'Four cards, four beats. Play them on your instrument.',
    'menu.play': 'Play',
    'menu.guide': 'Reading rhythms',
    'menu.settings': 'Settings',
    'menu.howto': 'How it works',
    'menu.record': ({ bpm }) => `Madness record: ${bpm} BPM`,
    back: 'Back',

    'setup.title': 'New game',
    'setup.intro': 'Four cards, one per beat, keep looping. A card can be replaced right after it has been played: you get 3 beats to read it. New cards show up as the loops go by. Randomness, level and tempo can also be changed mid-game.',
    'setup.level': 'Level',
    'setup.randomness': 'Randomness',
    'setup.tempo': 'Tempo:',
    'setup.startTempo': 'Starting tempo:',
    'setup.levelOption': ({ name, desc }) => `${name}: ${desc}`,
    'setup.randOption': ({ name, rate }) =>
      `${name}: ${!rate ? 'cards never change' : rate < 1 ? '1 card every 2 loops' : `${rate} ${pluralEn(rate, 'card', 'cards')} per loop`}`,
    'setup.start': 'Deal the cards',
    'setup.loading': 'Loading sounds…',
    'setup.loadError': 'The sounds could not be loaded. Try again.',

    'settings.title': 'Settings',
    'settings.guideSound': 'Guide sound',
    'settings.clickSound': 'Metronome sound',
    'settings.listen': 'Listen',
    'settings.guide': 'Guide: hear the rhythm to play',
    'settings.metronome': 'Metronome',
    'settings.backing': 'Drums in Madness',
    'settings.counting': 'Counting under the cards (1 e & a)',
    'settings.offset': 'Audio / video sync',
    'settings.offsetHelp': 'If the card lights up after the sound, increase the value. With Bluetooth headphones, it is often +100 to +200 ms.',
    'settings.volume': 'Volume',
    'format.percent': ({ v }) => `${v}%`,

    'howto.title': 'How it works',
    'howto.body': `<p>Beat Deck is made for <strong>musicians</strong>: four rhythm cards are laid on the table, one per beat, and you play them on your instrument (or by clapping).</p>
        <p>The cards loop endlessly. The current card turns pink. A card can be replaced <strong>right after it has been played</strong>: it flips over, and you get 3 beats to read it before it comes back around.</p>
        <p>A new rhythm cell shows up every 4 loops, until the chosen level is covered. Mid-game, adjust the <strong>randomness</strong> (from “fixed” to “chaos”), the <strong>level</strong> and the <strong>tempo</strong> (it applies from the next loop).</p>
        <p><strong>Madness</strong>: every cell, +2 BPM each loop, a drum groove, and announced traps (a card wiped just before it is played, face-down cards, a shaking table). Stop when you lose it: your record is the tempo you reached.</p>
        <p>During the game: <kbd>Space</kbd> to pause, <kbd>Esc</kbd> to stop, <kbd>↑</kbd> <kbd>↓</kbd> for the tempo. The buttons at the top mute the guide, the click or the drums.</p>
        <p class="muted small-print">Sounds: Salamander Drumkit (CC-BY-SA 3.0) and tonejs-instruments (CC-BY 3.0). Engraving: VexFlow (MIT). Font: Caveat (OFL). Code under the MIT license. Details in <a href="https://github.com/adelehedde/beatdeck/blob/main/CREDITS.md" target="_blank" rel="noopener">CREDITS.md</a>.</p>`,

    'res.retry': 'Play again',
    'res.share': 'Share',
    'res.menu': 'Menu',
    'res.copied': 'Copied!',
    'res.madnessTitle': ({ bpm }) => `Held on up to ${bpm} BPM`,
    'res.madnessLoops': ({ n }) => `${n} ${pluralEn(n, 'loop', 'loops')} in Madness.`,
    'res.newRecord': 'New record!',
    'res.record': ({ bpm }) => `Record: ${bpm} BPM`,
    'res.title': 'Well played!',
    'res.summary': ({ n, bpm, level }) => `${n} ${pluralEn(n, 'loop', 'loops')} at ${bpm} BPM, ${level} level.`,
    'res.faster': ({ bpm }) => `Play again at ${bpm} BPM`,
    'res.shareText': ({ bpm, url }) => `Beat Deck, Madness level: I held on up to ${bpm} BPM. Can you beat that?\n${url}`,

    'table.go': 'Go!',
    'table.newCard': ({ name }) => `New card: ${name}`,
    'effect.banner': ({ label, hint }) => `${label}! ${hint}`,
    'effect.fade': 'Fade',
    'effect.fade.hint': 'each card vanishes just before it is played: remember it',
    'effect.blind': 'Face down',
    'effect.blind.hint': 'cards are revealed only at the last moment',
    'effect.shake': 'Earthquake',
    'effect.shake.hint': 'the table shakes',

    'level.facile': 'Easy',
    'level.facile.desc': 'quarter notes, eighth notes, rests, offbeats',
    'level.moyen': 'Medium',
    'level.moyen.desc': '+ sixteenth notes',
    'level.difficile': 'Hard',
    'level.difficile.desc': '+ dotted rhythms, syncopation, triplets',
    'level.madness': 'Madness',
    'level.madness.desc': 'everything, +2 BPM each loop, and traps',
    'rand.0': 'Fixed',
    'rand.1': 'Calm',
    'rand.2': 'Normal',
    'rand.3': 'Lively',
    'rand.4': 'Chaos',

    'sound.snare': 'Snare drum',
    'sound.metal': 'Distorted guitar (palm-muted low E)',
    'sound.guitar': 'Acoustic guitar (low A)',
    'sound.stick': 'Rim click',
    'sound.hatfoot': 'Hi-hat pedal',

    'fig.ronde': 'Whole note',
    'fig.pause': 'Whole rest',
    'fig.blanchePointee': 'Dotted half note',
    'fig.blanche': 'Half note',
    'fig.demiPause': 'Half rest',
    'fig.noire': 'Quarter note',
    'fig.soupir': 'Quarter rest',
    'fig.croches': '2 eighth notes',
    'fig.crocheDemi': 'Eighth note, eighth rest',
    'fig.contretemps': 'Offbeat eighth',
    'fig.noirePointee': 'Dotted quarter, eighth',
    'fig.syncopeLongue': 'Syncopation',
    'fig.quatreDoubles': '4 sixteenths',
    'fig.crocheDoubles': 'Eighth, 2 sixteenths',
    'fig.doublesCroche': '2 sixteenths, eighth',
    'fig.pointee': 'Dotted eighth, sixteenth',
    'fig.lombard': 'Sixteenth, dotted eighth',
    'fig.syncope': 'Sixteenth, eighth, sixteenth',
    'fig.quartSoupir': 'Sixteenth rest, 3 sixteenths',
    'fig.doublesContre': 'Offbeat sixteenths',
    'fig.triolet': 'Triplet',
  },
};

// Texte traduit ; une entrée peut être une fonction des paramètres (pluriels, nombres).
export function t(key, params = {}) {
  const entry = DICT[lang][key] ?? DICT.en[key];
  if (entry === undefined) {
    console.warn(`i18n : clé manquante « ${key} »`);
    return key;
  }
  return typeof entry === 'function' ? entry(params) : entry;
}

// Pose les textes de la page : data-i18n (texte), data-i18n-html (HTML), data-i18n-aria (aria-label).
export function applyPage(root = document) {
  document.documentElement.lang = lang;
  document.querySelector('meta[name="description"]')?.setAttribute('content', t('meta.description'));
  root.querySelectorAll('[data-i18n]').forEach((el) => (el.textContent = t(el.dataset.i18n)));
  root.querySelectorAll('[data-i18n-html]').forEach((el) => (el.innerHTML = t(el.dataset.i18nHtml)));
  root.querySelectorAll('[data-i18n-aria]').forEach((el) => el.setAttribute('aria-label', t(el.dataset.i18nAria)));
}

// Bascule vers l'autre langue : la page se recharge avec ?lang=, mémorisé ensuite par detect().
export function switchLang() {
  const url = new URL(window.location.href);
  url.searchParams.set('lang', lang === 'fr' ? 'en' : 'fr');
  window.location.replace(url);
}
