    ALL_SUBJECTS_CONFIG.push(
      {
        id: 'sciences_global',
        group: 'sciences', groupLabel: 'Sciences', singleResult: true, bulletinLabel: 'Science et technologie', partLabel: 'Proposer (C1)',
        shortName: 'Sciences • Proposer (C1)',
        fullName: 'Science et technologie — C1 : Proposer des explications ou des solutions à des problèmes',
        imageUrl: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=960&q=70',
        icon: 'ST',
        refUrl: 'https://cdn-contenu.quebec.ca/cdn-contenu/education/pfeq/cadres-evaluation/primaire/francais/PFEQ-cadre-evaluation-science-technologie-primaire.pdf',
        cssmbUrl: 'https://sre.servicescsmb.com/disciplines/',
        criteria: [
          observableCriterion('sci_prob', '1. Description adéquate du problème et hypothèse', {
            A: 'Reformule clairement le problème dans ses mots et propose une hypothèse justifiée par ses connaissances.',
            B: 'Cerne seul le problème et formule une hypothèse ou une solution plausible liée à la situation.',
            C: 'Repère la question à résoudre et formule une hypothèse simple, seul ou après une relance.',
            D: 'Formule une hypothèse à partir du problème seulement lorsque l’adulte le guide étape par étape.',
            E: 'Cerne le problème ou formule l’hypothèse seulement avec un soutien constant et des questions précises.'
          }),
          observableCriterion('sci_demarche', '2. Mise en œuvre d’une démarche et manipulation', {
            A: 'Suit et ajuste son protocole avec rigueur; manipule avec précision et respecte les consignes de sécurité.',
            B: 'Réalise seul le protocole, manipule en sécurité et note ses résultats de façon fidèle.',
            C: 'Exécute l’essentiel du protocole à l’aide d’un guide illustré ou sur rappel; oublie parfois une étape.',
            D: 'Nécessite un guidage direct de l’adulte pour suivre les étapes et manipuler le matériel.',
            E: 'Réalise la démarche seulement avec un soutien constant et la démonstration de l’adulte.'
          }),
          observableCriterion('sci_explic', '3. Utilisation des connaissances scientifiques et technologiques', {
            A: 'Explique ses résultats et conclut avec justesse en utilisant le vocabulaire scientifique exact du cycle.',
            B: 'Relie seul ses résultats aux notions étudiées en employant les bons termes, avec de rares imprécisions.',
            C: 'Formule une conclusion simple liée aux notions vues en classe; certains termes restent imprécis.',
            D: 'Relie ses résultats aux notions étudiées seulement lorsque l’adulte le guide directement, question par question.',
            E: 'Utilise les notions étudiées seulement avec un soutien constant et des questions très ciblées.'
          }),
          observableCriterion('sci_strategies', '4. Stratégies d’exploration et de consignation (*)', {
            A: 'Organise seul ses observations dans des schémas ou des tableaux clairs, titrés et complets.',
            B: 'Utilise efficacement les stratégies d’observation et de consignation (ex. croquis légendé, tableau de résultats).',
            C: 'Complète ses relevés ou son schéma après un rappel ponctuel; certains éléments restent à préciser.',
            D: 'A besoin que l’adulte modèle et structure la consignation de ses observations et de ses mesures.',
            E: 'Consigne ses observations seulement avec un gabarit préparé et un soutien constant.'
          }, { formativeOnly: true })
        ]
      },
      {
        id: 'sciences_outils',
        group: 'sciences', groupLabel: 'Sciences', singleResult: true, bulletinLabel: 'Science et technologie', partLabel: 'Outils et procédés (C2)',
        shortName: 'Sciences • Outils (C2)',
        fullName: 'Science et technologie — C2 : Mettre à profit les outils, objets et procédés',
        imageUrl: 'https://images.unsplash.com/photo-1581093458791-9d15482442f6?auto=format&fit=crop&w=960&q=70',
        icon: 'ST2',
        refUrl: 'https://cdn-contenu.quebec.ca/cdn-contenu/education/pfeq/cadres-evaluation/primaire/francais/PFEQ-cadre-evaluation-science-technologie-primaire.pdf',
        cssmbUrl: 'https://sre.servicescsmb.com/disciplines/',
        criteria: [
          observableCriterion('sci2_demarche', '1. Mise en œuvre d’une démarche appropriée', {
            A: 'Planifie seul ses étapes, les réalise avec rigueur et s’ajuste au besoin en cours de route.',
            B: 'Suit seul une démarche appropriée, ajuste une étape lorsque la situation l’exige et note ses actions.',
            C: 'Réalise l’essentiel de la démarche à l’aide de son protocole ou sur relance; saute parfois une étape.',
            D: 'A besoin d’un guidage direct de l’adulte à chaque étape de la réalisation.',
            E: 'Met en œuvre la démarche seulement avec un soutien constant et un protocole illustré.'
          }),
          observableCriterion('sci2_outils', '2. Utilisation d’instruments, d’outils ou de techniques', {
            A: 'Choisit et manipule avec précision les instruments appropriés (ex. cylindre gradué, balance) en respectant toujours la sécurité.',
            B: 'Utilise de façon appropriée et sécuritaire les outils enseignés, avec de rares maladresses de manipulation.',
            C: 'Manipule correctement le matériel essentiel après un rappel de l’adulte sur la technique ou la sécurité.',
            D: 'Manipule le matériel avec le modelage et la supervision directe constante de l’adulte.',
            E: 'Manipule les outils seulement avec la démonstration et la supervision constante de l’adulte.'
          }),
          observableCriterion('sci2_connaissances', '3. Maîtrise des connaissances (objets, procédés, systèmes)', {
            A: 'Explique avec justesse le fonctionnement d’un objet ou d’un procédé en utilisant les termes précis.',
            B: 'Décrit et applique correctement les notions étudiées sur l’objet ou le procédé à l’étude.',
            C: 'Nomme les notions essentielles, seul ou avec son aide-mémoire; certaines explications restent partielles ou imprécises.',
            D: 'Rappelle quelques notions à l’aide d’exemples concrets et du guidage de l’adulte.',
            E: 'Mobilise les connaissances étudiées seulement avec des supports variés et un soutien constant.'
          }),
          observableCriterion('sci2_precision', '4. Consignation des observations et des mesures (*)', {
            A: 'Consigne avec précision ses mesures et leurs unités, et vérifie la fiabilité de ses relevés.',
            B: 'Consigne fidèlement ses observations et ses mesures dans sa fiche, avec les unités appropriées.',
            C: 'Complète ses relevés après un rappel ponctuel de l’adulte; quelques mesures ou unités manquent.',
            D: 'A besoin que l’adulte structure et guide la prise de notes de ses observations.',
            E: 'Consigne ses données seulement avec un gabarit préparé et un soutien constant.'
          }, { formativeOnly: true })
        ]
      },
      {
        id: 'sciences_comm',
        group: 'sciences', groupLabel: 'Sciences', singleResult: true, bulletinLabel: 'Science et technologie', partLabel: 'Communiquer (C3)',
        shortName: 'Sciences • Communiquer (C3)',
        fullName: 'Science et technologie — C3 : Communiquer à l’aide des langages utilisés en science et technologie',
        imageUrl: 'https://images.unsplash.com/photo-1507413245164-6160d8298b31?auto=format&fit=crop&w=960&q=70',
        icon: 'ST3',
        refUrl: 'https://cdn-contenu.quebec.ca/cdn-contenu/education/pfeq/cadres-evaluation/primaire/francais/PFEQ-cadre-evaluation-science-technologie-primaire.pdf',
        cssmbUrl: 'https://sre.servicescsmb.com/disciplines/',
        criteria: [
          observableCriterion('sci3_explic', '1. Production d’explications ou de solutions', {
            A: 'Produit une explication complète et cohérente, appuyée sur ses résultats et sur des notions étudiées.',
            B: 'Formule seul une explication ou une solution claire, liée à ses observations et à ses résultats.',
            C: 'Formule une explication simple et pertinente, seul ou après relance, avec quelques éléments manquants.',
            D: 'Formule une explication seulement avec un guidage pas à pas de l’adulte.',
            E: 'Produit une explication seulement avec un soutien constant et des questions très ciblées.'
          }),
          observableCriterion('sci3_terminologie', '2. Utilisation de la terminologie et des conventions', {
            A: 'Emploie avec précision les termes scientifiques, les unités et les symboles étudiés (ex. g, mL, °C).',
            B: 'Utilise adéquatement les termes scientifiques et les conventions étudiés en classe, avec de rares imprécisions.',
            C: 'Utilise les termes de base; précise un mot ou une unité à l’aide de son lexique.',
            D: 'A besoin que l’adulte nomme et modélise les termes et les unités à utiliser.',
            E: 'Emploie la terminologie seulement avec le lexique, le modelage et un soutien constant.'
          }),
          observableCriterion('sci3_connaissances', '3. Utilisation des connaissances scientifiques et technologiques', {
            A: 'Intègre avec justesse plusieurs notions étudiées pour expliquer un phénomène observé et en prévoir les effets.',
            B: 'Utilise correctement les notions étudiées pour appuyer son explication à l’oral ou à l’écrit.',
            C: 'Utilise une notion pertinente après une question ciblée de l’adulte; les autres liens restent à établir.',
            D: 'Relie ses propos aux notions étudiées seulement avec un guidage direct de l’adulte.',
            E: 'Utilise les notions étudiées seulement avec un soutien constant et des questions très ciblées.'
          }),
          observableCriterion('sci3_representation', '4. Modes de représentation : schémas, tableaux, graphiques (*)', {
            A: 'Construit seul des schémas, tableaux ou graphiques clairs et normalisés (titre, légende, unités, échelle exacte).',
            B: 'Utilise efficacement le schéma ou le tableau enseigné pour présenter ses résultats de façon lisible.',
            C: 'Complète son schéma ou son tableau après un rappel ponctuel; oublie parfois le titre ou la légende.',
            D: 'A besoin que l’adulte modèle la construction du schéma ou du tableau.',
            E: 'Représente ses résultats seulement avec un gabarit préparé et un soutien constant.'
          }, { formativeOnly: true })
        ]
      }
    );
