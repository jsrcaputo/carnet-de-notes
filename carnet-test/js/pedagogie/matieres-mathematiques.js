    ALL_SUBJECTS_CONFIG.push(
      {
        id: 'math_resoudre',
        group: 'maths', groupLabel: 'Mathématiques', partLabel: 'Résoudre (C1)',
        shortName: 'Mathématiques • Résoudre (C1)',
        fullName: 'Mathématiques — C1 : Résoudre une situation-problème',
        icon: 'M1',
        imageUrl: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=960&q=70',
        refUrl: 'https://cdn-contenu.quebec.ca/cdn-contenu/education/pfeq/cadres-evaluation/primaire/francais/PFEQ-cadre-evaluation-mathematique-primaire.pdf',
        cssmbUrl: 'https://sites.google.com/ggl.csmb.qc.ca/mathprimairecssmb',
        criteria: [
          observableCriterion('c1_comp', '1. Compréhension de la situation-problème', {
            A: 'Dégage seul toutes les données, même implicites, et respecte chaque contrainte de l’énoncé (ex. unités, nombre d’étapes).',
            B: 'Repère seul les données utiles à la résolution et respecte la plupart des contraintes de l’énoncé, sans relance.',
            C: 'Repère les données principales de l’énoncé; oublie une contrainte ou a besoin d’une relance ponctuelle pour la corriger.',
            D: 'Repère quelques données pertinentes de l’énoncé lorsque l’adulte le guide étape par étape.',
            E: 'Confond encore données et question, même avec un soutien constant de l’adulte et du matériel.'
          }),
          observableCriterion('c1_mob', '2. Mobilisation des concepts et processus requis', {
            A: 'Combine avec exactitude plusieurs concepts et opérations du 3e cycle pour résoudre la situation, sans erreur de calcul.',
            B: 'Choisit et applique seul les concepts et opérations requis; commet de rares erreurs mineures de calcul.',
            C: 'Mobilise les opérations essentielles; commet quelques erreurs ou consulte un aide-mémoire pour choisir ou appliquer le processus.',
            D: 'Applique quelques opérations simples lorsque l’adulte le guide directement à chaque étape du travail.',
            E: 'Choisit des opérations inappropriées, même avec le matériel de manipulation et le soutien de l’adulte.'
          }),
          observableCriterion('c1_traces', '3. Explicitation des éléments pertinents de la solution', {
            A: 'Présente une démarche complète, titrée et structurée, avec calculs, unités et phrase-réponse, lisible par un tiers.',
            B: 'Laisse des traces claires et ordonnées qui montrent toutes les étapes principales de sa démarche.',
            C: 'Laisse des traces partielles (étapes manquantes ou désordonnées), mais on peut suivre l’essentiel de la démarche.',
            D: 'Laisse des traces confuses ou incomplètes; l’adulte l’aide à les structurer étape par étape.',
            E: 'Laisse très peu de traces interprétables, même avec un canevas de réponse déjà structuré.'
          }),
          observableCriterion('c1_valid', '4. Validation de la solution (*)', {
            A: 'Vérifie spontanément la vraisemblance du résultat (ex. estimation, opération inverse) et se corrige seul au besoin.',
            B: 'Revoit ses calculs de lui-même et vérifie que sa réponse respecte les contraintes de l’énoncé.',
            C: 'Vérifie un calcul ou une contrainte après un rappel ponctuel de l’adulte ou de l’aide-mémoire.',
            D: 'Vérifie sa réponse seulement lorsque l’adulte l’y guide directement, question par question.',
            E: 'Amorce la vérification de sa réponse seulement avec un soutien constant et des outils de validation.'
          }, { formativeOnly: true })
        ]
      },
      {
        id: 'math_raisonner',
        group: 'maths', groupLabel: 'Mathématiques', partLabel: 'Raisonner (C2)',
        shortName: 'Mathématiques • Raisonner (C2)',
        fullName: 'Mathématiques — C2 : Raisonner à l’aide de concepts et de processus',
        icon: 'M2',
        imageUrl: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&w=960&q=70',
        refUrl: 'https://cdn-contenu.quebec.ca/cdn-contenu/education/pfeq/cadres-evaluation/primaire/francais/PFEQ-cadre-evaluation-mathematique-primaire.pdf',
        cssmbUrl: 'https://sites.google.com/ggl.csmb.qc.ca/mathprimairecssmb',
        criteria: [
          observableCriterion('c2_analyse', '1. Analyse adéquate de la situation d’application', {
            A: 'Cerne d’emblée toutes les relations entre les données et choisit les concepts les plus efficaces pour la situation.',
            B: 'Repère seul les éléments utiles de la situation et choisit les concepts mathématiques appropriés.',
            C: 'Cerne l’essentiel de la situation et choisit le bon concept, seul ou à l’aide d’un aide-mémoire.',
            D: 'Repère quelques éléments de la situation lorsque l’adulte le guide étape par étape.',
            E: 'Dégage les notions à mobiliser seulement avec un soutien constant, malgré les outils à sa disposition.'
          }),
          observableCriterion('c2_application', '2. Application adéquate des processus requis', {
            A: 'Exécute les calculs, mesures ou constructions avec exactitude et rigueur, en respectant les unités et les instruments.',
            B: 'Applique seul et correctement les processus requis; commet de rares erreurs mineures sans effet sur le résultat.',
            C: 'Applique l’essentiel des processus; commet quelques erreurs ou consulte un aide-mémoire pour exécuter une étape.',
            D: 'Exécute une partie des processus lorsque l’adulte le guide directement à chaque étape.',
            E: 'Applique les processus requis seulement avec le matériel et l’aide directe de l’adulte à chaque étape.'
          }),
          observableCriterion('c2_justif', '3. Justification d’actions ou d’énoncés', {
            A: 'Justifie avec rigueur ses actions par des arguments, propriétés ou calculs précis (ex. « car les angles sont supplémentaires »).',
            B: 'Appuie sa réponse sur des traces claires et des arguments pertinents liés à la situation.',
            C: 'Donne une justification partielle ou simple, seul ou après une relance de l’adulte.',
            D: 'Énonce une réponse sans preuve; fournit une justification seulement avec un guidage direct.',
            E: 'Justifie son choix seulement par des questions ciblées, malgré un soutien constant de l’adulte.'
          }),
          observableCriterion('c2_communication', '4. Communication à l’aide du langage mathématique (*)', {
            A: 'Utilise avec rigueur le vocabulaire, les symboles et les notations du 3e cycle (ex. =, <, cm², fractions).',
            B: 'Emploie adéquatement le vocabulaire et les symboles mathématiques, avec de rares imprécisions de notation.',
            C: 'Utilise les termes de base; précise un symbole ou un terme à l’aide d’un lexique.',
            D: 'Confond certains termes et symboles; l’adulte doit modéliser le langage mathématique juste.',
            E: 'Utilise le langage mathématique seulement en répétant le modèle de l’adulte, même avec les supports.'
          }, { formativeOnly: true })
        ]
      }
    );
