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
