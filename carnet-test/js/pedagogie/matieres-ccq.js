    ALL_SUBJECTS_CONFIG.push(
      {
        id: 'ccq_global',
        shortName: 'Culture et citoyenneté québécoise', tabLabel: 'Culture et citoyenneté québ.',
        fullName: 'Culture et citoyenneté québécoise (CCQ) — Explorer · Examiner · Réfléchir',
        imageUrl: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=960&q=70',
        icon: 'CCQ',
        refUrl: 'https://cdn-contenu.quebec.ca/cdn-contenu/education/pfeq/cadres-evaluation/primaire/francais/PFEQ-cadre-evaluation-culture-citoyennete-quebecoise-primaire.pdf',
        cssmbUrl: 'https://sites.google.com/ggl.csmb.qc.ca/ccq/%C3%A9valuation',
        criteria: [
          observableCriterion('ccq_obs', '1. Maîtrise des connaissances — Réfléchir de façon critique', {
            A: 'Explique avec justesse les concepts et réalités du 3e cycle et établit des liens entre eux.',
            B: 'Décrit et utilise seul les connaissances principales liées à la réalité étudiée, avec de rares imprécisions.',
            C: 'Nomme et utilise les notions essentielles, seul ou avec son référentiel; certaines notions restent imprécises.',
            D: 'Rappelle quelques notions à l’aide d’exemples concrets et d’un guidage direct de l’adulte.',
            E: 'Mobilise les connaissances étudiées seulement avec des supports variés et un soutien constant.'
          }),
          observableCriterion('ccq_ethique', '2. Qualité de la démarche (interrogation et traitement)', {
            A: 'Pose des questions pertinentes, recueille des informations fiables et compare divers points de vue.',
            B: 'Recueille seul des informations pertinentes et compare les points de vue en nommant des ressemblances ou différences.',
            C: 'Repère une information utile et fait une comparaison simple, seul ou avec un tableau.',
            D: 'A besoin d’un guidage pas à pas pour repérer des informations et comparer des points de vue.',
            E: 'Réalise la démarche seulement avec des supports variés et un soutien constant de l’adulte.'
          }),
          observableCriterion('ccq_comprehension', '3. Développement de la réponse (réflexion critique)', {
            A: 'Développe une réponse nuancée et cohérente, appuyée sur plusieurs repères (faits, valeurs, points de vue).',
            B: 'Développe seul une réponse claire et cohérente, appuyée sur des repères tirés de la situation.',
            C: 'Présente une réponse simple mais pertinente et liée au sujet, seul ou après une relance de l’adulte.',
            D: 'Formule une réponse incomplète; la justifie seulement avec un guidage direct de l’adulte.',
            E: 'Développe une réponse liée au sujet seulement avec un soutien constant et des questions précises.'
          }),
          observableCriterion('ccq_dialogue', '4. Pratique du dialogue et ouverture (*)', {
            A: 'Écoute activement, accueille la pluralité des points de vue et justifie ses idées avec respect.',
            B: 'Respecte les règles du dialogue, écoute ses pairs et exprime ses raisons de façon claire.',
            C: 'Respecte son tour de parole et écoute un avis différent après un rappel ponctuel.',
            D: 'A besoin que l’adulte régule ses tours de parole et soutienne son écoute.',
            E: 'Adopte une posture de dialogue seulement avec un cadre précis et un soutien constant.'
          }, { formativeOnly: true })
        ]
      }
    );
