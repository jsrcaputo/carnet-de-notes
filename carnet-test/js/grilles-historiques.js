

    const LEGACY_FRENCH_RUBRICS = {};
    [1, 2, 3].forEach(cycle => {
      const rubrics = cycle === 3
        ? Object.fromEntries(ALL_SUBJECTS_CONFIG.filter(s => ['fra_lecture', 'fra_ecriture'].includes(s.id)).map(s => [s.id, s.criteria]))
        : CYCLE_OBSERVABLE_RUBRICS[cycle];
      const lecture = rubrics.fra_lecture;
      const ecriture = rubrics.fra_ecriture;
      LEGACY_FRENCH_RUBRICS[cycle] = { fra_lecture: lecture, fra_ecriture: ecriture };

      const revisedLecture = [
        lecture[0],
        lecture[1],
        observableCriterion('lec_reac', '3. Justification des réactions au texte', lv(
          'Explique ses réactions avec des liens précis et pertinents au texte ou à son expérience.',
          'Justifie sa réaction par un lien pertinent au texte ou à son expérience.',
          'Justifie sa réaction par une raison simple liée au texte ou à son expérience.',
          'Exprime une réaction, mais la raison donnée est peu liée au texte ou à son expérience.',
          'Exprime difficilement une réaction ou une raison qui lui est liée.')),
        observableCriterion('lec_jugement', '4. Jugement critique sur les textes littéraires', cycle === 1 ? lv(
          'Exprime clairement son opinion sur l’œuvre et précise ses premières impressions.',
          'Exprime son opinion sur l’œuvre à partir de ses premières impressions.',
          'Exprime une opinion simple sur l’œuvre.',
          'Exprime une opinion peu claire sur l’œuvre.',
          'Exprime difficilement une opinion sur l’œuvre.') : lv(
          'Formule une appréciation nuancée et l’appuie sur des caractéristiques pertinentes de l’œuvre.',
          'Formule une appréciation et l’appuie sur des caractéristiques pertinentes de l’œuvre.',
          'Exprime une appréciation simple liée à une caractéristique de l’œuvre.',
          'Exprime une appréciation dont le lien avec l’œuvre demeure peu clair.',
          'Exprime difficilement une appréciation liée à l’œuvre.')),
        { ...lecture[3], title: 'Recours à des stratégies appropriées (*)' }
      ];
      const revisedEcriture = [
        observableCriterion('ecr_adapt', '1. Adaptation à la situation d’écriture', lv(
          'Respecte avec précision le sujet et les éléments pertinents de la situation d’écriture.',
          'Respecte le sujet et les éléments pertinents de la situation d’écriture.',
          'Respecte généralement le sujet et les éléments essentiels de la situation d’écriture.',
          'Respecte partiellement le sujet ou les éléments essentiels de la situation d’écriture.',
          'Le texte est difficilement lié au sujet ou à la situation d’écriture.')),
        observableCriterion('ecr_coherence', '2. Cohérence du texte', lv(
          'Organise et relie les idées avec clarté et constance.',
          'Organise les idées dans un ordre logique et assure des liens compréhensibles.',
          'Présente des idées généralement compréhensibles malgré quelques ruptures.',
          'Présente des idées dont l’ordre ou les liens rendent le texte difficile à suivre.',
          'Les idées ou leur organisation rendent le texte très difficile à comprendre.'), { formativeOnly: cycle === 1 }),
        observableCriterion('ecr_vocab', '3. Utilisation d’un vocabulaire approprié', lv(
          'Choisit des mots précis et variés qui servent bien le sens du texte.',
          'Choisit des mots appropriés au sujet et au sens du texte.',
          'Utilise des mots généralement appropriés, malgré quelques imprécisions.',
          'Utilise plusieurs mots imprécis ou peu appropriés au sens recherché.',
          'Les mots choisis rendent souvent le sens difficile à comprendre.'), { formativeOnly: cycle === 1 }),
        observableCriterion('ecr_syntaxe', '4. Construction des phrases et ponctuation', lv(
          'Construit et ponctue ses phrases avec précision selon les apprentissages visés.',
          'Construit et ponctue correctement la plupart de ses phrases.',
          'Construit des phrases généralement compréhensibles malgré certaines erreurs.',
          'Plusieurs erreurs de construction ou de ponctuation nuisent à la compréhension.',
          'Les erreurs de construction ou de ponctuation rendent le texte très difficile à comprendre.')),
        observableCriterion('ecr_ortho', '5. Orthographe d’usage et orthographe grammaticale', lv(
          'Respecte avec précision les conventions orthographiques étudiées.',
          'Respecte la plupart des conventions orthographiques étudiées.',
          'Respecte les conventions essentielles étudiées malgré certaines erreurs.',
          'Commet des erreurs fréquentes dans les conventions étudiées.',
          'Respecte rarement les conventions orthographiques étudiées.')),
        observableCriterion('ecr_presentation', 'Qualité de la présentation (*)', lv(
          'Présente un texte très lisible et soigneusement organisé.',
          'Présente un texte lisible et soigné.',
          'Présente un texte généralement lisible.',
          'La présentation nuit parfois à la lisibilité.',
          'La présentation rend le texte très difficile à lire.'), { formativeOnly: true }),
        observableCriterion('ecr_strategies', 'Recours à des stratégies appropriées (*)', lv(
          'Choisit et ajuste efficacement les stratégies d’écriture étudiées.',
          'Utilise efficacement les stratégies d’écriture étudiées.',
          'Utilise certaines stratégies d’écriture étudiées.',
          'Utilise peu les stratégies d’écriture étudiées ou les applique de façon incomplète.',
          'Utilise très difficilement les stratégies d’écriture étudiées.'), { formativeOnly: true })
      ];
      if (cycle === 3) {
        ALL_SUBJECTS_CONFIG.find(s => s.id === 'fra_lecture').criteria = revisedLecture;
        ALL_SUBJECTS_CONFIG.find(s => s.id === 'fra_ecriture').criteria = revisedEcriture;
      } else {
        rubrics.fra_lecture = revisedLecture;
        rubrics.fra_ecriture = revisedEcriture;
      }
    });

    const V2_ART_PLASTIC_CREATION = artPlasticCreation.criteria;
    artPlasticCreation.criteria = V2_ART_PLASTIC_CREATION.map(criterion => criterion.id === 'ap1_proposition'
      ? observableCriterion('ap1_proposition', '3. Cohérence de l’organisation des éléments', lv(
        'Organise les éléments plastiques avec précision et cohérence en lien avec la proposition.',
        'Organise les éléments plastiques de façon cohérente en lien avec la proposition.',
        'Organise des éléments généralement liés entre eux et à la proposition.',
        'Organise des éléments dont les liens entre eux ou avec la proposition sont peu clairs.',
        'L’organisation des éléments et son lien avec la proposition sont difficiles à percevoir.'))
      : criterion);

    const LEGACY_DRAMA_CREATION = {};
    [1, 2, 3].forEach(cycle => {
      const subject = ALL_SUBJECTS_CONFIG.find(s => s.id === 'art_dram_c1c2');
      const oldCriteria = cycle === 3 ? subject.criteria : CYCLE_OBSERVABLE_RUBRICS[cycle].art_dram_c1c2;
      LEGACY_DRAMA_CREATION[cycle] = oldCriteria;
      const updated = [
        ...oldCriteria.slice(0, 3),
        observableCriterion('ad1_sequence', '4. Respect des caractéristiques de la séquence dramatique', lv(
          'Respecte avec précision les indications de jeu et rend la séquence particulièrement expressive.',
          'Respecte les indications de jeu et les caractéristiques expressives de la séquence.',
          'Respecte les principales indications de jeu et certaines caractéristiques expressives.',
          'Respecte partiellement les indications de jeu ou les caractéristiques expressives.',
          'Les indications de jeu et les caractéristiques expressives sont difficilement perceptibles.')),
        oldCriteria[3]
      ];
      if (cycle === 3) subject.criteria = updated;
      else CYCLE_OBSERVABLE_RUBRICS[cycle].art_dram_c1c2 = updated;
    });

    const V3_SOCIAL_DIVERSITY = {};
    [2, 3].forEach(cycle => {
      const subject = ALL_SUBJECTS_CONFIG.find(s => s.id === 'us_diversite');
      const oldCriteria = cycle === 3 ? subject.criteria : CYCLE_OBSERVABLE_RUBRICS[cycle].us_diversite;
      V3_SOCIAL_DIVERSITY[cycle] = oldCriteria;
      const updated = oldCriteria.map(criterion => criterion.id === 'us3_vision'
        ? observableCriterion('us3_vision', '3. Mise en relation des caractéristiques des sociétés et des territoires', lv(
          'Explique avec précision plusieurs liens entre les caractéristiques des sociétés comparées et leurs territoires, à partir de faits pertinents.',
          'Explique un lien pertinent entre une caractéristique des sociétés comparées et leur territoire, à partir de faits étudiés.',
          'Établit un lien simple et généralement juste entre une caractéristique d’une société et son territoire.',
          'Établit un lien partiel ou imprécis entre une caractéristique d’une société et son territoire.',
          'Établit difficilement un lien pertinent entre les caractéristiques étudiées et le territoire.'))
        : criterion);
      if (cycle === 3) subject.criteria = updated;
      else CYCLE_OBSERVABLE_RUBRICS[cycle].us_diversite = updated;
    });

    // Les anciennes traces conservent leurs descriptions et leur calcul d'origine.
    const V4_OBSERVABLE_RUBRICS = Object.fromEntries(ALL_SUBJECTS_CONFIG.map(subject => [
      subject.id,
      {
        P: subject.prescoOnly ? subject.criteria : [],
        1: subject.prescoOnly ? [] : subject.sharedCycles ? subject.criteria : CYCLE_OBSERVABLE_RUBRICS[1][subject.id] || [],
        2: subject.prescoOnly ? [] : subject.sharedCycles ? subject.criteria : CYCLE_OBSERVABLE_RUBRICS[2][subject.id] || [],
        3: subject.prescoOnly ? [] : subject.criteria
      }
    ]));

    // Corriger la grille actuelle sans modifier les descriptions conservées en V4.
    const socialChange = ALL_SUBJECTS_CONFIG.find(subject => subject.id === 'us_changement');
    socialChange.criteria = socialChange.criteria.map(criterion => criterion.id === 'us2_traces'
      ? {
        ...criterion,
        cells: {
          ...criterion.cells,
          A: criterion.cells.A.map(text => text.replace('Trouve seul et explique', 'Trouve et explique'))
        }
      }
      : criterion);

    // Repères locaux centrés sur la production observée, avec les adaptations permises.
    const OBSERVABLE_PERFORMANCE_LEVELS = {
      c1_comp: ['Repère les données principales et comprend l’essentiel de la question.', 'Repère quelques données pertinentes, mais omet ou confond des éléments importants.', 'Confond les données et la question ou ne repère pas les éléments essentiels.'],
      c1_mob: ['Choisit les concepts et processus essentiels; quelques erreurs subsistent.', 'Applique certains processus pertinents, mais plusieurs choix ou étapes sont erronés.', 'Choisit ou applique des processus qui ne permettent pas de résoudre la situation.'],
      c1_traces: ['Présente les étapes essentielles; certaines traces manquent ou sont imprécises.', 'Présente une démarche incomplète ou difficile à suivre.', 'Présente très peu de traces permettant de comprendre la démarche.'],
      c1_valid: ['Vérifie une partie de la solution ou de sa vraisemblance.', 'Vérifie un élément, sans tenir compte de plusieurs aspects importants.', 'La vérification de la solution demeure difficilement perceptible.'],
      c2_analyse: ['Repère les éléments essentiels et le concept principal de la situation.', 'Repère certains éléments, mais manque des relations ou concepts importants.', 'Ne dégage pas les éléments ou les concepts essentiels de la situation.'],
      c2_application: ['Applique les processus essentiels, malgré quelques erreurs.', 'Applique une partie des processus, mais commet plusieurs erreurs importantes.', 'Applique des processus qui ne conviennent pas ou ne mène pas les étapes essentielles à terme.'],
      c2_justif: ['Donne une justification simple ou partielle liée à la réponse.', 'Donne une justification imprécise ou peu liée à la réponse.', 'Ne fournit pas de justification mathématique pertinente.'],
      c2_communication: ['Utilise les termes et symboles de base, malgré certaines imprécisions.', 'Utilise plusieurs termes ou symboles de façon imprécise.', 'Les termes et symboles employés rendent le message difficile à comprendre.'],
      lec_comp: ['Dégage les informations essentielles pertinentes au texte.', 'Dégage quelques informations, mais en omet ou confond plusieurs importantes.', 'Dégage difficilement les informations essentielles du texte.'],
      lec_interp: ['Propose une interprétation simple liée au texte.', 'Propose une interprétation partielle ou peu liée aux indices du texte.', 'Propose difficilement une interprétation liée au texte.'],
      lec_strat: ['Utilise certaines stratégies de lecture étudiées.', 'Utilise peu de stratégies ou les applique de façon incomplète.', 'Le recours aux stratégies étudiées est difficilement perceptible.'],
      ora_regles: ['Réagit à l’essentiel des propos entendus.', 'Réagit partiellement aux propos entendus ou s’en éloigne souvent.', 'Les réactions montrent difficilement un lien avec les propos entendus.'],
      ora_part: ['Transmet l’essentiel du message en tenant généralement compte de la situation.', 'Adapte partiellement son message à la situation de communication.', 'Le message est difficilement adapté à la situation de communication.'],
      ora_voix: ['Formule un message généralement compréhensible avec les mots étudiés.', 'Plusieurs formulations ou mots imprécis nuisent à la compréhension.', 'Les formulations ou les mots rendent le message très difficile à comprendre.'],
      ora_strategies: ['Utilise certaines stratégies de communication étudiées.', 'Utilise peu de stratégies ou les applique de façon incomplète.', 'Le recours aux stratégies étudiées est difficilement perceptible.'],
      ccq_obs: ['Utilise les connaissances essentielles liées à la réalité étudiée.', 'Mobilise quelques connaissances, mais plusieurs sont incomplètes ou imprécises.', 'Mobilise difficilement les connaissances essentielles liées à la réalité étudiée.'],
      ccq_ethique: ['Repère des informations pertinentes et effectue une comparaison simple.', 'Repère quelques informations, mais leur traitement demeure partiel ou imprécis.', 'Repère ou traite difficilement les informations pertinentes.'],
      ccq_comprehension: ['Formule un constat ou une réponse simple et pertinente sur la réalité étudiée.', 'Formule un constat ou une réponse partielle dont le lien avec la réalité étudiée est peu clair.', 'Formule difficilement un constat ou une réponse pertinente sur la réalité étudiée.'],
      ccq_dialogue: ['Participe au dialogue et prend en compte certains propos des autres.', 'Participe au dialogue, mais prend peu en compte les propos des autres.', 'Participe difficilement au dialogue ou prend rarement en compte les propos des autres.'],
      sci_prob: ['Repère la question et propose une hypothèse ou solution simple et plausible.', 'Repère une partie du problème, mais l’hypothèse ou la solution est imprécise.', 'Décrit difficilement le problème ou ne propose pas de piste pertinente.'],
      sci_demarche: ['Réalise les étapes essentielles de la démarche et manipule généralement le matériel de façon appropriée.', 'Réalise une partie de la démarche, avec plusieurs étapes ou manipulations imprécises.', 'La démarche ou les manipulations essentielles sont difficilement réalisées.'],
      sci_explic: ['Relie une observation ou un résultat à une notion étudiée.', 'Présente un lien partiel ou imprécis entre les résultats et les notions étudiées.', 'Relie difficilement les résultats aux connaissances étudiées.'],
      sci_strategies: ['Utilise certaines stratégies d’exploration ou de consignation.', 'Utilise peu de stratégies ou consigne des observations incomplètes.', 'L’utilisation de stratégies ou la consignation des observations est difficilement perceptible.'],
      sci2_demarche: ['Réalise les étapes essentielles de la démarche.', 'Réalise une partie de la démarche, mais omet ou confond plusieurs étapes.', 'La réalisation des étapes essentielles de la démarche est difficilement perceptible.'],
      sci2_outils: ['Utilise les outils essentiels de façon généralement appropriée et sécuritaire.', 'Utilise certains outils, mais plusieurs gestes ou règles de sécurité sont imprécis.', 'Utilise difficilement les outils ou techniques nécessaires de façon appropriée.'],
      sci2_connaissances: ['Utilise les notions essentielles liées à l’objet ou au procédé étudié.', 'Mobilise quelques notions, mais plusieurs sont incomplètes ou imprécises.', 'Mobilise difficilement les notions essentielles liées à l’objet ou au procédé.'],
      sci2_precision: ['Consigne les observations ou mesures essentielles, malgré quelques omissions.', 'Consigne des observations ou mesures incomplètes ou imprécises.', 'Consigne très peu d’observations ou de mesures exploitables.'],
      sci3_explic: ['Formule une explication ou une solution simple liée aux observations.', 'Formule une explication partielle ou peu liée aux observations.', 'Formule difficilement une explication ou une solution pertinente.'],
      sci3_terminologie: ['Utilise les termes et conventions essentiels, malgré quelques imprécisions.', 'Utilise plusieurs termes ou conventions de façon imprécise.', 'Utilise difficilement les termes et conventions essentiels.'],
      sci3_connaissances: ['Utilise une notion pertinente pour appuyer son explication.', 'Présente des liens partiels ou imprécis avec les notions étudiées.', 'Relie difficilement son explication aux notions étudiées.'],
      sci3_representation: ['Présente les éléments essentiels dans un schéma, un tableau ou un graphique.', 'La représentation est incomplète ou comporte plusieurs imprécisions.', 'La représentation permet difficilement de comprendre les résultats.'],
      us_oi: ['Situe les repères principaux et rappelle des faits essentiels.', 'Situe quelques repères ou rappelle certains faits, avec plusieurs imprécisions.', 'Situe difficilement les repères ou rappelle peu de faits pertinents.'],
      us_org: ['Décrit une caractéristique pertinente de la société et de son territoire.', 'Décrit quelques caractéristiques, mais plusieurs sont incomplètes ou imprécises.', 'Décrit difficilement les caractéristiques pertinentes de la société et de son territoire.'],
      us_causalite: ['Établit un lien simple et pertinent entre des faits étudiés.', 'Présente un lien partiel ou imprécis entre les faits étudiés.', 'Établit difficilement un lien pertinent entre les faits étudiés.'],
      us_div: ['Utilise une carte, une frise ou une légende pour repérer une information essentielle.', 'Utilise les documents de façon partielle ou avec plusieurs imprécisions.', 'Repère difficilement l’information pertinente dans les documents.'],
      us2_connaissances: ['Rappelle les faits essentiels de la société étudiée.', 'Rappelle quelques faits, mais plusieurs repères sont imprécis ou manquants.', 'Rappelle difficilement des faits pertinents sur la société étudiée.'],
      us2_changements: ['Relève un changement pertinent et en indique une cause ou une conséquence simple.', 'Relève un changement, mais la cause ou la conséquence demeure imprécise.', 'Relève difficilement un changement pertinent entre les périodes étudiées.'],
      us2_interpretation: ['Explique simplement un changement à partir d’un fait ou d’un document pertinent.', 'Propose une explication partielle ou peu appuyée sur des faits pertinents.', 'Explique difficilement le changement à partir des faits étudiés.'],
      us2_traces: ['Repère une trace actuelle liée à la société ou au changement étudié.', 'Repère une trace, mais son lien avec la société étudiée demeure imprécis.', 'Repère difficilement une trace liée à la société ou au changement étudié.'],
      us3_connaissances: ['Rappelle les caractéristiques essentielles des sociétés comparées.', 'Rappelle quelques caractéristiques, avec plusieurs imprécisions ou omissions.', 'Rappelle difficilement des caractéristiques pertinentes des sociétés comparées.'],
      us3_comparaison: ['Relève une ressemblance ou une différence pertinente entre les sociétés.', 'Compare certains éléments, mais plusieurs liens sont imprécis ou incomplets.', 'Établit difficilement une comparaison pertinente entre les sociétés.'],
      us3_techniques: ['Utilise une carte ou une frise pour situer les sociétés étudiées.', 'Utilise la carte ou la frise de façon partielle ou avec plusieurs imprécisions.', 'Situe difficilement les sociétés à partir des documents proposés.'],
      ad1_org: ['Utilise les éléments essentiels du langage dramatique dans la séquence.', 'Utilise quelques éléments, mais leur lien avec la séquence demeure imprécis.', 'Utilise difficilement les éléments essentiels du langage dramatique dans la séquence.'],
      ad1_jeu: ['Utilise une technique de jeu ou un mode de théâtralisation étudié.', 'Utilise partiellement une technique ou un mode de théâtralisation étudié.', 'Utilise difficilement les techniques et modes de théâtralisation étudiés.'],
      ad1_conventions: ['Organise les actions essentielles dans une séquence généralement cohérente.', 'Organise une séquence partielle dont plusieurs liens entre les actions sont peu clairs.', 'L’organisation des actions et la continuité de la séquence sont difficiles à percevoir.'],
      ad1_reflexion: ['Nomme une étape ou un choix de sa démarche.', 'Décrit partiellement sa démarche ou ses choix.', 'Décrit difficilement sa démarche ou ses choix.'],
      ad3_vocab: ['Nomme un élément pertinent de l’œuvre avec le vocabulaire étudié.', 'Nomme quelques éléments, avec plusieurs imprécisions de vocabulaire.', 'Nomme difficilement les éléments observés avec le vocabulaire étudié.'],
      ad3_liens: ['Relie une impression ou un effet à un élément observé dans l’œuvre.', 'Propose un lien partiel ou imprécis entre un effet et l’œuvre.', 'Établit difficilement un lien pertinent entre l’œuvre et ses effets.'],
      ad3_jugement: ['Exprime une appréciation et donne une raison simple liée à l’œuvre.', 'Exprime une appréciation dont la justification est partielle ou peu liée à l’œuvre.', 'Exprime difficilement une appréciation justifiée par des éléments de l’œuvre.'],
      ad3_observation: ['Observe la séquence et relève certains éléments pertinents.', 'Relève quelques éléments, mais l’observation demeure incomplète.', 'Relève difficilement des éléments pertinents de la séquence observée.'],
      ap1_retour: ['Nomme une étape ou un choix de sa démarche de création.', 'Décrit partiellement sa démarche ou ses choix de création.', 'Décrit difficilement sa démarche ou ses choix de création.'],
      ap1_mise: ['Utilise certaines étapes de la démarche de création étudiée.', 'Réalise une démarche partielle dont plusieurs étapes sont peu perceptibles.', 'La démarche de création est difficilement perceptible.'],
      ap3_vocab: ['Nomme un élément pertinent de l’œuvre avec le vocabulaire étudié.', 'Nomme quelques éléments, avec plusieurs imprécisions de vocabulaire.', 'Nomme difficilement les éléments observés avec le vocabulaire étudié.'],
      ap3_liens: ['Relie une impression ou un effet à un élément observé dans l’œuvre.', 'Propose un lien partiel ou imprécis entre un effet et l’œuvre.', 'Établit difficilement un lien pertinent entre l’œuvre et ses effets.'],
      ap3_jugement: ['Exprime une appréciation et donne une raison simple liée à l’œuvre.', 'Exprime une appréciation dont la justification est partielle ou peu liée à l’œuvre.', 'Exprime difficilement une appréciation justifiée par des éléments de l’œuvre.'],
      ap3_posture: ['Observe l’œuvre et relève certains éléments pertinents.', 'Relève quelques éléments, mais l’observation demeure incomplète.', 'Relève difficilement des éléments pertinents de l’œuvre observée.']
    };

    const CYCLE_RUBRIC_UNAVAILABLE_MESSAGES = {
      sciences_outils: 'Au 1er cycle, la science et la technologie n’est pas à la grille-matières : utilisez l’onglet « Proposer (C1) » pour vos traces.',
      sciences_comm: 'Au 1er cycle, la science et la technologie n’est pas à la grille-matières : utilisez l’onglet « Proposer (C1) » pour vos traces.',
      us_changement: 'Au 1er cycle, la géographie, l’histoire et l’éducation à la citoyenneté ne sont pas à la grille-matières : utilisez l’onglet « Organisation (C1) » pour vos traces.',
      us_diversite: 'Au 1er cycle, la géographie, l’histoire et l’éducation à la citoyenneté ne sont pas à la grille-matières : utilisez l’onglet « Organisation (C1) » pour vos traces.'
    };

    const COMPETENCY_INDICATORS = {
      math_resoudre: {
        c1_comp: ['Reformule ce qu’il faut trouver.', 'Repère les données utiles dans l’énoncé et les représentations.', 'Tient compte des contraintes de la situation.', 'Écarte les données qui ne servent pas à résoudre la tâche.'],
        c1_mob: ['Choisit les concepts et opérations adaptés.', 'Mobilise une stratégie ou des outils mathématiques pertinents.', 'Applique les processus et calcule avec exactitude.', 'Ajuste sa démarche lorsque les résultats ne conviennent pas.'],
        c1_traces: ['Présente les étapes essentielles de sa démarche.', 'Utilise des représentations, symboles et calculs compréhensibles.', 'Précise les unités et les éléments utiles à l’interprétation.', 'Formule une réponse qui répond à la question.']
      },
      math_raisonner: {
        c2_analyse: ['Repère les éléments mathématiques utiles de la tâche.', 'Établit les relations entre les données, figures ou mesures.', 'Choisit les concepts et processus appropriés.', 'Distingue les informations utiles des éléments secondaires.'],
        c2_application: ['Sélectionne une démarche adaptée.', 'Applique correctement les concepts et processus requis.', 'Organise les étapes de calcul, de mesure ou de construction.', 'Vérifie la cohérence des résultats obtenus.'],
        c2_justif: ['Explique les étapes qui soutiennent sa réponse.', 'Appuie ses affirmations sur des propriétés ou des faits mathématiques.', 'Utilise des exemples, des représentations ou des contre-exemples pertinents.', 'Relie clairement ses arguments à sa conclusion.']
      },
      fra_lecture: {
        lec_comp: ['Repère les informations explicites importantes.', 'Dégage les informations implicites par des inférences.', 'Établit des liens entre les idées et les parties du texte.', 'Appuie sa compréhension sur des indices pertinents du texte.'],
        lec_interp: ['Propose une interprétation cohérente du texte ou de l’œuvre.', 'S’appuie sur des indices pour expliquer son interprétation.', 'Établit des liens entre des éléments du texte et ses connaissances.', 'Tient compte du point de vue, de l’intention ou du contexte.'],
        lec_reac: ['Exprime une réaction ou un jugement personnel.', 'Justifie sa réaction par des éléments précis du texte.', 'Explique l’effet produit par des choix de l’auteur.', 'Établit des liens pertinents avec d’autres textes ou expériences.']
      },
      fra_ecriture: {
        ecr_adapt: ['Tient compte du sujet, de l’intention et du destinataire.', 'Organise les idées et les informations de façon cohérente.', 'Assure la progression et les liens entre les idées.', 'Respecte les caractéristiques du genre et de la situation d’écriture.'],
        ecr_vocab: ['Choisit un vocabulaire précis et adapté.', 'Construit des phrases compréhensibles et bien formées.', 'Varie les formulations selon le texte et l’intention.', 'Utilise la ponctuation pour clarifier le sens.'],
        ecr_ortho: ['Respecte les accords dans le groupe nominal.', 'Accorde correctement le verbe avec son sujet.', 'Applique les règles d’orthographe grammaticale étudiées.', 'Révise l’orthographe d’usage à l’aide de stratégies et d’outils.']
      },
      fra_oral: {
        ora_regles: ['Écoute les interventions jusqu’au bout.', 'Réagit en tenant compte des propos entendus.', 'Reprend ou approfondit une idée exprimée par un pair.', 'Respecte les règles et les tours de parole.'],
        ora_part: ['Adapte ses propos au sujet et à l’intention.', 'Tient compte de l’auditoire et du contexte.', 'Organise ses idées pour faire comprendre son message.', 'Ajuste sa voix, son débit et sa posture à la situation.'],
        ora_voix: ['Formule des idées compréhensibles et suffisamment développées.', 'Construit des phrases adaptées à la situation.', 'Emploie un vocabulaire précis et pertinent.', 'Utilise des exemples ou des précisions pour soutenir son propos.']
      },
      ccq_global: {
        ccq_obs: ['Nomme les notions et réalités culturelles étudiées.', 'Décrit des faits ou des exemples pertinents.', 'Utilise les connaissances pour éclairer une situation.', 'Distingue les faits, les opinions et les valeurs en jeu.'],
        ccq_ethique: ['Formule une question liée à une réalité culturelle ou éthique.', 'Recueille et sélectionne des informations pertinentes.', 'Compare des points de vue ou des perspectives.', 'Considère les raisons et les conséquences associées aux points de vue.'],
        ccq_comprehension: ['Dégage des constats à partir des informations étudiées.', 'Explique les enjeux ou les tensions présents.', 'Appuie sa réflexion sur des raisons ou des exemples.', 'Formule une réponse nuancée en considérant plusieurs perspectives.']
      },
      sciences_outils: {
        sci2_demarche: ['Planifie les étapes de son travail.', 'Réalise la démarche prévue.', 'Réajuste sa démarche au besoin.', 'Respecte les consignes et le protocole.'],
        sci2_outils: ['Choisit l’outil ou l’instrument approprié.', 'Manipule les objets avec soin et précision.', 'Respecte les règles de sécurité.', 'Utilise la technique enseignée.'],
        sci2_connaissances: ['Nomme les notions liées à l’objet ou au procédé.', 'Décrit le fonctionnement de l’objet ou du procédé.', 'Applique les notions étudiées à la tâche.', 'Utilise les connaissances de la progression des apprentissages.']
      },
      sciences_comm: {
        sci3_explic: ['Interprète ses observations ou ses résultats.', 'Formule une explication ou une solution.', 'Appuie son explication sur des données.', 'Tire une conclusion liée à la problématique.'],
        sci3_terminologie: ['Emploie les termes scientifiques étudiés.', 'Utilise les unités et symboles appropriés.', 'Respecte les conventions de la discipline.', 'Précise le sens des mots employés.'],
        sci3_connaissances: ['Relie ses propos aux notions étudiées.', 'Utilise les concepts de façon juste.', 'Intègre plusieurs notions dans une explication.', 'Justifie sa solution à l’aide des connaissances.']
      },
      us_changement: {
        us2_connaissances: ['Situe la société dans le temps et dans l’espace.', 'Rappelle des faits, personnages ou événements.', 'Décrit l’organisation de la société à deux moments.', 'Utilise les documents pour appuyer ses connaissances.'],
        us2_changements: ['Relève des changements sociaux et territoriaux.', 'Compare deux moments dans le temps.', 'Établit des causes des changements.', 'Établit des conséquences des changements.'],
        us2_interpretation: ['Exprime son interprétation du changement.', 'Appuie son interprétation sur des arguments.', 'Utilise des traces ou des documents.', 'Défend son point de vue auprès des autres.']
      },
      us_diversite: {
        us3_connaissances: ['Situe les sociétés comparées.', 'Décrit les caractéristiques de chaque société.', 'Rappelle les faits essentiels étudiés.', 'Utilise cartes et lignes du temps.'],
        us3_comparaison: ['Relève des ressemblances.', 'Relève des différences.', 'Explique des causes des différences.', 'Explique des conséquences des différences.'],
        us3_vision: ['Repère des caractéristiques des sociétés étudiées.', 'Relie une caractéristique au territoire.', 'Utilise des faits pertinents pour expliquer le lien.', 'Compare les liens observés entre les sociétés.']
      },
      sciences_global: {
        sci_prob: ['Décrit le problème ou le phénomène à l’étude.', 'Formule une question ou une hypothèse pertinente.', 'Repère les variables ou les éléments à examiner.', 'Justifie une prédiction à partir de ses connaissances ou observations.'],
        sci_demarche: ['Choisit ou suit une démarche adaptée à la question.', 'Utilise les instruments et le matériel de façon appropriée et sécuritaire.', 'Réalise les étapes de l’expérimentation ou de la conception.', 'Consigne des observations et des résultats utiles.'],
        sci_explic: ['Interprète les observations ou les résultats recueillis.', 'Établit des liens avec les concepts scientifiques étudiés.', 'Tire une conclusion en lien avec la question de départ.', 'Communique son raisonnement avec des termes et représentations appropriés.']
      },
      univers_social: {
        us_oi: ['Situe les faits et les sociétés dans le temps.', 'Localise les lieux et territoires à l’aide de documents.', 'Mobilise des connaissances historiques et géographiques pertinentes.', 'Repère des informations utiles dans des sources variées.'],
        us_org: ['Décrit des caractéristiques d’une société ou d’un territoire.', 'Compare des sociétés, des périodes ou des territoires.', 'Repère des changements et des continuités.', 'Relie les caractéristiques aux modes de vie et à l’organisation étudiés.'],
        us_causalite: ['Établit des liens entre des faits ou des phénomènes.', 'Explique des causes et des conséquences.', 'Appuie ses interprétations sur des traces ou des documents.', 'Présente une explication cohérente et contextualisée.']
      },
      art_dram_c1c2: {
        ad1_org: ['Mobilise le corps, la voix, l’espace ou les objets pour créer.', 'Développe un personnage ou une action dramatique.', 'Fait des choix liés à l’intention de création ou d’interprétation.', 'Combine les éléments du langage dramatique de façon signifiante.'],
        ad1_jeu: ['Utilise les techniques de jeu travaillées.', 'Exploite les modes de théâtralisation appropriés.', 'Ajuste ses moyens de jeu pendant la répétition ou la prestation.', 'Prend en compte les partenaires et les contraintes de la proposition.'],
        ad1_conventions: ['Organise les actions dans une séquence cohérente.', 'Respecte les caractéristiques de la proposition dramatique.', 'Maintient le rôle et la continuité de l’action.', 'Ajuste son jeu pour soutenir le sens et l’effet de la scène.']
      },
      art_dram_c3: {
        ad3_vocab: ['Reconnaît des éléments du langage dramatique et théâtral.', 'Utilise le vocabulaire disciplinaire pour décrire ses observations.', 'Repère des choix de jeu ou de mise en scène.', 'Décrit des caractéristiques pertinentes de l’œuvre ou de la réalisation.'],
        ad3_liens: ['Relie des choix artistiques aux effets produits.', 'Explique une réaction à partir d’éléments observés.', 'Établit des liens entre l’œuvre et son contexte socioculturel.', 'Compare des aspects pertinents de différentes œuvres ou réalisations.'],
        ad3_jugement: ['Formule une appréciation personnelle claire.', 'Justifie son jugement par des exemples précis.', 'Tient compte de critères liés à l’œuvre ou à la réalisation.', 'Explique les effets et les intentions qui soutiennent son appréciation.']
      }
    };

    // =========================================================================
    // 2. INITIAL STATE (EMPTY SHARED CLASS TEMPLATE)
    // =========================================================================
