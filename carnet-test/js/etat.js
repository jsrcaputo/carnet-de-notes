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
    let competencySubjectSelected = SUBJECTS_CONFIG[0].id;
    const competencyScaleSelected = {};
    let competencyTermSelected = null;
    let observationDraftBaseline = null;

    function normalizeImportedState(imported, isStore = false) {
      if (!imported || !Array.isArray(imported.students) || !imported.terms || typeof imported.terms !== 'object') {
        throw new Error('Le fichier ne contient pas une sauvegarde de carnet valide.');
      }

      imported.students = imported.students.filter(st => st && st.id).map(st => ({
        ...st,
        id: String(st.id),
        name: String(st.name || '').trim() || 'Élève',
        firstName: typeof st.firstName === 'string' ? st.firstName.trim() : String(st.name || '').trim() || 'Élève',
        lastName: typeof st.lastName === 'string' ? st.lastName.trim() : '',
        gradeLevel: GRADE_LEVEL_LABELS[String(st.gradeLevel)] ? String(st.gradeLevel) : '',
        adaptations: Array.isArray(st.adaptations) ? st.adaptations : [],
        customAdapt: typeof st.customAdapt === 'string' ? st.customAdapt : '',
        modifiedExpectations: (() => {
          const raw = st.modifiedExpectations;
          if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
          const clean = {};
          Object.entries(raw).forEach(([k, v]) => {
            const lvl = String(v || '');
            if (GRADE_LEVEL_LABELS[lvl]) clean[k] = lvl;
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
          if (!term.subjectData[sub.id]) {
            term.subjectData[sub.id] = buildTermDataForStudents(imported.students).subjectData[sub.id];
          }
          const subData = term.subjectData[sub.id];
          subData.assignments = Array.isArray(subData.assignments) ? subData.assignments : [];
          subData.assignments.forEach(asg => {
            if (!asg || typeof asg !== 'object') return;
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
          });
          subData.studentRecords = subData.studentRecords || {};
          subData.currentObsSession = subData.currentObsSession || createBlankObsSession(imported.students);
          subData.currentObsSession.studentDrafts = subData.currentObsSession.studentDrafts || {};
          if (Array.isArray(subData.currentObsSession.targetLevels)) {
            subData.currentObsSession.targetLevels = [...new Set(
              subData.currentObsSession.targetLevels.map(l => String(l || '')).filter(l => GRADE_LEVEL_LABELS[l] !== undefined)
            )];
          } else {
            subData.currentObsSession.targetLevels = [];
          }

          imported.students.forEach(st => {
            const rec = subData.studentRecords[st.id] || {};
            rec.scores = rec.scores || {};
            rec.scoreMeta = (rec.scoreMeta && typeof rec.scoreMeta === 'object' && !Array.isArray(rec.scoreMeta)) ? rec.scoreMeta : {};
            Object.keys(rec.scoreMeta).forEach(asgKey => {
              const m = rec.scoreMeta[asgKey];
              if (m && typeof m === 'object' && Array.isArray(m.flags)) {
                m.flags = [...new Set(m.flags.filter(code => VALID_CELL_FLAG_CODES.has(code)))];
                if (!m.flags.length) delete m.flags;
              }
            });
            rec.baremeChecked = Array.isArray(rec.baremeChecked) ? rec.baremeChecked : [];
            rec.baremeOverrideCode = rec.baremeOverrideCode || null;
            rec.finalJudgmentOverride = rec.finalJudgmentOverride ?? '';
            rec.comment = typeof rec.comment === 'string' ? rec.comment : '';
            subData.studentRecords[st.id] = rec;

            const draft = subData.currentObsSession.studentDrafts[st.id] || {};
            draft.checked = Array.isArray(draft.checked) ? draft.checked : [];
            draft.overrideCode = draft.overrideCode || null;
            draft.tags = Array.isArray(draft.tags) ? draft.tags : [];
            draft.comment = typeof draft.comment === 'string' ? draft.comment : '';
            draft.notEvaluated = draft.notEvaluated === true;
            draft.gradeLevel = GRADE_LEVEL_LABELS[String(draft.gradeLevel)]
              ? String(draft.gradeLevel)
              : st.gradeLevel;
            subData.currentObsSession.studentDrafts[st.id] = draft;
          });
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
        if (!td.subjectData[sub.id].currentObsSession) {
          td.subjectData[sub.id].currentObsSession = createBlankObsSession(appState.students);
        }
        appState.students.forEach(st => {
          if (!td.subjectData[sub.id].currentObsSession.studentDrafts[st.id]) {
            td.subjectData[sub.id].currentObsSession.studentDrafts[st.id] = {
              checked: [],
              overrideCode: null,
              tags: [],
              comment: ''
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

    function formatStudentAdaptations(st) {
      const list = Array.isArray(st.adaptations) ? st.adaptations.slice() : [];
      if (st.customAdapt && st.customAdapt.trim()) {
        list.push(st.customAdapt.trim());
      }
      const modList = getStudentModifiedSummaryList(st);
      if (modList.length > 0) {
        const label = `Bulletin modifié (${modList.map(m => `${m.label} : ${m.levelLabel}`).join(', ')})`;
        const index = list.indexOf('Bulletin modifié');
        if (index >= 0) list[index] = label;
        else list.push(label);
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

    function getAssignmentWeightForLevel(asg, level) {
      if (!asg) return 100;
      let sourceAsg = asg;
      const activeSub = SUBJECTS_CONFIG.find(s => s.id === appState.activeSubjectId);
      if (asg.linkId && asg.linkOrigin === false && activeSub && activeSub.singleResult) {
        const origin = getLinkedAssignments(asg).find(l => l.asg.linkOrigin !== false);
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
      const num = Math.max(0, Number.isFinite(Number(val)) ? Number(val) : 0);
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
          if (asg.weightByLevel[l] === undefined) asg.weightByLevel[l] = asg.weight !== undefined ? Number(asg.weight) : 100;
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

    function recalculateEqualWeights(subObj) {
      const allAsgs = subObj.assignments;
      if (allAsgs.length === 0) return;
      const present = getPresentStudentLevels();
      if (present.length <= 1) {
        const n = allAsgs.length;
        const base = Math.round((100 / n) * 10) / 10;
        allAsgs.forEach((a, idx) => {
          delete a.weightByLevel;
          if (idx === n - 1) {
            const sumPrev = Math.round(base * (n - 1) * 10) / 10;
            a.weight = Math.max(0, Math.round((100 - sumPrev) * 10) / 10);
          } else {
            a.weight = base;
          }
        });
        return;
      }

      // En multi-niveau (ex. 5e et 6e), répartir 100 % à l'intérieur de chaque niveau présent
      allAsgs.forEach(a => {
        a.weightByLevel = {};
      });
      present.forEach(lvl => {
        const applicable = allAsgs.filter(a => isAssignmentForLevel(a, lvl));
        const n = applicable.length;
        if (n === 0) return;
        const base = Math.round((100 / n) * 10) / 10;
        applicable.forEach((a, idx) => {
          const w = idx === n - 1
            ? Math.max(0, Math.round((100 - Math.round(base * (n - 1) * 10) / 10) * 10) / 10)
            : base;
          a.weightByLevel[lvl] = w;
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
        const filterLvl = ensureValidGbLevelFilter();
        if (filterLvl !== 'ALL') {
          return isLevelWeightSumValid100(subObj, filterLvl);
        }
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
    const unlockedWeights = new Set();
    function normText(value) {
      return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    }
    function studentMatches(student, query) {
      const q = normText(query).trim();
      return !q || normText(student.name).includes(q);
    }

    function adjustUnlockedWeight(subData, target, level, newWeight, render = true) {
      const factor = 1000;
      const current = Math.round(getAssignmentWeightForLevel(target, level) * factor);
      const next = Math.round(newWeight * factor);
      if (!Number.isFinite(newWeight) || next < 0 || next > 100 * factor) {
        showToast('La pondération doit rester entre 0 et 100 %.');
        return false;
      }
      const change = next - current;
      if (change === 0) return true;
      const peers = subData.assignments.filter(asg => asg !== target && unlockedWeights.has(asg.id) &&
        (level === 'ALL' || isAssignmentForLevel(asg, level)));
      if (!peers.length) {
        showToast('Déverrouillez au moins deux évaluations pour répartir la pondération.');
        return false;
      }
      const values = peers.map(asg => Math.round(getAssignmentWeightForLevel(asg, level) * factor));
      let remaining = Math.abs(change);
      const peerDirection = -Math.sign(change);
      while (remaining > 0) {
        const available = values.map((value, index) => ({ index, room: peerDirection > 0 ? 100 * factor - value : value }))
          .filter(item => item.room > 0);
        if (!available.length) {
          showToast('Les autres évaluations déverrouillées ne peuvent pas absorber ce changement.');
          return false;
        }
        const share = Math.ceil(remaining / available.length);
        available.forEach(item => {
          const amount = Math.min(share, item.room, remaining);
          values[item.index] += peerDirection * amount;
          remaining -= amount;
        });
      }
      const changes = [{ asg: target, value: next / factor }, ...peers.map((asg, index) => ({ asg, value: values[index] / factor }))];
      const linkedDeltas = new Map();
      if (getCurrentSubjectConfig().singleResult) {
        changes.forEach(changeItem => {
          getLinkedAssignments(changeItem.asg).forEach(linked => {
            const delta = changeItem.value - getAssignmentWeightForLevel(linked.asg, level);
            linkedDeltas.set(linked.subData, (linkedDeltas.get(linked.subData) || 0) + delta);
          });
        });
        if ([...linkedDeltas.values()].some(delta => Math.abs(delta) > 0.000001)) {
          showToast('Les évaluations liées dans une autre compétence doivent aussi conserver leur total. Déverrouillez les évaluations liées correspondantes.');
          return false;
        }
      }
      changes.forEach(changeItem => {
        setAssignmentWeightForLevel(changeItem.asg, level, changeItem.value);
        if (getCurrentSubjectConfig().singleResult) {
          getLinkedAssignments(changeItem.asg).forEach(linked => {
            setAssignmentWeightForLevel(linked.asg, level, changeItem.value);
            linked.subData.equalWeights = false;
          });
        }
      });
      subData.equalWeights = false;
      notifyUpdate('Pondération ajustée');
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
      recordHistory();
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
    const prefs = { theme: 'light', textSize: 'md', backupReminder: true };
    const STUDIO_ATMOSPHERE_IMAGES = {
      math_resoudre: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=1400&q=80',
      math_raisonner: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&w=1400&q=80',
      fra_lecture: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&w=1400&q=80',
      fra_ecriture: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1400&q=80',
      fra_oral: 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=1400&q=80',
      ccq_global: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1400&q=80',
      sciences_global: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=1400&q=80',
      sciences_outils: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1400&q=80',
      sciences_comm: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1400&q=80',
      univers_social: 'https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&w=1400&q=80',
      us_changement: 'https://images.unsplash.com/photo-1461360370896-922624d12aa1?auto=format&fit=crop&w=1400&q=80',
      us_diversite: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=1400&q=80',
      art_dram_c1c2: 'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?auto=format&fit=crop&w=1400&q=80',
      art_dram_c3: 'https://images.unsplash.com/photo-1514306191717-452ec28c7814?auto=format&fit=crop&w=1400&q=80'
    };
    const SUBJECT_STUDIO_ACCENTS = {
      maths: '#1d4ed8',
      francais: '#8f3f2b',
      ccq: '#6d3b8e',
      sciences: '#16697a',
      social: '#9a5b13',
      arts: '#9e2a5b'
    };
    let lastSavedFileSnapshot = null;
    let initialEditableSnapshot = null;
    function applyPrefs() {
      const root = document.documentElement;
      root.classList.add('design-studio');
      root.classList.toggle('theme-dark', prefs.theme === 'dark');
      root.classList.toggle('ts-sm', prefs.textSize === 'sm');
      root.classList.toggle('ts-lg', prefs.textSize === 'lg');
      document.querySelectorAll('#settingsPanel .sp-seg').forEach(seg => {
        const key = seg.getAttribute('data-pref');
        if (key && prefs[key] !== undefined) {
          seg.querySelectorAll('button').forEach(b => b.classList.toggle('is-on', b.getAttribute('data-val') === prefs[key]));
        }
      });
      document.querySelectorAll('#settingsPanel [data-pref-check]').forEach(cb => {
        cb.checked = !!prefs[cb.getAttribute('data-pref-check')];
      });
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
      return JSON.stringify({ carnet: getEditableStateSnapshot(), displayPreferences: prefs });
    }

    function readDisplayPreferences(value) {
      if (value === undefined) return { ...prefs };
      if (!value || typeof value !== 'object' || Array.isArray(value) ||
          !['light', 'dark'].includes(value.theme) ||
          !['sm', 'md', 'lg'].includes(value.textSize) ||
          typeof value.backupReminder !== 'boolean') {
        throw new Error('Les paramètres d’affichage de ce fichier sont invalides.');
      }
      return { theme: value.theme, textSize: value.textSize, backupReminder: value.backupReminder };
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
        if (viewId === 'viewGlobalReport' && appState.activeView !== 'viewGlobalReport') {
          competencyPanelOpen = false;
        }
        appState.selectedStudentId = null;
        if (updateState) updateState();
        if (viewId === 'viewStudents' || viewId === 'viewGlobalReport') expandedSubjectGroup = null;
        appState.activeView = viewId;
        renderAll();
      };
      return requestObservationDraftExit(continueNavigation);
    }

    function notifyUpdate(toastMsg) {
      if (toastMsg) {
        showToast(toastMsg);
      }
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

    function scheduleAppStateSave() {
      if (autosaveTimer) clearTimeout(autosaveTimer);
      if (activeFileHandle && getBackupSnapshot() !== lastSavedFileSnapshot && !fileWriteBlocked) {
        setFileSyncStatus('pending', activeFileWritable ? 'Modifications en attente' : 'À enregistrer : cliquez sur Sauvegarder');
      }
      autosaveTimer = setTimeout(() => {
        autosaveTimer = null;
        recordHistory();
        if (!fileOperation && activeFileHandle && activeFileWritable && !fileWriteBlocked && getBackupSnapshot() !== lastSavedFileSnapshot) {
          queueLinkedFileSave();
        }
      }, 350);
    }

