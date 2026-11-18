---
name: gravure-vexflow-et-sons
description: Pièges VexFlow 5 (couleurs, placement proportionnel) et échantillons audio de Psycho Pulse
metadata:
  type: feedback
---

- VexFlow 5 est servi depuis `vendor/vexflow-bravura.js` (build UMD, global `window.VexFlow`, police Bravura embarquée). Attendre `document.fonts.load('30px Bravura')` avant toute gravure, sinon les glyphes manquent.
- Sur fond sombre, appeler `ctx.setFillStyle/setStrokeStyle` sur le contexte VexFlow ET `note.setStyle` sur chaque note, rests compris. Sinon silences, ligatures, chiffres de triolet et portée sortent en noir, invisibles.
- Le placement proportionnel au temps se fait à la main : un `TickContext` par note, `preFormat()`, puis `setX` corrigé pour centrer la tête (`getNoteHeadBeginX/EndX`). Créer les `Beam` avant `note.draw()`, sinon les crochets s'ajoutent aux ligatures.
- Pour vérifier visuellement toutes les cellules : `dev/notation-test.html`.
- Échantillons : WAV mono préparés depuis Salamander Drumkit (CC-BY-SA 3.0) et tonejs-instruments (CC-BY 3.0), à créditer dans `CREDITS.md`. `ffmpeg` n'est pas installé : convertir avec `afconvert` (macOS), puis recaler, couper et normaliser en Python (module `wave`).
- `python3 -m http.server` coupe parfois des connexions quand ~25 sons sont chargés en parallèle (ERR_SOCKET_NOT_CONNECTED). `AudioEngine.load` réessaie 3 fois ; ne pas prendre ces erreurs isolées pour un bug.
