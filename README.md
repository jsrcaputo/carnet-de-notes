# Carnet de notes

- [index.html](index.html) : version publiée ; elle utilise le dossier [carnet-test](carnet-test/).
- [echelles-niveaux.js](echelles-niveaux.js) : échelles du primaire.

Pour utiliser le carnet, ouvrir `index.html` avec son dossier `carnet-test` et `echelles-niveaux.js` à leurs emplacements respectifs. Le site peut aussi être servi en statique, notamment sur GitHub Pages ; aucun serveur backend n'est requis.

À chaque ouverture ou actualisation, l’accueil apparaît avec un carnet vierge : utilisez **Charger** pour reprendre un fichier JSON. **Démonstration** charge trois groupes fictifs : Test-001 (préscolaire), Test-201 (2e année) et Test-503 (multi 5e/6e). Fermer l’accueil ou créer son propre groupe ne charge pas ces groupes. La démonstration conserve les groupes de la session en cours.

La visite guidée d’Erika s’ouvre uniquement à votre demande, depuis **Visite guidée** ou les commandes du guide dans l’application.

Dans **Listes et groupes**, créez ou sélectionnez un groupe, puis utilisez **Ajout d’élève** pour saisir un prénom et, au besoin, un nom de famille.

Dans le bilan de classe, dépliez une matière pour consulter ses compétences. La barre répartit les élèves ayant un résultat dans la compétence selon leur cote; les élèves sans résultat sont exclus. Au préscolaire, elle utilise un constat estimé à partir du résultat interne. **Masquer les notes** masque cette répartition.

## Sauvegarde des données

Dans un navigateur compatible avec l'accès aux fichiers, **Sauvegarder** permet de choisir un fichier JSON. Les modifications suivantes y sont enregistrées automatiquement après un court délai. Après **Charger**, il peut être nécessaire de cliquer sur **Sauvegarder** pour autoriser l'écriture. La liaison ne survit pas à la fermeture ou au rechargement de la page : il faut rouvrir le fichier.

Le carnet reste uniquement en mémoire dans l'onglet pendant son utilisation; il n'est plus sauvegardé automatiquement dans le stockage du navigateur. Après fermeture ou actualisation, rechargez le fichier JSON. Un avertissement est demandé au navigateur si des changements ne sont pas sauvegardés, mais il ne remplace pas une vérification du fichier. Les préférences d'affichage et les pondérations personnalisées restent enregistrées localement; toutefois, un carnet vierge démarre toujours en affichage clair, palette bleue, et le thème et la palette d'un carnet sont restaurés à l'ouverture de son fichier. Les anciennes copies automatiques, non chiffrées, sont conservées pour éviter toute perte : les options permettent de les télécharger, puis de les effacer explicitement après vérification. Utilisez des données fictives jusqu'à ce que l'utilisation de données réelles ait été approuvée par votre organisation.

**Options → Télécharger une copie chiffrée** crée un JSON protégé par un mot de passe (AES-GCM et PBKDF2). Saisissez deux fois un mot de passe de 12 caractères ou plus : un indicateur confirme leur concordance et **Continuer** devient disponible lorsque la saisie est valide. Gardez ce mot de passe séparément : il n'existe aucun moyen de récupérer le fichier s'il est perdu. Pour l'ouvrir sur un autre ordinateur, utilisez le site et **Charger**, puis entrez le même mot de passe. Après le chargement d'un fichier chiffré, les sauvegardes suivantes restent chiffrées avec le même mot de passe pendant la session, même après déliaison. À la réouverture de la page, il faut le charger de nouveau. Créer une copie chiffrée ne chiffre pas un fichier déjà lié en clair ni les autres copies ordinaires. Le chiffrement exige HTTPS ou l'ouverture locale du site dans un navigateur compatible.

L'export Excel ordinaire n'est pas chiffré. **Options → Exporter un Excel chiffré** télécharge un fichier `.xlsx` protégé par un mot de passe de 12 à 255 caractères, à saisir directement dans Excel. Une connexion Internet est nécessaire pour charger la bibliothèque de chiffrement. Un mot de passe perdu rend le fichier irrécupérable; protégez aussi toute copie non chiffrée. L'option **Récupérer un ancien export (.json)** ne sert qu'aux enveloppes créées par l'ancienne version et télécharge un classeur non chiffré. Aucun export Excel ne permet de recharger un carnet dans l'application.

La sauvegarde comprend les groupes, les élèves, les données des trois étapes, les brouillons de traces (y compris les forces et défis), les préférences d'affichage et les pondérations personnalisées. Les anciens fichiers sans pondérations personnalisées conservent celles déjà présentes dans le navigateur ; l'historique d'annulation et les éléments temporaires de navigation ne sont pas sauvegardés.

L'état de la liaison apparaît en haut de la page. Si le fichier est modifié ailleurs, ou si une écriture échoue, l'enregistrement automatique s'arrête et un message est affiché. Utiliser **Options → Télécharger une copie JSON** pour préserver le travail, puis délier ou recharger le fichier. Conserver des copies de sauvegarde indépendantes ; la détection d'une modification externe n'est pas un verrou entre applications.

Si l'accès direct aux fichiers n'est pas disponible, **Sauvegarder** télécharge une copie JSON : les changements ultérieurs ne sont pas enregistrés dans cette copie. L'export Excel dépend encore d'une bibliothèque chargée sur Internet ; l'ouverture locale n'implique donc pas un fonctionnement entièrement hors ligne.

### Nombreux groupes et grands effectifs

Un scénario fictif de 500 élèves dans 20 groupes, avec trois compétences d'éducation physique et huit évaluations par compétence à chacune des trois étapes, a été vérifié en sauvegarde et rechargement. Le carnet affiche les élèves du groupe actif, pas les 500 élèves simultanément. Ces essais ne constituent pas une garantie de performance sur tous les appareils.

La limite de chargement est de 25 Mio de données JSON (environ 33,34 Mio pour leur enveloppe chiffrée). Au-delà, l'enregistrement dans le fichier lié est interrompu sans l'écraser. Utilisez **Options → Télécharger une copie JSON** : une copie complète portant le suffixe `_RECUPERATION_HORS_LIMITE` est téléchargée, chiffrée avec le même mot de passe si le carnet est chiffré. Vérifiez que ce téléchargement existe avant de fermer l'onglet et conservez le fichier précédent.

Cette copie de récupération conserve les données, mais **ne peut pas être chargée tant que son JSON dépasse 25 Mio**. Elle n'est donc pas présentée comme une sauvegarde normalement rechargeable; le statut d'avertissement reste visible. L'application ne propose pas de répartition automatique des groupes entre fichiers : une réduction ou une répartition de la copie, en conservant sa structure et toutes ses données, nécessite une intervention technique (et son déchiffrement préalable si elle est protégée). Les réglages d'une session d'observation sont conservés même avant la première saisie.

L'historique d'annulation est limité à 60 actions et à un budget de 32 Mio d'instantanés, avec au moins une action conservée même si son instantané dépasse ce budget. Les grands carnets disposent donc de moins d'actions annulables; l'historique reste temporaire et ne remplace pas les copies de sauvegarde.

## Résultats et pondérations

Dans le carnet, la colonne « Moy. Travaux » affiche uniquement la moyenne pondérée. Les poids restent visibles dans les en-têtes des évaluations. Les notes manquantes, non évaluées, non remises, justifiées ou en reprise ne valent pas zéro : la moyenne utilise seulement les poids des résultats disponibles.

La colonne **Commentaires au bulletin** donne accès à une boîte de taille stable : cochez les formulations de la banque (forces, défis, stratégies et bilan), puis ajustez librement le texte avant de l'appliquer au carnet. La banque et le texte défilent indépendamment; sur petit écran, ils sont disposés l'un au-dessus de l'autre.

Le résultat annuel est provisoire tant qu'une étape manque. Il est alors recalculé sur les poids disponibles, proportionnellement; la moyenne générale reste indicative et provisoire si des matières ou des étapes manquent. Au préscolaire, le portrait met les observations écrites en avant. Les résultats numériques historiques restent accessibles séparément : leur calcul local ne constitue pas un bulletin officiel ni une méthode ministérielle pour le préscolaire.

Dans une trace observable, les forces et défis à cocher sont des repères locaux inspirés des [compétences transversales du PFEQ](https://www.quebec.ca/education/prescolaire-primaire-et-secondaire/programmes-formations-evaluation/programme-formation-ecole-quebecoise/primaire), non une grille officielle. Ils servent à décrire une situation et ne modifient pas la cote. Les anciens indicateurs et les textes déjà saisis restent accessibles et conservés.

## Éducation physique et anglais, langue seconde

L’**éducation physique et à la santé** expose les trois compétences officielles à tous les cycles. Elles alimentent un seul résultat de bulletin : les évaluations sont pondérées dans leur propre compétence et les évaluations liées ne sont comptées qu’une fois dans le résultat regroupé. Aucun partage fixe entre C1, C2 et C3 n’est imposé.

En **anglais, langue seconde**, le libellé, le nombre de compétences et le poids de bulletin dépendent du cycle de chaque élève. Au 1er cycle, seules C1 (textes entendus, 60 %) et C2 (communication orale, 40 %) sont actives. Aux 2e et 3e cycles, C1, C2 et C3 sont actives et les poids officiels sont respectivement 50/35/15 % et 45/35/20 %. Ces poids sont affichés et exportés comme pondérations de bulletin; les travaux conservent leurs propres pondérations internes. Les groupes multiniveaux filtrent les compétences non applicables par élève.

Les rubriques locales comportent des critères notés et des éléments de retour réflexif non notés. Elles s’inspirent du programme, de la progression des apprentissages et du cadre d’évaluation du MEQ; elles ne sont pas des grilles officielles. Les liens exacts sont dans **Informations et sources**.

## Carte de l'application

La structure des vues et des dialogues est dans [index.html](index.html). Les références pédagogiques affichées dans la fenêtre d'information y sont également définies.

- `carnet-test/css/` : styles, dans leur ordre de cascade. `test.css` contient le design bleu, le thème sombre et l'adaptation mobile, ainsi que le fond et les bordures assortis des barres de navigation ; `tailwind.css` contient les utilitaires existants.
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

## Musique

La musique est offerte aux trois cycles. Le carnet distingue **Inventer et interpréter** (70 % au bulletin) et **Apprécier** (30 %). Ces poids ne remplacent pas les pondérations des évaluations à l’intérieur de chaque volet. La moyenne générale indicative regroupe les deux volets selon ces poids lorsqu’ils sont tous les deux renseignés; elle ne traite pas un volet manquant comme un zéro.

Les critères et les commentaires proposés sont des repères locaux adaptés aux cycles, et non des grilles ministérielles. Le retour réflexif marqué d’un astérisque sert à la rétroaction et ne compte pas dans le résultat. Les échelles ministérielles restent consultables dans **Informations et sources**.

## Classe d’accueil

Dans **Niveau du groupe**, choisissez **Accueil (Multi)** entre « 6e année » et « Sélection individuelle ». Ajoutez ensuite les élèves comme d’habitude et choisissez le niveau scolaire propre à chacun. Le niveau « Accueil (Multi) » sert à organiser le groupe; il n’est jamais attribué à un élève.

La matière **ILSS (Français)** apparaît dans la navigation des matières avec trois compétences : communiquer oralement, lire et écrire. Comme les autres matières, elle utilise un carnet à colonnes : une colonne par évaluation et une dernière colonne pour le jugement d’étape. Aucun éditeur ILSS n’apparaît dans la liste de gestion des élèves. Le module de français régulier n’est pas dupliqué pour éviter de mélanger les cadres ILSS et français, langue d’enseignement.

Deux flux complètent le carnet : **Évaluation déjà réalisée** pour une production ou un entretien terminé, et **Grille d’observation** pour les manifestations constatées en contexte. Chaque compétence possède ses quatre critères observables adaptés aux cinq paliers ILSS; le niveau scolaire reste visible et le repère du cycle est rappelé dans la grille. Le palier proposé est la médiane des résultats, puis la cote proposée est la médiane prudente des cotes au palier retenu. Le résultat demeure qualitatif, sans pourcentage, et les menus de palier/cote de la dernière colonne permettent de le remplacer facilement ou de revenir à « Auto ». Cette organisation reprend la triangulation des conversations, observations et productions.

Les deux compétences de mathématique sont activées avec ce niveau de groupe et utilisent le système habituel du carnet selon le niveau individuel de chaque élève. D’autres matières peuvent rester sélectionnées si elles sont effectivement enseignées et évaluées. L’application n’applique pas automatiquement les parts d’horaire de 65 % ILSS, 20 % mathématique et 15 % autres matières comme pondérations de résultats. La synthèse, l’impression et l’export Excel distinguent les jugements ILSS des résultats des autres matières.

Dans Excel, les textes trop longs pour une cellule sont répartis sur des lignes numérotées : concaténez les parties dans l’ordre pour les reconstituer. Les anciens carnets créés avec un champ distinct « type de classe » sont migrés automatiquement vers **Accueil (Multi)**. L’application soutient le suivi enseignant, mais n’établit pas le bulletin officiel.

La démonstration **Accueil (Multi)** contient 17 élèves fictifs répartis de la 1re à la 6e année. Ce nombre correspond au maximum indiqué par le CSSDM pour une classe d’accueil de son réseau, et non à une moyenne provinciale. La démonstration de spécialiste comprend aussi des groupes et des travaux fictifs en musique.

## Sources ministérielles

- Musique : [programme d’études](https://cdn-contenu.quebec.ca/cdn-contenu/education/pfeq/primaire/programmes/PFEQ-musique-primaire.pdf), [progression des apprentissages](https://cdn-contenu.quebec.ca/cdn-contenu/education/pfeq/primaire/progressions-apprentissages/PFEQ-progression-apprentissages-musique-primaire.pdf), [cadre d’évaluation](https://cdn-contenu.quebec.ca/cdn-contenu/education/pfeq/cadres-evaluation/primaire/francais/PFEQ-cadre-evaluation-musique-primaire.pdf) et [ressources officielles](https://www.quebec.ca/education/prescolaire-primaire-et-secondaire/programmes-formations-evaluation/programme-formation-ecole-quebecoise/primaire/musique).
- Accueil : [programme d’intégration linguistique, scolaire et sociale](https://cdn-contenu.quebec.ca/cdn-contenu/education/pfeq/primaire/programmes/PFEQ-integration-linguistique-scolaire-sociale-primaire.pdf), [cadre d’évaluation](https://cdn-contenu.quebec.ca/cdn-contenu/education/pfeq/cadres-evaluation/primaire/francais/PFEQ-cadre-evaluation-integration-linguistique-scolaire-sociale-primaire.pdf), [paliers pour l’évaluation du français](https://cdn-contenu.quebec.ca/cdn-contenu/education/pfeq/primaire/PFEQ-paliers-evaluation-integration-scolaire-linguistique-primaire.pdf) et [ressources officielles](https://www.quebec.ca/education/prescolaire-primaire-et-secondaire/programmes-formations-evaluation/programme-formation-ecole-quebecoise/primaire/integration-linguistique-scolaire-sociale).
- Mathématique en accueil : [programme](https://www.quebec.ca/education/prescolaire-primaire-et-secondaire/programmes-formations-evaluation/programme-formation-ecole-quebecoise/primaire/mathematique) et [cadre d’évaluation](https://cdn-contenu.quebec.ca/cdn-contenu/education/pfeq/cadres-evaluation/primaire/francais/PFEQ-cadre-evaluation-mathematique-primaire.pdf).
- Effectif de la classe d’accueil de démonstration : [page Classes d’accueil de l’école Jean-Paul-Riopelle (CSSDM)](https://jean-paul-riopelle.cssdm.gouv.qc.ca/programmes/classes-daccueil/), qui mentionne un maximum de 17 élèves au CSSDM.
- Pratiques de suivi ILSS : [normes et modalités — classe d’accueil (CSS des Deux-Rives)](https://deuxruisseaux.csspo.gouv.qc.ca/wp-content/uploads/sites/23/2026/10/P26-27-ResumeSequenceEvaluationNormesEtModalites-Classe-daccueil.pdf), [recueillir des traces par triangulation (CSSDD)](https://ilss.cssdd.gouv.qc.ca/secondaire/support-enseignants-ilss/%C3%A9valuation/receuillir-des-traces) et [évaluation en classe d’accueil au primaire (CSSDM)](https://cybersavoir.cssdm.gouv.qc.ca/saf-pp/evaluation/).
- [Instruction annuelle 2026-2027](https://cdn-contenu.quebec.ca/cdn-contenu/adm/min/education/publications-adm/education/instruction-annuelle/Instruction-annuelle-2026-2027.pdf) : en accueil, 65 % du temps d’enseignement est consacré à l’ILSS, 20 % aux mathématiques et 15 % aux autres matières; ces pourcentages ne sont pas des pondérations des résultats.
- [Pondérations et libellés du bulletin au préscolaire et au primaire](https://www.quebec.ca/education/prescolaire-primaire-et-secondaire/programmes-formations-evaluation/epreuves-ministerielles-evaluation-apprentissages/ponderations-libelles-bulletin/prescolaire-primaire).
- Échelles des niveaux de compétence du primaire : [1er cycle](https://cdn-contenu.quebec.ca/cdn-contenu/education/pfeq/primaire/Echelles-niveau-competence-primaire-1erCycle.pdf), [2e cycle](https://cdn-contenu.quebec.ca/cdn-contenu/education/pfeq/primaire/Echelles-niveau-competence-primaire-2eCycle.pdf) et [3e cycle](https://cdn-contenu.quebec.ca/cdn-contenu/education/pfeq/primaire/Echelles-niveau-competence-primaire-3eCycle.pdf).
