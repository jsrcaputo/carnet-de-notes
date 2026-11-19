    (function () {
      function criterion(id, title, A, B, C, D, E, formativeOnly = false) {
        return observableCriterion(id, title, { A, B, C, D, E }, { formativeOnly });
      }

      function cycle1Listening() {
        return [
          criterion('eng_liste_signes', '1. Signes de compréhension des éléments essentiels',
            'Démontre avec constance sa compréhension des personnes, actions et événements importants par des gestes, choix et réponses pertinents.',
            'Démontre une compréhension juste des principaux éléments des textes entendus.',
            'Repère les éléments essentiels avec quelques gestes, images ou rappels du contexte.',
            'Manifeste une compréhension partielle et a besoin de répétitions ou de choix guidés.',
            'Démontre très peu de compréhension, même avec répétitions, gestes et choix ciblés.'),
          criterion('eng_liste_reinvestment', '2. Représentation et retour sur les passages entendus',
            'Associe avec précision plusieurs éléments, replace les événements dans l’ordre et réagit de façon appropriée.',
            'Replace les événements importants ou répond à partir des passages entendus de façon généralement exacte.',
            'Retrouve une partie des événements et réagit adéquatement après une relance.',
            'Raconte ou réagit seulement avec des images, des mots proposés et un questionnement direct.',
            'Retrouve très difficilement les éléments entendus malgré les images et le soutien constant.'),
          criterion('eng_liste_passages', '3. Repérage de mots et passages récurrents',
            'Anticipe, reconnaît et réutilise avec aisance des mots et passages récurrents entendus.',
            'Reconnaît les mots et passages familiers récurrents dans différents courts textes.',
            'Reconnaît quelques mots et passages récurrents avec un rappel du contexte.',
            'Reconnaît les éléments seulement après répétition et modelage.',
            'Reconnaît très peu de mots ou passages malgré la répétition et les repères visuels.'),
          criterion('eng_liste_strategies', '4. Utilisation de stratégies de compréhension (*)',
            'Choisit et combine spontanément gestes, images, contexte et répétition pour comprendre et vérifier.',
            'Utilise de façon efficace une ou plusieurs stratégies de compréhension enseignées.',
            'Utilise une stratégie connue sur rappel ponctuel.',
            'Utilise une stratégie seulement après modelage et questionnement.',
            'Mobilise très difficilement une stratégie malgré l’accompagnement constant.', true)
        ];
      }

      function cycle1Speaking() {
        return [
          criterion('eng_parler_comprehension', '1. Compréhension des messages et réactions appropriées',
            'Comprend rapidement les messages familiers et y répond de façon pertinente, avec des formulations variées.',
            'Comprend les messages habituels et réagit de façon adéquate dans l’échange.',
            'Comprend l’essentiel et réagit avec une expression ou une reformulation courante.',
            'Réagit seulement lorsque le message est répété, reformulé ou accompagné de gestes.',
            'Réagit très partiellement même avec répétition, gestes et formulations proposées.'),
          criterion('eng_parler_fonctionnel', '2. Utilisation de mots et d’expressions fonctionnelles',
            'Utilise spontanément et avec précision plusieurs mots et expressions fonctionnelles pour amorcer, poursuivre et conclure.',
            'Utilise correctement les expressions fonctionnelles travaillées pour communiquer son intention.',
            'Utilise les expressions essentielles, avec quelques hésitations ou simplifications.',
            'Utilise quelques mots seulement avec des amorces ou un modèle à proximité.',
            'Reprend très difficilement les mots ou expressions malgré les modèles proposés.'),
          criterion('eng_parler_participation', '3. Participation à une courte interaction',
            'Participe activement à l’interaction, respecte les tours et maintient l’échange avec persévérance.',
            'Amorce ou poursuit l’échange et intervient suffisamment pour être compris.',
            'Participe lorsque l’interlocuteur lance l’échange ou fournit un repère.',
            'Participe seulement après invitations répétées et interventions guidées.',
            'Participe très peu même avec des invitations constantes et un partenaire soutenant.'),
          criterion('eng_parler_strategies', '4. Stratégies de communication et de dépannage (*)',
            'Utilise avec souplesse reformulation, gestes, demandes de précision et reprise de modèles.',
            'Recourt efficacement aux stratégies enseignées pour faire comprendre son message.',
            'Utilise une stratégie connue après un rappel.',
            'Utilise une stratégie seulement après modelage de l’enseignant.',
            'Mobilise très difficilement une stratégie malgré un soutien constant.', true)
        ];
      }

      function interaction(cycle) {
        const advanced = cycle === 3;
        return [
          criterion('eng_inter_langue', '1. Utilisation fonctionnelle de la langue',
            `Mobilise avec précision et souplesse un large répertoire de formulations fonctionnelles${advanced ? ' adaptées à l’intention et à l’interlocuteur' : ''}.`,
            'Utilise de façon claire les mots et expressions fonctionnels travaillés pour transmettre son message.',
            'Utilise les formulations essentielles; des hésitations ou quelques erreurs n’empêchent pas la compréhension.',
            'Utilise une langue limitée et a besoin d’amorces, de modèles ou de reformulations fréquentes.',
            'Transmet très partiellement son message malgré les modèles et l’aide constante.'),
          criterion('eng_inter_participation', '2. Participation aux échanges',
            'Amorce, maintient et relance l’échange de façon autonome; tient compte des réactions de ses interlocuteurs.',
            'Participe activement, répond et pose des questions pertinentes en respectant les tours.',
            'Participe aux échanges avec quelques interventions pertinentes, surtout dans des situations familières.',
            'Participe seulement lorsqu’il est sollicité et avec un guidage fréquent.',
            'Participe très peu même avec des invitations, amorces et modèles constants.'),
          criterion('eng_inter_message', '3. Clarification et continuité du message',
            'Clarifie efficacement, utilise des stratégies variées et poursuit le message malgré les imprévus.',
            'Reformule ou précise son message lorsque nécessaire et maintient l’échange.',
            'Maintient l’essentiel du message, avec une aide ponctuelle pour clarifier une hésitation.',
            'Reformule seulement après une question précise ou un modèle.',
            'A beaucoup de difficulté à clarifier ou poursuivre son message malgré l’aide constante.'),
          criterion('eng_inter_strategies', '4. Stratégies de communication et de dépannage (*)',
            'Choisit de façon autonome reformulation, gestes, périphrases ou demandes de précision selon la difficulté.',
            'Utilise efficacement les stratégies enseignées pour comprendre ou se faire comprendre.',
            'Utilise une stratégie connue après un rappel.',
            'Utilise une stratégie seulement après modelage.',
            'Mobilise très difficilement une stratégie malgré un soutien constant.', true)
        ];
      }

      function reinvestment(cycle) {
        const advanced = cycle === 3;
        return [
          criterion('eng_reinvest_comprehension', '1. Compréhension des éléments essentiels des textes',
            `Dégage avec précision les éléments essentiels, leurs liens et ${advanced ? 'les idées implicites accessibles' : 'les informations utiles'} dans les textes lus et entendus.`,
            'Dégage correctement les éléments importants et les met en relation avec la tâche.',
            'Repère l’essentiel des textes, avec quelques confusions ou un retour ponctuel aux ressources.',
            'Repère quelques informations seulement avec des questions, images ou passages pointés.',
            'Repère très peu d’éléments pertinents malgré les répétitions et le soutien constant.'),
          criterion('eng_reinvest_information', '2. Sélection et organisation des informations pertinentes',
            'Sélectionne avec discernement les informations, les organise de façon cohérente et crée des liens personnels pertinents.',
            'Sélectionne les informations utiles et les organise pour répondre à la tâche.',
            'Utilise l’essentiel des informations pertinentes, mais la sélection ou l’organisation reste générale.',
            'Sélectionne des informations seulement avec une liste, un modèle ou un guidage fréquent.',
            'Réinvestit très partiellement les informations malgré un accompagnement constant.'),
          criterion('eng_reinvest_langue', '3. Réinvestissement dans une production pertinente',
            'Réutilise de façon autonome et créative les informations, structures et expressions étudiées pour réaliser une production soignée.',
            'Réutilise de façon appropriée les informations et la langue ciblée dans la tâche.',
            'Réutilise les éléments essentiels; la langue ou les liens demeurent parfois imprécis.',
            'Produit une réalisation partielle en s’appuyant sur un gabarit ou des formulations proposées.',
            'Réinvestit très difficilement les éléments attendus malgré les modèles et l’aide constante.'),
          criterion('eng_reinvest_strategies', '4. Stratégies de compréhension et de vérification (*)',
            'Anticipe, infère, vérifie et revise de façon autonome en retournant aux textes et aux ressources.',
            'Utilise efficacement les stratégies enseignées pour comprendre, sélectionner et vérifier.',
            'Utilise une stratégie après un rappel ou un repère.',
            'Utilise une stratégie seulement avec modelage ou questionnement direct.',
            'Mobilise très difficilement une stratégie malgré un soutien constant.', true)
        ];
      }

      function writing(cycle) {
        const advanced = cycle === 3;
        return [
          criterion('eng_ecr_langue', '1. Conventions linguistiques ciblées',
            `Applique avec constance les conventions linguistiques ciblées${advanced ? ' dans des structures variées' : ' dans les modèles étudiés'} et corrige la plupart de ses imprécisions.`,
            'Applique correctement les conventions ciblées; les rares erreurs ne nuisent pas à la compréhension.',
            'Applique l’essentiel des conventions attendues avec quelques erreurs.',
            'Applique les conventions seulement avec une liste, des exemples ou un guidage fréquent.',
            'Applique très partiellement les conventions malgré les modèles et l’aide constante.'),
          criterion('eng_ecr_caracteristiques', '2. Caractéristiques et organisation du texte',
            'Organise un texte complet, cohérent et personnalisé qui respecte toutes les caractéristiques du type de texte.',
            'Écrit un texte clair qui respecte les caractéristiques et les exigences principales de la tâche.',
            'Présente un texte compréhensible comportant les éléments essentiels attendus.',
            'Réalise un texte partiel dont l’organisation dépend d’un gabarit ou d’un modèle.',
            'Produit très peu de texte même avec un gabarit préparé et un soutien constant.'),
          criterion('eng_ecr_exigences', '3. Respect de l’intention et des exigences',
            'Traite l’intention avec précision, tient compte du destinataire et enrichit le message de détails pertinents.',
            'Répond à l’intention, au destinataire et aux principales exigences de la tâche.',
            'Traite l’essentiel de l’intention; quelques exigences ou détails restent à préciser.',
            'Répond à la tâche de façon partielle avec des questions de rappel.',
            'Démontre très partiellement la compréhension des exigences malgré l’accompagnement.'),
          criterion('eng_ecr_strategies', '4. Planification, vérification et révision (*)',
            'Planifie, utilise les ressources et révise de façon autonome plusieurs aspects de son texte.',
            'Utilise efficacement les stratégies de planification et de révision enseignées.',
            'Vérifie son texte à l’aide d’une liste ou après un rappel.',
            'Révise seulement après indication précise de l’enseignant.',
            'Mobilise très difficilement une stratégie de révision malgré un soutien constant.', true),
          criterion('eng_ecr_culture', '5. Liens avec les produits culturels et réflexion (*)',
            'Établit des liens précis avec des produits culturels étudiés et explique l’effet de ces découvertes sur son texte.',
            'Relie de façon pertinente son texte à un produit culturel ou à une découverte abordée en classe.',
            'Nomme un lien simple avec un produit culturel après une relance.',
            'Établit un lien seulement avec des exemples et un questionnement guidé.',
            'Exprime très difficilement un lien culturel malgré les repères proposés.', true)
        ];
      }

      CYCLE_OBSERVABLE_RUBRICS[1].eng_c1 = cycle1Listening();
      CYCLE_OBSERVABLE_RUBRICS[1].eng_c2 = cycle1Speaking();
      CYCLE_OBSERVABLE_RUBRICS[1].eng_c3 = [];
      CYCLE_OBSERVABLE_RUBRICS[2].eng_c1 = interaction(2);
      CYCLE_OBSERVABLE_RUBRICS[2].eng_c2 = reinvestment(2);
      CYCLE_OBSERVABLE_RUBRICS[2].eng_c3 = writing(2);
      const eng1 = ALL_SUBJECTS_CONFIG.find(subject => subject.id === 'eng_c1');
      const eng2 = ALL_SUBJECTS_CONFIG.find(subject => subject.id === 'eng_c2');
      const eng3 = ALL_SUBJECTS_CONFIG.find(subject => subject.id === 'eng_c3');
      eng1.criteria = interaction(3);
      eng2.criteria = reinvestment(3);
      eng3.criteria = writing(3);
    })();
