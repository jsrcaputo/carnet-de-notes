    function buildFullDemoTerms(type, students, legacySeed = false, previousSeed = false) {
      const terms = {
        '1': buildTermDataForStudents(students),
        '2': buildTermDataForStudents(students),
        '3': buildTermDataForStudents(students)
      };

      const subjectIds = [
        'math_resoudre', 'math_raisonner', 'fra_lecture', 'fra_ecriture', 'fra_oral',
        'sciences_global', 'sciences_outils', 'sciences_comm',
        'univers_social', 'us_changement', 'us_diversite',
        'ccq_global',
        'eps_c1', 'eps_c2', 'eps_c3',
        'eng_c1', 'eng_c2', 'eng_c3',
        'musique_c1c2', 'musique_c3',
        'art_plast_c1c2', 'art_plast_c3',
        'art_dram_c1c2', 'art_dram_c3'
      ];

      const baseScores = [
        91, 85, 76, 71, 59, 78, 86, 56, 68, 74,
        79, 93, 61, 70, 77, 85, 67, 75, 89, 80,
        82, 74, 88, 58
      ];

      const multiBaseScores = [86, 84, 77, 71, 59, 82, 85, 56, 67, 75, 88, 78, 61, 70, 79, 87, 68, 76, 84, 80];
      const multiDomainProfiles = [
        [4, -2, 3, 2, 1, 0], [-2, 4, 2, 3, 2, -1], [3, 1, -3, 0, 3, 2], [2, -2, 1, -2, 0, 4],
        [-4, -2, 2, 3, 0, 1], [3, 5, 1, 1, 1, -2], [4, -2, 4, 2, 0, 1], [-4, -2, 1, 3, -2, 2],
        [-2, -3, 3, 2, 1, 3], [1, 4, -2, 1, 4, -1], [5, 2, 0, -2, 2, 1], [-2, 4, 2, 1, 2, 3],
        [-3, -2, 3, 2, -1, 1], [3, -3, 2, 4, 2, 0], [-2, 2, 1, 0, -2, 4], [4, 3, -1, 2, 0, -2],
        [-2, 0, 3, 2, 1, 2], [2, 4, 1, -2, 1, -2], [2, -2, 3, 4, -1, 1], [1, 3, 0, -2, 4, 2]
      ];
      const multiSubjectDomains = {
        math_resoudre: 0, math_raisonner: 0,
        fra_lecture: 1, fra_ecriture: 1, fra_oral: 1,
        sciences_global: 2, sciences_outils: 2, sciences_comm: 2,
        univers_social: 3, us_changement: 3, us_diversite: 3,
        ccq_global: 4,
        eps_c1: 5, eps_c2: 5, eps_c3: 5,
        eng_c1: 1, eng_c2: 1, eng_c3: 1,
        musique_c1c2: 5, musique_c3: 5,
        art_plast_c1c2: 5, art_plast_c3: 5, art_dram_c1c2: 5, art_dram_c3: 5
      };
      const domainProfiles = [
        [4, -2, 3, -2, 4, 1], [-2, 5, 1, 3, -1, 2], [4, -2, -3, 2, 3, -2], [-2, -2, 3, 1, 2, 5],
        [-4, -3, 4, 3, 1, -1], [2, 5, -2, -2, 3, -2], [5, -2, 3, 0, 2, 4], [-5, -3, 1, 4, -2, 2],
        [-2, -3, 4, 2, 3, 2], [-2, 4, -2, 2, 5, 0], [5, -1, -2, 3, -1, 2], [-2, 4, 2, -1, 3, 4],
        [-4, -3, 5, 2, 0, 1], [3, -3, 2, 4, 3, 0], [-2, 3, 2, -1, -2, 5], [4, 2, -2, 3, -1, 0],
        [-2, 0, 4, 4, 0, 3], [2, 5, -2, -2, 2, -2], [3, -2, 2, 5, -1, 0], [-1, 3, -2, -1, 4, 4]
      ];

      const subjectOffsets = {
        math_resoudre: [3, 4, -2, 2, 4, -1, 2, -3, 3, -1, 2, 4, -2, 3, 4, 1, 2, -4, 3, 1],
        math_raisonner: [-2, 4, 3, -4, 2, 5, -1, -3, 0, 3, -2, 4, 1, -3, 2, 0, 4, -2, 3, -1],
        fra_lecture: [2, 1, 3, -2, 2, 1, 2, -2, 2, 2, 1, 2, 1, -1, 3, 2, 3, -2, 2, 2],
        fra_ecriture: [1, 2, 1, -3, 3, 0, 1, -4, 2, 0, 1, 1, -1, 0, 2, 0, 2, -3, 2, 0],
        fra_oral: [4, 2, 4, 1, 3, 3, 2, -1, 4, 2, 3, 3, 2, 2, 4, 3, 3, 0, 4, 2],
        sciences_global: [2, 3, 0, 1, 3, 2, 1, -2, 3, 1, 2, 4, 0, 3, 3, 2, 1, -1, 3, 1],
        sciences_outils: [3, 2, 1, 2, 2, 3, 2, 0, 2, 2, 2, 3, 1, 4, 3, 3, 2, 1, 3, 2],
        sciences_comm: [1, 2, 2, -1, 2, 1, 1, -3, 2, 1, 1, 2, 0, 1, 2, 1, 2, -2, 2, 1],
        univers_social: [2, 1, 3, 0, 2, 2, 2, -2, 2, 1, 2, 3, 1, 1, 3, 2, 2, -2, 3, 1],
        us_changement: [1, 2, 2, -1, 2, 1, 1, -3, 2, 1, 1, 2, 0, 1, 2, 1, 2, -2, 2, 1],
        us_diversite: [3, 2, 3, 1, 3, 3, 2, 0, 3, 2, 3, 3, 2, 2, 4, 3, 3, 1, 3, 2],
        ccq_global: [3, 1, 4, 1, 4, 2, 3, 0, 3, 2, 3, 2, 2, 2, 4, 3, 4, 0, 4, 3],
        art_plast_c1c2: [4, 0, 4, 3, 3, 2, 3, 2, 3, 3, 4, 1, 3, 4, 4, 3, 3, 3, 3, 3],
        art_plast_c3: [3, 1, 3, 2, 2, 2, 2, 1, 2, 2, 3, 2, 2, 3, 3, 2, 3, 1, 3, 2],
        art_dram_c1c2: [4, 1, 4, 2, 4, 3, 3, 2, 4, 3, 3, 2, 3, 3, 4, 3, 4, 2, 4, 3],
        art_dram_c3: [3, 2, 3, 1, 3, 2, 2, 1, 3, 2, 2, 3, 2, 2, 4, 2, 3, 1, 3, 2]
      };

      const plans = {
        math_resoudre: {
          '1': [
            { title: type === 'multi' ? 'Problème commun : Le budget de classe' : 'Situation-problème #1 : La fête d’école', outOf: 40, weight: type === 'multi' ? 30 : 50, date: '2026-10-15', isObs: false, targetLevels: [] },
            ...(type === 'multi' ? [
              { title: 'Problème 5e : Fractions équivalentes', outOf: 35, weight: 35, date: '2026-10-24', isObs: false, targetLevels: ['5'] },
              { title: 'Problème 6e : Ratios et pourcentages', outOf: 35, weight: 35, date: '2026-10-24', isObs: false, targetLevels: ['6'] }
            ] : []),
            { title: 'Trace observable : Démarche et calculs', outOf: 100, weight: type === 'multi' ? 35 : 50, date: '2026-11-04', isObs: true, critPrefix: 'c1', targetLevels: [] }
          ],
          '2': [
            { title: type === 'multi' ? 'Problème commun : Aménagement de la cour' : 'Situation-problème #2 : Les trésors de la forêt', outOf: 40, weight: 50, date: '2027-01-22', isObs: false, targetLevels: [] },
            { title: 'Trace observable : Organisation et justification', outOf: 100, weight: 50, date: '2027-02-12', isObs: true, critPrefix: 'c1', targetLevels: [] }
          ],
          '3': [
            { title: 'Mini-test : Calcul mental et régularités', outOf: 30, weight: 30, date: '2027-04-18', isObs: false, targetLevels: [] },
            { title: type === 'multi' ? 'Situation-problème finale : Le projet d’école' : 'Situation-problème finale : Le jardin', outOf: 50, weight: 40, date: '2027-05-20', isObs: false, targetLevels: [] },
            { title: 'Bilan observable : Validation et explicitation', outOf: 100, weight: 30, date: '2027-06-02', isObs: true, critPrefix: 'c1', targetLevels: [] }
          ]
        },
        math_raisonner: {
          '1': [
            { title: type === 'multi' ? 'Raisonnement : Fractions et nombres décimaux' : 'Raisonnement : Nombres et additions', outOf: 30, weight: 60, date: '2026-10-21', isObs: false, targetLevels: [] },
            { title: 'Trace observable : Choix et application des processus', outOf: 100, weight: 40, date: '2026-11-06', isObs: true, targetLevels: [] }
          ],
          '2': [
            { title: 'Raisonnement : Mesure et géométrie', outOf: 30, weight: 60, date: '2027-02-03', isObs: false, targetLevels: [] },
            { title: 'Trace observable : Justification mathématique', outOf: 100, weight: 40, date: '2027-02-20', isObs: true, targetLevels: [] }
          ],
          '3': [
            { title: type === 'multi' ? 'Raisonnement : Statistique et probabilités' : 'Raisonnement : Données et régularités', outOf: 40, weight: 60, date: '2027-05-21', isObs: false, targetLevels: [] },
            { title: 'Trace observable : Concepts et processus', outOf: 100, weight: 40, date: '2027-06-04', isObs: true, targetLevels: [] }
          ]
        },
        fra_lecture: {
          '1': [
            { title: type === 'multi' ? 'Compréhension : Roman jeunesse' : 'Compréhension : L’ourson perdu', outOf: 30, weight: 50, date: '2026-10-12', isObs: false, targetLevels: [] },
            { title: 'Trace observable : Inférences et réactions', outOf: 100, weight: 50, date: '2026-11-02', isObs: true, critPrefix: 'lec', targetLevels: [] }
          ],
          '2': [
            { title: 'Lecture documentaire : Faune du Québec', outOf: 30, weight: 50, date: '2027-01-28', isObs: false, targetLevels: [] },
            { title: 'Trace observable : Stratégies de compréhension', outOf: 100, weight: 50, date: '2027-02-18', isObs: true, critPrefix: 'lec', targetLevels: [] }
          ],
          '3': [
            { title: 'Cercle de lecture : Analyse de récits', outOf: 30, weight: 35, date: '2027-04-25', isObs: false, targetLevels: [] },
            { title: 'Évaluation sommative de lecture', outOf: 40, weight: 35, date: '2027-05-26', isObs: false, targetLevels: [] },
            { title: 'Trace observable : Fluidité et repères', outOf: 100, weight: 30, date: '2027-06-04', isObs: true, critPrefix: 'lec', targetLevels: [] }
          ]
        },
        fra_ecriture: {
          '1': [
            { title: type === 'multi' ? 'Texte narratif : Récit d’aventure' : 'Texte narratif : Mon animal imaginaire', outOf: 30, weight: 60, date: '2026-10-22', isObs: false, targetLevels: [] },
            { title: 'Trace observable : Orthographe et phrases', outOf: 100, weight: 40, date: '2026-11-06', isObs: true, critPrefix: 'ecr', targetLevels: [] }
          ],
          '2': [
            { title: type === 'multi' ? 'Texte descriptif ou d’opinion' : 'Texte descriptif : Ma créature fantastique', outOf: 30, weight: 50, date: '2027-02-05', isObs: false, targetLevels: [] },
            { title: 'Trace observable : Accords et syntaxe', outOf: 100, weight: 50, date: '2027-02-22', isObs: true, critPrefix: 'ecr', targetLevels: [] }
          ],
          '3': [
            { title: 'Mini-test : Accords dans le groupe du nom et verbes', outOf: 25, weight: 30, date: '2027-04-30', isObs: false, targetLevels: [] },
            { title: 'Projet d’écriture finale : Le conte fantastique', outOf: 40, weight: 40, date: '2027-05-28', isObs: false, targetLevels: [] },
            { title: 'Trace observable : Révision et autocorrection', outOf: 100, weight: 30, date: '2027-06-05', isObs: true, critPrefix: 'ecr', targetLevels: [] }
          ]
        },
        fra_oral: {
          '1': [
            { title: 'Présentation : Mon coup de cœur', outOf: 20, weight: 50, date: '2026-10-28', isObs: false, targetLevels: [] },
            { title: 'Trace observable : Écoute et prise de parole', outOf: 100, weight: 50, date: '2026-11-08', isObs: true, critPrefix: 'ora', targetLevels: [] }
          ],
          '2': [
            { title: 'Récit oral ou exposé d’équipe', outOf: 25, weight: 50, date: '2027-01-30', isObs: false, targetLevels: [] },
            { title: 'Trace observable : Voix, débit et clarté', outOf: 100, weight: 50, date: '2027-02-15', isObs: true, critPrefix: 'ora', targetLevels: [] }
          ],
          '3': [
            { title: 'Causerie thématique et débat guidé', outOf: 30, weight: 50, date: '2027-05-12', isObs: false, targetLevels: [] },
            { title: 'Trace observable : Formulation et écoute active', outOf: 100, weight: 50, date: '2027-06-03', isObs: true, critPrefix: 'ora', targetLevels: [] }
          ]
        },
        musique_c1c2: {
          '1': [
            { title: 'Interprétation : Motif rythmique et mélodique', outOf: 100, weight: 50, date: '2026-10-23', isObs: false, targetLevels: [] },
            { title: 'Trace observable : Création et techniques', outOf: 100, weight: 50, date: '2026-11-10', isObs: true, critPrefix: 'mus', targetLevels: [] }
          ],
          '2': [
            { title: 'Création : Courte pièce expressive', outOf: 100, weight: 50, date: '2027-01-29', isObs: false, targetLevels: [] },
            { title: 'Trace observable : Interprétation d’ensemble', outOf: 100, weight: 50, date: '2027-02-25', isObs: true, critPrefix: 'mus', targetLevels: [] }
          ],
          '3': [
            { title: 'Projet musical : Composition selon une intention', outOf: 100, weight: 60, date: '2027-05-19', isObs: false, targetLevels: [] },
            { title: 'Trace observable : Interprétation finale', outOf: 100, weight: 40, date: '2027-06-05', isObs: true, critPrefix: 'mus', targetLevels: [] }
          ]
        },
        musique_c3: {
          '1': [
            { title: 'Écoute : Repérage du langage musical', outOf: 100, weight: 50, date: '2026-10-30', isObs: false, targetLevels: [] },
            { title: 'Trace observable : Appréciation d’une œuvre', outOf: 100, weight: 50, date: '2026-11-12', isObs: true, critPrefix: 'mus_app', targetLevels: [] }
          ],
          '2': [
            { title: 'Appréciation : Œuvre québécoise', outOf: 100, weight: 50, date: '2027-02-04', isObs: false, targetLevels: [] },
            { title: 'Trace observable : Liens et vocabulaire musical', outOf: 100, weight: 50, date: '2027-02-26', isObs: true, critPrefix: 'mus_app', targetLevels: [] }
          ],
          '3': [
            { title: 'Écoute comparative : Effet et contexte', outOf: 100, weight: 60, date: '2027-05-24', isObs: false, targetLevels: [] },
            { title: 'Bilan : Appréciation argumentée', outOf: 100, weight: 40, date: '2027-06-06', isObs: true, critPrefix: 'mus_app', targetLevels: [] }
          ]
        },
        sciences_global: {
          '1': [
            { title: 'Démarche d’investigation : Propriétés de la matière', outOf: 30, weight: 50, date: '2026-10-18', isObs: false, targetLevels: [] },
            { title: 'Trace observable : Hypothèse et protocole', outOf: 100, weight: 50, date: '2026-11-05', isObs: true, critPrefix: 'sci', targetLevels: [] }
          ],
          '2': [
            { title: 'Rapport d’expérience : Les forces et le mouvement', outOf: 30, weight: 50, date: '2027-02-08', isObs: false, targetLevels: [] },
            { title: 'Trace observable : Manipulation et consignation', outOf: 100, weight: 50, date: '2027-02-24', isObs: true, critPrefix: 'sci', targetLevels: [] }
          ],
          '3': [
            { title: 'Projet sciences : Écosystèmes et environnement', outOf: 40, weight: 60, date: '2027-05-18', isObs: false, targetLevels: [] },
            { title: 'Trace observable : Explication des résultats', outOf: 100, weight: 40, date: '2027-06-06', isObs: true, critPrefix: 'sci', targetLevels: [] }
          ]
        },
        sciences_outils: {
          '1': [
            { title: 'Défi technologique : Conception d’une maquette', outOf: 25, weight: 100, date: '2026-11-01', isObs: false, targetLevels: [] }
          ],
          '2': [
            { title: 'Trace observable : Utilisation sécuritaire des instruments', outOf: 100, weight: 100, date: '2027-02-14', isObs: true, critPrefix: 'sci2', targetLevels: [] }
          ],
          '3': [
            { title: 'Projet d’assemblage technologique final', outOf: 30, weight: 100, date: '2027-05-22', isObs: false, targetLevels: [] }
          ]
        },
        sciences_comm: {
          '1': [
            { title: 'Schéma légendé et tableau d’observations', outOf: 20, weight: 100, date: '2026-10-30', isObs: false, targetLevels: [] }
          ],
          '2': [
            { title: 'Trace observable : Vocabulaire scientifique et symboles', outOf: 100, weight: 100, date: '2027-02-19', isObs: true, critPrefix: 'sci3', targetLevels: [] }
          ],
          '3': [
            { title: 'Communication des résultats d’investigation', outOf: 25, weight: 100, date: '2027-05-27', isObs: false, targetLevels: [] }
          ]
        },
        univers_social: {
          '1': [
            { title: type === 'multi' ? 'Sociétés vers 1500 (Iroquoiens et Incas)' : 'Les Iroquoiens et les Algonquiens vers 1500', outOf: 30, weight: 50, date: '2026-10-25', isObs: false, targetLevels: [] },
            { title: 'Trace observable : Repérage cartographique', outOf: 100, weight: 50, date: '2026-11-10', isObs: true, critPrefix: 'us', targetLevels: [] }
          ],
          '2': [
            { title: type === 'multi' ? 'La Nouvelle-France vers 1745' : 'L’habitat et les ressources du territoire', outOf: 30, weight: 50, date: '2027-02-02', isObs: false, targetLevels: [] },
            { title: 'Trace observable : Caractérisation de la société', outOf: 100, weight: 50, date: '2027-02-26', isObs: true, critPrefix: 'us', targetLevels: [] }
          ],
          '3': [
            { title: type === 'multi' ? 'Le Québec et le Canada vers 1905 et 1980' : 'Projet d’histoire : Modes de vie au fil du temps', outOf: 35, weight: 60, date: '2027-05-15', isObs: false, targetLevels: [] },
            { title: 'Trace observable : Ligne du temps et documents', outOf: 100, weight: 40, date: '2027-06-07', isObs: true, critPrefix: 'us', targetLevels: [] }
          ]
        },
        us_changement: {
          '1': [
            { title: 'Recherche : Causes et conséquences d’un événement historique', outOf: 20, weight: 100, date: '2026-11-03', isObs: false, targetLevels: [] }
          ],
          '2': [
            { title: 'Trace observable : Interprétation du changement', outOf: 100, weight: 100, date: '2027-02-16', isObs: true, critPrefix: 'us2', targetLevels: [] }
          ],
          '3': [
            { title: 'Bilan d’enquête : Traces actuelles du passé', outOf: 25, weight: 100, date: '2027-05-25', isObs: false, targetLevels: [] }
          ]
        },
        us_diversite: {
          '1': [
            { title: 'Trace observable : Ouverture à la diversité culturelle', outOf: 100, weight: 100, date: '2026-11-07', isObs: true, critPrefix: 'us3', targetLevels: [] }
          ],
          '2': [
            { title: 'Tableau comparatif : Territoires et modes de vie', outOf: 20, weight: 100, date: '2027-02-20', isObs: false, targetLevels: [] }
          ],
          '3': [
            { title: 'Synthèse : La richesse de la diversité', outOf: 20, weight: 100, date: '2027-05-30', isObs: false, targetLevels: [] }
          ]
        },
        ccq_global: {
          '1': [
            { title: 'Réflexion : Vivre ensemble et justice', outOf: 25, weight: 50, date: '2026-10-20', isObs: false, targetLevels: [] },
            { title: 'Trace observable : Écoute et respect dans le dialogue', outOf: 100, weight: 50, date: '2026-11-09', isObs: true, critPrefix: 'ccq', targetLevels: [] }
          ],
          '2': [
            { title: 'Dilemme éthique : Amitié, franchise et équité', outOf: 25, weight: 50, date: '2027-02-04', isObs: false, targetLevels: [] },
            { title: 'Trace observable : Justification d’un point de vue', outOf: 100, weight: 50, date: '2027-02-25', isObs: true, critPrefix: 'ccq', targetLevels: [] }
          ],
          '3': [
            { title: 'Projet citoyen : L’engagement dans notre milieu', outOf: 30, weight: 60, date: '2027-05-19', isObs: false, targetLevels: [] },
            { title: 'Trace observable : Pratique du dialogue et nuance', outOf: 100, weight: 40, date: '2027-06-08', isObs: true, critPrefix: 'ccq', targetLevels: [] }
          ]
        },
        art_plast_c1c2: {
          '1': [
            { title: 'Création plastique : Peinture et exploration des textures', outOf: 30, weight: 60, date: '2026-10-26', isObs: false, targetLevels: [] },
            { title: 'Trace observable : Démarche et langage plastique', outOf: 100, weight: 40, date: '2026-11-07', isObs: true, critPrefix: 'ap1', targetLevels: [] }
          ],
          '2': [
            { title: 'Création : Collage et formes en relief', outOf: 30, weight: 100, date: '2027-02-10', isObs: false, targetLevels: [] }
          ],
          '3': [
            { title: 'Projet d’envergure : Sculpture ou œuvre collective', outOf: 40, weight: 60, date: '2027-05-24', isObs: false, targetLevels: [] },
            { title: 'Trace observable : Autonomie et cohérence', outOf: 100, weight: 40, date: '2027-06-09', isObs: true, critPrefix: 'ap1', targetLevels: [] }
          ]
        },
        art_plast_c3: {
          '1': [
            { title: 'Appréciation : Une œuvre d’art québécois', outOf: 20, weight: 100, date: '2026-11-02', isObs: false, targetLevels: [] }
          ],
          '2': [
            { title: 'Trace observable : Vocabulaire et émotions ressenties', outOf: 100, weight: 100, date: '2027-02-17', isObs: true, critPrefix: 'ap3', targetLevels: [] }
          ],
          '3': [
            { title: 'Fiche d’appréciation : Comparaison de deux artistes', outOf: 20, weight: 100, date: '2027-05-31', isObs: false, targetLevels: [] }
          ]
        },
        art_dram_c1c2: {
          '1': [
            { title: 'Interprétation : Séquences mimées et personnages', outOf: 20, weight: 50, date: '2026-10-29', isObs: false, targetLevels: [] },
            { title: 'Trace observable : Expressivité corporelle et espace', outOf: 100, weight: 50, date: '2026-11-09', isObs: true, critPrefix: 'ad1', targetLevels: [] }
          ],
          '2': [
            { title: 'Création : Saynète dialoguée en équipe', outOf: 25, weight: 100, date: '2027-02-12', isObs: false, targetLevels: [] }
          ],
          '3': [
            { title: 'Projet dramatique : Pièce de théâtre de classe', outOf: 35, weight: 60, date: '2027-05-26', isObs: false, targetLevels: [] },
            { title: 'Trace observable : Écoute et présence sur scène', outOf: 100, weight: 40, date: '2027-06-10', isObs: true, critPrefix: 'ad1', targetLevels: [] }
          ]
        },
        art_dram_c3: {
          '1': [
            { title: 'Trace observable : Posture de spectateur attentif', outOf: 100, weight: 100, date: '2026-11-04', isObs: true, critPrefix: 'ad3', targetLevels: [] }
          ],
          '2': [
            { title: 'Appréciation : Ce que j’ai aimé dans la pièce', outOf: 20, weight: 100, date: '2027-02-23', isObs: false, targetLevels: [] }
          ],
          '3': [
            { title: 'Bilan d’appréciation théâtrale critique', outOf: 20, weight: 100, date: '2027-06-01', isObs: false, targetLevels: [] }
          ]
        }
      };

      const overrides = type === 'regulier' ? [
        { term: '1', sub: 'math_resoudre', idx: 0, val: '95', reason: 'Excellente constance et autonomie en fin d’étape.' },
        { term: '1', sub: 'fra_ecriture', idx: 7, val: '55', reason: 'Soutien soutenu et adaptations en place; les bases se consolident.' },
        { term: '2', sub: 'fra_lecture', idx: 3, val: '75', reason: 'Belle progression grâce au temps supplémentaire.' },
        { term: '2', sub: 'univers_social', idx: 17, val: '75', reason: 'Progrès marqués dans le repérage cartographique.' },
        { term: '3', sub: 'sciences_global', idx: 13, val: '80', reason: 'Bonne rigueur dans la démarche de projet final.' },
        { term: '3', sub: 'fra_oral', idx: 2, val: '80', reason: 'Aisance et vocabulaire plus précis lors de la causerie finale.' }
      ] : [
        { term: '1', sub: 'math_resoudre', idx: 0, val: '90', reason: 'Excellente maîtrise des fractions et décomposition.' },
        { term: '1', sub: 'fra_ecriture', idx: 8, val: '70', reason: 'Objectifs adaptés du bulletin modifié atteints avec soutien.' },
        { term: '2', sub: 'fra_lecture', idx: 6, val: '85', reason: 'Inférences fines démontrées lors des cercles de lecture.' },
        { term: '2', sub: 'univers_social', idx: 16, val: '75', reason: 'S’appuie bien sur les documents d’enquête historique.' },
        { term: '3', sub: 'sciences_global', idx: 11, val: '85', reason: 'Qualité remarquable du rapport d’enquête et autonomie.' },
        { term: '3', sub: 'math_resoudre', idx: 15, val: '95', reason: 'Résolution exemplaire des situations-problèmes d’envergure.' }
      ];

      const subjectComments = {
        math_resoudre: [
          'Excellente rigueur dans la démarche mathématique et explicitation claire des solutions.',
          'Bonne compréhension des situations-problèmes; consolider la vérification des calculs.',
          'Progrès constants. L’utilisation du matériel de manipulation favorise la compréhension.'
        ],
        math_raisonner: [
          'Choisit des processus pertinents et explique clairement son raisonnement.',
          'Applique les concepts étudiés; poursuivre la vérification des calculs.',
          'Développe ses stratégies de calcul et gagne à expliquer ses choix.'
        ],
        fra_lecture: [
          'Excellente compréhension en lecture; dégage avec finesse les inférences implicites.',
          'Lit avec fluidité et relève bien les repères explicites du texte.',
          'Progression encourageante dans les stratégies d’auto-questionnement et de dépannage.'
        ],
        fra_ecriture: [
          'Textes riches et captivants. Applique avec soin son code d’autocorrection.',
          'Idées créatives et bien structurées. Poursuivre l’attention aux accords de verbes.',
          'Progrès réguliers dans la construction des phrases et l’utilisation des outils d’aide.'
        ],
        fra_oral: [
          'S’exprime avec aisance, vocabulaire précis et écoute active remarquable.',
          'Participe volontiers aux échanges et formule clairement ses propos.',
          'Prend confiance dans ses prises de parole en grand groupe.'
        ],
        sciences_global: [
          'Curiosité scientifique et rigueur dans les observations et manipulations.',
          'Comprend bien les protocoles expérimentaux et participe activement en équipe.',
          'S’investit avec enthousiasme dans les projets d’investigation scientifique.'
        ],
        univers_social: [
          'Très bonne maîtrise des repères dans le temps et l’espace géographique.',
          'Établit des liens pertinents entre les modes de vie et les caractéristiques du territoire.',
          'Utilise efficacement les cartes et la ligne du temps pour appuyer ses réponses.'
        ],
        ccq_global: [
          'Participe avec respect et maturité aux réflexions éthiques et cercles de dialogue.',
          'Exprime son opinion avec nuance et écoute attentivement celle de ses pairs.',
          'Démontre une belle compréhension du vivre-ensemble et des règles de vie.'
        ],
        art_plast_c1c2: [
          'Démarche de création soignée, imaginative et très personnelle.',
          'Explore les matériaux avec intérêt et suit bien les propositions plastiques.',
          'Prend plaisir à réaliser ses projets artistiques avec minutie.'
        ],
        art_dram_c1c2: [
          'Expressivité corporelle et présence sur scène très dynamiques.',
          'Coopère harmonieusement avec ses partenaires de jeu théâtral.',
          'S’engage positivement dans les activités d’interprétation dramatique.'
        ]
      };

      const multiAssessmentFeedback = {
        0: {
          high: ['Tu as bien représenté les étapes de ta démarche; ajoute une vérification à la fin.', 'La stratégie choisie est efficace. Pense à écrire l’unité dans ta réponse.', 'Tu expliques clairement ton calcul; compare aussi avec une autre stratégie.'],
          mid: ['Le schéma t’aide à organiser les données. Vérifie chaque opération avant de conclure.', 'Tu as trouvé une piste pertinente; montre plus clairement comment tu passes d’une étape à l’autre.', 'Relis la question et souligne les données utiles avant de commencer.'],
          low: ['Représente d’abord la situation avec du matériel ou un schéma, puis note les calculs.', 'Prends le temps de vérifier ce que demande la question avant de choisir une opération.', 'La prochaine fois, laisse des traces de ta démarche pour qu’on puisse reprendre chaque étape ensemble.']
        },
        1: {
          high: ['Tu appuies ta réponse sur un indice précis; ajoute une deuxième preuve pour approfondir.', 'Bonne révision du texte : les idées sont claires et les détails choisis sont pertinents.', 'Tu prends ta place dans l’échange; pense à rebondir sur l’idée d’un camarade.'],
          mid: ['Relis la consigne une dernière fois pour vérifier que tous les éléments demandés sont présents.', 'Tes idées sont intéressantes; un plan rapide t’aidera à mieux les ordonner.', 'Tu repères les informations importantes. Explique davantage comment elles soutiennent ta réponse.'],
          low: ['Utilise la banque de mots et le plan de rédaction pour organiser tes idées avant d’écrire.', 'Relis une phrase à la fois et vérifie les accords avec les outils de la classe.', 'Lors de la prochaine lecture, arrête-toi après chaque paragraphe pour reformuler l’essentiel.']
        },
        2: {
          high: ['Tes observations sont précises; ajoute une légende pour rendre le schéma encore plus utile.', 'Tu as suivi les étapes de l’investigation et tu peux expliquer ce que montrent les résultats.', 'Bonne utilisation du matériel; décris aussi pourquoi tu as choisi cet outil.'],
          mid: ['Tu observes les changements avec attention. Note les résultats au fur et à mesure.', 'Le protocole est compris; prends soin de nommer les éléments de ton schéma.', 'Tu contribues à l’équipe; précise davantage le lien entre l’hypothèse et le résultat.'],
          low: ['Avant de manipuler, relis les étapes et vérifie avec un pair le matériel nécessaire.', 'Un tableau d’observations t’aidera à garder une trace de ce que tu remarques.', 'Décris d’abord ce que tu observes, puis essaie d’expliquer le résultat avec les mots étudiés.']
        },
        3: {
          high: ['Tu établis des liens pertinents entre les documents; précise la période ou le territoire concerné.', 'La comparaison est juste. Appuie-la avec un détail tiré de chacun des documents.', 'Tu situes bien les événements sur la ligne du temps; explique ce qui change.'],
          mid: ['La carte t’aide à repérer le territoire; ajoute une légende à ta réponse.', 'Tu as relevé des ressemblances intéressantes. Cherche aussi une différence importante.', 'Retourne au document pour vérifier les dates et les mots qui appuient ton explication.'],
          low: ['Repère d’abord le titre, la date et la légende du document avant de répondre.', 'Une ligne du temps avec quelques repères t’aidera à replacer les événements.', 'Choisis un indice dans la carte ou le texte et explique ce qu’il nous apprend.']
        },
        4: {
          high: ['Tu exprimes ton point de vue avec nuance et tu laisses de la place aux idées des autres.', 'Tu justifies ton opinion avec un exemple concret; continue d’écouter les différentes perspectives.', 'Tes interventions font avancer la discussion. Pense à reformuler l’idée entendue avant de répondre.'],
          mid: ['Tu participes au dialogue; prends le temps d’expliquer ce qui t’amène à cette opinion.', 'Tu écoutes les autres. Appuie davantage ton idée avec un exemple de la situation.', 'Tu distingues bien plusieurs points de vue; essaie de nommer ce qui les rapproche.'],
          low: ['Prépare une idée et un exemple avant le prochain cercle de discussion.', 'Écoute jusqu’au bout, puis commence ta réponse par ce que tu as compris de l’idée de l’autre.', 'Les cartes de prise de parole peuvent t’aider à formuler ton opinion et à donner une raison.']
        },
        5: {
          high: ['Tu as exploré plusieurs possibilités avant de faire tes choix; explique ce qui a guidé ta création.', 'Tu contribues à l’équipe et tu ajustes ton travail à partir des essais réalisés.', 'Ton interprétation est expressive; garde aussi un œil sur les déplacements du groupe.'],
          mid: ['Tu as persévéré dans les essais. Prends un moment pour observer le résultat avant de poursuivre.', 'Tu participes aux activités; essaie une autre façon d’utiliser le matériau ou l’espace.', 'Tes idées prennent forme. Pense à préparer le matériel et à le ranger avec soin.'],
          low: ['Commence par choisir une seule idée à explorer, puis essaie-la avec le matériel proposé.', 'Répète la séquence avec un partenaire avant de la présenter au groupe.', 'Un petit croquis ou quelques gestes d’essai peuvent t’aider à préparer ton projet.']
        }
      };

      const multiTermFeedback = {
        0: [
          ['Explique bien les stratégies de calcul et gagne à vérifier ses réponses avec une estimation.', 'Les représentations visuelles l’aident à résoudre les problèmes; poursuivre leur utilisation.'],
          ['Choisit des stratégies efficaces pour les situations étudiées; peut détailler davantage ses étapes.', 'Les notions sont mieux mobilisées quand les données sont organisées dans un tableau ou un schéma.'],
          ['Résout avec assurance plusieurs problèmes et justifie ses choix avec précision.', 'La vérification des calculs et des unités demeure un bon réflexe à consolider.']
        ],
        1: [
          ['La lecture progresse lorsque les indices du texte sont relevés et expliqués.', 'Les idées sont présentes; un plan et une relecture guidée soutiennent encore la production écrite.'],
          ['S’appuie sur des stratégies de lecture et structure de mieux en mieux ses textes.', 'Poursuivre l’attention aux accords et à la précision des réponses.'],
          ['Comprend finement les textes et communique ses idées avec clarté.', 'L’autocorrection porte ses fruits; continuer à enrichir les justifications et le vocabulaire.']
        ],
        2: [
          ['Participe aux manipulations; consigner les observations l’aide à expliquer les résultats.', 'Les outils de référence soutiennent la compréhension du vocabulaire scientifique.'],
          ['Formule des observations pertinentes et suit mieux les étapes d’une investigation.', 'Développer les liens entre les hypothèses, les manipulations et les conclusions.'],
          ['Mène les investigations avec méthode et présente des explications bien appuyées.', 'La précision des schémas et du vocabulaire renforce la communication des résultats.']
        ],
        3: [
          ['Les cartes et documents demandent encore un accompagnement pour repérer les indices utiles.', 'Les repères chronologiques se consolident avec des exemples concrets.'],
          ['Compare les sociétés et les territoires à partir de plusieurs caractéristiques.', 'Poursuivre l’utilisation des documents pour appuyer les explications.'],
          ['Établit des liens solides entre les sociétés, les territoires et les périodes étudiées.', 'Ses réponses sont bien appuyées par des repères pertinents.']
        ],
        4: [
          ['Participe au dialogue lorsqu’un cadre de discussion clair est proposé.', 'Prendre le temps de justifier son opinion aide à faire entendre son point de vue.'],
          ['Écoute les différents points de vue et formule des raisons de plus en plus précises.', 'Poursuivre la pratique du dialogue respectueux et de la nuance.'],
          ['Contribue aux échanges avec respect et nuance, en s’appuyant sur des exemples.'],
        ],
        5: [
          ['S’engage dans les projets artistiques et bénéficie de courtes étapes de planification.', 'Les essais variés l’aident à développer ses idées et à persévérer.'],
          ['Explore plusieurs moyens d’expression et coopère bien dans les projets collectifs.', 'Prendre le temps de commenter ses choix enrichit sa démarche de création.'],
          ['Fait preuve d’initiative et de constance dans sa démarche artistique.', 'Ses propositions enrichissent les réalisations individuelles et collectives.']
        ]
      };

      ['1', '2', '3'].forEach(termKey => {
        const termData = terms[termKey];
        const termProgression = termKey === '1' ? 0 : termKey === '2' ? 2 : 4;

        subjectIds.forEach(subId => {
          const subData = termData.subjectData[subId];
          if (!subData) return;
          const isAddedSubject = /^(eps_|eng_)/.test(subId);
          const subject = ALL_SUBJECTS_CONFIG.find(item => item.id === subId);
          const planList = (plans[subId] && plans[subId][termKey]) || (isAddedSubject ? [{
            title: `Trace observable : ${subject ? subject.partLabel : 'compétence disciplinaire'}`,
            outOf: 100,
            weight: 100,
            date: termKey === '1' ? '2026-11-06' : termKey === '2' ? '2027-02-19' : '2027-05-21',
            isObs: true,
            targetLevels: []
          }] : []);
          subData.assignments = [];

          planList.forEach((planItem, planIdx) => {
            const asgId = `asg_${type}_${subId}_t${termKey}_${planIdx + 1}`;
            const asgObj = {
              id: asgId,
              title: planItem.title,
              date: planItem.date,
              weight: planItem.weight,
              outOf: planItem.outOf,
              isObservation: Boolean(planItem.isObs),
              rubricVersion: 5,
              targetLevels: planItem.targetLevels || []
            };
            subData.assignments.push(asgObj);

            students.forEach((st, stIdx) => {
              if (!isAssignmentForStudent(asgObj, st) || !isSubjectApplicableForStudent(subject, st)) return;

              const base = type === 'multi' && !legacySeed
                ? multiBaseScores[stIdx % multiBaseScores.length]
                : baseScores[stIdx % baseScores.length];
              const offsetList = subjectOffsets[subId] || [];
              const offset = offsetList[stIdx % offsetList.length] || 0;
              const variation = type === 'multi' && !legacySeed
                ? ((stIdx * 11 + planIdx * 7 + subjectIds.indexOf(subId) * 5 + Number(termKey) * 3) % 9) - 4
                : ((stIdx * 7 + planIdx * 5 + subjectIds.indexOf(subId) * 3 + Number(termKey)) % 9) - 4;
              const domainIndex = multiSubjectDomains[subId];
              const domainOffset = legacySeed ? 0 : previousSeed
                ? (type === 'multi' ? multiDomainProfiles[stIdx % multiDomainProfiles.length][domainIndex] : 0)
                : domainProfiles[stIdx % domainProfiles.length][domainIndex];
              const competencyOffset = legacySeed || previousSeed ? 0 : ((stIdx * 3 + subjectIds.indexOf(subId) * 5) % 5) - 2;
              const termGrowth = type === 'multi' && !legacySeed
                ? (termKey === '1' ? 0 : termKey === '2' ? 1 : 3)
                : termProgression;
              let studentPct = Math.min(type === 'multi' && !legacySeed ? 97 : 98,
                Math.max(type === 'multi' && !legacySeed ? 45 : 46, base + offset + domainOffset + competencyOffset + termGrowth + variation));

              if (st.modifiedExpectations && st.modifiedExpectations[subId]) {
                studentPct = legacySeed
                  ? Math.min(90, studentPct + 4)
                  : Math.min(type === 'multi' ? 92 : 90, studentPct + (type === 'multi' ? 3 : 4));
              }

              const rec = subData.studentRecords[st.id];
              if (!rec) return;
              const feedbackBand = studentPct >= 85 ? 'high' : studentPct >= 70 ? 'mid' : 'low';
              const feedbackPool = type === 'multi' && multiAssessmentFeedback[domainIndex]
                ? multiAssessmentFeedback[domainIndex][feedbackBand]
                : null;
              const shouldCommentOnWork = type === 'multi' && !legacySeed &&
                ((stIdx * 3 + planIdx * 5 + subjectIds.indexOf(subId) * 2 + Number(termKey)) % 7 === 0);
              const workComment = shouldCommentOnWork && feedbackPool
                ? feedbackPool[(stIdx + planIdx * 2 + subjectIds.indexOf(subId) + Number(termKey)) % feedbackPool.length]
                : '';
              const adaptationFlagCodes = {
                'Temps supplémentaire': 'T+',
                'Lecture des consignes': 'AIDE',
                'Consignes fractionnées': 'AIDE',
                'Correcteur': 'OUTIL',
                'Prédicteur de mots': 'OUTIL',
                'Synthèse vocale': 'OUTIL',
                'Pauses planifiées': 'AIDE',
                'PIA': 'OUTIL',
                'Plan d’intervention': 'OUTIL'
              };
              const flags = (st.adaptations || []).map(flag =>
                legacySeed || previousSeed || VALID_CELL_FLAG_CODES.has(flag)
                  ? flag
                  : adaptationFlagCodes[flag]
              ).filter(flag => VALID_CELL_FLAG_CODES.has(flag));
              if (!legacySeed && !previousSeed && isSubjectModifiedForStudent(st, subId)) flags.push('MOD');

              if (!planItem.isObs) {
                const scaledScore = Math.min(planItem.outOf, Math.max(1, Math.round((studentPct / 100) * planItem.outOf)));
                rec.scores[asgId] = scaledScore;
                if ((type !== 'multi' || legacySeed) && (stIdx === 3 || stIdx === 7 || stIdx === 8 || stIdx === 13)) {
                  rec.scoreMeta[asgId] = {
                    comment: studentPct >= 85 ? 'Très belle réussite sur ce travail.' : 'Bon travail; révision appliquée.',
                    flags
                  };
                } else if (workComment) {
                  rec.scoreMeta[asgId] = { comment: workComment, flags };
                }
              } else {
                const gradeCode = pctToClosestGradeCode(studentPct);
                const gObj = GRADE_SCALE.find(g => g.code === gradeCode) || { pct: studentPct };
                rec.scores[asgId] = gObj.pct;
                const subject = ALL_SUBJECTS_CONFIG.find(item => item.id === subId);
                const criteria = subject ? getCriteriaForGradeLevel(subject, getEffectiveGradeLevel(st, subject)) : [];
                const family = GRADE_MAP[gradeCode].family;
                const isBorderlineAtRisk = stIdx === 16;
                const obsTags = isBorderlineAtRisk
                  ? (studentPct >= 75
                    ? ['Persévère lorsqu’un obstacle se présente', 'A besoin de soutien pour planifier les étapes']
                    : ['A besoin d’une relance pour amorcer la tâche', 'A besoin de repères pour suivre les étapes'])
                  : studentPct >= 82
                    ? ['Amorce la tâche sans relance', 'Réutilise une stratégie enseignée']
                    : studentPct >= 70
                      ? ['Persévère lorsqu’un obstacle se présente', 'Collabore avec ses pairs']
                      : studentPct >= 60
                        ? ['Persévère lorsqu’un obstacle se présente', 'A besoin d’une relance pour amorcer la tâche']
                        : ['A besoin d’une relance pour amorcer la tâche', 'A besoin de soutien pour planifier les étapes'];
                rec.scoreMeta[asgId] = {
                  overrideCode: null,
                  checked: getScoredObservableCriteria(criteria).map(criterion => `${criterion.id}_${family}_0`),
                  tags: obsTags,
                  flags,
                  comment: workComment || (type !== 'multi' || legacySeed
                    ? studentPct >= 85 ? 'Démontre une autonomie constante.' : 'Progression observée lors des ateliers.'
                    : '')
                };
              }
            });
          });
          if (subData.assignments.length > 1 && new Set(subData.assignments.map(a => a.weight)).size > 1) {
            subData.equalWeights = false;
          }

          const commentPool = subjectComments[subId] || [
            'Démontre un engagement soutenu et une belle régularité dans ses apprentissages.',
            'Bon trimestre dans cette discipline; poursuivre sur cette lancée.',
            'Efforts constants et participation positive lors des activités.'
          ];
          students.forEach((st, stIdx) => {
            const base = baseScores[stIdx % baseScores.length] + ((subjectOffsets[subId] || [])[stIdx] || 0);
            const rec = subData.studentRecords[st.id];
            if (!rec) return;
            if (type === 'multi' && !legacySeed) {
              const scores = subData.assignments
                .map(assignment => {
                  const score = rec.scores[assignment.id];
                  if (score === undefined || score === '') return NaN;
                  return previousSeed ? Number(score) : Number(score) / assignment.outOf * 100;
                })
                .filter(Number.isFinite);
              const average = scores.length ? scores.reduce((sum, score) => sum + score, 0) / scores.length : base;
              const band = average >= 84 ? 2 : average >= 70 ? 1 : 0;
              const multiCommentPool = multiTermFeedback[multiSubjectDomains[subId] || 0][band];
              rec.comment = multiCommentPool[(stIdx + subjectIds.indexOf(subId) * 2 + Number(termKey)) % multiCommentPool.length];
            } else {
              const scores = !legacySeed && !previousSeed
                ? subData.assignments.map(assignment => {
                  const score = rec.scores[assignment.id];
                  return score === undefined || score === '' ? NaN : Number(score) / assignment.outOf * 100;
                }).filter(Number.isFinite)
                : [];
              const average = scores.length ? scores.reduce((sum, score) => sum + score, 0) / scores.length : base;
              const cIdx = average >= 88 ? 0 : average >= 78 ? 1 : 2;
              rec.comment = commentPool[cIdx];
            }
          });
        });

        overrides.filter(ov => ov.term === termKey).forEach(ov => {
          const sd = termData.subjectData[ov.sub];
          if (sd && students[ov.idx]) {
            const st = students[ov.idx];
            const rec = sd.studentRecords[st.id];
            if (rec) {
              rec.finalJudgmentOverride = String(ov.val);
              rec.comment = `${rec.comment} [Note ajustée par jugement professionnel : ${ov.reason}]`;
            }
          }
        });
      });

      return terms;
    }

    const DEMO_FIRST_NAMES = [
      'Colette', 'Gaston', 'Mireille', 'Hector', 'Odette', 'Fernand',
      'Berthe', 'Maurice', 'Léontine', 'Boris', 'Suzette', 'Anatole',
      'Paulette', 'Octave', 'Germaine', 'Firmin', 'Rosalie', 'Léopold',
      'Adèle', 'Honoré', 'Casimir', 'Yvette', 'Godefroy', 'Bibiane',
      'Joséphine', 'Hubert', 'Félicie', 'Urbain', 'Mariette', 'Achille'
    ];
    const DEMO_LAST_NAMES = [
      'Pamplemousse', 'Ravioli', 'Cornichon', 'Chaussette', 'Spaghetti', 'Toboggan',
      'Flamby', 'Rutabaga', 'Galette', 'Pigeon', 'Trombone', 'Poisson',
      'Moustache', 'Plume', 'Nouille', 'Glaçon', 'Biscuit', 'Citrouille',
      'Frigidaire', 'Banane', 'Brocoli', 'Cacahuète', 'Patate', 'Tarte',
      'Boudin', 'Coucou', 'Chou', 'Pétunia', 'Fromage', 'Casserole',
      'Navet', 'Poireau', 'Omelette', 'Haricot', 'Croquette', 'Crayon'
    ];
    const DEMO_REPORT_COMMENTS = [
      first => `${first} participe avec curiosité et apporte des idées pertinentes aux échanges. Prendre le temps de vérifier ses réponses consolidera ses acquis.`,
      first => `${first} mobilise les notions apprises avec assurance et explique clairement sa démarche. Les défis plus complexes lui permettent de poursuivre ses apprentissages.`,
      first => `${first} démontre de beaux progrès lorsqu’une routine claire et des outils visuels soutiennent le travail. Continuer à utiliser ces repères favorisera son autonomie.`,
      first => `${first} s’investit avec constance et persévère devant les difficultés. Prendre le temps de relire les consignes demeure un objectif prioritaire.`,
      first => `${first} contribue positivement au climat de classe et respecte bien les étapes proposées. La précision des productions peut encore se développer.`,
      first => `${first} fait preuve d’initiative et comprend rapidement les nouvelles situations. Encourager la nuance des explications consolidera ce beau potentiel.`,
      first => `${first} progresse à son rythme et réussit davantage avec un guidage étape par étape. Les encouragements et la pratique régulière soutiennent sa confiance.`,
      first => `${first} utilise ses stratégies avec de plus en plus d’autonomie. Une relecture ciblée des accords et des calculs améliorera la qualité du résultat.`,
      first => `${first} prend une place active dans les discussions et écoute les idées des autres. Organiser ses idées avant de répondre l’aidera à être plus précis.`,
      first => `${first} démontre une bonne compréhension générale, particulièrement lorsque les apprentissages sont liés à des situations concrètes. Poursuivre les efforts de vérification.`,
      first => `${first} travaille avec soin et accepte bien les rétroactions. Les prochains défis viseront une application plus régulière des stratégies enseignées.`,
      first => `${first} présente une persévérance remarquable et demande de l’aide au moment opportun. Les progrès observés permettent d’aborder les prochaines notions avec confiance.`
    ];

    function buildDemoNames(count, offset) {
      return Array.from({ length: count }, (_, index) => {
        const first = DEMO_FIRST_NAMES[(index + offset) % DEMO_FIRST_NAMES.length];
        const last = DEMO_LAST_NAMES[(index * 7 + offset * 3) % DEMO_LAST_NAMES.length];
        return `${first} ${last}`;
      });
    }

    function buildDemoStudents(prefix, count, levels, nameOffset = 0, modifiedIndex = -1) {
      return buildDemoNames(count, nameOffset).map((name, index) => {
        const [firstName, lastName] = name.split(' ');
        const gradeLevel = typeof levels === 'function' ? levels(index) : levels;
        const isPresco = String(gradeLevel) === 'P';
        const modified = index === modifiedIndex && !isPresco;
        const adaptations = isPresco
          ? (index === 7 || index === 4 ? ['Plan d’intervention'] : [])
          : modified
            ? ['Plan d’intervention', 'Bulletin modifié']
            : (index === 4 || index === 7)
              ? ['Plan d’intervention']
              : [];
        const modifiedExpectations = modified
          ? { fra_ecriture: String(Number(gradeLevel) - 1), math_resoudre: String(Number(gradeLevel) - 1) }
          : {};
        const reportComment = modified
          ? `${firstName} fait preuve de persévérance et utilise de mieux en mieux les outils proposés. Les attentes modifiées sont indiquées au bulletin; nous poursuivrons le développement de son autonomie, une étape à la fois.`
          : DEMO_REPORT_COMMENTS[index % DEMO_REPORT_COMMENTS.length](firstName);
        return {
          id: `st_${prefix}_${index + 1}`,
          name,
          firstName,
          lastName,
          gradeLevel,
          adaptations,
          customAdapt: '',
          modifiedExpectations,
          competencyTerms: {},
          competencyMeq: {},
          competencyComments: {},
          reportComment
        };
      });
    }

    function buildDemoPreschoolData(previousSeed = false) {
      const students = buildDemoStudents('presco', 13, 'P', 24).map((student, index) => ({
        ...student,
        reportComment: index === 0
          ? `${student.firstName} arrive en classe avec enthousiasme et aime partager ses découvertes. Les jeux en petit groupe l’aident à exprimer ses idées et à prendre confiance.`
          : student.reportComment
      }));
      const terms = {
        '1': buildTermDataForStudents(students),
        '2': buildTermDataForStudents(students),
        '3': buildTermDataForStudents(students)
      };
      const profiles = [0, 1, 2, 1, 3, 2, 0, 4, 1, 3, 2, 0, 3, 1, 2, 0, 4, 2, 1, 3];
      const families = ['A', 'B', 'C', 'D', 'E'];
      const observationTitles = {
        '1': 'Observation de départ — jeux et routines',
        '2': 'Observation en contexte — ateliers et échanges',
        '3': 'Observation de fin d’année — situations variées'
      };
      const observationDates = { '1': '2026-11-06', '2': '2027-02-19', '3': '2027-06-05' };
      const contexts = {
        presco_c1: {
          activity: 'parcours moteur et atelier de manipulation',
          notes: [
            'essaie différentes façons de franchir le parcours et ajuste ses gestes avec assurance.',
            'coordonne de mieux en mieux ses mouvements et manipule les petits objets avec soin.',
            'participe aux parcours; un rappel l’aide à ralentir et à tenir le matériel adéquatement.',
            'a besoin d’un accompagnement rapproché pour suivre les étapes du parcours en sécurité.',
            'observe souvent avant d’essayer; une présence adulte et des étapes courtes facilitent sa participation.'
          ],
          next: [
            'Les parcours variés lui permettent de planifier ses mouvements et d’explorer de nouveaux gestes.',
            'La motricité fine se développe avec la manipulation régulière de petits outils.',
            'Les rappels de sécurité et les démonstrations soutiennent sa participation aux parcours.',
            'Un parcours court et prévisible aide à pratiquer les déplacements et la coordination.',
            'Des occasions d’essai sans pression, avec un adulte à proximité, favorisent la confiance.'
          ]
        },
        presco_c2: {
          activity: 'jeux de choix et routine d’accueil',
          notes: [
            'exprime ses préférences et choisit une activité avec confiance.',
            'communique ses goûts et ses besoins plus facilement au fil de la journée.',
            'fait des choix quand quelques options sont présentées et nommées.',
            'a besoin d’un rappel pour nommer son émotion ou demander de l’aide.',
            'se rassure avec une routine stable et un adulte disponible pour accueillir ses besoins.'
          ],
          next: [
            'Les occasions de faire des choix soutiennent son autonomie et sa confiance.',
            'Mettre des mots sur ses émotions l’aide à demander ce dont il a besoin.',
            'Des choix limités et un rappel verbal facilitent les prises d’initiative.',
            'La routine visuelle et les mots proposés par l’adulte l’aident à exprimer ses besoins.',
            'Un accueil prévisible et des encouragements discrets soutiennent son sentiment de sécurité.'
          ]
        },
        presco_c3: {
          activity: 'jeu symbolique et activité en petit groupe',
          notes: [
            'invite les autres dans le jeu et propose des idées qui font avancer l’activité.',
            'partage le matériel et attend son tour dans la plupart des jeux.',
            'joue près des autres et collabore davantage quand les rôles sont nommés.',
            'a besoin d’aide pour attendre son tour et trouver des mots lors d’un désaccord.',
            'bénéficie de la médiation de l’adulte pour entrer dans le jeu et résoudre un conflit.'
          ],
          next: [
            'Les jeux coopératifs lui permettent de proposer des idées et de négocier les rôles.',
            'Poursuivre la pratique du tour de rôle dans des jeux courts et connus.',
            'Des rôles simples et un rappel des règles facilitent les échanges avec les pairs.',
            'Les histoires sociales et les phrases modèles soutiennent la résolution de désaccords.',
            'Un adulte qui accompagne les premières étapes du jeu aide à établir un climat rassurant.'
          ]
        },
        presco_c4: {
          activity: 'causerie et lecture partagée',
          notes: [
            'raconte une expérience dans ses mots et réagit aux idées entendues.',
            's’exprime clairement dans les échanges et manifeste de l’intérêt pour les livres.',
            'répond aux questions et prend la parole quand un temps de réflexion est offert.',
            'a besoin d’une relance ou d’un choix d’images pour préciser son message.',
            'communique surtout par gestes ou par quelques mots; les échanges en dyade l’encouragent.'
          ],
          next: [
            'Les lectures dialoguées et les jeux de sons enrichissent son vocabulaire.',
            'L’inviter à raconter une idée dans ses mots nourrit la compréhension et l’expression.',
            'Les images et les questions ouvertes soutiennent la formulation de phrases.',
            'Un temps d’attente et des choix de mots facilitent la prise de parole.',
            'Les chansons, les images et les échanges individuels soutiennent l’émergence du langage.'
          ]
        },
        presco_c5: {
          activity: 'atelier de construction et exploration de matériel',
          notes: [
            'observe les changements, pose des questions et propose une façon de vérifier son idée.',
            'classe les objets selon une caractéristique et explique ce qu’il remarque.',
            'explore le matériel et repère certaines formes ou quantités avec un soutien ponctuel.',
            'a besoin d’un modèle pour comparer, classer ou dénombrer les objets.',
            'explore brièvement le matériel; une question simple et une démonstration l’aident à poursuivre.'
          ],
          next: [
            'Lui proposer du matériel varié permet de formuler de nouvelles hypothèses.',
            'Les jeux de classement et de mesure l’aident à préciser ses observations.',
            'Nommer les formes et comparer de petites quantités soutient ses découvertes.',
            'Une étape à la fois et du matériel à manipuler facilitent le raisonnement.',
            'Des explorations courtes avec un modèle concret favorisent l’attention et la curiosité.'
          ]
        }
      };

      Object.keys(terms).forEach(term => {
        ALL_SUBJECTS_CONFIG.filter(subject => subject.prescoOnly).forEach((subject, subjectIndex) => {
          const subData = terms[term].subjectData[subject.id];
          const asgId = `asg_presco_${subject.id}_t${term}`;
          const termNumber = Number(term);
          const stageShift = termNumber === 1 ? 0 : termNumber === 2 ? 1 : 1;
          const context = contexts[subject.id];
          subData.assignments.push({
            id: asgId,
            title: `${observationTitles[term]} — ${subject.partLabel}`,
            date: observationDates[term],
            weight: 100,
            outOf: 100,
            isObservation: true,
            rubricVersion: 5,
            targetLevels: []
          });

          students.forEach((student, index) => {
            const profile = profiles[index];
            const domainShift = ((index * 2 + subjectIndex * (previousSeed ? 3 : 2)) % 3) - 1;
            const growth = termNumber > 1 && (index + subjectIndex + termNumber) % 4 !== 0 ? stageShift : 0;
            const baseStage = Math.max(0, Math.min(4, profile + domainShift - growth));
            const criteria = getScoredObservableCriteria(getCriteriaForGradeLevel(subject, student.gradeLevel));
            const checked = criteria.map((criterion, criterionIndex) => {
              const criterionShift = (criterionIndex === 1 && (index + subjectIndex) % 2 === 0) ? 1
                : criterionIndex === 2 && (index + termNumber) % 3 === 0 ? -1 : 0;
              const stage = Math.max(0, Math.min(4, baseStage + criterionShift));
              return `${criterion.id}_${families[stage]}_0`;
            });
            const result = computeMajorityFromChecked(checked, null, criteria.length);
            const rec = subData.studentRecords[student.id];
            const resultStage = Math.max(0, Math.min(4, Math.round(
              checked.reduce((sum, key) => sum + families.indexOf(key.split('_').slice(-2, -1)[0]), 0) / Math.max(1, checked.length)
            )));
            const leaveWorkComment = (index + subjectIndex * 2 + termNumber) % 3 !== 0;

            rec.scores[asgId] = result.pct;
            rec.scoreMeta[asgId] = {
              overrideCode: null,
              checked,
              tags: resultStage <= 1
                ? ['Accomplit les routines de façon autonome', 'Explore et pose des questions avec curiosité']
                : resultStage === 2
                  ? ['Partage le matériel et attend son tour', 'Classe, compare et dénombre des objets']
                  : ['A besoin d’un accompagnement pour garder son calme devant une difficulté', 'A besoin d’une relance pour amorcer la tâche'],
              flags: [],
              comment: leaveWorkComment ? `Pendant le ${context.activity}, ${context.notes[resultStage]}` : ''
            };
            const progressLead = termNumber === 1 ? 'En ce début d’année' : 'Au fil des activités';
            const narrative = resultStage <= 1 ? context.next[0]
              : resultStage === 2 ? context.next[1]
                : resultStage === 3 ? context.next[2] : context.next[3];
            rec.comment = `${progressLead}, ${context.notes[resultStage]} ${narrative}`;
          });
        });
      });
      return { students, terms, selectedStudentId: students[0].id };
    }

    function buildAccueilDemoData(config) {
      const levels = ['1', '1', '2', '2', '2', '3', '3', '3', '3', '4', '4', '4', '5', '5', '5', '6', '6'];
      const students = buildDemoStudents(
        'accueil',
        config.count,
        index => levels[index % levels.length],
        config.offset
      );
      const competencyLabels = {
        oral: 'Prise de parole et écoute en situation familière',
        lecture: 'Lecture guidée d’un court texte illustré',
        ecriture: 'Production d’un court texte avec outils de soutien'
      };
      const palierByProfile = [4, 3, 2, 2, 1, 3, 4, 1, 2, 2, 3, 4, 1, 2, 3, 4, 2];
      const coteByProfile = ['A', 'B', 'B', 'C', 'D', 'B', 'A', 'D', 'B', 'C', 'B', 'A', 'C', 'C', 'B', 'A', 'C'];
      students.forEach((student, studentIndex) => {
        student.ilssByTerm = {};
        ['1', '2', '3'].forEach(termId => {
          const judgments = {};
          const assessments = [];
          ['oral', 'lecture', 'ecriture'].forEach((competency, competencyIndex) => {
            const basePalier = palierByProfile[studentIndex % palierByProfile.length];
            const compShift = competency === 'oral' ? 0 : competency === 'lecture' ? 0 : (basePalier > 1 ? -1 : 0);
            const palier = String(Math.min(5, Math.max(1, basePalier + compShift + (Number(termId) === 3 ? 1 : 0))));
            const baseCote = coteByProfile[studentIndex % coteByProfile.length];
            const cote = (baseCote === 'D' && competency === 'oral' && Number(termId) === 3) ? 'C' : baseCote;
            judgments[competency] = {
              palier: '',
              cote: '',
              overridePalier: '',
              overrideCote: '',
              comment: `${ILSS_COMMENT_BANK[competency][(studentIndex + competencyIndex) % ILSS_COMMENT_BANK[competency].length]}`,
              culture: competency === 'oral'
                ? 'Raconte une situation de la vie scolaire et utilise des repères culturels familiers.'
                : ''
            };
            assessments.push({
              competency,
              palier,
              cote,
              date: termId === '1' ? '2026-10-20' : termId === '2' ? '2027-02-20' : '2027-05-25',
              activity: competencyLabels[competency],
              observation: `Étape ${termId} — progression observée avec les appuis prévus pour le palier ${palier}.`,
              culture: competency === 'oral' ? 'Interaction liée à une routine de la classe québécoise.' : ''
            });
          });
          student.ilssByTerm[termId] = { judgments, assessments, disciplines: {} };
        });
      });
      const terms = buildFullDemoTerms('accueil', students);
      ILSS_SUBJECTS.forEach((ilssSubject, subjectIndex) => {
        ['1', '2', '3'].forEach(termId => {
          const subData = terms[termId].subjectData[ilssSubject.id];
          const id = `demo_ilss_${ilssSubject.id}_t${termId}`;
          subData.assignments.push({
            id,
            title: termId === '1'
              ? `${competencyLabels[ilssSubject.competency]} — départ`
              : termId === '2'
                ? `${competencyLabels[ilssSubject.competency]} — progression`
                : `${competencyLabels[ilssSubject.competency]} — bilan`,
            date: termId === '1' ? '2026-10-20' : termId === '2' ? '2027-02-20' : '2027-05-25',
            description: 'Trace structurée pour situer le palier et la cote à partir de plusieurs manifestations observables.',
            evidenceType: ['conversation', 'observation', 'production'][subjectIndex],
            isIlssAssessment: true,
            isObservation: true,
            targetLevels: []
          });
          students.forEach((student, studentIndex) => {
            const demoPalier = student.ilssByTerm[termId].assessments
              .find(item => item.competency === ilssSubject.competency).palier;
            const demoCote = student.ilssByTerm[termId].assessments
              .find(item => item.competency === ilssSubject.competency).cote;
            const pairs = (typeof ILSS_OBSERVATION_PAIRS !== 'undefined' && ILSS_OBSERVATION_PAIRS[ilssSubject.competency]) || [];
            const pair1 = pairs[(studentIndex + subjectIndex) % Math.max(1, pairs.length)];
            const pair2 = pairs[(studentIndex + subjectIndex + 1) % Math.max(1, pairs.length)];
            const isIlssChallenge = demoCote === 'D' || (demoCote === 'C' && (studentIndex === 3 || studentIndex === 9 || studentIndex === 12));
            const quickComments = isIlssChallenge
              ? [pair1 && pair1[1], pair2 && pair2[1]].filter(Boolean)
              : (pair1 ? [pair1[demoCote === 'C' ? 1 : 0]] : []);
            subData.studentRecords[student.id].scoreMeta[id] = {
              ilssPalier: '',
              ilssCote: demoCote,
              comment: `Appui observé au palier ${demoPalier} lors de l’activité.`,
              quickComments,
              criteria: Object.fromEntries(
                ILSS_OBSERVABLE_GRIDS[ilssSubject.competency].map(criterion => [criterion.id, demoPalier])
              )
            };
          });
        });
      });
      return {
        students,
        terms,
        selectedStudentId: students[0].id,
        subjectIds: ALL_SUBJECTS_CONFIG
          .filter(subject => subject.isIlss || subject.group === 'maths')
          .map(subject => subject.id)
      };
    }

    const DEMO_OPTIONS = [
      { id: 'presco', label: 'Préscolaire', groups: [
        { id: 'grp_presco', name: 'Démo — Préscolaire', count: 13, level: 'P', offset: 24 }
      ] },
      { id: 'annee1', label: '1re année', groups: [
        { id: 'grp_annee1', name: 'Démo — 1re année', count: 19, level: '1', offset: 1 }
      ] },
      { id: 'annee2', label: '2e année', groups: [
        { id: 'grp_regulier_2e', name: 'Démo — 2e année', count: 20, level: '2', offset: 2 }
      ] },
      { id: 'annee3', label: '3e année', groups: [
        { id: 'grp_annee3', name: 'Démo — 3e année', count: 22, level: '3', offset: 4 }
      ] },
      { id: 'annee4', label: '4e année', groups: [
        { id: 'grp_annee4', name: 'Démo — 4e année', count: 21, level: '4', offset: 7 }
      ] },
      { id: 'annee5', label: '5e année', groups: [
        { id: 'grp_annee5', name: 'Démo — 5e année', count: 24, level: '5', offset: 9, modified: true }
      ] },
      { id: 'annee6', label: '6e année', groups: [
        { id: 'grp_annee6', name: 'Démo — 6e année', count: 24, level: '6', offset: 13, modified: true }
      ] },
      { id: 'specialiste', label: 'Spécialiste 2e cycle', groups: [
        { id: 'grp_specialiste_3a', name: 'Démo — Spécialiste 3e A', count: 22, level: '3', offset: 16, specialist: true },
        { id: 'grp_specialiste_3b', name: 'Démo — Spécialiste 3e B', count: 21, level: '3', offset: 20, specialist: true },
        { id: 'grp_specialiste_4a', name: 'Démo — Spécialiste 4e A', count: 21, level: '4', offset: 23, specialist: true },
        { id: 'grp_specialiste_4b', name: 'Démo — Spécialiste 4e B', count: 20, level: '4', offset: 27, specialist: true }
      ] },
      { id: 'multi', label: 'Multi-niveau 5e et 6e', groups: [
        { id: 'grp_multi_5e6e', name: 'Démo — Multi 5e/6e', count: 18, level: '', offset: 6, multi: true, modified: true }
      ] },
      { id: 'accueil', label: 'Accueil (Multi)', groups: [
        { id: 'grp_accueil', name: 'Démo — Accueil (Multi)', count: 17, level: 'accueil', offset: 31, accueil: true }
      ] }
    ];
    const EXAMPLE_GROUP_CONFIGS = DEMO_OPTIONS.flatMap(option => option.groups);
    const EXAMPLE_GROUP_NAMES = Object.fromEntries(EXAMPLE_GROUP_CONFIGS.map(group => [group.id, group.name]));
    const EXAMPLE_GROUP_IDS = new Set(EXAMPLE_GROUP_CONFIGS.map(group => group.id));

    function isExampleGroup(group) {
      return !!group && EXAMPLE_GROUP_IDS.has(group.id);
    }

    function updateExampleGroupName(group) {
      if (EXAMPLE_GROUP_NAMES[group.id]) group.name = EXAMPLE_GROUP_NAMES[group.id];
    }

    function buildExampleGroupData(config) {
      if (config.level === 'P') return buildDemoPreschoolData();
      if (config.accueil) return buildAccueilDemoData(config);
      const primarySubjects = ALL_SUBJECTS_CONFIG.filter(s => !s.prescoOnly && !s.isIlss);
      let subjectIds = primarySubjects.map(subject => subject.id);
      if (['1', '2'].includes(config.level)) {
        subjectIds = primarySubjects.filter(subject => !['sciences', 'social'].includes(subject.group)).map(subject => subject.id);
      } else if (config.specialist) {
        subjectIds = primarySubjects
          .filter(subject => ['education_physique', 'anglais', 'art_plast', 'art_dram', 'musique'].includes(subject.group))
          .map(subject => subject.id);
      }
      const levelPicker = config.multi ? index => index < Math.ceil(config.count / 2) ? '5' : '6' : config.level;
      const students = buildDemoStudents(
        config.id.replace('grp_', ''),
        config.count,
        levelPicker,
        config.offset,
        config.modified ? 8 : -1
      );
      return {
        students,
        terms: buildFullDemoTerms(config.multi ? 'multi' : 'regulier', students),
        selectedStudentId: students[0].id,
        subjectIds
      };
    }

    function buildExampleGroups(selectedOptionIds = DEMO_OPTIONS.map(option => option.id)) {
      const selected = new Set(selectedOptionIds);
      const configs = DEMO_OPTIONS.filter(option => selected.has(option.id)).flatMap(option => option.groups);
      const groups = [];
      const groupStore = {};
      configs.forEach(config => {
        const data = buildExampleGroupData(config);
        const subjectIds = data.subjectIds || ALL_SUBJECTS_CONFIG.filter(subject => subject.prescoOnly).map(subject => subject.id);
        delete data.subjectIds;
        groups.push({ id: config.id, name: config.name, subjectIds, level: config.level });
        groupStore[config.id] = data;
      });
      return { groups, groupStore };
    }

    function looksLikeLegacyExampleData(data) {
      return !!data && Array.isArray(data.students) && data.students.some(student =>
        /^st_(reg|multi)_/.test(String(student.id || '')) ||
        /[-’][A-ZÀ-ÖØ-Ýa-zà-ÿ]+(?:[-’].+)?$/.test(String(student.lastName || ''))
      );
    }

    function ensureExampleGroups(selectedOptionIds = DEMO_OPTIONS.map(option => option.id)) {
      const examples = buildExampleGroups(selectedOptionIds);
      examples.groups.forEach(group => {
        const existingGroup = appState.groups.find(existing => existing.id === group.id);
        if (!existingGroup) appState.groups.push(group);
        else updateExampleGroupName(existingGroup);
        const existingData = group.id === appState.activeGroupId
          ? appState
          : appState.groupStore[group.id];
        const replacement = examples.groupStore[group.id];
        if (!existingData) {
          appState.groupStore[group.id] = replacement;
        } else if (looksLikeLegacyExampleData(existingData)) {
          if (group.id === appState.activeGroupId) {
            appState.students = replacement.students;
            appState.terms = replacement.terms;
            appState.selectedStudentId = replacement.selectedStudentId;
          } else {
            appState.groupStore[group.id] = replacement;
          }
        } else if (!appState.groupStore[group.id] && group.id !== appState.activeGroupId) {
          appState.groupStore[group.id] = examples.groupStore[group.id];
        }
      });
      return examples;
    }

    function initializeExampleGroups(selectedOptionIds = DEMO_OPTIONS.map(option => option.id)) {
      const examples = ensureExampleGroups(selectedOptionIds);
      const selectedIds = new Set(examples.groups.map(group => group.id));
      appState.groups = [
        { id: 'g1', name: 'Mon groupe', subjectIds: DEFAULT_GROUP_SUBJECT_IDS.slice(), level: '', placeholder: true },
        ...examples.groups
      ];
      appState.activeGroupId = 'g1';
      delete appState.groupStore.g1;
      Object.keys(appState.groupStore).forEach(groupId => {
        if (EXAMPLE_GROUP_IDS.has(groupId) && !selectedIds.has(groupId)) delete appState.groupStore[groupId];
      });
      appState.students = [];
      appState.terms = { '1': buildTermDataForStudents([]), '2': buildTermDataForStudents([]), '3': buildTermDataForStudents([]) };
      appState.selectedStudentId = null;
      appState.activeView = 'viewStudents';
      applyActiveSubjects(appState);
      return examples;
    }

