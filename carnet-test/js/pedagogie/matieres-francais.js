    ALL_SUBJECTS_CONFIG.push(
      {
        id: 'fra_lecture',
        group: 'francais', groupLabel: 'Français', partLabel: 'Lecture (C1)',
        shortName: 'Français • Lecture (C1)',
        fullName: 'Français — Lire des textes variés et Apprécier des œuvres littéraires',
        icon: 'LEC',
        imageUrl: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&w=960&q=70',
        refUrl: 'https://cdn-contenu.quebec.ca/cdn-contenu/education/pfeq/cadres-evaluation/primaire/francais/PFEQ-cadre-evaluation-francais-langue-enseignement-primaire.pdf',
        cssmbUrl: 'https://sites.google.com/ggl.csmb.qc.ca/cpfrancaiscssmb/lecture',
        criteria: [
          observableCriterion('lec_comp', '1. Compréhension des éléments significatifs (explicite et implicite)', {
            A: 'Repère toute l’information explicite du texte et réussit les inférences fines (ex. émotions, causes non dites).',
            B: 'Repère seul l’information explicite du texte et réussit la plupart des inférences demandées.',
            C: 'Relève l’essentiel de l’information explicite et réussit les inférences simples, parfois après une relance.',
            D: 'Repère quelques informations explicites avec un guidage; éprouve de la difficulté avec l’implicite.',
            E: 'Comprend le texte seulement avec la lecture assistée et des questions ciblées de l’adulte.'
          }),
          observableCriterion('lec_interp', '2. Interprétation plausible d’un texte', {
            A: 'Formule une interprétation nuancée du texte appuyée sur plusieurs indices précis qu’il cite ou explique.',
            B: 'Formule seul une interprétation plausible du texte et l’appuie sur au moins un indice pertinent.',
            C: 'Exprime une interprétation simple à partir d’un seul indice, seul ou après une relance de l’adulte.',
            D: 'Dégage un sens implicite du texte seulement lorsque l’adulte le guide directement.',
            E: 'Formule une interprétation plausible seulement avec des pistes très précises et un soutien constant.'
          }),
          observableCriterion('lec_reac', '3. Réaction et jugement critique (Apprécier)', {
            A: 'Formule un jugement critique nuancé de l’œuvre, appuyé sur des extraits précis et des critères explicites.',
            B: 'Justifie seul sa réaction et son appréciation par des éléments du texte (personnage, événement, style).',
            C: 'Appuie sa réaction ou son opinion sur un élément simple du texte, seul ou après relance.',
            D: 'Exprime une réaction vague (« J’ai aimé »); la précise seulement avec le guidage de l’adulte.',
            E: 'Justifie sa réaction seulement avec des pistes guidées et un soutien constant de l’adulte.'
          }),
          observableCriterion('lec_strat', '4. Recours à des stratégies de lecture appropriées (*)', {
            A: 'Adapte spontanément ses stratégies (survol, annotation, inférence) selon le texte et s’autorégule en cours de lecture.',
            B: 'Utilise efficacement ses stratégies de compréhension et ses outils d’aide (ex. dictionnaire, surlignage) pour construire le sens.',
            C: 'Applique une stratégie de lecture connue après un rappel ponctuel de l’adulte ou de l’affiche.',
            D: 'A besoin que l’adulte modèle et guide la stratégie de lecture à utiliser.',
            E: 'Utilise une stratégie de lecture seulement avec le modelage de l’adulte, malgré les supports offerts.'
          }, { formativeOnly: true })
        ]
      },
      {
        id: 'fra_ecriture',
        group: 'francais', groupLabel: 'Français', partLabel: 'Écriture (C2)',
        shortName: 'Français • Écriture (C2)',
        fullName: 'Français — Écrire des textes variés',
        imageUrl: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=960&q=70',
        icon: 'ÉCR',
        refUrl: 'https://cdn-contenu.quebec.ca/cdn-contenu/education/pfeq/cadres-evaluation/primaire/francais/PFEQ-cadre-evaluation-francais-langue-enseignement-primaire.pdf',
        cssmbUrl: 'https://sites.google.com/ggl.csmb.qc.ca/cpfrancaiscssmb/%C3%A9criture',
        criteria: [
          observableCriterion('ecr_adapt', '1. Adaptation à la situation d’écriture et cohérence du texte', {
            A: 'Présente des idées riches et pertinentes, des paragraphes fluides, des marqueurs de relation et des reprises variés.',
            B: 'Respecte le sujet et l’intention d’écriture; produit un texte cohérent, bien divisé en paragraphes.',
            C: 'Respecte le sujet avec des idées logiques; fait quelques maladresses de transition ou de reprise de l’information.',
            D: 'Présente des idées peu développées ou décousues; avance dans son texte avec un guidage étape par étape.',
            E: 'Respecte le sujet et la cohérence seulement avec un canevas détaillé et un soutien constant.'
          }),
          observableCriterion('ecr_vocab', '2. Vocabulaire, construction des phrases et ponctuation', {
            A: 'Emploie un vocabulaire précis et recherché, des phrases variées et une ponctuation exacte (virgule, point, majuscule).',
            B: 'Emploie un vocabulaire approprié; construit des phrases bien structurées et correctement ponctuées, avec de rares oublis.',
            C: 'Emploie des mots courants et des phrases de base correctes; oublie parfois la ponctuation.',
            D: 'Répète souvent les mêmes mots; certaines phrases sont mal construites ou la ponctuation est incomplète.',
            E: 'Construit des phrases correctes seulement avec un soutien constant, des modèles et des outils.'
          }),
          observableCriterion('ecr_ortho', '3. Orthographe d’usage et orthographe grammaticale', {
            A: 'Commet très peu d’erreurs; maîtrise l’orthographe d’usage et les accords du 3e cycle (GN, verbe, p.p.).',
            B: 'Orthographie la majorité des mots courants et réussit les accords dans le GN et avec le verbe.',
            C: 'Réussit les accords de base (GN, verbe); commet des erreurs dans les cas complexes (ex. participe passé).',
            D: 'Commet des erreurs fréquentes dans les mots courants et les accords de base (GN, verbe).',
            E: 'Applique les règles d’usage et d’accord seulement avec les outils et l’aide directe de l’adulte.'
          }),
          observableCriterion('ecr_strategies', '4. Stratégies d’écriture, révision et présentation (*)', {
            A: 'Planifie son texte, le révise méthodiquement avec ses outils (code de correction, dictionnaire) et soigne sa copie.',
            B: 'Suit son plan, applique son code de révision et remet une copie lisible et soignée.',
            C: 'Applique partiellement son code de révision ou ses outils, après un rappel de l’adulte.',
            D: 'Planifie et révise son texte seulement avec un guidage direct de l’adulte.',
            E: 'Utilise les stratégies de révision seulement avec des repères visuels et un soutien constant.'
          }, { formativeOnly: true })
        ]
      },
      {
        id: 'fra_oral',
        group: 'francais', groupLabel: 'Français', partLabel: 'Oral (C3)',
        shortName: 'Français • Oral (C3)',
        fullName: 'Français — Communiquer oralement',
        imageUrl: 'https://images.unsplash.com/photo-1529390079861-591de354faf5?auto=format&fit=crop&w=960&q=70',
        icon: 'ORA',
        refUrl: 'https://cdn-contenu.quebec.ca/cdn-contenu/education/pfeq/cadres-evaluation/primaire/francais/PFEQ-cadre-evaluation-francais-langue-enseignement-primaire.pdf',
        cssmbUrl: 'https://sites.google.com/ggl.csmb.qc.ca/cpfrancaiscssmb/communication-orale',
        criteria: [
          observableCriterion('ora_regles', '1. Réaction témoignant d’une écoute efficace', {
            A: 'Écoute activement, rebondit sur les idées des pairs et enrichit l’échange par des propos pertinents.',
            B: 'Écoute avec attention et formule seul des propos pertinents liés au sujet de l’échange.',
            C: 'Reste attentif et formule un propos lié au sujet, seul ou après une relance de l’adulte.',
            D: 'Nécessite des rappels fréquents pour écouter ses pairs et rester dans le sujet.',
            E: 'Maintient son écoute seulement avec un cadre structuré et un soutien constant de l’adulte.'
          }),
          observableCriterion('ora_part', '2. Adaptation à la situation de communication', {
            A: 'Ajuste avec aisance sa voix, son débit, son intonation et son registre standard à l’auditoire.',
            B: 'Adapte seul son message, sa voix et son registre à l’auditoire et à l’intention.',
            C: 'Transmet l’essentiel du message; ajuste sa voix ou son débit après un rappel de l’adulte.',
            D: 'Parle à voix faible ou trop vite, ou son propos est confus; l’adulte le guide directement.',
            E: 'Adapte sa prise de parole seulement avec un soutien constant et des repères visuels.'
          }),
          observableCriterion('ora_voix', '3. Utilisation des formulations appropriées (syntaxe et vocabulaire)', {
            A: 'S’exprime par des phrases complètes et variées, avec un vocabulaire précis et des mots justes.',
            B: 'Formule ses idées dans des phrases bien construites, avec les mots justes et peu d’erreurs.',
            C: 'S’exprime par des phrases simples compréhensibles, avec des mots courants; reprend certaines formulations imprécises.',
            D: 'Dit des phrases incomplètes ou des mots imprécis; progresse avec des amorces de phrases et du guidage.',
            E: 'Se fait comprendre seulement avec des amorces de phrases et un soutien constant de l’adulte.'
          }),
          observableCriterion('ora_strategies', '4. Recours à des stratégies de communication orale (*)', {
            A: 'Mobilise spontanément ses stratégies de préparation, d’écoute et de parole (ex. plan, notes, reformulation) selon la tâche.',
            B: 'Utilise efficacement ses notes ou repères visuels, et regarde l’auditoire pendant sa prise de parole.',
            C: 'Utilise son support ou applique une stratégie orale connue après un rappel ponctuel de l’adulte.',
            D: 'A besoin que l’adulte modèle et guide ses stratégies de communication orale.',
            E: 'Utilise une stratégie orale seulement avec le modelage de l’adulte et des supports variés.'
          }, { formativeOnly: true })
        ]
      }
    );
