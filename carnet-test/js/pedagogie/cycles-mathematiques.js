    CYCLE_OBSERVABLE_RUBRICS[1].math_resoudre = [
          observableCriterion('c1_comp', '1. Compréhension de la situation-problème', {
            A: 'Dégage seul la question et toutes les données utiles, sans se laisser distraire par les détails superflus (ex. : les souligne).',
            B: 'Repère seul la question et les données utiles d’une situation familière, en les nommant ou en les encerclant.',
            C: 'Repère la question et les données principales après une relecture ou une relance, mais oublie parfois une donnée utile.',
            D: 'Repère quelques données seulement quand l’adulte relit l’énoncé et le guide étape par étape.',
            E: 'Confond les données et la question malgré la lecture de l’énoncé et un soutien constant de l’adulte.'
          }),
          observableCriterion('c1_mob', '2. Mobilisation des concepts et processus requis', {
            A: 'Choisit et applique avec exactitude les concepts et les opérations (+, -) du 1er cycle, sans erreur de calcul ni oubli.',
            B: 'Choisit et applique seul les opérations ou les dessins requis, avec de rares erreurs mineures qu’il corrige facilement.',
            C: 'Applique une stratégie connue (dessin, calcul) avec quelques erreurs de calcul, ou en consultant son aide-mémoire.',
            D: 'Applique une opération ou un dénombrement seulement avec un guidage direct de l’adulte à chaque étape.',
            E: 'Choisit une démarche inappropriée malgré le matériel de manipulation et le soutien constant de l’adulte.'
          }),
          observableCriterion('c1_traces', '3. Explicitation des éléments pertinents de la solution', {
            A: 'Présente une démarche complète et structurée : dessins organisés, opération écrite et réponse clairement formulée avec l’unité.',
            B: 'Laisse des traces claires et ordonnées (dessins, nombres) qui montrent comment il a trouvé sa réponse.',
            C: 'Laisse des traces partielles (dessin sans opération, par exemple) qui permettent tout de même de suivre l’essentiel de sa démarche.',
            D: 'Laisse des traces confuses ou incomplètes; l’adulte doit le guider pour les ordonner.',
            E: 'Laisse très peu de traces interprétables malgré un canevas illustré qui structure sa feuille.'
          }),
          observableCriterion('c1_valid', '4. Validation de la solution (*)', {
            A: 'Vérifie spontanément son résultat avec son matériel (jetons, droite numérique) et se corrige seul au besoin.',
            B: 'Revoit son dénombrement ou son calcul à la fin de la tâche et corrige parfois une erreur.',
            C: 'Vérifie son résultat après un rappel ponctuel de l’enseignant (« Peux-tu vérifier ? »).',
            D: 'Vérifie sa réponse seulement quand l’adulte le guide directement, étape par étape.',
            E: 'Vérifie très difficilement sa réponse malgré le matériel et un soutien constant de l’adulte.'
          }, { formativeOnly: true })
    ];
    CYCLE_OBSERVABLE_RUBRICS[1].math_raisonner = [
          observableCriterion('c2_analyse', '1. Analyse adéquate de la situation d’application', {
            A: 'Cerne d’emblée les nombres, les figures ou les mesures utiles et explique seul ce qu’il doit faire.',
            B: 'Repère seul les éléments utiles et choisit la bonne action mathématique (ajouter, retirer, comparer, regrouper).',
            C: 'Cerne l’essentiel et choisit la bonne notion, seul ou en s’aidant de son aide-mémoire.',
            D: 'Repère quelques éléments utiles seulement avec un guidage étape par étape de l’adulte.',
            E: 'Dégage très difficilement les notions à utiliser malgré le soutien et le matériel offert.'
          }),
          observableCriterion('c2_application', '2. Application adéquate des processus requis', {
            A: 'Exécute les dénombrements, les opérations ou les classements avec exactitude, sans erreur ni besoin de matériel.',
            B: 'Applique seul et correctement les notions du 1er cycle, avec de rares erreurs mineures qu’il peut corriger.',
            C: 'Applique l’essentiel des notions, avec quelques erreurs ou en s’aidant du matériel de manipulation.',
            D: 'Exécute une partie de la tâche seulement, avec un guidage direct de l’adulte.',
            E: 'Applique très difficilement les notions de base malgré le matériel et le soutien de l’adulte.'
          }),
          observableCriterion('c2_justif', '3. Justification d’actions ou d’énoncés', {
            A: 'Justifie clairement son choix avec les mots justes ou un dessin précis (ex. : « J’ai ajouté parce que… »).',
            B: 'Appuie seul sa réponse sur une raison simple ou sur une trace claire (dessin, calcul).',
            C: 'Donne une raison simple, oralement ou par un dessin, seul ou après une relance de l’enseignant.',
            D: 'Énonce une réponse sans la justifier; l’adulte doit le guider directement pour obtenir une raison.',
            E: 'Justifie très difficilement son choix malgré un soutien constant et des exemples modelés.'
          }),
          observableCriterion('c2_communication', '4. Communication à l’aide du langage mathématique (*)', {
            A: 'Utilise avec justesse le vocabulaire (dizaine, unité) et les symboles (+, -, =) en expliquant ou en écrivant sa démarche.',
            B: 'Emploie correctement les mots et les symboles mathématiques travaillés en classe, à l’oral et à l’écrit.',
            C: 'Utilise les termes de base; précise un mot ou un symbole en consultant les affiches de la classe.',
            D: 'Confond certains termes et symboles; l’adulte doit modeler le mot ou le symbole juste.',
            E: 'Utilise très difficilement le langage mathématique malgré les imagiers et le modelage de l’adulte.'
          }, { formativeOnly: true })
    ];
    CYCLE_OBSERVABLE_RUBRICS[2].math_resoudre = [
          observableCriterion('c1_comp', '1. Compréhension de la situation-problème', {
            A: 'Dégage seul toutes les données utiles, écarte les données inutiles et respecte chaque contrainte de l’énoncé (ex. : surligne, barre, reformule).',
            B: 'Repère seul les données utiles et respecte la plupart des contraintes; peut laisser passer une donnée inutile.',
            C: 'Repère les données principales; oublie une contrainte ou a besoin d’une relance ponctuelle pour la retrouver.',
            D: 'Repère quelques données utiles lorsque l’adulte guide la lecture de l’énoncé étape par étape.',
            E: 'Distingue difficilement les données de la question, même avec l’aide de l’adulte et du matériel à chaque étape.'
          }),
          observableCriterion('c1_mob', '2. Mobilisation des concepts et processus requis', {
            A: 'Combine avec exactitude les concepts et les opérations du 2e cycle, sans erreur, et choisit seul la façon la plus efficace.',
            B: 'Choisit et applique seul les opérations requises; commet de rares erreurs mineures de calcul qu’il peut expliquer.',
            C: 'Mobilise les opérations essentielles; commet quelques erreurs de calcul ou consulte son aide-mémoire pour poursuivre.',
            D: 'Applique quelques opérations lorsque l’adulte l’oriente directement à chaque étape de la résolution.',
            E: 'Choisit des opérations peu adaptées au problème, même avec le matériel de manipulation et le soutien de l’adulte.'
          }),
          observableCriterion('c1_traces', '3. Explicitation des éléments pertinents de la solution', {
            A: 'Présente une démarche complète, titrée et organisée (schéma, calculs, phrase-réponse) qu’un camarade peut suivre sans explication.',
            B: 'Laisse des traces claires et ordonnées qui montrent toutes les étapes principales de sa démarche.',
            C: 'Laisse des traces partielles qui permettent tout de même de suivre l’essentiel de sa démarche.',
            D: 'Laisse des traces confuses ou incomplètes; l’adulte l’aide à les organiser étape par étape.',
            E: 'Laisse très peu de traces compréhensibles, même avec un canevas structuré fourni par l’adulte.'
          }),
          observableCriterion('c1_valid', '4. Validation de la solution (*)', {
            A: 'Vérifie spontanément chaque contrainte, compare sa réponse à la question posée et corrige seul ses erreurs.',
            B: 'Refait ses calculs et vérifie que sa réponse est plausible (ex. : estimation, opération inverse).',
            C: 'Vérifie un calcul ou une contrainte après un rappel ponctuel de l’adulte.',
            D: 'Vérifie sa réponse seulement lorsque l’adulte pose des questions directes à chaque étape.',
            E: 'Vérifie sa réponse avec peine, même avec le soutien constant de l’adulte et une liste de vérification.'
          }, { formativeOnly: true })
    ];
    CYCLE_OBSERVABLE_RUBRICS[2].math_raisonner = [
          observableCriterion('c2_analyse', '1. Analyse adéquate de la situation d’application', {
            A: 'Cerne d’emblée les données et les conditions, puis choisit seul le concept le plus efficace pour résoudre la situation.',
            B: 'Repère seul les éléments utiles de la situation et choisit des concepts appropriés au 2e cycle.',
            C: 'Cerne l’essentiel de la situation et choisit le bon concept, seul ou avec son aide-mémoire.',
            D: 'Repère quelques éléments utiles de la situation lorsque l’adulte le guide étape par étape.',
            E: 'Dégage avec peine les notions à utiliser, même avec le soutien de l’adulte et du matériel.'
          }),
          observableCriterion('c2_application', '2. Application adéquate des processus requis', {
            A: 'Exécute les calculs, les mesures ou les constructions avec exactitude et rigueur (ex. : utilise bien la règle et le rapporteur).',
            B: 'Applique seul et correctement les processus du 2e cycle; commet de rares erreurs mineures qu’il corrige.',
            C: 'Applique l’essentiel des processus; commet quelques erreurs ou consulte son aide-mémoire pour poursuivre.',
            D: 'Exécute une partie des processus lorsque l’adulte le guide directement à chaque étape.',
            E: 'Applique avec peine les processus requis, même avec les outils et le modelage de l’adulte.'
          }),
          observableCriterion('c2_justif', '3. Justification d’actions ou d’énoncés', {
            A: 'Justifie clairement ses choix à l’aide de propriétés, de calculs ou de schémas (ex. : « J’ai additionné parce que… »).',
            B: 'Appuie sa réponse sur des traces claires et donne une explication pertinente liée à sa démarche.',
            C: 'Donne une justification simple ou partielle, seul ou après une relance de l’adulte.',
            D: 'Énonce une réponse sans preuve; l’adulte le guide directement pour qu’il explique sa démarche.',
            E: 'Justifie avec peine son choix, même avec le soutien constant de l’adulte et des pistes écrites.'
          }),
          observableCriterion('c2_communication', '4. Communication à l’aide du langage mathématique (*)', {
            A: 'Utilise avec justesse le vocabulaire, les symboles et les diagrammes du 2e cycle (ex. : =, ≠, <, >, tableaux, droite numérique).',
            B: 'Emploie adéquatement le vocabulaire et les symboles mathématiques étudiés, avec de rares oublis.',
            C: 'Utilise les termes de base; précise un symbole ou un mot en consultant son lexique.',
            D: 'Confond certains termes et symboles; l’adulte modèle la formulation juste à voix haute.',
            E: 'Utilise avec peine le langage mathématique, même avec le lexique et le modelage de l’adulte.'
          }, { formativeOnly: true })
    ];
