    (function () {
      function criterion(id, title, A, B, C, D, E, formativeOnly = false) {
        return observableCriterion(id, title, { A, B, C, D, E }, { formativeOnly });
      }

      function epsRubrics(cycle, comp) {
        const cycleWords = {
          1: {
            action: 'des actions motrices connues',
            plan: 'un court plan illustré ou une suite simple d’actions',
            adjust: 'ajuste un geste après une démonstration ou une relance',
            cooperation: 'de petits jeux de groupe avec des règles simples',
            life: 'des habitudes quotidiennes simples liées au mouvement, au repos et à une alimentation équilibrée'
          },
          2: {
            action: 'des actions motrices et des principes d’action étudiés',
            plan: 'un plan d’action cohérent comprenant les principales actions et la sécurité',
            adjust: 'ajuste ses actions et sa stratégie pendant l’activité',
            cooperation: 'des jeux et activités collectives comportant des rôles et des stratégies',
            life: 'des habitudes de vie favorisant la pratique régulière d’activités physiques'
          },
          3: {
            action: 'des actions motrices variées et les principes d’action pertinents',
            plan: 'un plan d’action précis qui tient compte des contraintes, de la sécurité et des possibilités',
            adjust: 'analyse l’effet de ses choix et ajuste de façon autonome son action ou son plan',
            cooperation: 'des activités collectives complexes exigeant rôles, tactique et communication',
            life: 'un plan personnel de pratique régulière, sécuritaire et réaliste d’activité physique'
          }
        }[cycle];
        const pad = comp === 'c1' ? 'eps1' : comp === 'c2' ? 'eps2' : 'eps3';
        if (comp === 'c1') {
          return [
            criterion(`${pad}_connaissances`, '1. Connaissances liées aux actions motrices et à la sécurité',
              `Mobilise avec justesse ${cycleWords.action} et explique les règles de sécurité qui guident l’action.`,
              `Mobilise correctement ${cycleWords.action} et applique les principales règles de sécurité.`,
              `Mobilise l’essentiel des actions et règles de sécurité attendues, avec quelques imprécisions ou rappels.`,
              `Mobilise des actions connues et les règles de sécurité seulement avec un guidage fréquent.`,
              `Montre une mobilisation très partielle des actions ou des règles malgré une aide constante.`),
            criterion(`${pad}_planification`, '2. Cohérence de la planification des actions',
              `Construit ${cycleWords.plan}; les actions s’enchaînent avec pertinence et anticipent les difficultés.`,
              `Organise ${cycleWords.plan} de façon cohérente avec la situation et les consignes.`,
              `Prévoit les actions essentielles; quelques choix manquent de précision ou nécessitent un rappel.`,
              `Planifie seulement avec des choix proposés, un modèle ou un guidage direct.`,
              `Élabore une planification très partielle seulement avec un accompagnement constant.`),
            criterion(`${pad}_execution`, '3. Exécution efficace et ajustement des actions',
              `Exécute les actions avec contrôle, efficacité et persévérance; ${cycleWords.adjust}.`,
              `Exécute les actions avec assurance; apporte les ajustements attendus dans l’activité.`,
              `Réalise l’essentiel des actions; les ajustements demeurent occasionnels ou dépendent de rappels.`,
              `Réalise les actions avec difficulté et a besoin de guidage pour s’ajuster.`,
              `Réalise seulement une partie des actions avec une démonstration ou une aide soutenue.`),
            criterion(`${pad}_retour`, '4. Retour réflexif sur l’efficacité des actions (*)',
              'Explique clairement un ajustement utile, le justifie par ses essais et choisit une prochaine piste réaliste.',
              'Repère une réussite et un élément à améliorer, puis nomme un ajustement pertinent.',
              'Décrit une réussite ou une difficulté après une question de rappel.',
              'Décrit sa démarche seulement à partir de questions dirigées ou d’indices.',
              'Exprime un retour très limité malgré le questionnement et les repères proposés.', true)
          ];
        }
        if (comp === 'c2') {
          return [
            criterion(`${pad}_connaissances`, '1. Connaissances des principes de coopération et des règles',
              `Mobilise avec justesse les principes de communication, de synchronisation et d’éthique dans ${cycleWords.cooperation}.`,
              `Applique correctement les règles, les rôles et les moyens de communication à ${cycleWords.cooperation}.`,
              `Applique l’essentiel des règles et des rôles, avec quelques oublis ou rappels.`,
              `Applique les règles et coopère seulement avec un guidage fréquent de l’adulte ou des pairs.`,
              `Mobilise très partiellement les règles de coopération malgré un soutien constant.`),
            criterion(`${pad}_planification`, '2. Cohérence des stratégies de coopération',
              `Prévoit des rôles, une stratégie et des règles de sécurité adaptés; les choix contribuent clairement au but collectif.`,
              `Organise avec ses partenaires des actions ou des rôles cohérents et une stratégie sécuritaire.`,
              `Choisit les actions et rôles essentiels; la coordination demeure à préciser.`,
              `Choisit une stratégie seulement avec des choix proposés ou l’intervention fréquente de l’enseignant.`,
              `Participe au plan de coopération de façon très partielle même avec un accompagnement constant.`),
            criterion(`${pad}_execution`, '3. Exécution des actions et interaction avec les partenaires',
              `Participe activement, communique avec efficacité, se synchronise et respecte l’éthique dans les changements de situation.`,
              `Réalise son rôle, communique avec ses partenaires et ajuste ses actions à leurs réactions.`,
              `Réalise l’essentiel de son rôle et respecte les règles; les ajustements sont irréguliers.`,
              `Interagit avec difficulté et nécessite des rappels réguliers pour communiquer, attendre son tour ou s’ajuster.`,
              `Participe seulement avec un soutien constant et des consignes très ciblées.`),
            criterion(`${pad}_retour`, '4. Retour sur la coopération et la conduite éthique (*)',
              'Analyse l’effet de ses choix sur le groupe, justifie un ajustement et propose une façon concrète de soutenir l’équipe.',
              'Nomme une réussite collective, une difficulté et une action possible pour améliorer la coopération.',
              'Exprime un constat simple sur la coopération après une question ciblée.',
              'Décrit les interactions seulement avec des questions ou des choix guidés.',
              'Fournit un retour très limité malgré les exemples et le soutien constant.', true)
          ];
        }
        return [
          criterion(`${pad}_connaissances`, '1. Connaissances favorisant un mode de vie sain et actif',
            `Mobilise avec justesse les connaissances sur ${cycleWords.life} et les relie à ses besoins.`,
            `Utilise correctement les principales connaissances sur l’activité physique, la sécurité et les habitudes de vie.`,
            `Utilise l’essentiel des connaissances attendues, avec quelques imprécisions ou rappels.`,
            `Reconnaît quelques connaissances favorables à la santé seulement avec un guidage fréquent.`,
            `Mobilise ces connaissances de façon très partielle malgré une aide constante.`),
          criterion(`${pad}_planification`, '2. Cohérence du plan de pratique régulière',
            `Élabore ${cycleWords.life}; le plan est sécuritaire, varié, réaliste et précisément lié aux objectifs.`,
            `Propose un plan de pratique cohérent, réalisable et respectueux des règles de sécurité.`,
            `Propose les éléments essentiels d’un plan; certains moyens ou repères restent généraux.`,
            `Construit un plan seulement à partir d’un modèle, de choix ou d’un guidage direct.`,
            `Formule un plan très partiel seulement avec un soutien constant.`),
          criterion(`${pad}_execution`, '3. Mise en œuvre et régularité des habitudes actives',
            'Met en œuvre ses moyens, respecte la sécurité, poursuit régulièrement sa pratique et ajuste le plan de façon pertinente.',
            'Applique le plan de pratique, choisit des activités appropriées et maintient des habitudes sécuritaires.',
            'Applique l’essentiel du plan; la régularité ou les ajustements nécessitent occasionnellement un rappel.',
            'Met en œuvre des habitudes actives seulement avec un suivi et des rappels fréquents.',
            'Met en œuvre très partiellement le plan malgré un accompagnement constant.'),
          criterion(`${pad}_retour`, '4. Retour sur le plan et les habitudes de vie (*)',
            'Analyse la faisabilité et les effets de son plan, puis choisit une adaptation précise et justifiée.',
            'Explique ce qui a bien fonctionné, une difficulté rencontrée et un ajustement réaliste.',
            'Décrit une constatation simple sur le plan après une question de rappel.',
            'Évalue son plan seulement avec des questions dirigées et des exemples proposés.',
            'Fournit un retour très limité malgré le questionnement et les repères proposés.', true)
        ];
      }

      ['c1', 'c2', 'c3'].forEach(comp => {
        const id = `eps_${comp}`;
        const subject = ALL_SUBJECTS_CONFIG.find(item => item.id === id);
        subject.criteria = epsRubrics(3, comp);
        CYCLE_OBSERVABLE_RUBRICS[1][id] = epsRubrics(1, comp);
        CYCLE_OBSERVABLE_RUBRICS[2][id] = epsRubrics(2, comp);
      });
    })();
