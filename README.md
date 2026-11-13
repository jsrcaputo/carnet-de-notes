# Carnet de notes

- [index.html](index.html) : version publiée ; elle utilise le dossier [carnet-test](carnet-test/).
- [index-test.html](index-test.html) : page de test utilisant les mêmes ressources.
- [index-Backup.html](index-Backup.html) : sauvegarde de la version publiée précédente.
- [echelles-niveaux.js](echelles-niveaux.js) : échelles du primaire.

Pour utiliser le carnet, ouvrir `index.html` avec son dossier `carnet-test` et `echelles-niveaux.js` à leurs emplacements respectifs. Le site peut aussi être servi en statique, notamment sur GitHub Pages ; aucun serveur backend n'est requis.

## Sauvegarde des données

Dans un navigateur compatible avec l'accès aux fichiers, **Sauvegarder** permet de choisir un fichier JSON. Les modifications suivantes y sont enregistrées automatiquement après un court délai. Après **Charger**, il peut être nécessaire de cliquer sur **Sauvegarder** pour autoriser l'écriture. La liaison ne survit pas à la fermeture ou au rechargement de la page : il faut rouvrir le fichier.

L'état de la liaison apparaît en haut de la page. Si le fichier est modifié ailleurs, ou si une écriture échoue, l'enregistrement automatique s'arrête et un message est affiché. Utiliser **Options → Télécharger une copie JSON** pour préserver le travail, puis délier ou recharger le fichier. Conserver des copies de sauvegarde indépendantes ; la détection d'une modification externe n'est pas un verrou entre applications.

Si l'accès direct aux fichiers n'est pas disponible, **Sauvegarder** télécharge une copie JSON : les changements ultérieurs ne sont pas enregistrés dans cette copie. L'export Excel dépend encore d'une bibliothèque chargée sur Internet ; l'ouverture locale n'implique donc pas un fonctionnement entièrement hors ligne.

## Carte de l'application

La structure des vues et des dialogues est dans [index.html](index.html). Les références pédagogiques affichées dans la fenêtre d'information y sont également définies.

- `carnet-test/css/` : styles, dans leur ordre de cascade. `test.css` contient le design bleu, le thème sombre et l'adaptation mobile ; `tailwind.css` contient les utilitaires existants.
- `carnet-test/js/pedagogie/matieres-*.js` : grilles et matières du 3e cycle, ou du préscolaire et des arts plastiques. Un fichier par discipline.
- `carnet-test/js/pedagogie/cycles-*.js` : grilles des 1er et 2e cycles, par discipline.
- `grilles-matieres.js`, `grilles-cycles.js` et `grilles-historiques.js` : initialisation commune et versions historiques des grilles. Les anciens critères restent nécessaires à la lecture des traces enregistrées.
- `constantes.js` : cotes, niveaux, marqueurs et constantes communes.
- `demo.js` : données fictives des trois groupes modèles.
- `groupes.js` et `etat.js` : groupes, état du carnet, migration des sauvegardes, historique et préférences.
- `sauvegarde.js` : chargement, téléchargement, liaison et écriture du JSON.
- `calculs.js`, `criteres.js`, `competences.js` et `commentaires.js` : calculs, choix des grilles, échelles et rédaction.
- `ui-carnet.js`, `ui-traces.js`, `ui-eleves.js` et `ui-bulletin.js` : rendu et interactions propres aux vues.
- `export-excel.js` et `impression.js` : export du classeur et impressions.
- `navigation.js` et `demarrage.js` : placement des commandes, initialisation et écouteurs d'événements.

Les scripts sont des **scripts classiques**, chargés dans l'ordre indiqué par `index.html`, sans `async` ni modules ES6. Cet ordre est important : les variables globales, la construction des grilles et leurs versions historiques en dépendent. Ne pas déplacer ou renommer les fichiers sans mettre à jour les liens ; conserver cet ordre lors des modifications.
