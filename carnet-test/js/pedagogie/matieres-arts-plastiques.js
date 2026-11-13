

    // ARTS PLASTIQUES et PRÉSCOLAIRE : grilles rédigées pour tous les niveaux
    const lv = (a, b, c, d, e) => ({ A: a, B: b, C: c, D: d, E: e });
    ALL_SUBJECTS_CONFIG.push(
      {
        id: 'art_plast_c1c2',
        group: 'art_plast', groupLabel: 'Arts plastiques', partLabel: 'Créer (C1 – C2)',
        shortName: 'Arts plast. • Créer (C1–C2)',
        fullName: 'Arts plastiques — C1/C2 : Réaliser des créations plastiques personnelles et médiatiques',
        icon: 'AC', sharedCycles: true,
        refUrl: 'https://cdn-contenu.quebec.ca/cdn-contenu/education/pfeq/cadres-evaluation/primaire/francais/PFEQ-cadre-evaluatioon-arts-plastiques-primaire.pdf',
        cssmbUrl: 'https://sre.servicescsmb.com/disciplines/',
        criteria: [
          observableCriterion('ap1_langage', '1. Utilisation des connaissances liées au langage plastique', lv(
            'Exploite avec originalité gestes, matériaux, outils et langage plastique pour exprimer son intention dans sa création.',
            'Utilise seul et adéquatement le langage plastique (formes, couleurs, lignes) selon l’intention de sa création.',
            'Utilise les éléments de base du langage plastique (formes, couleurs), seul ou à l’aide d’un modèle.',
            'Utilise quelques éléments du langage plastique lorsque l’adulte guide les choix de matériaux et les gestes.',
            'Utilise un élément du langage plastique en reproduisant un modèle, avec un accompagnement individuel constant.')),
          observableCriterion('ap1_mise', '2. Mise en œuvre de la démarche de création', lv(
            'Explore plusieurs idées, planifie ses étapes et réalise sa création avec autonomie en ajustant ses choix.',
            'Réalise seul sa création de façon cohérente en suivant les étapes de la démarche, du croquis au produit fini.',
            'Réalise l’essentiel de sa création après un rappel des étapes de la démarche par l’adulte.',
            'Démarre et termine sa création avec un guidage fréquent de l’adulte à chaque étape.',
            'Réalise une partie de sa création avec un soutien individuel constant et des étapes illustrées.')),
          observableCriterion('ap1_proposition', '3. Cohérence de la production avec la proposition de création', lv(
            'Produit une réalisation très cohérente avec la proposition, respecte toutes les contraintes et ajoute une touche personnelle originale.',
            'Produit une réalisation cohérente qui respecte l’intention de la proposition et ses contraintes (thème, matériaux, format).',
            'Produit une réalisation partiellement liée à la proposition (oubli d’une contrainte, intention peu visible).',
            'Relie sa production à la proposition avec des rappels fréquents des consignes par l’adulte.',
            'Relie un élément de sa production à la proposition avec un soutien individuel constant.')),
          observableCriterion('ap1_retour', '4. Justesse du retour réflexif (*)', lv(
            'Décrit avec précision ses choix artistiques, ses essais et ses ajustements en utilisant le vocabulaire plastique.',
            'Identifie seul les étapes clés de sa démarche de création et nomme une réussite et un défi.',
            'Nomme une étape ou un choix de sa création après une question ciblée de l’adulte, avec un exemple.',
            'Décrit sa démarche lorsque l’adulte le guide pas à pas, sa production sous les yeux.',
            'Nomme un choix de sa création avec un soutien individuel constant et des photos de ses essais.'), { formativeOnly: true })
        ]
      },
      {
        id: 'art_plast_c3',
        group: 'art_plast', groupLabel: 'Arts plastiques', partLabel: 'Apprécier (C3)',
        shortName: 'Arts plast. • Apprécier (C3)',
        fullName: 'Arts plastiques — C3 : Apprécier des œuvres d’art, des objets culturels et des images médiatiques',
        icon: 'AA', sharedCycles: true,
        refUrl: 'https://cdn-contenu.quebec.ca/cdn-contenu/education/pfeq/cadres-evaluation/primaire/francais/PFEQ-cadre-evaluatioon-arts-plastiques-primaire.pdf',
        cssmbUrl: 'https://sre.servicescsmb.com/disciplines/',
        criteria: [
          observableCriterion('ap3_vocab', '1. Maîtrise des connaissances et vocabulaire disciplinaire', lv(
            'Repère finement les éléments de l’œuvre (lignes, couleurs, textures) et utilise un vocabulaire précis pour les nommer.',
            'Identifie seul les éléments plastiques de l’œuvre et les nomme avec le lexique étudié en classe.',
            'Nomme un élément plastique observé dans l’œuvre, avec le référentiel ou après une relance de l’adulte.',
            'Reconnaît les éléments de l’œuvre lorsque l’adulte les pointe et les nomme avec lui.',
            'Nomme un élément de l’œuvre avec un soutien individuel constant et un imagier de vocabulaire.')),
          observableCriterion('ap3_liens', '2. Liens entre l’œuvre, les effets ressentis et le contexte', lv(
            'Explique clairement comment les choix de l’artiste créent un effet et les relie au contexte de l’œuvre.',
            'Établit seul un lien pertinent entre un aspect de l’œuvre et l’effet qu’elle produit sur lui.',
            'Relie une impression ou une émotion à un aspect visible de l’œuvre, seul ou sur relance.',
            'Relie son impression à l’œuvre lorsque l’adulte donne des pistes directes (questions, détail ciblé).',
            'Exprime une impression avec un soutien individuel constant et une œuvre revue avec l’adulte.')),
          observableCriterion('ap3_jugement', '3. Pertinence et justification de l’appréciation', lv(
            'Formule un jugement nuancé appuyé sur plusieurs exemples précis tirés de l’œuvre et du vocabulaire plastique.',
            'Justifie seul son appréciation par un élément pertinent de l’œuvre (couleur, forme, texture).',
            'Donne une raison simple liée à un détail observé de l’œuvre, seul ou sur relance.',
            'Dit « J’ai aimé / pas aimé » sans preuve; ajoute une raison avec un guidage.',
            'Exprime son goût avec un soutien individuel constant et des choix de réponses (visage, image, mot).')),
          observableCriterion('ap3_posture', '4. Posture d’observation et démarche (*)', lv(
            'Observe attentivement, relève plusieurs détails de l’œuvre et accueille avec ouverture l’avis des pairs.',
            'Adopte une posture respectueuse (écoute, regard attentif) et suit bien la démarche d’appréciation proposée.',
            'Maintient son attention durant l’observation et participe à l’échange après un rappel de l’adulte.',
            'Se laisse distraire pendant l’observation; reprend la tâche avec des rappels fréquents de l’adulte.',
            'Reste attentif à de courtes périodes avec un soutien individuel constant et un cadre très structuré.'), { formativeOnly: true })
        ]
      }
    );

    const artPlasticCreation = ALL_SUBJECTS_CONFIG.find(subject => subject.id === 'art_plast_c1c2');
    const LEGACY_ART_PLASTIC_CREATION = artPlasticCreation.criteria;
    artPlasticCreation.criteria = [
      observableCriterion('ap1_langage', '1. Utilisation des connaissances liées au langage plastique', lv(
        'Combine les éléments du langage plastique de façon précise et expressive selon son intention.',
        'Utilise adéquatement les éléments du langage plastique selon son intention.',
        'Utilise des éléments de base du langage plastique qui sont généralement liés à son intention.',
        'Utilise quelques éléments du langage plastique, mais leur lien avec son intention reste peu clair.',
        'Utilise peu d’éléments du langage plastique ou leur lien avec son intention est difficile à percevoir.')),
      observableCriterion('ap1_gestes', '2. Utilisation des gestes transformateurs', lv(
        'Choisit et combine des gestes adaptés aux matériaux et aux outils avec précision.',
        'Utilise les gestes transformateurs appropriés aux matériaux et aux outils proposés.',
        'Utilise les gestes essentiels; certains choix ou gestes restent à préciser.',
        'Utilise quelques gestes appropriés, mais leur application reste souvent imprécise.',
        'Utilise rarement des gestes adaptés aux matériaux et aux outils.')),
      observableCriterion('ap1_proposition', '3. Cohérence de la production avec la proposition de création', lv(
        'Réalise une production très cohérente avec l’intention et les contraintes de la proposition.',
        'Réalise une production cohérente avec l’intention et les contraintes de la proposition.',
        'Réalise une production généralement liée à la proposition, malgré certaines incohérences.',
        'Réalise une production dont le lien avec la proposition est partiel ou peu clair.',
        'Réalise une production dont le lien avec la proposition est difficile à percevoir.')),
      observableCriterion('ap1_authenticite', '4. Authenticité de la production', lv(
        'Développe une image expressive et personnelle, en s’éloignant des solutions convenues.',
        'Réalise une image expressive où ses choix personnels sont visibles.',
        'Intègre quelques choix personnels dans sa réalisation.',
        'La réalisation montre peu de choix personnels ou reprend surtout des solutions proposées.',
        'Les choix personnels et l’intention expressive sont difficilement perceptibles.')),
      { ...LEGACY_ART_PLASTIC_CREATION[3], title: 'Justesse du retour réflexif (*)' },
      { ...LEGACY_ART_PLASTIC_CREATION[1], title: 'Démarche de création', formativeOnly: true }
    ];

    // Préscolaire : 5 compétences du Programme-cycle de l'éducation préscolaire
