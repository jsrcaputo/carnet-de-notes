    function computeMajorityFromChecked(checkedKeys, overrideCode, requiredCriteriaCount) {
      const counts = { A: 0, B: 0, C: 0, D: 0, E: 0 };
      let total = 0;
      (checkedKeys || []).forEach(k => {
        const parts = k.split('_');
        const fam = parts[parts.length - 2];
        if (counts[fam] !== undefined) {
          counts[fam]++;
          total++;
        }
      });

      if (overrideCode && GRADE_MAP[overrideCode]) {
        const g = GRADE_MAP[overrideCode];
        return {
          hasData: true,
          code: g.code,
          pct: g.pct,
          family: g.family,
          counts,
          total,
          isOverride: true,
          isComplete: requiredCriteriaCount === undefined || total >= requiredCriteriaCount,
          hasFinalGrade: true
        };
      }

      if (total === 0) {
        return {
          hasData: false,
          code: null,
          pct: null,
          family: null,
          counts,
          total: 0,
          isOverride: false,
          isComplete: false,
          hasFinalGrade: false
        };
      }

      const familyWeights = { A: 95, B: 80, C: 65, D: 50, E: 40 };
      let maxCount = -1;
      let topFamilies = [];
      ['A', 'B', 'C', 'D', 'E'].forEach(f => {
        if (counts[f] > maxCount) {
          maxCount = counts[f];
          topFamilies = [f];
        } else if (counts[f] === maxCount && maxCount > 0) {
          topFamilies.push(f);
        }
      });

      let weightedSum = 0;
      ['A', 'B', 'C', 'D', 'E'].forEach(f => {
        weightedSum += counts[f] * familyWeights[f];
      });
      const avgPct = weightedSum / total;

      let chosenFamily = topFamilies[0];
      if (topFamilies.length > 1) {
        let bestDiff = 999;
        topFamilies.forEach(f => {
          const d = Math.abs(familyWeights[f] - avgPct);
          if (d < bestDiff) {
            bestDiff = d;
            chosenFamily = f;
          }
        });
      }

      let chosenCode = FAMILY_DEFAULT_CODE[chosenFamily];
      if (chosenFamily === 'A') {
        if (avgPct >= 97) chosenCode = 'A+';
        else if (avgPct < 92.5) chosenCode = 'A-';
        else chosenCode = 'A';
      } else if (chosenFamily === 'B') {
        if (avgPct >= 82.5) chosenCode = 'B+';
        else if (avgPct <= 77.5) chosenCode = 'B-';
        else chosenCode = 'B';
      } else if (chosenFamily === 'C') {
        if (avgPct >= 67.5) chosenCode = 'C+';
        else if (avgPct <= 62.5) chosenCode = 'C-';
        else chosenCode = 'C';
      } else if (chosenFamily === 'D') {
        if (avgPct >= 53) chosenCode = 'D+';
        else if (avgPct <= 47.5) chosenCode = 'D-';
        else chosenCode = 'D';
      } else {
        chosenCode = 'E';
      }

      const g = GRADE_MAP[chosenCode];
      return {
        hasData: true,
        code: g.code,
        pct: g.pct,
        family: g.family,
        counts,
        total,
        isOverride: false,
        isComplete: requiredCriteriaCount === undefined || total >= requiredCriteriaCount,
        hasFinalGrade: requiredCriteriaCount === undefined || total >= requiredCriteriaCount
      };
    }

    function getScoredObservableCriteria(criteria) {
      return (criteria || []).filter(criterion => !criterion.formativeOnly);
    }

    const LOCAL_FORMATIVE_CRITERIA = new Set([
      'ccq_dialogue', 'sci2_precision', 'sci3_representation',
      'us2_traces', 'ad3_observation', 'ap3_posture', 'ap1_mise'
    ]);

    function computeObservableResult(checkedKeys, overrideCode, criteria, explicitlyNotEvaluated = false) {
      const allCriteria = criteria || [];
      const scoredCriteria = getScoredObservableCriteria(allCriteria);
      const allIds = new Set(allCriteria.map(criterion => criterion.id));
      const scoredIds = new Set(scoredCriteria.map(criterion => criterion.id));
      const selectedIds = new Set();
      const scoredKeys = (checkedKeys || []).filter(key => {
        const parts = key.split('_');
        const family = parts[parts.length - 2];
        const criterionId = parts.slice(0, -2).join('_');
        if (!allIds.has(criterionId)) return false;
        selectedIds.add(criterionId);
        return scoredIds.has(criterionId) && ['A', 'B', 'C', 'D', 'E'].includes(family);
      });
      const result = scoredCriteria.length
        ? computeMajorityFromChecked(scoredKeys, overrideCode, scoredCriteria.length)
        : computeMajorityFromChecked([], null, 0);
      result.isNotEvaluated = explicitlyNotEvaluated;
      if (explicitlyNotEvaluated) result.isComplete = true;
      result.hasEvidence = explicitlyNotEvaluated || selectedIds.size > 0 || Boolean(scoredCriteria.length && GRADE_MAP[overrideCode]);
      return result;
    }

    function computeStudentSubjectSummary(termId, subjectId, studentId) {
      const termData = appState.terms[termId];
      const subData = termData.subjectData[subjectId];
      const rec = subData.studentRecords[studentId];
      const stObj = (appState.students || []).find(s => s.id === studentId) || null;
      const stuLvl = stObj && stObj.gradeLevel ? String(stObj.gradeLevel) : '';

      // 1. Weighted average of /100 assignments & visual traces (filtered by student grade level in multi-level groups)
      let weightedSum = 0;
      let totalWeightUsed = 0;
      subData.assignments.forEach(asg => {
        if (stObj && !isAssignmentForStudent(asg, stObj)) {
          return; // Skip evaluations targeted at another grade level!
        }
        const rawVal = rec.scores[asg.id];
        if (rawVal === undefined || rawVal === null || rawVal === '' || rawVal === '-' || rawVal === 'N/A') {
          return; // Skip N/A!
        }
        const numVal = Number(String(rawVal).replace(',', '.'));
        const wRaw = getAssignmentWeightForLevel(asg, stuLvl);
        const w = (!isNaN(Number(wRaw)) && Number(wRaw) > 0) ? Number(wRaw) : 0;
        const outOf = getAssignmentOutOf(asg);
        if (Number.isFinite(numVal) && numVal >= 0 && numVal <= outOf && w > 0) {
          weightedSum += (numVal / outOf * 100) * w;
          totalWeightUsed += w;
        }
      });
      const assignmentsAvg = totalWeightUsed > 0
        ? Math.round(weightedSum / totalWeightUsed)
        : null;

      // 2. Barème École
      const baremeRes = computeMajorityFromChecked(
        rec.baremeChecked,
        rec.baremeOverrideCode,
        BAREME_ECOLE_ROWS.length
      );

      // Le barème soutient le jugement, mais ne modifie pas la moyenne calculée.
      const autoCombinedPct = assignmentsAvg;

      const overridePct = Number(rec.finalJudgmentOverride);
      const finalPct = (rec.finalJudgmentOverride !== '' && Number.isFinite(overridePct) && overridePct >= 0 && overridePct <= 100)
        ? overridePct
        : autoCombinedPct;

      const finalLetter = pctToClosestGradeCode(finalPct);

      return {
        assignmentsAvg,
        baremeRes,
        autoCombinedPct,
        finalPct,
        finalLetter
      };
    }

    // Résultat unique (Sciences, GHEC) : les évaluations partagées (même linkId) ne comptent qu'une fois.
    function computePooledGroupPct(termId, parts, studentId, fallback) {
      let sum = 0, wTot = 0;
      const seen = new Set();
      let hasOverride = false;
      const stObj = (appState.students || []).find(s => s.id === studentId) || null;
      const stuLvl = stObj && stObj.gradeLevel ? String(stObj.gradeLevel) : '';
      parts.forEach(sub => {
        const sd = appState.terms[termId].subjectData[sub.id];
        const rec = sd.studentRecords[studentId];
        if (rec.finalJudgmentOverride !== '' && rec.finalJudgmentOverride !== undefined) hasOverride = true;
        sd.assignments.forEach(asg => {
          if (stObj && !isAssignmentForStudent(asg, stObj)) return;
          const raw = rec.scores[asg.id];
          if (raw === undefined || raw === null || raw === '' || raw === '-' || raw === 'N/A') return;
          const v = Number(String(raw).replace(',', '.'));
          const w = Number(getAssignmentWeightForLevel(asg, stuLvl));
          const outOf = getAssignmentOutOf(asg);
          if (!Number.isFinite(v) || v < 0 || v > outOf || !(w > 0)) return;
          if (asg.linkId) {
            if (asg.linkOrigin === false || seen.has(asg.linkId)) return;
            seen.add(asg.linkId);
          }
          sum += (v / outOf * 100) * w;
          wTot += w;
        });
      });
      if (hasOverride) return fallback;
      return wTot > 0 ? Math.round(sum / wTot) : null;
    }

    function pctToClosestGradeCode(pct) {
      if (pct === null || pct === undefined || isNaN(pct)) return '—';
      let best = GRADE_SCALE[0];
      let minDiff = 999;
      GRADE_SCALE.forEach(g => {
        const d = Math.abs(g.pct - pct);
        if (d < minDiff) {
          minDiff = d;
          best = g;
        }
      });
      return best.code;
    }

    function getBadgeColorClasses(familyOrCode) {
      if (!familyOrCode || familyOrCode === '—' || familyOrCode === '-') return 'bg-slate-100 text-slate-600 border-slate-200';
      const fam = familyOrCode.charAt(0);
      if (fam === 'A') return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      if (fam === 'B') return 'bg-blue-100 text-blue-800 border-blue-300';
      if (fam === 'C') return 'bg-amber-100 text-amber-800 border-amber-300';
      if (fam === 'D') return 'bg-orange-100 text-orange-800 border-orange-300';
      if (fam === 'E') return 'bg-red-100 text-red-800 border-red-300';
      return 'bg-slate-100 text-slate-700 border-slate-200';
    }

    function getAssignmentOutOf(asg) {
      const n = Number(asg && asg.outOf);
      return !asg || asg.isObservation || !Number.isFinite(n) || n <= 0 ? 100 : n;
    }

    function getLinkedAssignments(asg) {
      if (!asg || !asg.linkId) return [];
      const termData = getActiveTermData();
      const found = [];
      ALL_SUBJECTS_CONFIG.forEach(s => {
        const sd = termData.subjectData[s.id];
        if (!sd) return;
        sd.assignments.forEach(a => {
          if (a.linkId === asg.linkId && a !== asg) found.push({ sub: s, subData: sd, asg: a });
        });
      });
      return found;
    }

    function syncLinkedScore(asg, studentId, value) {
      getLinkedAssignments(asg).forEach(({ subData, asg: other }) => {
        const rec = subData.studentRecords[studentId];
        if (!rec) return;
        if (value === undefined) delete rec.scores[other.id];
        else rec.scores[other.id] = value;
      });
    }

    function getCellFlags(rec, asgId) {
      if (!rec || !rec.scoreMeta || !rec.scoreMeta[asgId] || !Array.isArray(rec.scoreMeta[asgId].flags)) {
        return [];
      }
      return rec.scoreMeta[asgId].flags.filter(code => VALID_CELL_FLAG_CODES.has(code));
    }

    function setCellFlags(rec, asgId, flagsArray) {
      if (!rec) return;
      rec.scoreMeta = rec.scoreMeta || {};
      const clean = [...new Set((flagsArray || []).filter(code => VALID_CELL_FLAG_CODES.has(code)))];
      if (!rec.scoreMeta[asgId]) {
        if (!clean.length) return;
        rec.scoreMeta[asgId] = { flags: clean };
      } else {
        if (clean.length) {
          rec.scoreMeta[asgId].flags = clean;
        } else {
          delete rec.scoreMeta[asgId].flags;
          if (!Object.keys(rec.scoreMeta[asgId]).length) {
            delete rec.scoreMeta[asgId];
          }
        }
      }
    }

    function syncLinkedFlags(asg, studentId, flagsArray) {
      getLinkedAssignments(asg).forEach(({ subData, asg: other }) => {
        const rec = subData.studentRecords[studentId];
        if (!rec) return;
        setCellFlags(rec, other.id, flagsArray);
      });
    }

    function computeWeightedAnnualAverage(t1, t2, t3, mode) {
      const entries = [
        { val: t1, w: OFFICIAL_TERM_WEIGHTS['1'] },
        { val: t2, w: OFFICIAL_TERM_WEIGHTS['2'] },
        { val: t3, w: OFFICIAL_TERM_WEIGHTS['3'] }
      ].filter(item => item.val !== null && item.val !== undefined && Number.isFinite(Number(item.val)));
      if (!entries.length) return null;
      if (mode === 'equal') {
        const sum = entries.reduce((acc, item) => acc + Number(item.val), 0);
        return Math.round(sum / entries.length);
      }
      const wSum = entries.reduce((acc, item) => acc + item.w, 0);
      const weighted = entries.reduce((acc, item) => acc + Number(item.val) * item.w, 0);
      return wSum > 0 ? Math.round(weighted / wSum) : null;
    }

    function formatScoreNumber(n) {
      return String(Math.round(n * 100) / 100).replace('.', ',');
    }

    function parsePercentageInput(rawValue, max = 100) {
      const value = String(rawValue ?? '').trim();
      if (value === '') return { valid: true, empty: true, value: '' };
      if (value === '-' || value.toUpperCase() === 'N/A') {
        return { valid: true, empty: false, value: '-' };
      }

      const normalized = value.replace(',', '.');
      if (!/^\d+(\.\d+)?$/.test(normalized)) return { valid: false };
      const number = Number(normalized);
      if (!Number.isFinite(number) || number < 0 || number > max) return { valid: false };
      return { valid: true, empty: false, value: String(number) };
    }

    function escapeHtml(value) {
      return String(value ?? '').replace(/[&<>"']/g, character => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      })[character]);
    }

    function getCurrentSubjectConfig() {
      return SUBJECTS_CONFIG.find(s => s.id === appState.activeSubjectId) || SUBJECTS_CONFIG[0];
    }

    function getStudentCycle(gradeLevel) {
      if (String(gradeLevel) === 'P') return 'P';
      const level = Number(gradeLevel);
      return Number.isInteger(level) && level >= 1 && level <= 6
        ? Math.ceil(level / 2)
        : null;
    }

    // Bulletin modifié (Modification des attentes du PFEQ par matière ou compétence)
    function getSubjectConfigOrGroupById(subjectOrId) {
      if (!subjectOrId) return null;
      if (typeof subjectOrId === 'object') return subjectOrId;
      return ALL_SUBJECTS_CONFIG.find(s => s.id === subjectOrId)
        || ALL_SUBJECTS_CONFIG.find(s => s.group === subjectOrId)
        || null;
    }

    function getEffectiveGradeLevel(student, subjectOrId) {
      if (!student) return '';
      const baseLevel = GRADE_LEVEL_LABELS[String(student.gradeLevel)] ? String(student.gradeLevel) : '';
      const mods = (student.modifiedExpectations && typeof student.modifiedExpectations === 'object')
        ? student.modifiedExpectations
        : null;
      if (!mods || !subjectOrId) return baseLevel;
      const subObj = getSubjectConfigOrGroupById(subjectOrId);
      const rawId = typeof subjectOrId === 'string' ? subjectOrId : (subObj ? subObj.id : '');
      const grpId = subObj && subObj.group ? subObj.group : '';
      if (rawId && GRADE_LEVEL_LABELS[String(mods[rawId])] && String(mods[rawId]) !== baseLevel) {
        return String(mods[rawId]);
      }
      if (grpId && GRADE_LEVEL_LABELS[String(mods[grpId])] && String(mods[grpId]) !== baseLevel) {
        return String(mods[grpId]);
      }
      return baseLevel;
    }

    function isSubjectModifiedForStudent(student, subjectOrId) {
      if (!student || !subjectOrId) return false;
      const baseLevel = GRADE_LEVEL_LABELS[String(student.gradeLevel)] ? String(student.gradeLevel) : '';
      const effLevel = getEffectiveGradeLevel(student, subjectOrId);
      return Boolean(effLevel && effLevel !== baseLevel);
    }

    function getStudentModifiedSummaryList(student) {
      if (!student || !student.modifiedExpectations || typeof student.modifiedExpectations !== 'object') return [];
      const baseLevel = String(student.gradeLevel || '');
      const items = [];
      const seenKeys = new Set();
      Object.entries(student.modifiedExpectations).forEach(([key, lvl]) => {
        const cleanLvl = String(lvl || '');
        if (!GRADE_LEVEL_LABELS[cleanLvl] || cleanLvl === baseLevel) return;
        if (seenKeys.has(key)) return;
        seenKeys.add(key);
        const sub = ALL_SUBJECTS_CONFIG.find(s => s.id === key);
        const grp = !sub ? ALL_SUBJECTS_CONFIG.find(s => s.group === key) : null;
        const label = sub
          ? sub.shortName
          : grp
          ? (grp.groupLabel || grp.bulletinLabel || key)
          : key;
        items.push({ key, label, level: cleanLvl, levelLabel: GRADE_LEVEL_LABELS[cleanLvl] });
      });
      return items;
    }

    function getObservationDraftGradeLevel(draft, student, session, subjectOrId) {
      const savedGradeLevel = String(draft.gradeLevel || '');
      if (session && session.editingAssignmentId && GRADE_LEVEL_LABELS[savedGradeLevel]) {
        return savedGradeLevel;
      }
      const subTarget = subjectOrId || appState.activeSubjectId;
      const effectiveLevel = getEffectiveGradeLevel(student, subTarget);
      return GRADE_LEVEL_LABELS[effectiveLevel] ? effectiveLevel : '';
    }

    function getCompetencyTabs() {
      const data = window.ECHELLES_PRIMAIRE || {};
      const makeScale = (id, tab, chip) => {
        const source = data[id];
        const echelons = source ? source.echelons : [];
        return { id, label: (source && source.titre) || id, tab, chip, echelons, max: echelons.length };
      };
      return [
        { id: 'maths', label: 'Mathématiques', scales: [
          makeScale('math_resoudre', 'Résoudre (C1)', 'Math. · Résoudre'),
          makeScale('math_raisonner', 'Raisonner (C2)', 'Math. · Raisonner')
        ] },
        { id: 'francais', label: 'Français', scales: [
          makeScale('fra_lecture', 'Lecture (C1)', 'Français · Lecture (C1)'),
          makeScale('fra_ecriture', 'Écriture (C2)', 'Français · Écriture (C2)'),
          makeScale('fra_oral', 'Oral (C3)', 'Français · Oral (C3)')
        ] },
        { id: 'ccq_global', label: 'Culture et citoyenneté québ.', scales: [], disabled: true },
        { id: 'sciences_global', label: 'Sciences', scales: [makeScale('sciences_global', 'Sciences', 'Sciences')] },
        { id: 'univers_social', label: 'Géo. / Histoire', scales: [
          makeScale('us_organisation', 'Organisation', 'GHEC · Organisation'),
          makeScale('us_changement', 'Changement', 'GHEC · Changement'),
          makeScale('us_diversite', 'Diversité', 'GHEC · Diversité')
        ] },
        { id: 'art_dram', label: 'Art dramatique', scales: [
          makeScale('art_dram_inventer', 'Inventer', 'Art dram. · Inventer'),
          makeScale('art_dram_interpreter', 'Interpréter', 'Art dram. · Interpréter'),
          makeScale('art_dram_apprecier', 'Apprécier', 'Art dram. · Apprécier')
        ] },
        { id: 'art_plast', label: 'Arts plastiques', scales: [], disabled: true },
        { id: 'presco', label: 'Préscolaire', scales: [], disabled: true }
      ].filter(tab => {
        const key = { sciences_global: 'sciences', univers_social: 'social' }[tab.id] || tab.id;
        return SUBJECTS_CONFIG.some(s => (s.group || s.id) === key);
      });
    }

    // Découpe chaque échelon en phrases, puis aligne les phrases « équivalentes » d'un échelon à l'autre
    // (même idée qui progresse : mêmes mots-clés, même position) pour former des lignes de progression.
