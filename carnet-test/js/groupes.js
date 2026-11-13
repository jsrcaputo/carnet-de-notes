    function createBlankObsSession(students) {
      const studentDrafts = {};
      students.forEach(st => {
        studentDrafts[st.id] = {
          checked: [],
          overrideCode: null,
          tags: [],
          comment: '',
          gradeLevel: st.gradeLevel || '',
          notEvaluated: false
        };
      });
      return {
        editingAssignmentId: null,
        rubricVersion: 5,
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
      let groups = Array.isArray(state.groups) ? state.groups.filter(g => g && g.id) : [];
      groups = groups.map(g => ({
        id: String(g.id),
        name: String(g.name || '').trim() || 'Groupe',
        subjectIds: (Array.isArray(g.subjectIds) ? g.subjectIds : DEFAULT_GROUP_SUBJECT_IDS).filter(id => valid.has(id)),
        level: GRADE_LEVEL_LABELS[String(g.level)] ? String(g.level) : '',
        ...(g.placeholder ? { placeholder: true } : {})
      }));
      if (!groups.length) groups = [{ id: 'g1', name: 'Mon groupe', subjectIds: DEFAULT_GROUP_SUBJECT_IDS.slice(), level: '' }];
      state.groups = groups;
      if (!groups.some(g => g.id === state.activeGroupId)) state.activeGroupId = groups[0].id;
      const oldStore = state.groupStore && typeof state.groupStore === 'object' ? state.groupStore : {};
      state.groupStore = {};
      groups.forEach(g => {
        if (g.id === state.activeGroupId) return;
        const saved = oldStore[g.id];
        if (!saved || !Array.isArray(saved.students) || !saved.terms) {
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

