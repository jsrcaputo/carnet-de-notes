    ALL_SUBJECTS_CONFIG.push(
      {
        id: 'univers_social',
        group: 'social', groupLabel: 'Géographie, histoire et éducation à la citoyenneté', tabLabel: 'Géo. / Histoire', singleResult: true, bulletinLabel: 'Géographie, histoire et éd. à la citoyenneté', partLabel: 'Organisation (C1)',
        shortName: 'GHEC • Organisation (C1)',
        fullName: 'Géographie, histoire et éducation à la citoyenneté — C1 : Lire l’organisation d’une société sur son territoire',
        imageUrl: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=960&q=70',
        icon: 'US',
        refUrl: 'https://cdn-contenu.quebec.ca/cdn-contenu/education/pfeq/cadres-evaluation/primaire/francais/PFEQ-cadre-evaluation-univers-social-primaire.pdf',
        cssmbUrl: 'https://sre.servicescsmb.com/disciplines/',
        criteria: [
          observableCriterion('us_oi', '1. Maîtrise des connaissances et repérage (temps et espace)', {
            A: 'Situe avec exactitude événements et repères sur cartes et frises, et rappelle précisément les faits de 1820 à 1980 sans aide.',
            B: 'Rappelle seul les connaissances principales et situe correctement la plupart des faits sur une carte ou une frise.',
            C: 'Situe les repères principaux et nomme un fait exact, seul ou à l’aide d’un référentiel (carte, aide-mémoire).',
            D: 'Se repère dans les documents lorsque l’adulte pointe les indices à observer et reformule la consigne.',
            E: 'Situe quelques repères et rappelle un fait avec un soutien individuel constant et des supports adaptés.'
          }),
          observableCriterion('us_org', '2. Caractérisation d’une société et de son territoire', {
            A: 'Caractérise avec précision une société et son territoire (population, économie, milieu) et les compare à une autre société.',
            B: 'Décrit seul les caractéristiques principales de la société étudiée et de son territoire à partir des documents fournis.',
            C: 'Relève une caractéristique pertinente de la société et de son territoire, seul ou à l’aide d’un tableau.',
            D: 'Identifie des caractéristiques lorsque l’adulte cible les documents et les éléments à observer un à un.',
            E: 'Relève une caractéristique avec un guidage individuel soutenu et des supports visuels adaptés (images, cartes simplifiées).'
          }),
          observableCriterion('us_causalite', '3. Mise en relation des faits et liens de causalité', {
            A: 'Met en relation plusieurs faits et explique clairement leurs causes et leurs conséquences en s’appuyant sur les documents.',
            B: 'Établit seul un lien de causalité pertinent entre deux faits à partir des documents et l’explique.',
            C: 'Établit un lien simple de cause à effet entre deux faits, seul ou après une relance.',
            D: 'Relie deux faits entre eux avec un guidage direct de l’adulte (questions pas à pas).',
            E: 'Relie deux faits avec un modelage de l’adulte et un soutien individuel soutenu (schéma cause-effet).'
          }),
          observableCriterion('us_div', '4. Techniques propres à la géographie et à l’histoire (*)', {
            A: 'Interprète et construit seul cartes, lignes du temps et tableaux exacts (légende, échelle, graduation) pour appuyer son propos.',
            B: 'Utilise efficacement la légende, l’échelle et la ligne du temps pour lire et situer l’information demandée.',
            C: 'Repère une information sur une carte ou une frise après un rappel de l’usage de la légende.',
            D: 'Lit la carte ou la frise lorsque l’adulte modèle la démarche à voix haute, étape par étape.',
            E: 'Repère une information avec un support simplifié et un accompagnement individuel constant de l’adulte.'
          }, { formativeOnly: true })
        ]
      },
      {
        id: 'us_changement',
        group: 'social', groupLabel: 'Géographie, histoire et éducation à la citoyenneté', tabLabel: 'Géo. / Histoire', singleResult: true, bulletinLabel: 'Géographie, histoire et éd. à la citoyenneté', partLabel: 'Changement (C2)',
        shortName: 'GHEC • Changement (C2)',
        fullName: 'Géographie, histoire et éducation à la citoyenneté — C2 : Interpréter le changement dans une société et sur son territoire',
        imageUrl: 'https://images.unsplash.com/photo-1461360370896-922624d12aa1?auto=format&fit=crop&w=960&q=70',
        icon: 'US2',
        refUrl: 'https://cdn-contenu.quebec.ca/cdn-contenu/education/pfeq/cadres-evaluation/primaire/francais/PFEQ-cadre-evaluation-univers-social-primaire.pdf',
        cssmbUrl: 'https://sre.servicescsmb.com/disciplines/',
        criteria: [
          observableCriterion('us2_connaissances', '1. Maîtrise des connaissances sur les sociétés à l’étude', {
            A: 'Rappelle avec justesse faits, personnages et événements de la société à l’étude et les situe dans le temps.',
            B: 'Rappelle correctement les connaissances sur la société à deux moments de son histoire, sans aide extérieure.',
            C: 'Rappelle les faits essentiels de la société, seul ou à l’aide de sa ligne du temps.',
            D: 'Rappelle quelques faits lorsque l’adulte pointe les repères dans les documents et pose des questions ciblées.',
            E: 'Rappelle un fait avec un soutien individuel constant et des documents adaptés (images, courte ligne du temps).'
          }),
          observableCriterion('us2_changements', '2. Détermination des changements, causes et conséquences', {
            A: 'Relève plusieurs changements entre deux périodes et explique clairement leurs causes et leurs conséquences à l’aide des documents.',
            B: 'Décrit seul des changements entre deux périodes et nomme au moins une cause ou une conséquence pertinente.',
            C: 'Relève un changement entre deux périodes et nomme une cause simple, seul ou après une relance.',
            D: 'Nomme un changement isolé; trouve la cause avec un guidage direct de l’adulte.',
            E: 'Relève un changement avec un soutien individuel constant et des images comparatives avant-après.'
          }),
          observableCriterion('us2_interpretation', '3. Justification de son interprétation du changement', {
            A: 'Défend son interprétation du changement avec plusieurs arguments précis tirés des documents et cite des extraits ou des traces.',
            B: 'Appuie seul son interprétation du changement sur un argument pertinent et au moins une trace tirée des documents.',
            C: 'Donne une raison simple pour justifier son interprétation du changement, avec un exemple tiré d’un document.',
            D: 'Exprime une idée sans preuve; la justifie avec un guidage direct de l’adulte.',
            E: 'Exprime une idée avec un soutien individuel constant et des pistes de justification fournies (amorces de phrases).'
          }),
          observableCriterion('us2_traces', '4. Recherche de traces actuelles des changements (*)', {
            A: 'Trouve seul et explique plusieurs traces actuelles des changements (bâtiment, toponyme, tradition) en les reliant à leur époque.',
            B: 'Repère seul des traces actuelles de la société étudiée et précise à quel changement elles se rattachent.',
            C: 'Repère une trace actuelle de la société étudiée, avec des exemples ou sur relance.',
            D: 'Repère une trace dans des photos lorsque l’adulte la pointe et pose des questions ciblées.',
            E: 'Repère une trace avec un soutien individuel constant, des exemples guidés et des photos annotées.'
          }, { formativeOnly: true })
        ]
      },
      {
        id: 'us_diversite',
        group: 'social', groupLabel: 'Géographie, histoire et éducation à la citoyenneté', tabLabel: 'Géo. / Histoire', singleResult: true, bulletinLabel: 'Géographie, histoire et éd. à la citoyenneté', partLabel: 'Diversité (C3)',
        shortName: 'GHEC • Diversité (C3)',
        fullName: 'Géographie, histoire et éducation à la citoyenneté — C3 : S’ouvrir à la diversité des sociétés et de leur territoire',
        imageUrl: 'https://images.unsplash.com/photo-1526470608268-f674ce90ebd4?auto=format&fit=crop&w=960&q=70',
        icon: 'US3',
        refUrl: 'https://cdn-contenu.quebec.ca/cdn-contenu/education/pfeq/cadres-evaluation/primaire/francais/PFEQ-cadre-evaluation-univers-social-primaire.pdf',
        cssmbUrl: 'https://sre.servicescsmb.com/disciplines/',
        criteria: [
          observableCriterion('us3_connaissances', '1. Maîtrise des connaissances sur des sociétés différentes', {
            A: 'Situe avec exactitude les sociétés comparées dans l’espace et le temps et décrit précisément leurs caractéristiques.',
            B: 'Rappelle correctement les caractéristiques des sociétés étudiées et les situe sur une carte, sans aide extérieure.',
            C: 'Nomme les caractéristiques principales d’une société, seul ou à l’aide d’un référentiel (tableau, fiche-synthèse).',
            D: 'Nomme quelques caractéristiques avec un guidage direct de l’adulte et des questions précises.',
            E: 'Nomme une caractéristique avec un soutien individuel constant et des supports visuels adaptés (images, cartes).'
          }),
          observableCriterion('us3_comparaison', '2. Comparaison de sociétés : ressemblances, différences et causes', {
            A: 'Compare plusieurs aspects de deux sociétés et explique les causes des différences en s’appuyant sur les documents.',
            B: 'Établit seul des ressemblances et des différences pertinentes entre deux sociétés à partir des documents.',
            C: 'Relève une ressemblance ou une différence entre deux sociétés, seul ou à l’aide d’un tableau comparatif.',
            D: 'Compare deux éléments lorsque l’adulte cible chaque aspect à observer, un aspect à la fois.',
            E: 'Relève une ressemblance ou une différence avec un soutien individuel constant et des supports visuels adaptés.'
          }),
          observableCriterion('us3_vision', '3. Vision de la diversité : forces, faiblesses et arguments', {
            A: 'Défend une vision nuancée de la diversité en nommant forces et faiblesses appuyées sur plusieurs arguments précis.',
            B: 'Présente sa vision de la diversité et la justifie par un argument pertinent tiré des documents.',
            C: 'Nomme une force ou une faiblesse de la diversité d’une société après une relance, avec un exemple.',
            D: 'Exprime une opinion générale; la justifie avec un guidage direct de l’adulte.',
            E: 'Exprime une opinion avec un soutien individuel constant et des pistes de réflexion fournies (amorces, images).'
          }),
          observableCriterion('us3_techniques', '4. Techniques propres à la géographie et à l’histoire (*)', {
            A: 'Lit et construit seul cartes et lignes du temps exactes pour comparer des sociétés (légende, échelle, repères).',
            B: 'Utilise efficacement la légende et la frise pour situer les sociétés et en tirer des informations justes.',
            C: 'Utilise la légende ou la frise pour situer une société après un rappel ponctuel de la démarche.',
            D: 'Lit la frise ou la carte lorsque l’adulte montre chaque étape à voix haute et guide le repérage.',
            E: 'Situe une société sur une carte simplifiée avec un accompagnement individuel constant et un modèle visuel.'
          }, { formativeOnly: true })
        ]
      }
    );
