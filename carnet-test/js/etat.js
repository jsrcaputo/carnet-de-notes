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
            if (typeof asg.columnColor !== 'string' || !/^#[0-9a-f]{6}$/i.test(asg.columnColor)) {
              delete asg.columnColor;
            } else {
              asg.columnColor = asg.columnColor.toLowerCase();
            }
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
