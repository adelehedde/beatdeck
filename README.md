# Beat Deck

**▶ Jouer en ligne : https://adelehedde.github.io/beatdeck/**

Quatre cartes, quatre temps. Quatre cartes rythmiques sont posées sur la table, une par temps, et tournent en boucle ; tu les joues sur ton instrument.

- Une carte peut être remplacée juste après avoir été jouée : tu as 3 temps pour la lire avant qu'elle revienne.
- Une nouvelle cellule arrive toutes les 4 boucles (de la noire au triolet).
- Niveau (Facile, Moyen, Difficile, **Madness**), aléatoire et tempo réglables en pleine partie.
- **Comprendre les notes** : les bases (valeurs, silences, point, syncope, triolet, comptage) avec exemples gravés.
- En français et en anglais : langue du navigateur détectée (anglais par défaut), bouton pour changer dans le menu.

HTML / CSS / Canvas / JavaScript sans build. Gravure avec VexFlow (inclus dans `vendor/`), sons enregistrés et police Caveat servis depuis le projet (voir [CREDITS.md](CREDITS.md)).

## Lancer en local

Les modules ES exigent un serveur HTTP :

```sh
python3 -m http.server 8000
# puis http://localhost:8000
```

Pendant la partie : `Espace` pour pause, `Échap` pour arrêter, `↑` `↓` pour le tempo.

## Déployer sur GitHub Pages

Settings → Pages → *Deploy from a branch* → `main`, dossier `/ (root)`.

## Conception

Voir [docs/GAME_DESIGN.md](docs/GAME_DESIGN.md). Les textes de l'interface sont dans `js/i18n.js`, ceux de « Comprendre les notes » dans `js/guide.js`.

## Licence

Code sous licence [MIT](LICENSE). Les sons, VexFlow et la police Caveat gardent leur propre licence : voir [CREDITS.md](CREDITS.md).
