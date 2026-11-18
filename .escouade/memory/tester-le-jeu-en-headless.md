---
name: tester-le-jeu-en-headless
description: "Comment tester Beat Deck (ex-Psycho Pulse) : serveur HTTP obligatoire, Playwright avec channel chrome, simulation node de Session avec un faux audio"
metadata:
  type: feedback
---

Le jeu s'appelle Beat Deck depuis le 18/11/2026 ; le dossier a été renommé `beatdeck` le même jour. Un seul jeu : 4 cartes en boucle.

- Les modules ES exigent un serveur : `python3 -m http.server 8765` à la racine, jamais file://.
- Captures d'écran : Playwright installé dans le scratchpad de la session (les dossiers sous /tmp sont nettoyés entre deux sessions), lancé avec `chromium.launch({ channel: 'chrome' })` (le Chrome du Mac). Les navigateurs Playwright en cache ne correspondent pas à la version installée par npm.
- La logique (`js/session.js`, `js/rhythm.js`) se teste sous node : copier les fichiers en .mjs (et réécrire les imports `.js` → `.mjs`), puis injecter un faux audio `{ ctx: { currentTime, state, suspend, resume }, latency: 0, ensure, click, guide, drum }`, avancer `currentTime` et appeler `update()`. `new Session({ audio, settings, ex: { difficulty, randomness, bpm } })` ; la partie est sans fin, la simulation doit appeler `stop()` elle-même.
- Contrôles utiles : mesures contiguës (`m.start === prev.end`) après `setTempo` / `setPlay`, et nombre de sons joués = nombre de notes passées.
- Piège : ne jamais nommer un champ de formulaire `length` (ni `item`, `namedItem`…), car `form.elements.length` est une propriété native.
- Piège déjà rencontré : une clé en double dans l'objet `store` de `main.js` (la dernière gagne) a vidé l'écran du menu. Après une modification de `store`, recharger la page et vérifier qu'aucune erreur n'apparaît.
- `python3 -m http.server` coupe parfois des connexions quand ~25 sons sont chargés en parallèle (ERR_SOCKET_NOT_CONNECTED / CONNECTION_RESET) ; `AudioEngine.load` réessaie, ne pas prendre ces erreurs isolées pour un bug.
