    ALL_SUBJECTS_CONFIG.push(
      {
        id: 'eps_c1',
        group: 'education_physique', groupLabel: 'Éducation physique et à la santé', tabLabel: 'Éducation physique',
        singleResult: true, bulletinLabel: 'Éducation physique et à la santé',
        partLabel: 'Agir dans divers contextes (C1)',
        shortName: 'Éduc. phys. • Agir (C1)',
        fullName: 'Éducation physique et à la santé — C1 : Agir dans divers contextes de pratique d’activités physiques',
        icon: 'EP1',
        refUrl: 'https://cdn-contenu.quebec.ca/cdn-contenu/education/pfeq/primaire/programmes/PFEQ-education-physique-primaire.pdf',
        criteria: []
      },
      {
        id: 'eps_c2',
        group: 'education_physique', groupLabel: 'Éducation physique et à la santé', tabLabel: 'Éducation physique',
        singleResult: true, bulletinLabel: 'Éducation physique et à la santé',
        partLabel: 'Interagir dans divers contextes (C2)',
        shortName: 'Éduc. phys. • Interagir (C2)',
        fullName: 'Éducation physique et à la santé — C2 : Interagir dans divers contextes de pratique d’activités physiques',
        icon: 'EP2',
        refUrl: 'https://cdn-contenu.quebec.ca/cdn-contenu/education/pfeq/primaire/programmes/PFEQ-education-physique-primaire.pdf',
        criteria: []
      },
      {
        id: 'eps_c3',
        group: 'education_physique', groupLabel: 'Éducation physique et à la santé', tabLabel: 'Éducation physique',
        singleResult: true, bulletinLabel: 'Éducation physique et à la santé',
        partLabel: 'Mode de vie sain et actif (C3)',
        shortName: 'Éduc. phys. • Mode de vie sain et actif (C3)',
        fullName: 'Éducation physique et à la santé — C3 : Adopter un mode de vie sain et actif',
        icon: 'EP3',
        refUrl: 'https://cdn-contenu.quebec.ca/cdn-contenu/education/pfeq/primaire/programmes/PFEQ-education-physique-primaire.pdf',
        criteria: []
      }
    );
    ['eps_c1', 'eps_c2', 'eps_c3'].forEach(id => {
      ALL_SUBJECTS_CONFIG.find(subject => subject.id === id).cycleScaleUrls = { ...CYCLE_SCALE_URLS };
    });
