# Beat Deck

Quatre cartes, quatre temps. Quatre cartes rythmiques sont posées sur la table, une par temps, et tournent en boucle ; tu les joues sur ton instrument.

- Une carte peut être remplacée juste après avoir été jouée : tu as 3 temps pour la lire avant qu'elle revienne.
- Une nouvelle cellule arrive toutes les 4 boucles (de la noire au triolet).
- Niveau (Facile, Moyen, Difficile, **Madness**), aléatoire et tempo réglables en pleine partie.
- **Comprendre les notes** : les bases (valeurs, silences, point, syncope, triolet, comptage) avec exemples gravés.

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

Voir [docs/GAME_DESIGN.md](docs/GAME_DESIGN.md).
