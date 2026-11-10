# Takt — planificateur d'habitudes pour e-ink

Application une page, locale et hors ligne, pour tablette e-ink 6". Grandes
tuiles sans défilement, coche en un geste, les retards restent visibles jusqu'à
être clos. Sans réseau, sans compte, sans analyse : les données vivent dans le
navigateur de l'appareil.

**En ligne :** https://danilka88.github.io/eink-planner/

![Tableau](design/screens/eink-536-day.png)

## Ce qu'elle fait

- **Tableau du jour.** 1–4 colonnes, les tuiles occupent l'écran, lisibles à 1–2 m.
- **Habitude dans sa plage.** Apparaît à `06:30`, après `09:30` devient
  « en retard · jusqu'à 09:30 » et reste jusqu'à la coche (désactivable).
- **Un geste** — fait : la tuile s'inverse et disparaît après 5–60 minutes.
- **Répétition :** chaque jour, jours de la semaine, jour du mois, date unique.
- **Historique et archives.** Toutes les coches par jour, annulation et
  rétablissement ; les habitudes désactivées gardent leur historique.
- **Dupliquer** une habitude en un geste.
- **Retards** des jours précédents, clos à posteriori.
- **8 langues**, thème clair/sombre/auto, export et import JSON.
- **Hors ligne :** service worker, manifeste PWA, zéro requête réseau.

## Démarrage rapide

```bash
git clone https://github.com/Danilka88/eink-planner.git
cd eink-planner
python3 -m http.server 8080
```

Ouvrez `http://127.0.0.1:8080`.

> Ouvrir `index.html` par double-clic ne fonctionne pas : l'app utilise des
> modules ES, bloqués par le navigateur en `file://`.

### Installer sur la tablette

1. Ouvrez le site en **https** (ou `localhost`) — le cache hors ligne n'y
   fonctionne que là.
2. Menu du navigateur → « Ajouter à l'écran d'accueil ».
3. Activez le mode avion et ouvrez le raccourci : cela fonctionne sans réseau.

Le `http://192.168.x.x` simple n'a pas de mode hors ligne — restriction du
navigateur, pas un défaut de l'app. Réglages → À propos affiche l'état.

## Commandes

| Action | Effet |
|---|---|
| Toucher une tuile | cocher / décocher |
| Appui long | éditeur d'habitude |
| Appui long sur un retard | enregistrer un manque |
| « Toutes » → « Habitudes » | activer, dupliquer, modifier, ajouter |
| « Toutes » → « Historique » | coches par jour : retirer, cocher, manquer |
| « Toutes » → « Archives » | rétablir ou supprimer définitivement |
| « Actualiser » | flash d'écran (nettoyage des fantômes) |
| « Réglages » | thème, langue, format d'heure, minuteries, démo, export |

## Structure

```
index.html            balisage, SEO, modèles, CSP
styles.css            thème 1 bit, grille, règles e-ink
js/app.js             DOM, événements, rendu, éditeur, réglages
js/core/schedule.js   plages, répétition, retards (pur)
js/core/state.js      modèle, migrations, localStorage
js/core/i18n.js       8 langues, pluriels Intl, dates, 12/24 h
js/core/dict/*.js     dictionnaires d'interface
js/core/icons.js      sprite Phosphor Bold
sw.js                 cache hors ligne
tests/                tests unitaires (node --test)
docs/                 architecture, modèle de données, i18n, déploiement
```

## Tests

```bash
npm test
```

25 tests : horaires, migrations, pluriels dans les 8 langues, format d'heure.
Voir `docs/TESTING.md`.

## Confidentialité

Aucune requête réseau : `connect-src 'self'` dans la CSP les bloque au niveau du
navigateur, et l'app n'en fait aucune. Les données restent dans `localStorage`
et ne quittent pas l'appareil. Voir `PRIVACY.md`.

## Données

- Tout vit dans le `localStorage` du navigateur de l'appareil. Pas de synchronisation.
- **« Partager »** ouvre le menu Android : le fichier part directement vers Telegram, le mail ou Fichiers.
- **« Exporter vers un fichier »** télécharge `takt-YYYY-MM-DD.json`.
- **« Importer depuis un fichier »** remplace tout après confirmation.
- Effacer les données du site supprime les habitudes : l'export est la seule sécurité.
- Adresse = stockage. Après un changement d'adresse, déplacez les données par export et import.

## Licence

Code — MIT (`LICENSE`). Icônes — Phosphor Icons, MIT (`THIRD-PARTY.md`).

## Autres langues

[Русский](README.md) · [English](README.en.md) · [Español](README.es.md) ·
[Português](README.pt.md) · [中文](README.zh.md) · [हिन्दी](README.hi.md) ·
[العربية](README.ar.md)
