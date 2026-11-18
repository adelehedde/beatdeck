# Beat Deck — document de conception

> Statut : prototype v0.4. Un seul jeu : quatre cartes rythmiques qui tournent en boucle. Anciennement « Psycho Pulse » ; les modes Théorie, Styles et Rythme du jour ont été retirés (pas le même ADN).

## 1. Concept

**Quatre cartes, quatre temps. Joue-les sur ton instrument.**

Inspiré des vidéos de lecture rythmique où quatre cartes sont posées sur une table : chaque carte porte une cellule rythmique (noire, croches, soupir, doubles, triolet…). La carte du temps en cours est mise en avant et la boucle tourne sans fin. Le musicien joue sur sa guitare, sa batterie ou sa basse, ou frappe dans ses mains. L'app ne juge pas : elle fournit le guide sonore, le métronome et la progression.

## 2. Le jeu

- **4 cartes = 1 mesure de 4/4**, une carte par temps. La carte en cours devient rose et se soulève.
- **Boucle continue**, sans manches. Le décompte (« 1, 2, 3, Go ! ») n'a lieu qu'au début.
- **Changement de carte** : une carte peut être remplacée **juste après avoir été jouée**. Elle se retourne à l'écran, et on a 3 temps pour lire la nouvelle avant qu'elle revienne. Jamais de surprise sous le curseur.
- **Progression automatique** : on démarre avec quelques cellules, puis une nouvelle se débloque **toutes les 4 boucles**, arrive aussitôt sur une carte et s'annonce (« Nouvelle carte : croche, 2 doubles »), jusqu'à couvrir le niveau.
- Ordre de déblocage : noire → croches → soupir → croche + demi-soupir → contretemps → 4 doubles → croche + 2 doubles → 2 doubles + croche → croche pointée-double → double-croche pointée → syncope en doubles → quart de soupir → doubles à contretemps → triolet.

### Réglages (avant la partie et en direct)

| Réglage | Valeurs |
|---|---|
| Niveau | **Facile** (jusqu'au contretemps) · **Moyen** (jusqu'aux 2 doubles + croche) · **Difficile** (tout) · **Madness** |
| Aléatoire | Fixe (rien ne change) · Calme (1 carte toutes les 2 boucles) · Normal (1 par boucle) · Vif (2) · Chaos (4) |
| Tempo | 40 à 240 BPM ; un changement en direct s'applique à la boucle suivante. Chaque niveau garde son dernier tempo. |
| Son du guide | caisse claire, guitare saturée (mi grave étouffé), guitare folk, rim-click |

En baissant le niveau en pleine partie, les cartes trop difficiles sont remplacées dès la boucle suivante. Les cartes ne sont préparées qu'une boucle à l'avance : tout réglage s'entend presque tout de suite.

### Madness

Toutes les cellules, **+2 BPM à chaque boucle**, une batterie (grosse caisse sur les temps, charleston sur les contretemps), et des pièges annoncés une boucle à l'avance :

- **Fondu** : chaque carte s'efface juste avant d'être jouée, il faut l'avoir mémorisée.
- **Face cachée** : les cartes ne se dévoilent qu'au dernier moment.
- **Séisme** : la table tremble.

On arrête soi-même (« J'ai décroché ») ; le **record** est le tempo atteint, partageable.

## 3. Direction artistique : « Table & papier »

- Une pièce sombre éclairée au centre, une **table en bois** (dégradé brun), des **cartes en papier crème** légèrement de travers, posées à la main.
- **Encre noire** pour la notation (gravure VexFlow, police Bravura), sans portée, cellule centrée sur la carte.
- **Rose** pour la carte en cours et les accents de l'interface.
- **Caveat** (manuscrite) pour le logo, les titres, le décompte, le comptage écrit sur les cartes ; police système pour le reste de l'interface. Caveat est **servie depuis le projet** (pas depuis Google Fonts, pour ne pas transmettre l'adresse IP des joueurs à Google : sujet RGPD).
- Sur téléphone en portrait, les cartes passent en 2 × 2.

## 4. Aide : « Comprendre les notes »

Section de référence accessible depuis le menu. Elle couvre pulsation, temps et mesure (une carte = un temps), les valeurs et leurs silences, l'arbre des valeurs, le point, les ligatures, contretemps et syncope, le triolet et le comptage à voix haute. Les exemples sont gravés sur de petites cartes en papier.

## 5. Prochaine grosse brique : le mode Écoute (micro)

Le micro détecte les **attaques** (détection d'onsets), les compare aux cartes et affiche l'avance ou le retard de chaque note. Cela permettrait un score objectif, un classement et des défis entre joueurs. Difficultés : latence d'entrée à calibrer, guide et batterie captés par le micro (casque conseillé), bruit ambiant.

## 6. Technique

HTML, CSS, Canvas et JavaScript en modules ES, sans build. Une seule bibliothèque : **VexFlow** pour la gravure.

- **Gravure** : VexFlow 5 (MIT), servi depuis `vendor/`. Chaque cellule est gravée une fois par taille de carte, puis mise en cache.
- **Sons** : échantillons enregistrés (1,8 Mo de WAV mono), joués par un petit lecteur Web Audio. 3 prises par son en alternance aléatoire, attaque recalée à la milliseconde. Le guide joue chaque note à l'identique (même hauteur, même nuance), seule la durée suit la valeur écrite ; le métronome marque le premier temps. La guitare saturée est une prise directe passée dans un ampli simulé (saturation à deux étages, médiums creusés, simulation de baffle).
- **Horloge** : `AudioContext.currentTime`, sons programmés 150 ms à l'avance ; compensation de la latence de sortie et réglage « Synchro son / image ».

```
index.html           écrans + barre de contrôle
css/style.css        thème « Table & papier »
js/rhythm.js         figures, niveaux, aléatoire, générateur de la boucle de cartes
js/session.js        partie : horloge, boucle, planification des sons, réglages en direct
js/audio.js          lecteur d'échantillons, ampli de guitare simulé
js/notation.js       gravure VexFlow
js/render.js         la table, les cartes, le retournement, les pièges
js/guide.js          « Comprendre les notes »
js/main.js           menu, préparation, barre de contrôle, résultats, réglages
assets/samples/      sons            assets/fonts/   Caveat
vendor/              VexFlow         dev/notation-test.html  planche de contrôle des cellules gravées
```

## 7. Hébergement

**GitHub Pages** convient tel quel (`.nojekyll` est présent) : Settings → Pages → branche `main`, dossier racine. Ses conditions d'utilisation sont floues pour un usage commercial : si la monétisation devient sérieuse, passer sur **Cloudflare Pages** ou **Netlify** (gratuits). Un backend (par exemple Supabase) ne deviendra nécessaire qu'avec un classement.

## 8. Monétisation (cible : musiciens)

- **Affiliation matériel**, contextuelle à l'instrument : métronome, pad d'entraînement, baguettes, médiators, ampli casque, casque **filaire** (lien direct avec la latence), pupitre, support de tablette. Programmes : Thomann, Woodbrass, Amazon Partenaires.
- **Affiliation cours** : plateformes de cours d'instrument en ligne.
- **Premium** (achat unique ou petit abonnement) : mode Écoute, statistiques, paquets de cartes supplémentaires (mesures composées, styles), mode prof.
- **Profs et écoles de musique** : parties partagées par lien (niveau, aléatoire, tempo dans l'URL). C'est le marché le plus solvable.
- Pub : au mieux une bannière sur le menu et les résultats, jamais pendant la partie. Toute pub personnalisée impose une bannière de consentement RGPD ; de simples liens d'affiliation, non.

## 9. Mobile

1. **PWA** (manifest + service worker) : installable, plein écran, hors ligne, maintien de l'écran allumé (*wake lock*).
2. **Capacitor** ensuite, pour les stores et un meilleur accès au micro pour le mode Écoute.
3. Point de vigilance : la latence audio d'Android.

## 10. Feuille de route proposée

1. **v0.5** : PWA et déploiement, paquets de cartes en mesures composées (6/8 : noire pointée, trois croches…), partage d'une partie par lien.
2. **v0.6** : **mode Écoute** (micro), calibrage automatique, statistiques par cellule.
3. **v0.7** : mode prof, affiliation matériel.
4. **v1.0** : app mobile, premium.

## 11. Questions ouvertes

- Faut-il plus de 4 cartes (2 mesures, 8 cartes) pour les niveaux avancés ?
- Batterie : une seule ligne rythmique, ou des cartes à plusieurs voix (grosse caisse, caisse claire, charleston) ?
- Quel public cible d'abord : élèves débutants, musiciens confirmés, profs ?
