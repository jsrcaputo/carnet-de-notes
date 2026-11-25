    const MUSIC_FRAMEWORK_URL = 'https://cdn-contenu.quebec.ca/cdn-contenu/education/pfeq/cadres-evaluation/primaire/francais/PFEQ-cadre-evaluation-musique-primaire.pdf';

    function musicRubrics(cycle) {
      const topics = {
        1: {
          langage: 'les contrastes de durée, de hauteur et d’intensité travaillés',
          technique: 'les gestes vocaux ou instrumentaux et les repères de jeu travaillés',
          organisation: 'les sons et les courts motifs de la pièce',
          caracteristiques: 'les caractéristiques expressives et les signaux de la pièce',
          elements: 'les sons et les éléments musicaux entendus',
          liens: 'un élément entendu et l’effet ressenti',
          vocabulaire: 'les mots de musique appris en classe'
        },
        2: {
          langage: 'les nuances, les durées, les hauteurs et les timbres travaillés',
          technique: 'les techniques vocales ou instrumentales et les règles de jeu d’ensemble',
          organisation: 'les motifs et les procédés de composition de la pièce',
          caracteristiques: 'les caractéristiques expressives, les indications et les signaux de la pièce',
          elements: 'les éléments du langage musical repérés dans l’œuvre',
          liens: 'les aspects de l’œuvre, les effets ressentis et les repères culturels étudiés',
          vocabulaire: 'le vocabulaire musical étudié'
        },
        3: {
          langage: 'les nuances, les durées, les hauteurs et les timbres choisis pour la pièce',
          technique: 'les techniques vocales ou instrumentales et les règles de musique d’ensemble',
          organisation: 'les phrases musicales et les procédés de composition selon l’intention',
          caracteristiques: 'les caractéristiques expressives, les indications et les signaux de la pièce',
          elements: 'les éléments musicaux et leur organisation dans l’œuvre',
          liens: 'les aspects de l’œuvre, les effets ressentis et leur contexte socioculturel',
          vocabulaire: 'le vocabulaire musical pertinent à l’œuvre'
        }
      }[cycle];
      const criterion = (id, title, levels, formativeOnly = false) =>
        observableCriterion(id, title, Object.fromEntries(['A', 'B', 'C', 'D', 'E'].map((level, index) => [level, levels[index]])), { formativeOnly });
      return {
        musique_c1c2: [
          criterion('mus_langage', 'Utilisation du langage musical', [
            `Combine ${topics.langage} avec précision pour enrichir son intention musicale.`,
            `Utilise ${topics.langage} en lien avec la pièce ou la proposition.`,
            `Utilise ${topics.langage} de manière généralement appropriée, malgré quelques imprécisions.`,
            `Utilise partiellement ${topics.langage}; plusieurs choix restent imprécis ou peu liés à la pièce.`,
            `Utilise très peu ${topics.langage} ou les choix ne correspondent pas à la pièce.`
          ]),
          criterion('mus_technique', 'Utilisation des techniques', [
            `Maîtrise et ajuste ${topics.technique} avec précision pendant toute la pièce.`,
            `Utilise adéquatement ${topics.technique} dans la situation musicale proposée.`,
            `Utilise les éléments essentiels parmi ${topics.technique}, malgré quelques hésitations.`,
            `Utilise certains éléments parmi ${topics.technique}, mais des difficultés nuisent à la réalisation.`,
            `Utilise très peu les éléments travaillés parmi ${topics.technique}; la réalisation reste difficile à suivre.`
          ]),
          criterion('mus_organisation', 'Cohérence de l’organisation des éléments', [
            `Organise ${topics.organisation} de façon expressive et cohérente avec l’intention.`,
            `Organise ${topics.organisation} de façon cohérente avec la proposition.`,
            `Organise ${topics.organisation} de manière généralement cohérente, malgré quelques ruptures.`,
            `Organise partiellement ${topics.organisation}; plusieurs enchaînements restent peu clairs.`,
            `La façon d’organiser ${topics.organisation} demeure difficile à percevoir.`
          ]),
          criterion('mus_caracteristiques', 'Respect des caractéristiques de la pièce', [
            `Interprète avec précision et expressivité ${topics.caracteristiques}.`,
            `Respecte ${topics.caracteristiques} pendant son interprétation.`,
            `Respecte généralement ${topics.caracteristiques}, malgré quelques écarts.`,
            `Respecte partiellement ${topics.caracteristiques}.`,
            `Les caractéristiques et les signaux de la pièce sont rarement perceptibles dans l’interprétation.`
          ]),
          criterion('mus_retour', 'Justesse du retour réflexif (*)', [
            'Décrit les étapes de sa démarche et explique les effets de ses choix et ajustements.',
            'Décrit les étapes importantes de sa démarche et explique un choix.',
            'Nomme une étape et un choix en lien avec sa réalisation.',
            'Nomme une partie de sa démarche, avec peu de précisions sur ses choix.',
            'Les étapes et les choix de sa démarche demeurent difficiles à préciser.'
          ], true)
        ],
        musique_c3: [
          criterion('mus_app_elements', 'Repérage des éléments musicaux', [
            `Repère et décrit avec précision plusieurs aspects parmi ${topics.elements}.`,
            `Repère et décrit ${topics.elements} qui sont pertinents pour son appréciation.`,
            `Repère des éléments essentiels parmi ${topics.elements}, malgré quelques imprécisions.`,
            `Repère quelques aspects parmi ${topics.elements}, mais les décrit de façon imprécise.`,
            `Repère très peu d’éléments pertinents dans l’extrait entendu.`
          ]),
          criterion('mus_app_liens', 'Pertinence de l’appréciation', [
            `Explique avec des exemples précis les liens entre ${topics.liens}.`,
            `Établit des liens pertinents entre ${topics.liens} pour justifier son appréciation.`,
            `Établit un lien simple entre ${topics.liens} pour expliquer son appréciation.`,
            `Exprime une impression, mais le lien avec les éléments musicaux reste partiel ou imprécis.`,
            `L’appréciation ne fait pas ressortir de lien pertinent avec les éléments entendus.`
          ]),
          criterion('mus_app_vocabulaire', 'Utilisation du vocabulaire disciplinaire', [
            `Utilise ${topics.vocabulaire} avec précision pour nuancer son appréciation.`,
            `Utilise correctement ${topics.vocabulaire} pour décrire son écoute.`,
            `Utilise ${topics.vocabulaire} avec quelques imprécisions.`,
            `Utilise ${topics.vocabulaire} de façon limitée ou imprécise.`,
            'Le vocabulaire utilisé ne permet pas de reconnaître les éléments musicaux décrits.'
          ]),
          criterion('mus_app_retour', 'Retour sur la démarche (*)', [
            'Explique comment son écoute et ses observations ont fait évoluer son appréciation.',
            'Décrit les étapes importantes de sa démarche d’appréciation.',
            'Nomme une étape de sa démarche en lien avec l’extrait.',
            'Nomme une étape, mais la décrit avec peu de précisions.',
            'La démarche d’appréciation demeure difficile à décrire.'
          ], true)
        ]
      };
    }

    const MUSIC_RUBRICS = { 1: musicRubrics(1), 2: musicRubrics(2), 3: musicRubrics(3) };
    ALL_SUBJECTS_CONFIG.push(
      {
        id: 'musique_c1c2',
        group: 'musique',
        groupLabel: 'Musique',
        partLabel: 'Inventer / interpréter (C1-C2)',
        shortName: 'Musique • Inventer / interpréter',
        fullName: 'Musique — Inventer des pièces vocales ou instrumentales et interpréter des pièces musicales',
        icon: 'MU',
        refUrl: MUSIC_FRAMEWORK_URL,
        cycleScaleUrls: { ...CYCLE_SCALE_URLS },
        cycleInfo: {
          1: { bulletinName: 'Musique', bulletinWeight: 70 },
          2: { bulletinName: 'Musique', bulletinWeight: 70 },
          3: { bulletinName: 'Musique', bulletinWeight: 70 }
        },
        criteria: MUSIC_RUBRICS[3].musique_c1c2
      },
      {
        id: 'musique_c3',
        group: 'musique',
        groupLabel: 'Musique',
        partLabel: 'Apprécier (C3)',
        shortName: 'Musique • Apprécier',
        fullName: 'Musique — Apprécier des œuvres musicales, ses réalisations et celles de ses camarades',
        icon: 'MA',
        refUrl: MUSIC_FRAMEWORK_URL,
        cycleScaleUrls: { ...CYCLE_SCALE_URLS },
        cycleInfo: {
          1: { bulletinName: 'Musique', bulletinWeight: 30 },
          2: { bulletinName: 'Musique', bulletinWeight: 30 },
          3: { bulletinName: 'Musique', bulletinWeight: 30 }
        },
        criteria: MUSIC_RUBRICS[3].musique_c3
      }
    );
