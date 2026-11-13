    function getCriteriaForGradeLevel(subject, gradeLevel) {
      const cycle = getStudentCycle(gradeLevel);
      if (!cycle) return [];
      if (subject.prescoOnly && cycle !== 'P') return [];
      if (!subject.prescoOnly && cycle === 'P') return [];
      const criteria = subject.prescoOnly || subject.sharedCycles || cycle === 3
        ? subject.criteria
        : CYCLE_OBSERVABLE_RUBRICS[cycle][subject.id] || [];
      return criteria.map(criterion => {
        if (subject.prescoOnly) {
          return {
            ...criterion,
            title: criterion.id === 'presco_c3_3' ? '3. Trouve des solutions aux conflits' : criterion.title,
            cells: Object.fromEntries(Object.entries(lv(
              'Se développe très bien : manifeste cet élément de façon constante dans diverses situations.',
              'Se développe très bien : manifeste cet élément régulièrement et avec aisance.',
              'Se développe adéquatement : manifeste cet élément dans les situations habituelles.',
              'Se développe avec certaines difficultés : manifeste cet élément de façon irrégulière ou partielle.',
              'Se développe avec des difficultés importantes : manifeste encore très difficilement cet élément.'
            )).map(([level, text]) => [level, [text]]))
          };
        }
        const performance = cycle === 1 && criterion.id === 'us_org'
          ? [
            'Décrit une caractéristique pertinente du milieu étudié.',
            'Décrit quelques caractéristiques du milieu, avec plusieurs imprécisions.',
            'Décrit difficilement les caractéristiques pertinentes du milieu étudié.'
          ]
          : OBSERVABLE_PERFORMANCE_LEVELS[criterion.id];
        const cells = { ...criterion.cells };
        ['A', 'B'].forEach(level => {
          cells[level] = cells[level].map(text => text
            .replaceAll(' seul et ', ' ')
            .replaceAll(' seul ', ' ')
            .replaceAll(' seul,', ',')
            .replaceAll(' seul.', '.')
            .replaceAll(', sans aide extérieure', '')
            .replaceAll(', sans aide', '')
            .replaceAll(' sans aide extérieure', '')
            .replaceAll(' sans aide', '')
            .replaceAll(', sans relance', '')
            .replaceAll(', sans rappel', '')
            .replaceAll(' spontanément', '')
            .replaceAll(' avec autonomie', '')
            .replaceAll(' (regard, silence)', '')
            .replaceAll('regarde l’auditoire', 's’adresse à l’auditoire'));
        });
        if (performance) {
          ['C', 'D', 'E'].forEach((level, index) => { cells[level] = [performance[index]]; });
        }
        return { ...criterion, cells };
      });
    }

    function getObservationCriteria(subject, gradeLevel, context) {
      const cycle = getStudentCycle(gradeLevel);
      if (subject.id === 'art_plast_c1c2' && context && !(context.rubricVersion >= 2) &&
          cycle && cycle !== 'P') {
        return LEGACY_ART_PLASTIC_CREATION;
      }
      if (subject.id === 'art_plast_c1c2' && context && context.rubricVersion === 2 && cycle && cycle !== 'P') {
        return V2_ART_PLASTIC_CREATION;
      }
      if (cycle && cycle !== 'P' && context && !(context.rubricVersion >= 3) && LEGACY_FRENCH_RUBRICS[cycle][subject.id]) {
        return LEGACY_FRENCH_RUBRICS[cycle][subject.id];
      }
      if (subject.id === 'art_dram_c1c2' && cycle && cycle !== 'P' && context && !(context.rubricVersion >= 3)) {
        return LEGACY_DRAMA_CREATION[cycle];
      }
      if (subject.id === 'us_diversite' && V3_SOCIAL_DIVERSITY[cycle] && context && !(context.rubricVersion >= 4)) {
        return V3_SOCIAL_DIVERSITY[cycle];
      }
      if (context && !(context.rubricVersion >= 5) && cycle) {
        return V4_OBSERVABLE_RUBRICS[subject.id][cycle];
      }
      return getCriteriaForGradeLevel(subject, gradeLevel);
    }

    // =========================================================================
    // 4. RENDERING FUNCTIONS
    // =========================================================================
