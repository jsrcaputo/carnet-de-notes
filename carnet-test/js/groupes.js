    const CUSTOM_RUBRIC_LEVEL_KEYS = {
      2: ['A', 'E'],
      3: ['A', 'C', 'E'],
      4: ['A', 'B', 'D', 'E'],
      5: ['A', 'B', 'C', 'D', 'E']
    };

    function cloneCustomRubric(rubric) {
      return rubric ? JSON.parse(JSON.stringify(rubric)) : null;
    }

    function normalizeCustomRubric(value, requireComplete = false) {
      if (!isRecord(value) || !Array.isArray(value.criteria) || !Array.isArray(value.levels)) return null;
      const criteriaCount = Math.max(0, Math.min(8, value.criteria.length));
      const levelCount = Math.max(0, Math.min(5, value.levels.length));
      if (criteriaCount < 1 || levelCount < 2) return null;
      const keys = CUSTOM_RUBRIC_LEVEL_KEYS[levelCount];
      const levels = value.levels.slice(0, levelCount).map((source, index) => {
        const level = isRecord(source) ? source : {};
        const rawPercent = Number(String(level.percent ?? level.pct ?? '').replace(',', '.'));
        return {
          key: keys[index],
          name: typeof level.name === 'string' ? level.name.trim().slice(0, 100) : '',
          percent: Number.isFinite(rawPercent) ? Math.max(0, Math.min(100, rawPercent)) : 0
        };
      });
      const usedIds = new Set();
      const criteria = value.criteria.slice(0, criteriaCount).map((source, index) => {
        const criterion = isRecord(source) ? source : {};
        let id = typeof criterion.id === 'string' && isSafeImportedId(criterion.id)
          ? criterion.id
          : `custom_c${index + 1}`;
        if (usedIds.has(id)) id = `custom_c${index + 1}`;
        while (usedIds.has(id)) id += '_x';
        usedIds.add(id);
        const rawWeight = Number(String(criterion.weight ?? '').replace(',', '.'));
        const cells = {};
        levels.forEach((level, levelIndex) => {
          const savedCells = isRecord(criterion.cells) ? criterion.cells : {};
          const sourceText = OWN.call(savedCells, level.key)
            ? savedCells[level.key]
            : OWN.call(savedCells, keys[levelIndex])
              ? savedCells[keys[levelIndex]]
              : [];
          const text = Array.isArray(sourceText)
            ? String(sourceText[0] ?? '')
            : String(sourceText ?? '');
          cells[level.key] = [text.trim().slice(0, 2000)];
        });
        return {
          id,
          title: typeof criterion.title === 'string' ? criterion.title.trim().slice(0, 180) : '',
          weight: Number.isFinite(rawWeight) ? Math.max(0, Math.min(100, rawWeight)) : 0,
          cells
        };
      });
      const rubric = {
        title: typeof value.title === 'string' ? value.title.trim().slice(0, 160) : '',
        levels,
        criteria
      };
      if (requireComplete) {
        const totalWeight = criteria.reduce((sum, item) => sum + Number(item.weight || 0), 0);
        const complete = rubric.title &&
          levels.every(level => level.name) &&
          criteria.every(item => item.title && levels.every(level => (item.cells[level.key] || [''])[0])) &&
          criteria.every(item => Number.isFinite(item.weight) && item.weight >= 0 && item.weight <= 100) &&
          Math.abs(totalWeight - 100) < 0.0001;
        if (!complete) return null;
      }
      return rubric;
    }

    function createDefaultCustomRubric() {
      const levels = [
        { key: 'A', name: 'Maîtrise', percent: 100 },
        { key: 'C', name: 'En développement', percent: 60 },
        { key: 'E', name: 'À soutenir', percent: 20 }
      ];
      const defaults = [
        ['Compréhension de la tâche', ['Démontre une compréhension solide et autonome de la tâche.', 'Démontre une compréhension suffisante avec quelques appuis.', 'A besoin d’appuis soutenus pour comprendre la tâche.']],
        ['Démarche et stratégies', ['Choisit et utilise des stratégies efficaces avec constance.', 'Choisit des stratégies généralement pertinentes.', 'Choisit des stratégies incomplètes ou peu adaptées.']],
        ['Justification et communication', ['Communique clairement une démarche précise et justifiée.', 'Communique une démarche compréhensible malgré quelques imprécisions.', 'Communique difficilement sa démarche ou sa justification.']]
      ];
      return {
        title: 'Ma grille personnalisée',
        levels,
        criteria: defaults.map(([title, texts], index) => ({
          id: `custom_c${index + 1}`,
          title,
          weight: [34, 33, 33][index],
          cells: Object.fromEntries(levels.map((level, levelIndex) => [level.key, [texts[levelIndex]]]))
        }))
      };
    }

    function createBlankObsSession(students) {
      const studentDrafts = {};
      students.forEach(st => {
        studentDrafts[st.id] = {
          checked: [],
          overrideCode: null,
          tags: [],
          comment: '',
          strengths: '',
          challenges: '',
          gradeLevel: st.gradeLevel || '',
          notEvaluated: false
        };
      });
      return {
        editingAssignmentId: null,
        rubricVersion: 5,
        obsMode: 'portrait',
        criteriaWeights: null,
        customRubric: null,
        selectedCustomRubricId: null,
        title: '',
        linkTargets: [],
        studentDrafts
      };
    }

    function buildTermDataForStudents(students) {
      const subjectData = {};
      ALL_SUBJECTS_CONFIG.forEach(sub => {
        subjectData[sub.id] = {
          equalWeights: true,
          assignments: [], // AUCUN travail pré-existant ("Travail 1 / Travail 2" supprimés) !
          studentRecords: {},
          customRubrics: [],
          currentObsSession: createBlankObsSession(students)
        };
        students.forEach(st => {
          subjectData[sub.id].studentRecords[st.id] = {
            scores: {},
            scoreMeta: {},
            baremeChecked: [],
            baremeOverrideCode: null,
            finalJudgmentOverride: '',
            comment: ''
          };
        });
      });
      return {
        subjectData,
        observations: []
      };
    }

    // ---- Groupes : chaque groupe a ses élèves, ses notes et ses matières ----
    const DEFAULT_GROUP_SUBJECT_IDS = ALL_SUBJECTS_CONFIG
      .filter(s => !s.prescoOnly && s.group !== 'art_plast').map(s => s.id);
    const LEGACY_DEFAULT_GROUP_SUBJECT_IDS = DEFAULT_GROUP_SUBJECT_IDS
      .filter(id => !/^(eps_|eng_)/.test(id));

    function createBlankGroupData() {
      return {
        students: [],
        terms: { '1': buildTermDataForStudents([]), '2': buildTermDataForStudents([]), '3': buildTermDataForStudents([]) },
        selectedStudentId: null
      };
    }

    function applyActiveSubjects(state) {
      const group = (state.groups || []).find(g => g.id === state.activeGroupId);
      const ids = new Set(group ? group.subjectIds : DEFAULT_GROUP_SUBJECT_IDS);
      const chosen = ALL_SUBJECTS_CONFIG.filter(s => ids.has(s.id));
      SUBJECTS_CONFIG.length = 0;
      SUBJECTS_CONFIG.push(...(chosen.length ? chosen : ALL_SUBJECTS_CONFIG.filter(s => DEFAULT_GROUP_SUBJECT_IDS.includes(s.id))));
    }

    function normalizeGroups(state) {
      const valid = new Set(ALL_SUBJECTS_CONFIG.map(s => s.id));
      const rawGroups = Array.isArray(state.groups) ? state.groups.filter(isRecord).filter(g => OWN.call(g, 'id')) : [];
      const groupIds = new Set();
      const groupSources = rawGroups.map(g => ({
        originalId: String(g.id),
        importedId: makeImportedId(g.id, 'g', groupIds),
        source: g
      }));
      const groupIdMap = new Map();
      let groups = groupSources.map(item => {
        if (!groupIdMap.has(item.originalId)) groupIdMap.set(item.originalId, item.importedId);
        const g = item.source;
        return {
          id: item.importedId,
          name: String(g.name || '').trim() || 'Groupe',
          subjectIds: (Array.isArray(g.subjectIds) ? g.subjectIds : LEGACY_DEFAULT_GROUP_SUBJECT_IDS).filter(id => valid.has(id)),
          level: GRADE_LEVEL_LABELS[String(g.level)] ? String(g.level) : '',
          ...(g.placeholder ? { placeholder: true } : {})
        };
      });
      if (!groups.length) groups = [{ id: 'g1', name: 'Mon groupe', subjectIds: LEGACY_DEFAULT_GROUP_SUBJECT_IDS.slice(), level: '' }];
      state.groups = groups;
      state.activeGroupId = groupIdMap.get(String(state.activeGroupId))
        || (groups.some(g => g.id === state.activeGroupId) ? state.activeGroupId : groups[0].id);
      const oldStore = isRecord(state.groupStore) ? state.groupStore : {};
      state.groupStore = {};
      groups.forEach(g => {
        if (g.id === state.activeGroupId) return;
        const sourceGroup = groupSources.find(item => item.importedId === g.id);
        const originalId = sourceGroup ? sourceGroup.originalId : g.id;
        const saved = OWN.call(oldStore, originalId) ? oldStore[originalId]
          : (OWN.call(oldStore, g.id) ? oldStore[g.id] : null);
        if (!isRecord(saved) || !Array.isArray(saved.students) || !isRecord(saved.terms)) {
          throw new Error(`Les données du groupe « ${g.name} » sont absentes ou invalides.`);
        }
        let data;
        try {
          data = normalizeImportedState({ students: saved.students, terms: saved.terms, selectedStudentId: saved.selectedStudentId }, true);
        } catch (error) {
          throw new Error(`Impossible de charger le groupe « ${g.name} » : ${error instanceof Error ? error.message : 'données invalides.'}`);
        }
        state.groupStore[g.id] = { students: data.students, terms: data.terms, selectedStudentId: data.selectedStudentId };
      });
      applyActiveSubjects(state);
    }

    function stashActiveGroup() {
      appState.groupStore[appState.activeGroupId] = {
        students: appState.students,
        terms: appState.terms,
        selectedStudentId: appState.selectedStudentId
      };
    }

    function hasActiveGroup() {
      const group = appState.groups.find(g => g.id === appState.activeGroupId);
      return !!group && !group.placeholder;
    }

    function switchGroup(groupId) {
      if (!groupId || groupId === appState.activeGroupId || !appState.groupStore[groupId]) return;
      landingPortalRequested = false;
      flushPendingSave();
      const leaving = appState.groups.find(g => g.id === appState.activeGroupId);
      let recoveredGroup = false;
      if (leaving && leaving.placeholder) {
        const omitEmptyTargets = (key, value) => key === 'targetLevels' && Array.isArray(value) && !value.length ? undefined : value;
        const hasData = appState.students.length > 0 ||
          JSON.stringify(appState.terms, omitEmptyTargets) !== JSON.stringify(createBlankGroupData().terms, omitEmptyTargets);
        if (hasData) {
          delete leaving.placeholder;
          stashActiveGroup();
          recoveredGroup = true;
        } else {
          appState.groups = appState.groups.filter(g => g !== leaving);
        }
      } else {
        stashActiveGroup();
      }
      const next = appState.groupStore[groupId];
      delete appState.groupStore[groupId];
      appState.students = next.students;
      appState.terms = next.terms;
      appState.selectedStudentId = null;
      gbFilter = '';
      document.getElementById('headerStudentSearch').value = '';
      document.getElementById('studentSearchMessage').textContent = '';
      appState.activeGroupId = groupId;
      expandedSubjectGroup = null;
      applyActiveSubjects(appState);
      if (!SUBJECTS_CONFIG.some(s => s.id === appState.activeSubjectId)) appState.activeSubjectId = SUBJECTS_CONFIG[0].id;
      competencySubjectSelected = null;
      const g = appState.groups.find(x => x.id === groupId);
      notifyUpdate(recoveredGroup ? `Vos données précédentes ont été conservées dans « ${leaving.name} ».` : `Groupe « ${g ? g.name : ''} »`);
      renderAll();
    }

    function createGroup(name, subjectIds, copyFromGroupId, level) {
      expandedSubjectGroup = null;
      const id = 'g' + Date.now();
      appState.groups.push({ id, name: name || 'Nouveau groupe', subjectIds, level: level || '' });
      const data = createBlankGroupData();
      if (copyFromGroupId) {
        const src = copyFromGroupId === appState.activeGroupId
          ? { students: appState.students }
          : appState.groupStore[copyFromGroupId];
        (src ? src.students : []).forEach(st => {
          data.students.push({ ...JSON.parse(JSON.stringify(st)), gradeLevel: level || st.gradeLevel || '', competencyLevelsByCycle: {}, competencyCriterionLevelsByCycle: {}, competencyEvidenceByCycle: {}, competencyTerms: undefined, competencySentences: undefined, competencyComments: undefined });
        });
        const fresh = { '1': buildTermDataForStudents(data.students), '2': buildTermDataForStudents(data.students), '3': buildTermDataForStudents(data.students) };
        data.terms = fresh;
      }
      appState.groupStore[id] = data;
      switchGroup(id);
    }

    function deleteGroup(groupId) {
      if (appState.groups.length < 2) return;
      const wasActive = groupId === appState.activeGroupId;
      if (wasActive) switchGroup(appState.groups.find(g => g.id !== groupId).id);
      appState.groups = appState.groups.filter(g => g.id !== groupId);
      delete appState.groupStore[groupId];
      notifyUpdate('Groupe supprimé');
      renderAll();
    }

