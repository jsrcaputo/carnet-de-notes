
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
      { code: 'AIDE',  group: 'adaptation', label: 'Avec aide / étayage', hint: 'Soutien compatible avec la compétence évaluée' },
      { code: 'T+',    group: 'adaptation', label: 'Temps supplémentaire', hint: 'Réalisé avec période prolongée' },
      { code: 'ADAPT', group: 'adaptation', label: 'Conditions adaptées', hint: 'Conditions adaptées sans modifier les attentes' },
      { code: 'OUTIL', group: 'adaptation', label: 'Outils d’aide utilisés', hint: 'Outil compatible avec la compétence évaluée' },
      { code: 'MOD',   group: 'modification', label: 'Attentes modifiées', hint: 'Attentes modifiées selon le plan d’intervention' },
      { code: 'REP',   group: 'autre', label: 'Reprise / corrigé', hint: 'Travail repris ou bonifié' },
      { code: 'ABS',   group: 'autre', label: 'Absent / à reprendre', hint: 'Absence lors de l’évaluation' }
    ];
    const VALID_CELL_FLAG_CODES = new Set(CELL_FLAGS.map(f => f.code));

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
            hint: 'Pondération officielle épreuve MEQ : 30 % / 20 % / 5 % / 25 % / 20 %',
            weights: { [c1]: 30, [c2]: 20, [c3]: 5, [c4]: 25, [c5]: 20 }
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
