---
name: traductions-fr-en
description: "Traductions de Beat Deck : où sont les textes, comment ajouter une chaîne, pièges (variable t masquée, pluriels, tester une langue)"
metadata:
  type: feedback
---

- Tout texte visible passe par `t('clé', params)` de `js/i18n.js` (dictionnaires `fr` et `en`, une entrée peut être une fonction pour les pluriels). Le HTML porte `data-i18n` (texte), `data-i18n-html` ou `data-i18n-aria`, posés par `applyPage()` au démarrage. Le contenu de « Comprendre les notes » est à part, dans `TEXT` de `js/guide.js`.
- Ajouter une chaîne : la mettre dans les DEUX dictionnaires. Une clé absente en français retombe sur l'anglais et un avertissement s'affiche en console.
- La langue est fixée au chargement (détection : `?lang=`, puis localStorage `beatdeck.lang`, puis la langue du navigateur, sinon l'anglais). Changer de langue recharge la page : les noms de niveaux, figures et sons sont calculés au chargement des modules.
- Piège rencontré : une variable locale `const t = ...` dans une fonction qui appelle aussi `t(...)` plante (« Cannot access 't' before initialization ») et fige la boucle de rendu. Ne jamais nommer une variable `t` dans un fichier qui importe `t` ; `audio.js` importe `t as tr`, car `t` y désigne l'instant audio.
- Pluriels : en français, singulier jusqu'à 1 (« 0 boucle ») ; en anglais, singulier pour 1 seulement (« 0 loops »). Les deux fonctions `plural` et `pluralEn` existent pour ça.
- Tester une langue avec Playwright : `newPage({ locale: 'en-US' })`, ou ouvrir `?lang=fr`.
