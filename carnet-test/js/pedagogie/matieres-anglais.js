    ALL_SUBJECTS_CONFIG.push(
      {
        id: 'eng_c1',
        group: 'anglais', groupLabel: 'Anglais, langue seconde', tabLabel: 'Anglais',
        partLabel: 'C1 — selon le cycle',
        shortName: 'Anglais • C1',
        fullName: 'Anglais, langue seconde — compétence 1',
        icon: 'EN1',
        refUrl: 'https://cdn-contenu.quebec.ca/cdn-contenu/education/pfeq/primaire/programmes/PFEQ-anglais-langue-seconde-2e-3e-cycles-primaire.pdf',
        criteria: [],
        cycleInfo: {
          1: { partLabel: 'Comprendre des textes entendus (C1)', shortName: 'Anglais • Textes entendus (C1)', fullName: 'Anglais, langue seconde — C1 : Mobiliser sa compréhension de textes entendus', bulletinName: 'Comprendre des textes entendus', bulletinWeight: 60, refUrl: 'https://cdn-contenu.quebec.ca/cdn-contenu/education/pfeq/primaire/programmes/PFEQ-anglais-langue-seconde-1er-cycle-primaire.pdf' },
          2: { partLabel: 'Interagir oralement en anglais (C1)', shortName: 'Anglais • Interaction orale (C1)', fullName: 'Anglais, langue seconde — C1 : Interagir oralement en anglais', bulletinName: 'Communiquer oralement en anglais', bulletinWeight: 50 },
          3: { partLabel: 'Interagir oralement en anglais (C1)', shortName: 'Anglais • Interaction orale (C1)', fullName: 'Anglais, langue seconde — C1 : Interagir oralement en anglais', bulletinName: 'Communiquer oralement en anglais', bulletinWeight: 45 }
        }
      },
      {
        id: 'eng_c2',
        group: 'anglais', groupLabel: 'Anglais, langue seconde', tabLabel: 'Anglais',
        partLabel: 'C2 — selon le cycle',
        shortName: 'Anglais • C2',
        fullName: 'Anglais, langue seconde — compétence 2',
        icon: 'EN2',
        refUrl: 'https://cdn-contenu.quebec.ca/cdn-contenu/education/pfeq/primaire/programmes/PFEQ-anglais-langue-seconde-2e-3e-cycles-primaire.pdf',
        criteria: [],
        cycleInfo: {
          1: { partLabel: 'Communiquer oralement en anglais (C2)', shortName: 'Anglais • Communication orale (C2)', fullName: 'Anglais, langue seconde — C2 : Communiquer oralement en anglais', bulletinName: 'Communiquer oralement en anglais', bulletinWeight: 40, refUrl: 'https://cdn-contenu.quebec.ca/cdn-contenu/education/pfeq/primaire/programmes/PFEQ-anglais-langue-seconde-1er-cycle-primaire.pdf' },
          2: { partLabel: 'Comprendre des textes lus et entendus (C2)', shortName: 'Anglais • Textes lus et entendus (C2)', fullName: 'Anglais, langue seconde — C2 : Réinvestir sa compréhension de textes lus et entendus', bulletinName: 'Comprendre des textes lus et entendus', bulletinWeight: 35 },
          3: { partLabel: 'Comprendre des textes lus et entendus (C2)', shortName: 'Anglais • Textes lus et entendus (C2)', fullName: 'Anglais, langue seconde — C2 : Réinvestir sa compréhension de textes lus et entendus', bulletinName: 'Comprendre des textes lus et entendus', bulletinWeight: 35 }
        }
      },
      {
        id: 'eng_c3',
        group: 'anglais', groupLabel: 'Anglais, langue seconde', tabLabel: 'Anglais',
        partLabel: 'Écrire des textes (C3)',
        shortName: 'Anglais • Écriture (C3)',
        fullName: 'Anglais, langue seconde — C3 : Écrire des textes',
        icon: 'EN3',
        refUrl: 'https://cdn-contenu.quebec.ca/cdn-contenu/education/pfeq/primaire/programmes/PFEQ-anglais-langue-seconde-2e-3e-cycles-primaire.pdf',
        criteria: [],
        cycleInfo: {
          1: { applicable: false },
          2: { applicable: true, bulletinName: 'Écrire des textes', bulletinWeight: 15 },
          3: { applicable: true, bulletinName: 'Écrire des textes', bulletinWeight: 20 }
        }
      }
    );
    ['eng_c1', 'eng_c2', 'eng_c3'].forEach(id => {
      ALL_SUBJECTS_CONFIG.find(subject => subject.id === id).cycleScaleUrls = { ...CYCLE_SCALE_URLS };
    });

    function getSubjectCycle(subject, gradeLevelOrCycle) {
      return typeof getStudentCycle === 'function' ? getStudentCycle(gradeLevelOrCycle) : null;
    }

    function getSubjectCycleInfo(subject, gradeLevelOrCycle) {
      const cycle = getSubjectCycle(subject, gradeLevelOrCycle);
      return {
        cycle,
        meta: subject && subject.cycleInfo && cycle ? subject.cycleInfo[cycle] || null : null
      };
    }

    function isSubjectApplicableForStudent(subject, studentOrLevel) {
      if (!subject || subject.prescoOnly) return true;
      const level = typeof studentOrLevel === 'object'
        ? (typeof getEffectiveGradeLevel === 'function' ? getEffectiveGradeLevel(studentOrLevel, subject) : studentOrLevel && studentOrLevel.gradeLevel)
        : studentOrLevel;
      const { meta } = getSubjectCycleInfo(subject, level);
      return !meta || meta.applicable !== false;
    }

    function getSubjectDisplayConfig(subject, gradeLevelOrCycle) {
      if (!subject) return null;
      const { meta, cycle } = getSubjectCycleInfo(subject, gradeLevelOrCycle);
      const officialWeight = meta && Number.isFinite(Number(meta.bulletinWeight)) ? Number(meta.bulletinWeight) : null;
      return {
        ...subject,
        ...(meta || {}),
        cycle,
        officialWeight,
        officialWeightLabel: officialWeight !== null ? `Pondération bulletin : ${officialWeight} %` : ''
      };
    }

    function getActiveContextLevels() {
      const levels = [...new Set((typeof appState !== 'undefined' ? appState.students || [] : [])
        .map(student => String(student.gradeLevel || ''))
        .filter(level => GRADE_LEVEL_LABELS[level]))];
      if (levels.length) return levels;
      if (typeof appState !== 'undefined') {
        const group = (appState.groups || []).find(item => item.id === appState.activeGroupId);
        return group && GRADE_LEVEL_LABELS[String(group.level)] ? [String(group.level)] : [];
      }
      return [];
    }

    function getVisibleSubjectsForContext(subjects = SUBJECTS_CONFIG) {
      const students = typeof appState !== 'undefined' ? appState.students || [] : [];
      if (students.length) {
        return subjects.filter(subject => students.some(student => isSubjectApplicableForStudent(subject, student)));
      }
      const levels = getActiveContextLevels();
      if (!levels.length) return subjects.slice();
      return subjects.filter(subject => levels.some(level => isSubjectApplicableForStudent(subject, level)));
    }

    function getSubjectContextDisplay(subject, levels = null) {
      if (!levels) {
        const students = typeof appState !== 'undefined' ? appState.students || [] : [];
        levels = students.length
          ? [...new Set(students.map(student => typeof getEffectiveGradeLevel === 'function'
            ? getEffectiveGradeLevel(student, subject) || student.gradeLevel
            : student.gradeLevel).filter(Boolean))]
          : getActiveContextLevels();
      }
      const applicable = [];
      if (levels.length) {
        levels.forEach(level => {
          const display = getSubjectDisplayConfig(subject, level);
          if (!display.cycle || display.applicable === false) return;
          if (!applicable.some(item => item.cycle === display.cycle)) applicable.push(display);
        });
      } else {
        applicable.push(getSubjectDisplayConfig(subject, ''));
      }
      if (!applicable.length || applicable.length === 1) return applicable[0] || subject;
      const uniquePartLabels = [...new Set(applicable.map(item => item.partLabel).filter(Boolean))];
      const weightLabels = applicable.map(item => item.officialWeight !== null
        ? `${item.officialWeight} % (${CYCLE_LABELS[item.cycle]})` : '').filter(Boolean);
      const bulletinNames = [...new Set(applicable.map(item => item.bulletinName).filter(Boolean))];
      return {
        ...subject,
        partLabel: uniquePartLabels.join(' · '),
        shortName: `${subject.groupLabel} • ${uniquePartLabels.join(' / ')}`,
        fullName: `${subject.groupLabel} — ${uniquePartLabels.join(' / ')}`,
        officialWeightLabel: weightLabels.length ? `Pondération bulletin : ${weightLabels.join(' · ')}` : '',
        bulletinName: bulletinNames.length ? bulletinNames.join(' / ') : ''
      };
    }

    function formatOfficialWeightLabel(subject, level) {
      const display = getSubjectDisplayConfig(subject, level);
      return display && display.officialWeight !== null ? `Pondération bulletin : ${display.officialWeight} %` : '';
    }
