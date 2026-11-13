    const PRESCO_FREQ = () => lv(
      'Se développe très bien : manifeste cette compétence de façon constante et autonome.',
      'Se développe très bien : manifeste cette compétence régulièrement, avec aisance.',
      'Se développe adéquatement : manifeste cette compétence avec un rappel ou un soutien ponctuel.',
      'Se développe avec certaines difficultés : a besoin d’un soutien fréquent de l’adulte.',
      'Se développe avec des difficultés importantes malgré un soutien soutenu.');
    [
      ['presco_c1', 'Physique et moteur', 'Accroître son développement physique et moteur',
        ['Coordination et motricité globale (courir, sauter, grimper, lancer)', 'Motricité fine (découper, tracer, manipuler)', 'Respect des règles de sécurité et conscience de son corps']],
      ['presco_c2', 'Affectif', 'Construire sa conscience de soi',
        ['Exprime ses goûts, ses émotions et ses besoins', 'Prend des initiatives et fait des choix', 'Confiance en soi et gestion de ses émotions']],
      ['presco_c3', 'Social', 'Vivre des relations harmonieuses avec les autres',
        ['Joue et collabore avec les autres', 'Respecte les règles de vie et attend son tour', 'Règle ses conflits avec de moins en moins d’aide']],
      ['presco_c4', 'Langagier', 'Communiquer à l’oral et à l’écrit',
        ['Comprend les consignes et les messages oraux', 'S’exprime à l’oral (vocabulaire, phrases, prise de parole)', 'Développe ses habiletés en émergence de l’écrit et de la lecture']],
      ['presco_c5', 'Cognitif', 'Découvrir le monde qui l’entoure',
        ['Explore, observe et pose des questions', 'Utilise des notions de mathématiques (nombres, formes, mesures, classement)', 'Établit des liens et résout des problèmes simples']]
    ].forEach(([id, part, full, crits]) => {
      ALL_SUBJECTS_CONFIG.push({
        id,
        group: 'presco', groupLabel: 'Préscolaire', partLabel: part,
        shortName: `${part} — ${full}`,
        fullName: `Préscolaire — ${full}`,
        icon: 'P' + id.slice(-1), sharedCycles: true, prescoOnly: true,
        refUrl: 'https://www.quebec.ca/education/prescolaire-primaire-et-secondaire/programmes-formations-evaluation/programme-formation-ecole-quebecoise/education-prescolaire',
        cssmbUrl: 'https://sre.servicescsmb.com/disciplines/',
        criteria: crits.map((c, i) => observableCriterion(`${id}_${i + 1}`, `${i + 1}. ${c}`, PRESCO_FREQ()))
      });
    });

    // Matières affichées = matières cochées pour le groupe actif (voir applyActiveSubjects)
    const SUBJECTS_CONFIG = ALL_SUBJECTS_CONFIG.slice();

    // 1er CYCLE (1re-2e année) & 2e CYCLE (3e-4e année) — 100 % HARMONISÉ AVEC LE 3e CYCLE
