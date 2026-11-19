    function createInitialState() {
      const students = [];
      const tagCategories = JSON.parse(JSON.stringify(PIA_TAG_CATEGORIES));

      return {
        groups: [{ id: 'g1', name: 'Mon groupe', subjectIds: DEFAULT_GROUP_SUBJECT_IDS.slice(), placeholder: true }],
        activeGroupId: 'g1',
        groupStore: {},
        version: 9,
        activeTerm: '1',
        activeSubjectId: 'math_resoudre',
        activeView: 'viewStudents',
        selectedStudentId: null,
        annualWeightMode: 'official',
        activeTagCategoryId: 'autonomie',
        tagCategories,
        students,
        terms: {
          '1': buildTermDataForStudents(students),
          '2': buildTermDataForStudents(students),
          '3': buildTermDataForStudents(students)
        }
      };
    }

    let appState = createInitialState();
    applyActiveSubjects(appState);
    let competencyPanelOpen = false;
    let competencySubjectSelected = null;
    const competencyScaleSelected = {};
    let competencyTermSelected = null;
    let observationDraftBaseline = null;

    const OWN = Object.prototype.hasOwnProperty;
    const SAFE_IMPORTED_ID = /^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/;
    const RESERVED_IMPORTED_IDS = new Set(['__proto__', 'prototype', 'constructor']);

    function isRecord(value) {
      return value !== null && typeof value === 'object' && !Array.isArray(value);
    }

    function isSafeImportedId(value) {
      const id = typeof value === 'string' || typeof value === 'number' ? String(value) : '';
      return SAFE_IMPORTED_ID.test(id) && !RESERVED_IMPORTED_IDS.has(id);
    }

    function makeImportedId(value, prefix, used) {
      const candidate = typeof value === 'string' || typeof value === 'number' ? String(value) : '';
      if (SAFE_IMPORTED_ID.test(candidate) && !RESERVED_IMPORTED_IDS.has(candidate) && !used.has(candidate)) {
        used.add(candidate);
        return candidate;
      }
      let id;
      let index = used.size + 1;
      do {
        id = `${prefix}_import_${index++}`;
      } while (used.has(id));
      used.add(id);
      return id;
    }

    function normalizeImportedState(imported, isStore = false) {
      if (!imported || !Array.isArray(imported.students) || !imported.terms || typeof imported.terms !== 'object') {
        throw new Error('Le fichier ne contient pas une sauvegarde de carnet valide.');
      }

      const studentIds = new Set();
      const studentSources = imported.students.filter(isRecord).filter(st => OWN.call(st, 'id')).map(st => ({
        originalId: String(st.id),
        importedId: makeImportedId(st.id, 'stu', studentIds),
        source: st
      }));
      const studentIdMap = new Map();
      studentSources.forEach(item => {
        if (!studentIdMap.has(item.originalId)) studentIdMap.set(item.originalId, item.importedId);
      });
      imported.students = studentSources.map(({ source: st, importedId }) => ({
        ...st,
        id: importedId,
        name: String(st.name || '').trim() || 'Élève',
        firstName: typeof st.firstName === 'string' ? st.firstName.trim() : String(st.name || '').trim() || 'Élève',
        lastName: typeof st.lastName === 'string' ? st.lastName.trim() : '',
        gradeLevel: GRADE_LEVEL_LABELS[String(st.gradeLevel)] ? String(st.gradeLevel) : '',
        adaptations: Array.isArray(st.adaptations) ? [...new Set(st.adaptations.map(a => a === 'WordQ Écriture' ? 'Prédicteur de mots' : a).filter(Boolean))] : [],
        customAdapt: typeof st.customAdapt === 'string' ? st.customAdapt : '',
        modifiedExpectations: (() => {
          const raw = st.modifiedExpectations;
          if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
          const clean = {};
          Object.entries(raw).forEach(([k, v]) => {
            const lvl = String(v || '');
            if (ALL_SUBJECTS_CONFIG.some(subject => subject.id === k || subject.group === k) && GRADE_LEVEL_LABELS[lvl]) clean[k] = lvl;
          });
          return clean;
        })(),
        competencyLevelsByCycle: [1, 2, 3].reduce((levelsByCycle, cycle) => {
          const savedCycleLevels = st.competencyLevelsByCycle && typeof st.competencyLevelsByCycle === 'object'
            ? st.competencyLevelsByCycle[cycle]
            : null;
          levelsByCycle[cycle] = {};
          if (savedCycleLevels && typeof savedCycleLevels === 'object') {
            ALL_SUBJECTS_CONFIG.forEach(subject => {
              const level = String(savedCycleLevels[subject.id] || '');
              if (['1', '2', '3', '4', '5'].includes(level)) {
                levelsByCycle[cycle][subject.id] = level;
              }
            });
          }
          return levelsByCycle;
        }, {}),
        competencyCriterionLevelsByCycle: [1, 2, 3].reduce((evidenceByCycle, cycle) => {
          const savedCycleEvidence = st.competencyCriterionLevelsByCycle && typeof st.competencyCriterionLevelsByCycle === 'object'
            ? st.competencyCriterionLevelsByCycle[cycle]
            : null;
          evidenceByCycle[cycle] = {};
          if (savedCycleEvidence && typeof savedCycleEvidence === 'object') {
            ALL_SUBJECTS_CONFIG.forEach(subject => {
              const savedSubjectEvidence = savedCycleEvidence[subject.id];
              if (!savedSubjectEvidence || typeof savedSubjectEvidence !== 'object') return;
              const validCriteria = new Set(getScoredObservableCriteria(
                getCriteriaForGradeLevel(subject, cycle * 2)
              ).map(criterion => criterion.id));
              if (subject.id === 'art_plast_c1c2') {
                getScoredObservableCriteria(LEGACY_ART_PLASTIC_CREATION).forEach(criterion => validCriteria.add(criterion.id));
              }
              if (LEGACY_FRENCH_RUBRICS[cycle][subject.id]) {
                getScoredObservableCriteria(LEGACY_FRENCH_RUBRICS[cycle][subject.id]).forEach(criterion => validCriteria.add(criterion.id));
              }
              const normalizedEvidence = {};
              Object.entries(savedSubjectEvidence).forEach(([criterionId, level]) => {
                const normalizedLevel = String(level || '');
                if (validCriteria.has(criterionId) && ['1', '2', '3', '4', '5'].includes(normalizedLevel)) {
                  normalizedEvidence[criterionId] = normalizedLevel;
                }
              });
              if (Object.keys(normalizedEvidence).length) {
                evidenceByCycle[cycle][subject.id] = normalizedEvidence;
              }
            });
          }
          return evidenceByCycle;
        }, {}),
        competencyEvidenceByCycle: [1, 2, 3].reduce((evidenceByCycle, cycle) => {
          const savedCycleEvidence = st.competencyEvidenceByCycle && typeof st.competencyEvidenceByCycle === 'object'
            ? st.competencyEvidenceByCycle[cycle]
            : null;
          evidenceByCycle[cycle] = {};
          if (savedCycleEvidence && typeof savedCycleEvidence === 'object') {
            ALL_SUBJECTS_CONFIG.forEach(subject => {
              const validIds = new Set(Object.entries(COMPETENCY_INDICATORS[subject.id] || {}).flatMap(([groupId, items]) =>
                items.map((_, itemIndex) => `${groupId}_${itemIndex + 1}`)
              ));
              const savedIds = savedCycleEvidence[subject.id];
              if (!Array.isArray(savedIds)) return;
              const normalizedIds = [...new Set(savedIds.filter(id => validIds.has(id)))];
              if (normalizedIds.length) evidenceByCycle[cycle][subject.id] = normalizedIds;
            });
          }
          return evidenceByCycle;
        }, {})
      }));

      ['1', '2', '3'].forEach(termId => {
        const term = imported.terms[termId];
        if (!term || typeof term !== 'object') {
          throw new Error(`La sauvegarde ne contient pas les données de l’étape ${termId}.`);
        }
        term.subjectData = term.subjectData || {};
        term.observations = Array.isArray(term.observations) ? term.observations : [];

        ALL_SUBJECTS_CONFIG.forEach(sub => {
          if (!OWN.call(term.subjectData, sub.id) || !isRecord(term.subjectData[sub.id])) {
            term.subjectData[sub.id] = buildTermDataForStudents(imported.students).subjectData[sub.id];
          }
          const subData = term.subjectData[sub.id];
          const rawCustomRubrics = Array.isArray(subData.customRubrics) ? subData.customRubrics : [];
          const customRubricIds = new Set();
          const customRubricIdMap = new Map();
          subData.customRubrics = rawCustomRubrics.flatMap(source => {
            if (!isRecord(source)) return [];
            const customRubric = normalizeCustomRubric(source.customRubric, true);
            if (!customRubric) return [];
            const originalId = OWN.call(source, 'id') ? String(source.id) : '';
            const importedId = makeImportedId(source.id, 'rubric', customRubricIds);
            if (originalId && !customRubricIdMap.has(originalId)) customRubricIdMap.set(originalId, importedId);
            const createdAt = typeof source.createdAt === 'string' ? source.createdAt : new Date().toISOString();
            const updatedAt = typeof source.updatedAt === 'string' ? source.updatedAt : createdAt;
            return [{
              id: importedId,
              title: customRubric.title,
              createdAt,
              updatedAt,
              customRubric
            }];
          }).slice(0, 5);
          const rawAssignments = Array.isArray(subData.assignments) ? subData.assignments.filter(isRecord) : [];
          const assignmentIds = new Set();
          const assignmentIdMap = new Map();
          subData.assignments = rawAssignments.map(source => {
            const originalId = OWN.call(source, 'id') ? String(source.id) : '';
            const importedId = makeImportedId(source.id, 'asg', assignmentIds);
            if (originalId && !assignmentIdMap.has(originalId)) assignmentIdMap.set(originalId, importedId);
            const asg = { ...source, id: importedId, title: typeof source.title === 'string' ? source.title : '' };
            if (Array.isArray(asg.targetLevels)) {
              asg.targetLevels = [...new Set(
                asg.targetLevels.map(l => String(l || '')).filter(l => GRADE_LEVEL_LABELS[l] !== undefined)
              )];
              if (!asg.targetLevels.length) delete asg.targetLevels;
            } else {
              delete asg.targetLevels;
            }
            if (asg.weightByLevel && typeof asg.weightByLevel === 'object' && !Array.isArray(asg.weightByLevel)) {
              const cleanWeights = {};
              Object.entries(asg.weightByLevel).forEach(([lvl, w]) => {
                const num = Number(w);
                if (GRADE_LEVEL_LABELS[String(lvl)] !== undefined && Number.isFinite(num) && num >= 0) {
                  cleanWeights[String(lvl)] = num;
                }
              });
              if (Object.keys(cleanWeights).length) asg.weightByLevel = cleanWeights;
              else delete asg.weightByLevel;
            } else {
              delete asg.weightByLevel;
            }
            if (!['portrait', 'weighted', 'custom'].includes(asg.obsMode)) {
              if (asg.obsMode === 'checklist') asg.obsMode = 'portrait';
              else delete asg.obsMode;
            }
            asg.customRubric = normalizeCustomRubric(asg.customRubric, asg.obsMode === 'custom');
            if (!asg.customRubric) {
              delete asg.customRubric;
              if (asg.obsMode === 'custom') asg.obsMode = 'portrait';
            }
            if (asg.criteriaWeights && typeof asg.criteriaWeights === 'object' && !Array.isArray(asg.criteriaWeights)) {
              const cleanCritW = {};
              Object.entries(asg.criteriaWeights).forEach(([cId, w]) => {
                const num = Number(w);
                if (isSafeImportedId(cId) && Number.isFinite(num) && num >= 0 && num <= 100) {
                  cleanCritW[String(cId)] = num;
                }
              });
              if (Object.keys(cleanCritW).length) asg.criteriaWeights = cleanCritW;
              else delete asg.criteriaWeights;
            } else {
              delete asg.criteriaWeights;
            }
            if (!isSafeImportedId(asg.linkId)) delete asg.linkId;
            return asg;
          });
          const rawRecords = isRecord(subData.studentRecords) ? subData.studentRecords : {};
          const cleanRecords = {};
          subData.studentRecords = cleanRecords;
          subData.currentObsSession = isRecord(subData.currentObsSession)
            ? subData.currentObsSession
            : createBlankObsSession(imported.students);
          subData.currentObsSession.obsMode = ['portrait', 'weighted', 'custom'].includes(subData.currentObsSession.obsMode)
            ? subData.currentObsSession.obsMode
            : 'portrait';
          subData.currentObsSession.customRubric = normalizeCustomRubric(
            subData.currentObsSession.customRubric,
            subData.currentObsSession.obsMode === 'custom'
          );
          const selectedCustomRubricId = customRubricIdMap.get(String(subData.currentObsSession.selectedCustomRubricId || ''))
            || String(subData.currentObsSession.selectedCustomRubricId || '');
          const selectedCustomRubric = subData.customRubrics.find(item => item.id === selectedCustomRubricId);
          subData.currentObsSession.selectedCustomRubricId =
            subData.currentObsSession.obsMode === 'custom' && selectedCustomRubric
              ? selectedCustomRubric.id
              : null;
          if (selectedCustomRubric && subData.currentObsSession.selectedCustomRubricId) {
            subData.currentObsSession.customRubric = cloneCustomRubric(selectedCustomRubric.customRubric);
          }
          if (!subData.currentObsSession.customRubric && subData.currentObsSession.obsMode === 'custom') {
            subData.currentObsSession.obsMode = 'portrait';
            subData.currentObsSession.selectedCustomRubricId = null;
          }
          if (!isRecord(subData.currentObsSession.criteriaWeights)) {
            subData.currentObsSession.criteriaWeights = null;
          } else {
            const cleanCriteriaWeights = {};
            Object.entries(subData.currentObsSession.criteriaWeights).forEach(([criterionId, weight]) => {
              const num = Number(weight);
              if (isSafeImportedId(criterionId) && Number.isFinite(num) && num >= 0 && num <= 100) {
                cleanCriteriaWeights[criterionId] = num;
              }
            });
            subData.currentObsSession.criteriaWeights = Object.keys(cleanCriteriaWeights).length
              ? cleanCriteriaWeights
              : null;
          }
          const rawDrafts = isRecord(subData.currentObsSession.studentDrafts)
            ? subData.currentObsSession.studentDrafts
            : {};
          subData.currentObsSession.studentDrafts = {};
          if (Array.isArray(subData.currentObsSession.targetLevels)) {
            subData.currentObsSession.targetLevels = [...new Set(
              subData.currentObsSession.targetLevels.map(l => String(l || '')).filter(l => GRADE_LEVEL_LABELS[l] !== undefined)
            )];
          } else {
            subData.currentObsSession.targetLevels = [];
          }
          if (assignmentIdMap.has(String(subData.currentObsSession.editingAssignmentId))) {
            subData.currentObsSession.editingAssignmentId = assignmentIdMap.get(String(subData.currentObsSession.editingAssignmentId));
          } else {
            delete subData.currentObsSession.editingAssignmentId;
          }

          studentSources.forEach(({ originalId, importedId }) => {
            const sourceRec = OWN.call(rawRecords, originalId) && isRecord(rawRecords[originalId])
              ? rawRecords[originalId]
              : {};
            const rec = { ...sourceRec };
            const rawScores = isRecord(sourceRec.scores) ? sourceRec.scores : {};
            const rawScoreMeta = isRecord(sourceRec.scoreMeta) ? sourceRec.scoreMeta : {};
            rec.scores = {};
            rec.scoreMeta = {};
            subData.assignments.forEach((asg, index) => {
              const oldAsgId = rawAssignments[index] && OWN.call(rawAssignments[index], 'id')
                ? String(rawAssignments[index].id)
                : '';
              if (OWN.call(rawScores, oldAsgId)) rec.scores[asg.id] = rawScores[oldAsgId];
              const m = OWN.call(rawScoreMeta, oldAsgId) && isRecord(rawScoreMeta[oldAsgId])
                ? { ...rawScoreMeta[oldAsgId] }
                : null;
              if (!m) return;
              if (!['portrait', 'weighted', 'custom'].includes(m.obsMode)) delete m.obsMode;
              m.customRubric = normalizeCustomRubric(m.customRubric, m.obsMode === 'custom');
              if (!m.customRubric) delete m.customRubric;
              if (m.obsMode === 'custom' && !m.customRubric) m.obsMode = 'portrait';
              if (Array.isArray(m.flags)) {
                m.flags = [...new Set(m.flags.filter(code => VALID_CELL_FLAG_CODES.has(code)))];
                if (!m.flags.length) delete m.flags;
              }
              rec.scoreMeta[asg.id] = m;
            });
            rec.baremeChecked = Array.isArray(rec.baremeChecked) ? rec.baremeChecked : [];
            rec.baremeOverrideCode = rec.baremeOverrideCode || null;
            rec.finalJudgmentOverride = rec.finalJudgmentOverride ?? '';
            rec.comment = typeof rec.comment === 'string' ? rec.comment : '';
            cleanRecords[importedId] = rec;

            const draftSource = OWN.call(rawDrafts, originalId) && isRecord(rawDrafts[originalId])
              ? rawDrafts[originalId]
              : {};
            const draft = { ...draftSource };
            draft.checked = Array.isArray(draft.checked) ? draft.checked : [];
            draft.overrideCode = draft.overrideCode || null;
            draft.tags = Array.isArray(draft.tags) ? draft.tags : [];
            draft.comment = typeof draft.comment === 'string' ? draft.comment : '';
            draft.strengths = typeof draft.strengths === 'string' ? draft.strengths : '';
            draft.challenges = typeof draft.challenges === 'string' ? draft.challenges : '';
            draft.notEvaluated = draft.notEvaluated === true;
            draft.gradeLevel = GRADE_LEVEL_LABELS[String(draft.gradeLevel)]
              ? String(draft.gradeLevel)
              : imported.students.find(st => st.id === importedId).gradeLevel;
            subData.currentObsSession.studentDrafts[importedId] = draft;
          });
          subData.assignmentIdMap = assignmentIdMap;
        });
      });

      ['1', '2', '3'].forEach(termId => {
        const term = imported.terms[termId];
        const rawObservations = Array.isArray(term.observations) ? term.observations : [];
        const observationIds = new Set();
        term.observations = rawObservations.filter(isRecord).map(source => {
          const observation = { ...source };
          observation.id = makeImportedId(source.id, 'obs', observationIds);
          if (studentIdMap.has(String(source.studentId))) observation.studentId = studentIdMap.get(String(source.studentId));
          const subjectData = OWN.call(term.subjectData, String(source.subjectId))
            ? term.subjectData[String(source.subjectId)]
            : null;
          if (subjectData && subjectData.assignmentIdMap.has(String(source.asgId))) {
            observation.asgId = subjectData.assignmentIdMap.get(String(source.asgId));
          }
          return observation;
        }).filter(observation => {
          return imported.students.some(st => st.id === observation.studentId)
            && typeof observation.subjectId === 'string'
            && ALL_SUBJECTS_CONFIG.some(subject => subject.id === observation.subjectId);
        });
        ALL_SUBJECTS_CONFIG.forEach(sub => {
          if (term.subjectData && term.subjectData[sub.id]) delete term.subjectData[sub.id].assignmentIdMap;
        });
      });

      imported.version = 9;
      imported.activeTerm = ['1', '2', '3'].includes(String(imported.activeTerm)) ? String(imported.activeTerm) : '1';
      imported.annualWeightMode = imported.annualWeightMode === 'equal' ? 'equal' : 'official';
      if (!isStore) normalizeGroups(imported);
      imported.activeSubjectId = SUBJECTS_CONFIG.some(sub => sub.id === imported.activeSubjectId)
        ? imported.activeSubjectId
        : SUBJECTS_CONFIG[0].id;
      imported.activeView = ['viewGradebook', 'viewBareme', 'viewQuickObs', 'viewStudents', 'viewGlobalReport'].includes(imported.activeView)
        ? imported.activeView
        : 'viewGradebook';
      imported.selectedStudentId = null;
      imported.tagCategories = Array.isArray(imported.tagCategories)
        ? imported.tagCategories
        : JSON.parse(JSON.stringify(PIA_TAG_CATEGORIES));
      return imported;
    }

    // Enforce strictly ONE checked box per criterion row
    function toggleSingleChoiceInRow(checkedArray, rowIdPrefix, clickedKey) {
      const alreadySelected = checkedArray.includes(clickedKey);
      const filtered = checkedArray.filter(k => !k.startsWith(rowIdPrefix + '_'));
      if (!alreadySelected) {
        filtered.push(clickedKey);
      }
      return filtered;
    }

    function getActiveTermData() {
      if (!appState.terms || !appState.terms[appState.activeTerm]) {
        appState.terms = appState.terms || {};
        appState.terms[appState.activeTerm] = buildTermDataForStudents(appState.students);
      }
      const td = appState.terms[appState.activeTerm];
      SUBJECTS_CONFIG.forEach(sub => {
        if (!Array.isArray(td.subjectData[sub.id].customRubrics)) {
          td.subjectData[sub.id].customRubrics = [];
        }
        if (!td.subjectData[sub.id].currentObsSession) {
          td.subjectData[sub.id].currentObsSession = createBlankObsSession(appState.students);
        }
        appState.students.forEach(st => {
          if (!td.subjectData[sub.id].currentObsSession.studentDrafts[st.id]) {
            td.subjectData[sub.id].currentObsSession.studentDrafts[st.id] = {
              checked: [],
              overrideCode: null,
              tags: [],
              comment: '',
              strengths: '',
              challenges: ''
            };
          }
          if (!td.subjectData[sub.id].studentRecords[st.id].scoreMeta) {
            td.subjectData[sub.id].studentRecords[st.id].scoreMeta = {};
          }
        });
      });
      return td;
    }

    function openVisualTraceForEditing(asgId, focusStudentId) {
      const sub = getCurrentSubjectConfig();
      const termData = getActiveTermData();
      const subData = termData.subjectData[sub.id];
      const asg = subData.assignments.find(a => a.id === asgId && a.isObservation);
      if (!asg) return;
      requestObservationDraftExit(() => {
        const session = createBlankObsSession(appState.students);
        session.editingAssignmentId = asg.id;
        session.rubricVersion = asg.rubricVersion;
        session.obsMode = ['portrait', 'weighted', 'custom'].includes(asg.obsMode) ? asg.obsMode : 'portrait';
        session.criteriaWeights = (asg.criteriaWeights && typeof asg.criteriaWeights === 'object') ? { ...asg.criteriaWeights } : null;
        const restoredMetaRubric = Object.values(subData.studentRecords)
          .map(record => record.scoreMeta && record.scoreMeta[asg.id])
          .find(meta => meta && meta.customRubric)?.customRubric;
        session.customRubric = cloneCustomRubric(asg.customRubric || restoredMetaRubric);
        session.title = asg.title;
        session.targetLevels = getAssignmentTargetLevels(asg);

        appState.students.forEach(st => {
          const rec = subData.studentRecords[st.id];
          const meta = (rec.scoreMeta && rec.scoreMeta[asg.id]) ? rec.scoreMeta[asg.id] : null;
          if (meta && !meta.linkedCopy) {
            session.studentDrafts[st.id] = {
              checked: Array.isArray(meta.checked) ? meta.checked.slice() : [],
              overrideCode: meta.overrideCode || null,
              tags: Array.isArray(meta.tags) ? meta.tags.slice() : [],
              comment: meta.comment || '',
              strengths: typeof meta.strengths === 'string' ? meta.strengths : '',
              challenges: typeof meta.challenges === 'string' ? meta.challenges : '',
              gradeLevel: meta.gradeLevel || st.gradeLevel || '',
              notEvaluated: meta.notEvaluated === true
            };
          }
        });
        session.savedDraftSnapshot = getCurrentObservationSessionSnapshot(session);

        subData.currentObsSession = session;
        appState.selectedStudentId = focusStudentId || null;
        appState.activeView = 'viewQuickObs';
        showToast(`Modification de "${asg.title}"`);
        renderAll();
        observationDraftBaseline = session.savedDraftSnapshot;
      });
    }

    function startNewVisualTraceSession() {
      if (!appState.students.length) {
        showToast('Ajoutez d’abord un élève et choisissez son niveau.');
        navigateToView('viewStudents');
        return;
      }
      if (!appState.students.some(student => getStudentCycle(student.gradeLevel))) {
        showToast('Choisissez le niveau d’au moins un élève avant de créer une grille.');
        navigateToView('viewStudents');
        return;
      }
      requestObservationDraftExit(() => {
        const sub = getCurrentSubjectConfig();
        const termData = getActiveTermData();
        const subData = termData.subjectData[sub.id];
        subData.currentObsSession = createBlankObsSession(appState.students);
        if (isMultiLevelGroup() && gbLevelFilter !== 'ALL') {
          subData.currentObsSession.targetLevels = [gbLevelFilter];
        } else {
          subData.currentObsSession.targetLevels = [];
        }
        subData.currentObsSession.savedDraftSnapshot = getCurrentObservationSessionSnapshot(subData.currentObsSession);
        appState.selectedStudentId = null;
        appState.activeView = 'viewQuickObs';
        renderAll();
        observationDraftBaseline = subData.currentObsSession.savedDraftSnapshot;
        const titleInput = document.getElementById('qoSessionTitleInput');
        if (titleInput) titleInput.focus();
      });
    }

    function normalizeAdaptationLabel(label) {
      const value = String(label || '').trim();
      return value === 'WordQ Écriture' ? 'Prédicteur de mots' : value;
    }

    function getStudentAdaptationSummary(st) {
      const raw = Array.isArray(st && st.adaptations)
        ? [...new Set(st.adaptations.map(normalizeAdaptationLabel).filter(Boolean))]
        : [];
      const adaptations = raw.filter(a => a !== 'Bulletin modifié');
      const customAdapt = st && st.customAdapt ? st.customAdapt.trim() : '';
      if (customAdapt && !adaptations.includes(customAdapt)) {
        adaptations.push(customAdapt);
      }
      const modList = typeof getStudentModifiedSummaryList === 'function' ? getStudentModifiedSummaryList(st) : [];
      const hasModifiedBulletin = Boolean(st && st.gradeLevel !== 'P' && raw.includes('Bulletin modifié'));
      return {
        adaptations,
        customAdapt,
        hasModifiedBulletin,
        modifiedItems: hasModifiedBulletin ? modList : []
      };
    }

    function formatStudentAdaptations(st) {
      const summary = getStudentAdaptationSummary(st);
      const list = summary.adaptations.slice();
      if (summary.hasModifiedBulletin) {
        const label = summary.modifiedItems.length > 0
          ? `Bulletin modifié (${summary.modifiedItems.map(m => `${m.label} : ${m.levelLabel}`).join(', ')})`
          : 'Bulletin modifié';
        list.push(label);
      }
      return list.length > 0 ? list.join(' • ') : 'Aucune adaptation';
    }

    // ---- Gestion Multi-Niveau (ex. 5e et 6e année dans le même groupe) ----
    let gbLevelFilter = 'ALL';
    let modalAddAsgTargetLevels = [];

    function getPresentStudentLevels() {
      const order = ['P', '1', '2', '3', '4', '5', '6'];
      const seen = new Set();
      (appState.students || []).forEach(st => {
        const lvl = String((st && st.gradeLevel) || '');
        if (GRADE_LEVEL_LABELS[lvl]) seen.add(lvl);
      });
      return order.filter(lvl => seen.has(lvl));
    }

    function isMultiLevelGroup() {
      return getPresentStudentLevels().length > 1;
    }

    function ensureValidGbLevelFilter() {
      const present = getPresentStudentLevels();
      if (gbLevelFilter !== 'ALL' && !present.includes(gbLevelFilter)) {
        gbLevelFilter = 'ALL';
      }
      return gbLevelFilter;
    }

    function getAssignmentTargetLevels(asg) {
      if (!asg || !Array.isArray(asg.targetLevels)) return [];
      return asg.targetLevels.map(String).filter(lvl => GRADE_LEVEL_LABELS[lvl]);
    }

    function isAssignmentForLevel(asg, level) {
      if (!level || level === 'ALL' || !GRADE_LEVEL_LABELS[String(level)]) return true;
      const targets = getAssignmentTargetLevels(asg);
      return targets.length === 0 || targets.includes(String(level));
    }

    function isAssignmentForStudent(asg, student) {
      if (!student || !GRADE_LEVEL_LABELS[String(student.gradeLevel)]) return true;
      return isAssignmentForLevel(asg, String(student.gradeLevel));
    }

    function formatShortLevelTag(level) {
      if (level === 'P') return 'Présco';
      if (level === '1') return '1re';
      return `${level}e`;
    }

    function formatAssignmentTargetBadge(asg) {
      const targets = getAssignmentTargetLevels(asg);
      if (!targets.length) return 'Tous';
      return targets.map(formatShortLevelTag).join('/');
    }

    function getAssignmentWeightForLevel(asg, level, subject = SUBJECTS_CONFIG.find(s => s.id === appState.activeSubjectId), termData) {
      if (!asg) return 100;
      let sourceAsg = asg;
      if (asg.linkId && asg.linkOrigin === false && subject && subject.singleResult) {
        const origin = getLinkedAssignments(asg, termData).find(l => l.asg.linkOrigin !== false);
        if (origin && origin.asg) sourceAsg = origin.asg;
      }
      const lvl = String(level || '');
      if (lvl && lvl !== 'ALL' && sourceAsg.weightByLevel && typeof sourceAsg.weightByLevel === 'object') {
        const byLvl = Number(sourceAsg.weightByLevel[lvl]);
        if (sourceAsg.weightByLevel[lvl] !== undefined && Number.isFinite(byLvl)) {
          return byLvl;
        }
      }
      const targets = getAssignmentTargetLevels(sourceAsg);
      if (targets.length === 1 && sourceAsg.weightByLevel && typeof sourceAsg.weightByLevel === 'object') {
        const singleW = Number(sourceAsg.weightByLevel[targets[0]]);
        if (sourceAsg.weightByLevel[targets[0]] !== undefined && Number.isFinite(singleW)) {
          return singleW;
        }
      }
      const baseW = Number(sourceAsg.weight);
      return sourceAsg.weight !== undefined && Number.isFinite(baseW) ? baseW : 100;
    }

    function setAssignmentWeightForLevel(asg, level, val) {
      if (!asg) return;
      const num = Math.max(0, Math.round(Number.isFinite(Number(val)) ? Number(val) : 0));
      const targets = getAssignmentTargetLevels(asg);
      const present = getPresentStudentLevels();
      if (!isMultiLevelGroup() || targets.length === 1) {
        asg.weight = num;
        if (asg.weightByLevel && typeof asg.weightByLevel === 'object') {
          if (targets.length === 1) asg.weightByLevel[targets[0]] = num;
          else present.forEach(l => { asg.weightByLevel[l] = num; });
        }
      } else if (level && level !== 'ALL') {
        asg.weightByLevel = (asg.weightByLevel && typeof asg.weightByLevel === 'object') ? asg.weightByLevel : {};
        present.forEach(l => {
          if (asg.weightByLevel[l] === undefined) asg.weightByLevel[l] = asg.weight !== undefined ? Math.round(Number(asg.weight)) : 100;
        });
        asg.weightByLevel[String(level)] = num;
        asg.weight = num;
      } else {
        asg.weight = num;
        if (asg.weightByLevel) {
          present.forEach(l => { asg.weightByLevel[l] = num; });
        }
      }
    }

    function distributeIntegersEqually(totalUnits, count) {
      if (count <= 0) return [];
      const base = Math.floor(totalUnits / count);
      const rem = totalUnits - base * count;
      return Array.from({ length: count }, (_, idx) => base + (idx >= count - rem ? 1 : 0));
    }

    function recalculateEqualWeights(subObj) {
      const allAsgs = subObj.assignments;
      if (allAsgs.length === 0) return;
      const present = getPresentStudentLevels();
      if (present.length <= 1) {
        const shares = distributeIntegersEqually(100, allAsgs.length);
        allAsgs.forEach((a, idx) => {
          delete a.weightByLevel;
          a.weight = shares[idx];
        });
        return;
      }

      // En multi-niveau (ex. 5e et 6e), répartir 100 % en entiers (bonds de 1 %) à l'intérieur de chaque niveau présent
      allAsgs.forEach(a => {
        a.weightByLevel = {};
      });
      present.forEach(lvl => {
        const applicable = allAsgs.filter(a => isAssignmentForLevel(a, lvl));
        const shares = distributeIntegersEqually(100, applicable.length);
        applicable.forEach((a, idx) => {
          a.weightByLevel[lvl] = shares[idx];
        });
      });
      allAsgs.forEach(a => {
        const vals = Object.values(a.weightByLevel || {});
        if (vals.length > 0) {
          a.weight = vals[0];
          const allEqual = vals.every(v => v === vals[0]);
          if (allEqual && getAssignmentTargetLevels(a).length === 1) {
            delete a.weightByLevel;
          }
        } else {
          a.weight = 100;
        }
      });
    }

    function getTotalAssignmentWeightsForLevel(subObj, level) {
      let sum = 0;
      subObj.assignments.forEach(a => {
        if (!isAssignmentForLevel(a, level)) return;
        const w = getAssignmentWeightForLevel(a, level);
        if (!isNaN(w)) sum += w;
      });
      return Math.round(sum * 10) / 10;
    }

    function isLevelWeightSumValid100(subObj, level) {
      const applicable = subObj.assignments.filter(a => isAssignmentForLevel(a, level));
      if (applicable.length === 0) return true;
      const total = getTotalAssignmentWeightsForLevel(subObj, level);
      return Math.abs(total - 100) <= 0.15;
    }

    function getTotalAssignmentWeights(subObj) {
      const present = getPresentStudentLevels();
      if (present.length > 1) {
        const filterLvl = ensureValidGbLevelFilter();
        if (filterLvl !== 'ALL') {
          return getTotalAssignmentWeightsForLevel(subObj, filterLvl);
        }
        const activeTotals = present
          .filter(lvl => subObj.assignments.some(a => isAssignmentForLevel(a, lvl)))
          .map(lvl => getTotalAssignmentWeightsForLevel(subObj, lvl));
        if (!activeTotals.length) return 0;
        if (activeTotals.every(t => Math.abs(t - 100) <= 0.15)) return 100;
        return activeTotals[0];
      }
      let sum = 0;
      subObj.assignments.forEach(a => {
        const w = Number(a.weight);
        if (!isNaN(w)) sum += w;
      });
      return Math.round(sum * 10) / 10;
    }

    function isWeightSumValid100(subObj) {
      if (subObj.assignments.length === 0) return true;
      const present = getPresentStudentLevels();
      if (present.length > 1) {
        return present.every(lvl => isLevelWeightSumValid100(subObj, lvl));
      }
      const total = getTotalAssignmentWeights(subObj);
      return Math.abs(total - 100) <= 0.15;
    }

    function isAssignmentWeightBoxValid(subObj, asg) {
      const present = getPresentStudentLevels();
      if (present.length <= 1) return isWeightSumValid100(subObj);
      const filterLvl = ensureValidGbLevelFilter();
      if (filterLvl !== 'ALL') return isLevelWeightSumValid100(subObj, filterLvl);
      const applicableLevels = present.filter(lvl => isAssignmentForLevel(asg, lvl));
      if (!applicableLevels.length) return true;
      return applicableLevels.every(lvl => isLevelWeightSumValid100(subObj, lvl));
    }

    // ---- Recherche d'élèves ----
    let stFilter = '';
    let gbFilter = '';
    let gbSort = { key: '', dir: 1 };
    const GB_SORT_OPTIONS = [
      { key: 'firstName', label: 'Prénom', dir: 1 },
      { key: 'lastName', label: 'Nom de famille', dir: 1 },
      { key: 'avg', label: 'Moyenne', dir: -1 },
      { key: 'final', label: 'Note finale', dir: -1 }
    ];
    // Tri d'affichage seulement : l'ordre de la liste d'élèves n'est pas modifié
    function getGradebookStudents(sub) {
      const list = appState.students.slice();
      if (!gbSort.key) return list;
      const text = s => gbSort.key === 'lastName' ? (s.lastName || '') : (s.firstName || s.name || '');
      const num = s => {
        const summary = computeStudentSubjectSummary(appState.activeTerm, sub.id, s.id);
        return gbSort.key === 'avg' ? summary.assignmentsAvg : summary.finalPct;
      };
      const numeric = gbSort.key === 'avg' || gbSort.key === 'final';
      return list.sort((a, b) => {
        if (numeric) {
          const x = num(a), y = num(b);
          if (x === null || y === null) return x === y ? 0 : (x === null ? 1 : -1);
          return (x - y) * gbSort.dir;
        }
        const tie = (a.name || '').localeCompare(b.name || '', 'fr', { sensitivity: 'base' });
        return (text(a).localeCompare(text(b), 'fr', { sensitivity: 'base' }) || tie) * gbSort.dir;
      });
    }
    function openGradebookSortBar(event) {
      const rect = event.currentTarget.getBoundingClientRect();
      const options = GB_SORT_OPTIONS.map(o => ({
        id: o.key,
        label: o.label + (gbSort.key === o.key ? (gbSort.dir === o.dir ? ' ↓' : ' ↑') : ''),
        onPick: () => {
          gbSort = gbSort.key === o.key ? { key: o.key, dir: -gbSort.dir } : { key: o.key, dir: o.dir };
          renderGradebookView();
        }
      }));
      if (gbSort.key) options.push({ label: 'Ordre de la liste', onPick: () => { gbSort = { key: '', dir: 1 }; renderGradebookView(); } });
      openMouseBar(rect.left, rect.bottom, options, gbSort.key);
    }
    let weightMode = false;
    let weightScope = '';
    let weightLevel = '';
    const lockedWeights = new Set();
    const autoLockedWeights = new Set();
    const unlockedWeights = {
      has: id => !lockedWeights.has(id) && !autoLockedWeights.has(id),
      add: id => { lockedWeights.delete(id); autoLockedWeights.delete(id); },
      delete: id => { lockedWeights.add(id); autoLockedWeights.delete(id); },
      clear: () => { lockedWeights.clear(); autoLockedWeights.clear(); },
      forEach: () => {},
      get size() { return lockedWeights.size + autoLockedWeights.size; }
    };
    function isWeightPinned(id) {
      return lockedWeights.has(id);
    }
    function toggleWeightPin(id) {
      if (isWeightPinned(id)) {
        lockedWeights.delete(id);
      } else {
        lockedWeights.add(id);
        autoLockedWeights.delete(id);
      }
    }
    function normText(value) {
      return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    }
    function studentMatches(student, query) {
      const q = normText(query).trim();
      return !q || normText(student.name).includes(q);
    }

    function adjustUnlockedWeight(subData, target, level, newWeight, render = true) {
      const next = Math.round(newWeight);
      if (!Number.isFinite(newWeight) || next < 0 || next > 100) {
        showToast('La pondération doit rester entre 0 et 100 %.');
        return false;
      }
      const presentLevels = getPresentStudentLevels();
      const isMulti = presentLevels.length > 1;
      const levelsToUpdate = (isMulti && (!level || level === 'ALL'))
        ? presentLevels.filter(lvl => isAssignmentForLevel(target, lvl))
        : [level || 'ALL'];
      if (!levelsToUpdate.length) levelsToUpdate.push('ALL');

      const distributeDeltaAcross = (pool, deltaPct, lvlKey) => {
        if (!pool.length || deltaPct === 0) return deltaPct;
        const vals = pool.map(asg => Math.round(getAssignmentWeightForLevel(asg, lvlKey === 'ALL' ? '' : lvlKey)));
        let rem = Math.abs(deltaPct);
        const dir = deltaPct > 0 ? 1 : -1;
        while (rem > 0) {
          const available = vals
            .map((value, index) => ({ index, room: dir > 0 ? 100 - value : value }))
            .filter(item => item.room > 0);
          if (!available.length) break;
          const stepBase = Math.floor(rem / available.length);
          let stepExtra = rem - stepBase * available.length;
          let movedThisPass = 0;
          available.forEach(item => {
            if (rem <= 0) return;
            const wanted = stepBase + (stepExtra > 0 ? 1 : 0);
            const take = Math.min(wanted, item.room, rem);
            if (take > 0) {
              vals[item.index] += dir * take;
              rem -= take;
              movedThisPass += take;
              if (stepExtra > 0) stepExtra--;
            }
          });
          if (movedThisPass === 0) break;
        }
        pool.forEach((asg, index) => {
          const val = Math.round(vals[index]);
          setAssignmentWeightForLevel(asg, lvlKey, val);
          if (getCurrentSubjectConfig().singleResult) {
            getLinkedAssignments(asg).forEach(linked => {
              setAssignmentWeightForLevel(linked.asg, lvlKey, val);
              linked.subData.equalWeights = false;
            });
          }
        });
        return dir > 0 ? rem : -rem;
      };

      let anyChanged = false;
      let blockedByExplicitLocks = false;
      levelsToUpdate.forEach(lvl => {
        const current = Math.round(getAssignmentWeightForLevel(target, lvl === 'ALL' ? '' : lvl));
        const targetTotal = 100;
        const allAsgs = subData.assignments.filter(asg => lvl === 'ALL' || isAssignmentForLevel(asg, lvl));
        const sumAllNow = allAsgs.reduce((acc, asg) => acc + Math.round(getAssignmentWeightForLevel(asg, lvl === 'ALL' ? '' : lvl)), 0);
        const change = next - current;
        if (change === 0 && sumAllNow === targetTotal) return;
        anyChanged = true;

        setAssignmentWeightForLevel(target, lvl, next);
        if (getCurrentSubjectConfig().singleResult) {
          getLinkedAssignments(target).forEach(linked => {
            setAssignmentWeightForLevel(linked.asg, lvl, next);
            linked.subData.equalWeights = false;
          });
        }

        const allPeers = allAsgs.filter(asg => asg !== target);
        if (!allPeers.length) return;

        // Cible de correction en bonds entiers de 1 % pour conserver 100 % par niveau
        const currentTotalWithNext = (sumAllNow - current) + next;
        let neededDelta = targetTotal - currentTotalWithNext;

        // 1) Ajuster d'abord les colonnes libres qui n'ont pas été ajustées juste avant
        const freePeers = allPeers.filter(asg => !lockedWeights.has(asg.id) && !autoLockedWeights.has(asg.id));
        if (freePeers.length && neededDelta !== 0) {
          neededDelta = distributeDeltaAcross(freePeers, neededDelta, lvl);
        }

        // 2) S'il reste un écart (ex. une autre colonne était déjà ajustée mais reste déverrouillée),
        //    répartir en entiers sur les autres colonnes dont le cadenas n'est pas figé manuellement
        if (neededDelta !== 0) {
          const nonManualPeers = allPeers.filter(asg => !lockedWeights.has(asg.id) && autoLockedWeights.has(asg.id));
          if (nonManualPeers.length) {
            neededDelta = distributeDeltaAcross(nonManualPeers, neededDelta, lvl);
          }
        }

        if (neededDelta !== 0 && allPeers.some(asg => lockedWeights.has(asg.id))) {
          blockedByExplicitLocks = true;
        }
      });

      if (!anyChanged) return true;
      // Garder uniquement une priorité interne de non-recul sans jamais fermer le cadenas visuel
      if (!lockedWeights.has(target.id)) autoLockedWeights.add(target.id);
      subData.equalWeights = false;
      const valid100 = isWeightSumValid100(subData);
      const totalW = getTotalAssignmentWeights(subData);
      updateWeightIndicatorsUI(totalW, valid100, subData.assignments.length > 0, subData);
      notifyUpdate(blockedByExplicitLocks
        ? 'Ajusté : libérez une colonne figée ou cliquez sur « Répartir également » pour revenir à 100 %'
        : 'Pondération ajustée');
      scheduleAppStateSave();
      if (render) renderGradebookView();
      return true;
    }

    // ---- Historique (annuler / rétablir) ----
    const history = { undo: [], redo: [], last: null };
    function updateHistoryButtons() {
      const u = document.getElementById('btnUndo');
      const r = document.getElementById('btnRedo');
      if (u) u.disabled = history.undo.length === 0;
      if (r) r.disabled = history.redo.length === 0;
    }
    function recordHistory() {
      const snap = getEditableStateSnapshot();
      if (history.last === null) { history.last = snap; return; }
      if (snap === history.last) return;
      history.undo.push(history.last);
      if (history.undo.length > 60) history.undo.shift();
      history.redo = [];
      history.last = snap;
      updateHistoryButtons();
    }
    function applyHistorySnapshot(snap) {
      const data = JSON.parse(snap);
      if (data.groups) {
        appState.groups = data.groups;
        appState.activeGroupId = data.activeGroupId;
        appState.groupStore = data.groupStore || {};
        applyActiveSubjects(appState);
        if (!SUBJECTS_CONFIG.some(s => s.id === appState.activeSubjectId)) appState.activeSubjectId = SUBJECTS_CONFIG[0].id;
      }
      appState.students = data.students;
      appState.terms = data.terms;
      if (data.tagCategories !== undefined) appState.tagCategories = data.tagCategories;
      history.last = snap;
      renderAll();
      updateHistoryButtons();
      scheduleAppStateSave();
    }
    function flushPendingSave() {
      if (autosaveTimer) {
        clearTimeout(autosaveTimer);
        autosaveTimer = null;
        recordHistory();
      }
    }
    function undoAction() {
      flushPendingSave();
      if (!history.undo.length) { showToast('Rien à annuler'); return; }
      history.redo.push(getEditableStateSnapshot());
      applyHistorySnapshot(history.undo.pop());
      showToast('Action annulée');
    }
    function redoAction() {
      flushPendingSave();
      if (!history.redo.length) { showToast('Rien à rétablir'); return; }
      history.undo.push(getEditableStateSnapshot());
      applyHistorySnapshot(history.redo.pop());
      showToast('Action rétablie');
    }

    // ---- Préférences d'affichage ----
    const CUSTOM_RUBRICS_STORAGE_KEY = 'carnet_notes_custom_rubrics_v1';
    function loadAllCustomWeightedPresets() {
      try {
        const parsed = JSON.parse(window.localStorage.getItem(CUSTOM_RUBRICS_STORAGE_KEY) || '{}');
        return (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) ? parsed : {};
      } catch (_) {
        return {};
      }
    }
    function getCustomWeightedPreset(subjectId, cycle, scoredCriteria = []) {
      const all = loadAllCustomWeightedPresets();
      const key = `${subjectId}__c${cycle}`;
      const saved = all[key];
      if (!saved || typeof saved !== 'object' || Array.isArray(saved) || !scoredCriteria.length) return null;
      const valid = scoredCriteria.every(c => Number.isFinite(Number(saved[c.id])) && Number(saved[c.id]) >= 0);
      if (!valid) return null;
      const out = {};
      scoredCriteria.forEach(c => { out[c.id] = Math.round(Number(saved[c.id])); });
      return out;
    }
    function saveCustomWeightedPreset(subjectId, cycle, weightsMap, scoredCriteria = []) {
      if (!subjectId || !weightsMap || !scoredCriteria.length) return false;
      const clean = {};
      scoredCriteria.forEach(c => {
        clean[c.id] = Math.round(Math.max(0, Number(weightsMap[c.id] || 0)));
      });
      const all = loadAllCustomWeightedPresets();
      all[`${subjectId}__c${cycle}`] = clean;
      try {
        window.localStorage.setItem(CUSTOM_RUBRICS_STORAGE_KEY, JSON.stringify(all));
        return true;
      } catch (_) {
        return false;
      }
    }

    const VALID_PALETTES = ['ocean', 'foret', 'boreal', 'terracotta', 'prune', 'ambre', 'graphite'];
    const PALETTE_LABELS = {
      ocean: 'Bleu Océan',
      foret: 'Vert Forêt',
      boreal: 'Indigo Boréal',
      terracotta: 'Argile & Terracotta',
      prune: 'Prune Éditoriale',
      ambre: 'Ocre & Ambre',
      graphite: 'Graphite & Encre'
    };
    const prefs = { theme: 'light', palette: 'ocean', textSize: 'md', backupReminder: true };
    try {
      const savedPrefs = JSON.parse(window.localStorage.getItem('carnet_notes_prefs_2026_v1') || 'null');
      if (savedPrefs && typeof savedPrefs === 'object') {
        // Thème et palette viennent du carnet ouvert : un carnet vierge démarre en clair, palette bleue.
        if (['xs', 'sm', 'md', 'lg', 'xl'].includes(savedPrefs.textSize)) prefs.textSize = savedPrefs.textSize;
        if (typeof savedPrefs.backupReminder === 'boolean') prefs.backupReminder = savedPrefs.backupReminder;
      }
    } catch (_) {}
    const SUBJECT_STUDIO_ACCENTS = {
      maths: '#1d4ed8',
      francais: '#8f3f2b',
      ccq: '#6d3b8e',
      sciences: '#16697a',
      social: '#9a5b13',
      education_physique: '#15803d',
      anglais: '#2563eb',
      arts: '#9e2a5b'
    };
    let lastSavedFileSnapshot = null;
    let initialEditableSnapshot = null;
    function applyPrefs() {
      const root = document.documentElement;
      root.classList.add('design-studio');
      const activePalette = VALID_PALETTES.includes(prefs.palette) ? prefs.palette : 'ocean';
      prefs.palette = activePalette;
      root.setAttribute('data-palette', activePalette);
      root.classList.toggle('theme-dark', prefs.theme === 'dark');
      ['xs', 'sm', 'lg', 'xl'].forEach(size => root.classList.toggle('ts-' + size, prefs.textSize === size));
      const sizeIndex = ['xs', 'sm', 'md', 'lg', 'xl'].indexOf(prefs.textSize);
      const sizeSlider = document.getElementById('spTextSize');
      const sizeValue = document.getElementById('spTextSizeValue');
      if (sizeSlider && sizeValue) {
        sizeSlider.value = String(sizeIndex);
        sizeSlider.setAttribute('aria-valuetext', `${sizeIndex + 1} sur 5`);
        sizeValue.textContent = `${sizeIndex + 1} / 5`;
      }
      document.querySelectorAll('#settingsPanel .sp-seg').forEach(seg => {
        const key = seg.getAttribute('data-pref');
        if (key && prefs[key] !== undefined) {
          seg.querySelectorAll('button').forEach(b => b.classList.toggle('is-on', b.getAttribute('data-val') === prefs[key]));
        }
      });
      const paletteNameEl = document.getElementById('spPaletteName');
      if (paletteNameEl) paletteNameEl.textContent = PALETTE_LABELS[activePalette] || 'Bleu Océan';
      document.querySelectorAll('#settingsPanel [data-palette-val]').forEach(btn => {
        const isOn = btn.getAttribute('data-palette-val') === activePalette;
        btn.classList.toggle('is-active', isOn);
        btn.setAttribute('aria-pressed', String(isOn));
      });
      document.querySelectorAll('#settingsPanel [data-pref-check]').forEach(cb => {
        cb.checked = !!prefs[cb.getAttribute('data-pref-check')];
      });
      try {
        window.localStorage.setItem('carnet_notes_prefs_2026_v1', JSON.stringify(prefs));
      } catch (_) {}
    }

    function getEditableStateSnapshot() {
      return JSON.stringify({
        groups: appState.groups,
        activeGroupId: appState.activeGroupId,
        groupStore: appState.groupStore,
        students: appState.students,
        terms: appState.terms,
        tagCategories: appState.tagCategories
      });
    }

    function getBackupSnapshot() {
      return JSON.stringify({ carnet: getEditableStateSnapshot(), annualWeightMode: appState.annualWeightMode, displayPreferences: prefs, customWeightedPresets: loadAllCustomWeightedPresets() });
    }

    function readDisplayPreferences(value) {
      if (value === undefined) return { ...prefs };
      if (!value || typeof value !== 'object' || Array.isArray(value) ||
          !['light', 'dark'].includes(value.theme) ||
          !['xs', 'sm', 'md', 'lg', 'xl'].includes(value.textSize) ||
          typeof value.backupReminder !== 'boolean') {
        throw new Error('Les paramètres d’affichage de ce fichier sont invalides.');
      }
      const palette = value.palette === 'azur' ? 'ocean' : (VALID_PALETTES.includes(value.palette) ? value.palette : (prefs.palette || 'ocean'));
      return { theme: value.theme, palette, textSize: value.textSize, backupReminder: value.backupReminder };
    }

    function getCurrentObservationSessionSnapshot(sessionOverride) {
      let session = sessionOverride;
      if (!session) {
        const activeTerm = appState.terms && appState.terms[appState.activeTerm];
        const subjectData = activeTerm && activeTerm.subjectData
          ? activeTerm.subjectData[appState.activeSubjectId]
          : null;
        session = subjectData && subjectData.currentObsSession;
      }
      if (!session) return 'null';
      const snapshot = JSON.parse(JSON.stringify(session));
      delete snapshot.savedDraftSnapshot;
      return JSON.stringify(snapshot);
    }

    function hasUncommittedObservationDraft() {
      if (appState.activeView !== 'viewQuickObs') return false;
      const activeTerm = appState.terms && appState.terms[appState.activeTerm];
      const subjectData = activeTerm && activeTerm.subjectData
        ? activeTerm.subjectData[appState.activeSubjectId]
        : null;
      const session = subjectData && subjectData.currentObsSession;
      if (!session) return false;
      const savedBaseline = session.savedDraftSnapshot || observationDraftBaseline;
      return savedBaseline !== null && getCurrentObservationSessionSnapshot(session) !== savedBaseline;
    }

    let pendingObservationExit = null;

    function closeObservationWarning(continueEditing) {
      const modal = document.getElementById('modalUnsavedObservation');
      if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
      }
      const pendingAction = pendingObservationExit;
      pendingObservationExit = null;
      if (continueEditing) {
        if (appState.activeView === 'viewQuickObs') renderQuickObsView();
      } else if (pendingAction) {
        pendingAction();
      }
    }

    function requestObservationDraftExit(continueAction) {
      if (!hasUncommittedObservationDraft()) {
        continueAction();
        return true;
      }
      pendingObservationExit = continueAction;
      const modal = document.getElementById('modalUnsavedObservation');
      modal.classList.remove('hidden');
      modal.classList.add('flex');
      document.getElementById('btnStayOnObservation').focus();
      return false;
    }

    function navigateToView(viewId, updateState) {
      const continueNavigation = () => {
        const changedView = appState.activeView !== viewId;
        if (viewId === 'viewGlobalReport' && appState.activeView !== 'viewGlobalReport') {
          competencyPanelOpen = false;
        }
        appState.selectedStudentId = null;
        if (updateState) updateState();
        if (viewId === 'viewStudents' || viewId === 'viewGlobalReport') expandedSubjectGroup = null;
        appState.activeView = viewId;
        renderAll();
        if (changedView || updateState) {
          const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
          window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' });
        }
      };
      return requestObservationDraftExit(continueNavigation);
    }

    function notifyUpdate(toastMsg) {
      if (toastMsg) {
        showToast(toastMsg);
      }
      scheduleAppStateSave();
    }

    let toastTimer = null;
    let toastHideTimer = null;
    function showToast(msg) {
      const toast = document.getElementById('toastNotification');
      const msgEl = document.getElementById('toastMessage');
      if (!toast || !msgEl) return;
      msgEl.textContent = msg;
      if (toastTimer) clearTimeout(toastTimer);
      if (toastHideTimer) clearTimeout(toastHideTimer);
      toast.classList.remove('toast-leaving', 'toast-entering');
      toast.classList.remove('hidden');
      toast.classList.add('flex');
      void toast.offsetWidth;
      toast.classList.add('toast-entering');
      toastTimer = setTimeout(() => {
        toast.classList.remove('toast-entering');
        toast.classList.add('toast-leaving');
        toastHideTimer = setTimeout(() => {
          toast.classList.add('hidden');
          toast.classList.remove('flex', 'toast-leaving');
        }, 160);
      }, 2400);
    }

    let autosaveTimer = null;

    function setupLegacyModalAccessibility() {
      const modalSelector = '#modalAddAssignment, #modalTargetLevels, #modalGroup, #modalDeleteLinked, #modalCommentBank, #modalUnsavedObservation';
      const openers = new WeakMap();
      const getVisibleModal = () => [...document.querySelectorAll(modalSelector)]
        .find(modal => !modal.classList.contains('hidden'));
      const getFocusable = modal => [...modal.querySelectorAll(
        'button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])'
      )].filter(element => element.getClientRects().length);
      document.querySelectorAll(modalSelector).forEach(modal => {
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-modal', 'true');
      });
      const observer = new MutationObserver(records => {
        records.forEach(record => {
          const modal = record.target;
          if (!(modal instanceof HTMLElement)) return;
          if (!modal.classList.contains('hidden')) {
            if (!openers.has(modal)) openers.set(modal, document.activeElement);
            window.setTimeout(() => {
              const controls = getFocusable(modal);
              if (controls.length && !modal.contains(document.activeElement)) controls[0].focus();
            }, 0);
          } else {
            const opener = openers.get(modal);
            openers.delete(modal);
            if (opener && opener.isConnected) opener.focus({ preventScroll: true });
          }
        });
      });
      document.querySelectorAll(modalSelector).forEach(modal => {
        observer.observe(modal, { attributes: true, attributeFilter: ['class'] });
      });
      document.addEventListener('keydown', event => {
        const modal = getVisibleModal();
        if (!modal) return;
        if (event.key === 'Escape') {
          event.preventDefault();
          const closeButton = modal.querySelector(
            '#btnCloseModalAssignment, #btnCancelModalAssignment, #btnCloseModalTargetLevels, #btnGroupClose, #btnGroupCancel, #btnDelLinkedClose, #btnDelLinkedCancel, #btnCbClose, #btnCbCancel, #btnStayOnObservation'
          );
          if (closeButton) closeButton.click();
          return;
        }
        if (event.key !== 'Tab') return;
        const controls = getFocusable(modal);
        if (!controls.length) return;
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      });
    }

    function scheduleAppStateSave() {
      if (autosaveTimer) clearTimeout(autosaveTimer);
      if (activeFileHandle && getBackupSnapshot() !== lastSavedFileSnapshot && !fileWriteBlocked) {
        setFileSyncStatus('pending', activeFileWritable ? 'Modifications en attente' : 'À enregistrer : cliquez sur Sauvegarder');
      }
      autosaveTimer = setTimeout(() => {
        autosaveTimer = null;
        recordHistory();
        if (typeof updateUnlinkedSaveStatus === 'function') {
          updateUnlinkedSaveStatus();
        }
        if (!fileOperation && activeFileHandle && activeFileWritable && !fileWriteBlocked && getBackupSnapshot() !== lastSavedFileSnapshot) {
          queueLinkedFileSave();
        }
      }, 350);
    }

