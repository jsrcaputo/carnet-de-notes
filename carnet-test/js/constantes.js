
    // =========================================================================
    // 1. CONSTANTS & EDUCATIONAL REFERENCE DATA
    // =========================================================================
    const GRADE_SCALE = [
      { code: 'A+', pct: 100, family: 'A', label: 'A+ (100%)' },
      { code: 'A',  pct: 95,  family: 'A', label: 'A (95%)' },
      { code: 'A-', pct: 90,  family: 'A', label: 'A- (90%)' },
      { code: 'B+', pct: 85,  family: 'B', label: 'B+ (85%)' },
      { code: 'B',  pct: 80,  family: 'B', label: 'B (80%)' },
      { code: 'B-', pct: 75,  family: 'B', label: 'B- (75%)' },
      { code: 'C+', pct: 70,  family: 'C', label: 'C+ (70%)' },
      { code: 'C',  pct: 65,  family: 'C', label: 'C (65%)' },
      { code: 'C-', pct: 60,  family: 'C', label: 'C- (60%)' },
      { code: 'D+', pct: 55,  family: 'D', label: 'D+ (55%)' },
      { code: 'D',  pct: 50,  family: 'D', label: 'D (50%)' },
      { code: 'D-', pct: 45,  family: 'D', label: 'D- (45%)' },
      { code: 'E',  pct: 40,  family: 'E', label: 'E (40%)' }
    ];

    const GRADE_MAP = {};
    GRADE_SCALE.forEach(g => { GRADE_MAP[g.code] = g; });

    const FAMILY_DEFAULT_CODE = { A: 'A', B: 'B', C: 'C', D: 'D+', E: 'E' };
    const CYCLE_SCALE_URLS = {
      1: 'https://cdn-contenu.quebec.ca/cdn-contenu/education/pfeq/primaire/Echelles-niveau-competence-primaire-1erCycle.pdf',
      2: 'https://cdn-contenu.quebec.ca/cdn-contenu/education/pfeq/primaire/Echelles-niveau-competence-primaire-2eCycle.pdf',
      3: 'https://cdn-contenu.quebec.ca/cdn-contenu/education/pfeq/primaire/Echelles-niveau-competence-primaire-3eCycle.pdf'
    };
    const GRADE_LEVEL_LABELS = {
      'P': 'Préscolaire',
      '1': '1re année',
      '2': '2e année',
      '3': '3e année',
      '4': '4e année',
      '5': '5e année',
      '6': '6e année'
    };
    const CYCLE_LABELS = {
      'P': 'Préscolaire',
      1: '1er cycle',
      2: '2e cycle',
      3: '3e cycle'
    };
    const PIA_TAG_CATEGORIES = [
      {
        id: 'autonomie',
        label: 'Autonomie & Étayage',
        tags: [
          'Autonome après la consigne de groupe',
          'Démarre la tâche sans relance',
          'Réussit avec soutien ponctuel (relance)',
          'Besoin de reformulation individuelle',
          'Modélisation par l’adulte requise',
          'Guidage constant (pas à pas) requis',
          'Fonctionne mieux en sous-groupe guidé'
        ]
      },
      {
        id: 'organisation',
        label: 'Organisation & Exécution',
        tags: [
          'Planifie et séquence bien ses étapes',
          'Suit son plan de travail / horaire visuel',
          'Consulte spontanément ses référentiels',
          'Besoin de fractionner la tâche en sous-étapes',
          'Termine dans le temps régulier',
          'Temps supplémentaire nécessaire et rentable',
          'Signes de surcharge cognitive observés'
        ]
      },
      {
        id: 'attention',
        label: 'Attention & Autorégulation',
        tags: [
          'Attention soutenue durant l’activité',
          'Se recentre rapidement après un rappel',
          'Sensible aux distractions de l’environnement',
          'Utilise ses moyens d’autorégulation / retour au calme',
          'Pause active ou outil sensoriel bénéfique',
          'Persévère devant l’obstacle',
          'Découragement ou évitement devant la difficulté',
          'Fatigue cognitive marquée en fin de période'
        ]
      },
      {
        id: 'outils',
        label: 'Adaptations & Outils PIA',
        tags: [
          'Utilise spontanément ses outils PIA',
          'Utilise ses outils PIA sur rappel de l’adulte',
          'Oublie ou refuse d’utiliser ses aides',
          'Synthèse vocale efficace (soutient la compréhension)',
          'Prédicteur de mots aidant (fluidité et mise en mots)',
          'Utilise efficacement le correcteur pour se réviser',
          'Matériel concret / manipulation bénéfique'
        ]
      },
      {
        id: 'metacognition',
        label: 'Stratégies & Métacognition',
        tags: [
          'Repère et surligne les informations clés',
          'Verbalise clairement sa démarche',
          'Se relit et corrige ses erreurs seul',
          'Repère ses erreurs avec un indice de l’adulte',
          'Réinvestit les stratégies enseignées',
          'Impulsivité (agit ou répond sans vérifier)'
        ]
      },
      {
        id: 'social',
        label: 'Demandes d’aide & Interactions',
        tags: [
          'Demande de l’aide de façon appropriée',
          'Attend passivement lorsqu’il est bloqué',
          'Coopère positivement avec ses pairs',
          'Respecte l’écoute et le tour de parole',
          'Gère adéquatement les compromis en équipe',
          'S’engage activement dans la tâche'
        ]
      }
    ];

    const OBSERVATION_AREAS = [
      { id: 'autonomie', label: 'Autonomie', items: [
        ['Comprend la consigne et se met au travail', 'A besoin d’une reformulation pour commencer'],
        ['Amorce la tâche sans relance', 'A besoin d’une relance pour amorcer la tâche'],
        ['Demande de l’aide lorsqu’elle est nécessaire', 'A besoin d’aide pour reconnaître quand demander du soutien']
      ] },
      { id: 'organisation', label: 'Organisation', items: [
        ['Planifie les étapes de son travail', 'A besoin de soutien pour planifier les étapes'],
        ['Suit les étapes prévues', 'A besoin de repères pour suivre les étapes'],
        ['Gère le temps disponible pour la tâche', 'A besoin de repères pour gérer le temps disponible']
      ] },
      { id: 'attention', label: 'Attention et persévérance', items: [
        ['Maintient son attention pendant l’activité', 'A besoin de soutien pour maintenir son attention'],
        ['Se recentre après une distraction', 'A besoin d’un rappel pour se recentrer'],
        ['Persévère lorsqu’un obstacle se présente', 'A besoin d’encouragement pour poursuivre devant un obstacle']
      ] },
      { id: 'strategies', label: 'Stratégies et réflexion', items: [
        ['Repère les informations utiles à la tâche', 'A besoin d’aide pour repérer les informations utiles'],
        ['Explique sa démarche', 'A besoin de soutien pour expliquer sa démarche'],
        ['Vérifie son travail et apporte des corrections', 'A besoin de repères pour vérifier et corriger son travail'],
        ['Réutilise une stratégie enseignée', 'A besoin d’un rappel pour réutiliser une stratégie enseignée']
      ] },
      { id: 'ressources', label: 'Ressources et outils', items: [
        ['Consulte les ressources utiles à la tâche', 'A besoin d’un rappel pour consulter les ressources utiles'],
        ['Utilise les outils convenus pour la tâche', 'A besoin de soutien pour utiliser les outils convenus']
      ] },
      { id: 'interaction', label: 'Participation et collaboration', items: [
        ['Participe activement à la tâche', 'A besoin d’une invitation pour participer à la tâche'],
        ['Collabore avec ses pairs', 'A besoin de soutien pour collaborer avec ses pairs'],
        ['Écoute les autres et respecte les tours de parole', 'A besoin de rappels pour écouter et respecter les tours de parole']
      ] }
    ];

    // Préscolaire : observations propres aux 5 domaines du Programme-cycle de l’éducation préscolaire (MEQ, 2021).
    const PRESCHOOL_OBSERVATION_AREAS = [
      { id: 'presco_c1', label: 'Physique et moteur', items: [
        ['Coordonne ses mouvements lors des jeux actifs', 'A besoin de soutien pour coordonner ses mouvements'],
        ['Manipule les petits objets avec précision', 'A besoin de soutien pour manipuler les petits objets'],
        ['Tient son crayon et ses ciseaux de façon adéquate', 'A besoin de rappels pour bien tenir son crayon et ses ciseaux'],
        ['Adopte des comportements sécuritaires', 'A besoin de rappels pour adopter des comportements sécuritaires']
      ] },
      { id: 'presco_c2', label: 'Affectif', items: [
        ['Nomme ses émotions', 'A besoin d’aide pour nommer ses émotions'],
        ['Exprime ses besoins et ses goûts', 'A besoin de soutien pour exprimer ses besoins et ses goûts'],
        ['Garde son calme devant une difficulté', 'A besoin d’accompagnement pour garder son calme devant une difficulté'],
        ['Accomplit les routines de façon autonome', 'A besoin de rappels pour accomplir les routines']
      ] },
      { id: 'presco_c3', label: 'Social', items: [
        ['Joue et coopère avec ses pairs', 'A besoin de soutien pour jouer et coopérer avec ses pairs'],
        ['Partage le matériel et attend son tour', 'A besoin de rappels pour partager le matériel et attendre son tour'],
        ['Propose des solutions lors d’un conflit', 'A besoin de l’aide d’un adulte pour régler un conflit'],
        ['Respecte les règles de vie de la classe', 'A besoin de rappels pour respecter les règles de vie de la classe']
      ] },
      { id: 'presco_c4', label: 'Langagier', items: [
        ['S’exprime clairement pour se faire comprendre', 'A besoin de soutien pour s’exprimer clairement'],
        ['Écoute une histoire et en parle', 'A besoin de soutien pour écouter une histoire et en parler'],
        ['Joue avec les sons et les rimes', 'A besoin de soutien pour jouer avec les sons et les rimes'],
        ['Reconnaît des lettres et s’essaie à écrire', 'A besoin de soutien pour reconnaître des lettres et s’essayer à écrire']
      ] },
      { id: 'presco_c5', label: 'Cognitif', items: [
        ['Explore et pose des questions avec curiosité', 'A besoin d’encouragement pour explorer et poser des questions'],
        ['Persévère pour résoudre un petit problème', 'A besoin d’encouragement pour persévérer devant un petit problème'],
        ['Classe, compare et dénombre des objets', 'A besoin de soutien pour classer, comparer et dénombrer des objets'],
        ['Décrit ses découvertes', 'A besoin de soutien pour décrire ses découvertes']
      ] }
    ];

    function getObservationAreasForSubject(sub) {
      return sub && sub.group === 'presco' ? PRESCHOOL_OBSERVATION_AREAS : OBSERVATION_AREAS;
    }

    function groupObservationTags(tags) {
      const allAreas = [...OBSERVATION_AREAS, ...PRESCHOOL_OBSERVATION_AREAS];
      const strengths = new Set(allAreas.flatMap(area => area.items.map(item => item[0])));
      const challenges = new Set(allAreas.flatMap(area => area.items.map(item => item[1])));
      const result = { strengths: [], challenges: [], previous: [] };
      (Array.isArray(tags) ? tags : []).forEach(tag => {
        if (strengths.has(tag)) result.strengths.push(tag);
        else if (challenges.has(tag)) result.challenges.push(tag);
        else result.previous.push(tag);
      });
      return result;
    }

    const ADAPTATION_PRESETS = [
      'Correcteur',
      'Prédicteur de mots',
      'Synthèse vocale',
      'Temps supplémentaire',
      'Lecture des consignes',
      'Consignes fractionnées',
      'Pauses planifiées',
      'PIA'
    ];

    // Marqueurs rapides sur cellule : sobres, typographiques, monochromes (ton sur ton)
    const CELL_FLAGS = [
      { code: 'AIDE',  badge: 'AIDE',     group: 'adaptation', label: 'Avec aide', hint: 'Soutien ponctuel compatible avec la compétence évaluée' },
      { code: 'AIDE+', badge: 'AIDE +',   group: 'adaptation', label: 'Aide soutenue', hint: 'Soutien fréquent ou rapproché pendant la tâche' },
      { code: 'AIDE1', badge: '1 pour 1', group: 'adaptation', label: 'Aide 1 - 1', hint: 'Soutien individuel (un adulte pour l’élève)' },
      { code: 'T+',    badge: 'Temps+',   group: 'adaptation', label: 'Temps supplémentaire', hint: 'Réalisé avec période prolongée' },
      { code: 'OUTIL', badge: 'OUTIL',    group: 'adaptation', label: 'Outils d’aide utilisés', hint: 'Outil compatible avec la compétence évaluée' },
      { code: 'MOD',   badge: 'MOD',      group: 'modification', label: 'Attentes modifiées', hint: 'Attentes modifiées selon le plan d’intervention' },
      { code: 'REP',   badge: 'REP',      group: 'autre', label: 'Reprise', hint: 'Travail repris ou bonifié' },
      { code: 'ABS',   badge: 'ABS',      group: 'autre', label: 'Absent / à reprendre', hint: 'Absence lors de l’évaluation' },
      // Anciens marqueurs : plus proposés, mais conservés pour les données existantes.
      { code: 'ADAPT', badge: 'ADAPT',    group: 'adaptation', label: 'Conditions adaptées', hint: 'Conditions adaptées sans modifier les attentes', retired: true }
    ];
    const VALID_CELL_FLAG_CODES = new Set(CELL_FLAGS.map(f => f.code));
    const getCellFlagBadge = code => {
      const def = CELL_FLAGS.find(f => f.code === code);
      return def ? def.badge : code;
    };

    // Pondération officielle du bulletin unique québécois (Régime pédagogique MEQ)
    const OFFICIAL_TERM_WEIGHTS = { '1': 20, '2': 20, '3': 60 };

    // Barème de l'école — 1 seule sélection par rangée, identique pour tous les niveaux.
    const BAREME_ECOLE_ROWS = [
      {
        id: 'attentes',
        title: '1. Attentes de l’étape',
        cells: {
          A: ['Dépasse les attentes prévues pour l’étape'],
          B: ['Satisfait aux attentes prévues à l’étape'],
          C: ['Satisfait minimalement aux attentes prévues à l’étape'],
          D: ['Est en deçà des attentes prévues à l’étape'],
          E: ['Est nettement en deçà des attentes prévues à l’étape']
        }
      },
      {
        id: 'execution',
        title: '2. Exécution de la tâche & Autonomie',
        cells: {
          A: [
            'Comprend facilement la tâche, organise très bien sa démarche et exécute la tâche sans aide avec beaucoup d’autonomie'
          ],
          B: [
            'Comprend la tâche, organise adéquatement sa démarche et exécute souvent la tâche de façon autonome'
          ],
          C: [
            'A parfois besoin de soutien pour comprendre la tâche ; organise et exécute à l’occasion de façon autonome'
          ],
          D: [
            'A souvent besoin de soutien pour comprendre et organiser sa démarche ; exécute la tâche avec de l’aide'
          ],
          E: [
            'Comprend et organise difficilement la tâche malgré l’aide apportée ; exécute rarement la tâche'
          ]
        }
      },
      {
        id: 'internes',
        title: '3. Mobilisation des ressources internes',
        cells: {
          A: [
            'Trouve et utilise facilement des stratégies ; fait facilement des liens et des transferts'
          ],
          B: [
            'Utilise des stratégies connues pour réaliser une tâche ; fait des liens et des transferts'
          ],
          C: [
            'Utilise à l’occasion des stratégies connues ; fait parfois des liens et des transferts'
          ],
          D: [
            'Utilise, avec de l’aide, des stratégies connues ; fait des liens lorsqu’il est accompagné'
          ],
          E: [
            'Utilise difficilement les stratégies enseignées et fait difficilement des liens malgré le support'
          ]
        }
      },
      {
        id: 'metacognition',
        title: '4. Métacognition (Auto-correction)',
        cells: {
          A: ['Voit, comprend et corrige ses erreurs spontanément'],
          B: ['Voit, comprend et corrige ses erreurs souvent'],
          C: ['Voit, comprend et corrige ses erreurs à l’occasion'],
          D: ['Voit, comprend et corrige ses erreurs avec l’aide de l’enseignant'],
          E: ['Éprouve de la difficulté à voir, comprendre et corriger ses erreurs même avec l’aide de l’enseignant']
        }
      },
      {
        id: 'externes',
        title: '5. Mobilisation des ressources externes (Outils, Prédicteur, Pairs)',
        cells: {
          A: ['Utilise spontanément les ressources externes (enseignant, pairs, documents, outils technologiques)'],
          B: ['Utilise souvent les ressources externes (enseignant, pairs, documents, outils technologiques)'],
          C: ['Utilise à l’occasion les ressources externes (enseignant, pairs, documents, outils technologiques)'],
          D: ['Utilise les ressources externes lorsque l’enseignant lui demande'],
          E: ['Utilise difficilement les ressources externes qui lui sont proposées par l’enseignant']
        }
      }
    ];

    // =========================================================================
    const WEIGHTED_RUBRIC_SUBJECT_IDS = new Set(['fra_ecriture', 'math_resoudre', 'math_raisonner']);

    function getOfficialWeightPresets(subjectId, cycle, scoredCriteria = []) {
      const ids = scoredCriteria.map(c => c.id);
      if (subjectId === 'fra_ecriture') {
        if (Number(cycle) === 1 || ids.length === 3) {
          const id1 = ids[0] || 'ecr_adapt';
          const id2 = ids[1] || 'ecr_syntaxe';
          const id3 = ids[2] || 'ecr_ortho';
          return [
            {
              id: 'meq_c1',
              label: 'Grille pondérée (MEQ)',
              hint: 'Pondération officielle MEQ 1er cycle : 40 % / 30 % / 30 %',
              weights: { [id1]: 40, [id2]: 30, [id3]: 30 }
            }
          ];
        }
        const c1 = ids[0] || 'ecr_adapt';
        const c2 = ids[1] || 'ecr_coherence';
        const c3 = ids[2] || 'ecr_vocab';
        const c4 = ids[3] || 'ecr_syntaxe';
        const c5 = ids[4] || 'ecr_ortho';
        return [
          {
            id: 'meq_epreuve',
            label: 'Grille pondérée (MEQ)',
            hint: 'Pondération des épreuves ministérielles d’écriture (MEQ, 4e et 6e année) : 20 % par critère',
            weights: { [c1]: 20, [c2]: 20, [c3]: 20, [c4]: 20, [c5]: 20 }
          }
        ];
      }
      if (subjectId === 'math_resoudre') {
        return [
          {
            id: 'meq_c1_math',
            label: 'Grille pondérée (MEQ)',
            hint: 'Pondération officielle MEQ (C1) : 40 % / 40 % / 20 %',
            weights: { c1_comp: 40, c1_mob: 40, c1_traces: 20 }
          }
        ];
      }
      if (subjectId === 'math_raisonner') {
        return [
          {
            id: 'meq_c2_action',
            label: 'Grille pondérée (MEQ)',
            hint: 'Pondération officielle MEQ (C2) : Analyse 30 % · Application 50 % · Justification 20 %',
            weights: { c2_analyse: 30, c2_application: 50, c2_justif: 20 }
          }
        ];
      }
      return [];
    }

    function getEffectiveCriteriaWeights(subjectId, cycle, scoredCriteria = [], customWeights = null) {
      const presets = getOfficialWeightPresets(subjectId, cycle, scoredCriteria);
      const defaultMap = presets.length > 0 ? presets[0].weights : {};
      const out = {};
      const count = scoredCriteria.length || 1;
      const baseInt = Math.floor(100 / count);
      const remInt = 100 - baseInt * count;

      const hasMatchingCustomWeights = Boolean(
        customWeights &&
        typeof customWeights === 'object' &&
        !Array.isArray(customWeights) &&
        scoredCriteria.length > 0 &&
        Object.keys(customWeights).length === scoredCriteria.length &&
        scoredCriteria.every(crit => Number.isFinite(Number(customWeights[crit.id])) && Number(customWeights[crit.id]) >= 0)
      );

      scoredCriteria.forEach((crit, idx) => {
        if (hasMatchingCustomWeights) {
          out[crit.id] = Math.round(Number(customWeights[crit.id]));
        } else if (Number.isFinite(Number(defaultMap[crit.id]))) {
          out[crit.id] = Math.round(Number(defaultMap[crit.id]));
        } else {
          out[crit.id] = baseInt + (idx >= count - remInt ? 1 : 0);
        }
      });
      return out;
    }
    // =========================================================================
    // Grilles locales inspirées des cadres MEQ; certains critères sont regroupés ou ajoutés.
    // =========================================================================
