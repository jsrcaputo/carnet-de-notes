    function scrollToCompetencyElement(element) {
      requestAnimationFrame(() => {
        if (!element || !element.isConnected || (element.matches('details') && !element.open)) return;
        const header = document.querySelector('header.test-topbar');
        const fixedHeader = header && ['sticky', 'fixed'].includes(getComputedStyle(header).position);
        const offset = fixedHeader ? header.getBoundingClientRect().height + 12 : 12;
        const top = Math.max(0, element.getBoundingClientRect().top + window.scrollY - offset);
        window.scrollTo({ top, behavior: isReducedMotionEnabled() ? 'auto' : 'smooth' });
      });
    }

    function getIncompleteModifiedCompetency(student, subject) {
      if (!student || !subject || isAccueilGroup() || !isSubjectModifiedForStudent(student, subject)) return null;
      const tabs = getCompetencyTabs();
      const picks = getAnnualCompetencyPicks(student);
      let target = null;
      tabs.forEach(tab => {
        if (target) return;
        const directScale = tab.scales.find(scale => scale.id === subject.id);
        if (directScale) {
          target = { tab, scales: [directScale] };
          return;
        }
        const tabKey = { sciences_global: 'sciences', univers_social: 'social' }[tab.id] || tab.id;
        if (subject.singleResult && subject.group === tabKey) target = { tab, scales: tab.scales.slice() };
      });
      if (!target || !target.scales.length) return null;
      const missing = target.scales.filter(scale => !computeCompetencyResult(scale, picks[scale.id] || {}));
      return missing.length ? { tabId: target.tab.id, missing } : null;
    }

    let competencyGuideTarget = null;

    function flashCompetencyElement(element) {
      if (!element) return;
      element.classList.remove('is-attention-flash');
      void element.offsetWidth;
      element.classList.add('is-attention-flash');
      window.setTimeout(() => element.classList.remove('is-attention-flash'), 1700);
    }

    function beginMissingModifiedCompetencyGuide(studentId, tabId, scaleId) {
      const student = appState.students.find(item => item.id === studentId);
      if (!student || !tabId || !scaleId) return;
      competencyGuideTarget = { tabId, scaleId, studentId: student.id };
      const details = document.getElementById('competencyPositioning');
      if (!details) return;
      if (details.open) {
        details.open = false;
        competencyPanelOpen = false;
      }
      const summary = details.querySelector(':scope > summary');
      flashCompetencyElement(summary);
      scrollToCompetencyElement(summary);
    }

    function resolveJumpSubjectId(rawSubId) {
      if (SUBJECTS_CONFIG.some(s => s.id === rawSubId)) return rawSubId;
      const parts = SUBJECTS_CONFIG.filter(s => s.group === rawSubId);
      if (!parts.length) return appState.activeSubjectId || (SUBJECTS_CONFIG[0] && SUBJECTS_CONFIG[0].id) || '';
      const activeTermData = appState.terms && appState.terms[appState.activeTerm];
      const inActiveTerm = parts.find(p => activeTermData && activeTermData.subjectData[p.id] && activeTermData.subjectData[p.id].assignments.length > 0);
      if (inActiveTerm) return inActiveTerm.id;
      for (const tKey of ['1', '2', '3']) {
        const td = appState.terms && appState.terms[tKey];
        const found = parts.find(p => td && td.subjectData[p.id] && td.subjectData[p.id].assignments.length > 0);
        if (found) return found.id;
      }
      return parts[0].id;
    }

    function jumpFromReportToSubject(rawSubId, studentId, targetTerm) {
      const targetId = resolveJumpSubjectId(rawSubId);
      const targetSub = SUBJECTS_CONFIG.find(s => s.id === targetId);
      if (!targetSub) return;
      navigateToView('viewGradebook', () => {
        if (targetTerm && ['1', '2', '3'].includes(String(targetTerm))) {
          appState.activeTerm = String(targetTerm);
        }
        appState.activeSubjectId = targetSub.id;
        expandedSubjectGroup = (targetSub.group && targetSub.group !== 'presco') ? targetSub.group : null;
        gbFilter = '';
        gbLevelFilter = 'ALL';
      }, { skipScrollTop: true, flashStudentId: studentId });
    }

    function getStudentAnnualEvaluationSummary(student, subjectIds) {
      const seen = new Set();
      const byTerm = { '1': 0, '2': 0, '3': 0 };
      if (!student) return { total: 0, byTerm };

      ['1', '2', '3'].forEach(termKey => {
        const termSeen = new Set();
        (subjectIds || []).forEach(subjectId => {
          const subject = SUBJECTS_CONFIG.find(item => item.id === subjectId);
          if (!subject || !isSubjectApplicableForStudent(subject, student)) return;
          const subjectData = appState.terms?.[termKey]?.subjectData?.[subjectId];
          if (!subjectData) return;
          const record = subjectData.studentRecords?.[student.id];
          if (!record) return;

          (subjectData.assignments || []).forEach(assignment => {
            if (!isAssignmentForStudent(assignment, student)) return;
            const raw = record.scores && record.scores[assignment.id];
            const meta = record.scoreMeta && record.scoreMeta[assignment.id];
            if (assignment.isObservation && meta && meta.linkedCopy) return;
            const value = String(raw ?? '').trim();
            const upper = value.toUpperCase();
            const hasScore = value !== '' && value !== '-' &&
              (Number.isFinite(Number(value.replace(',', '.'))) || ['NR', 'REP', 'JUST', 'JUS'].includes(upper));
            const hasTrace = Boolean(assignment.isObservation && meta && (
              meta.notEvaluated ||
              (Array.isArray(meta.checked) && meta.checked.length > 0) ||
              hasObservationFeedback(meta)
            ));
            if (!hasScore && !hasTrace) return;
            const key = assignment.linkId ? `linked:${termKey}:${assignment.linkId}` : `${termKey}:${subjectId}:${assignment.id}`;
            seen.add(key);
            termSeen.add(key);
          });
        });
        byTerm[termKey] = termSeen.size;
      });

      return { total: seen.size, byTerm };
    }

    function getGlobalReportStudentStatus(student) {
      let hasAlert = false;
      let hasFollowup = Boolean(student && Array.isArray(student.adaptations) && student.adaptations.includes('Bulletin modifié'));
      if (!student) return { hasAlert, hasFollowup };
      SUBJECTS_CONFIG.forEach(sub => {
        if (!isSubjectApplicableForStudent(sub, student)) return;
        if (sub.isIlss) {
          ['1', '2', '3'].forEach(tk => {
            if (typeof getIlssFinalJudgment === 'function') {
              const f = getIlssFinalJudgment(sub, tk, student);
              if (f && f.cote === 'D') hasAlert = true;
            }
          });
          return;
        }
        const cycle = getStudentCycle(student.gradeLevel);
        const isFeedbackOnly = cycle === 1 && ['sciences', 'social'].includes(sub.group || sub.id);
        let hasLow = false;
        const tVals = ['1', '2', '3'].map(tk => {
          const sd = appState.terms?.[tk]?.subjectData?.[sub.id];
          const rec = sd?.studentRecords?.[student.id];
          if (sd && rec) {
            (sd.assignments || []).forEach(asg => {
              const val = String((rec.scores && rec.scores[asg.id]) ?? '').trim().toUpperCase();
              const flags = typeof getCellFlags === 'function' ? getCellFlags(rec, asg.id) : [];
              if (val === 'NR' || val === 'REP' || flags.includes('ABS')) hasFollowup = true;
            });
          }
          return computeStudentSubjectSummary(tk, sub.id, student.id).finalPct;
        });
        const avg = computeWeightedAnnualAverage(tVals[0], tVals[1], tVals[2], 'official');
        if (!isFeedbackOnly && avg !== null && avg < 60 && student.gradeLevel !== 'P') hasLow = true;
        if (hasLow) hasAlert = true;
      });
      return { hasAlert, hasFollowup };
    }

    function renderGrStudentSelectorOnly() {
      const band = document.getElementById('grStudentBand');
      if (!band) return null;
      const orderedStudents = getGlobalReportOrderedStudents();
      const st = orderedStudents.find(s => s.id === appState.selectedStudentId) || null;
      ['btnGrPrevStudent', 'btnGrNextStudent'].forEach(id => {
        const btn = document.getElementById(id);
        if (btn) btn.disabled = !st || orderedStudents.length < 2;
      });

      const activeGroup = appState.groups.find(g => g.id === appState.activeGroupId);
      const groupPill = document.getElementById('grGroupNamePill');
      if (groupPill) {
        const showPill = Boolean(activeGroup && !activeGroup.placeholder);
        groupPill.classList.toggle('hidden', !showPill);
        groupPill.textContent = showPill ? activeGroup.name : '';
      }
      const counterEl = document.getElementById('grStudentCounter');
      if (counterEl) {
        if (!orderedStudents.length) {
          counterEl.classList.add('hidden');
        } else {
          counterEl.classList.remove('hidden');
          const idx = st ? orderedStudents.findIndex(s => s.id === st.id) : -1;
          counterEl.textContent = idx >= 0
            ? `Élève ${idx + 1} / ${orderedStudents.length}`
            : `${orderedStudents.length} élève${orderedStudents.length > 1 ? 's' : ''}`;
        }
      }

      const useSelect = prefs.summaryStudentListMode === 'select';
      const searchWrap = document.getElementById('grStudentSearchWrap');
      const searchInput = document.getElementById('grStudentSearch');
      const showSearch = !useSelect && orderedStudents.length >= 6;
      if (searchWrap) searchWrap.classList.toggle('hidden', !showSearch);
      const query = showSearch && searchInput ? searchInput.value.trim() : '';

      band.innerHTML = '';
      if (!orderedStudents.length) {
        band.className = 'w-full';
        return { orderedStudents, st: null };
      }

      band.className = useSelect
        ? 'gr-student-select-wrap is-select w-full'
        : 'gr-student-grid w-full';

      if (useSelect) {
        const select = document.createElement('select');
        select.className = 'gr-student-select';
        select.setAttribute('aria-label', 'Choisir un élève pour la synthèse');
        const placeholder = document.createElement('option');
        placeholder.value = '';
        placeholder.textContent = 'Choisir un élève…';
        select.appendChild(placeholder);
        orderedStudents.forEach(student => {
          const option = document.createElement('option');
          option.value = student.id;
          option.textContent = student.name;
          option.selected = Boolean(st && student.id === st.id);
          select.appendChild(option);
        });
        select.value = st ? st.id : '';
        select.addEventListener('change', () => {
          appState.selectedStudentId = select.value || null;
          renderGlobalReportView();
        });
        band.appendChild(select);
        return { orderedStudents, st };
      }

      const isMulti = typeof getPresentStudentLevels === 'function' && getPresentStudentLevels().length > 1;
      const filteredStudents = query
        ? orderedStudents.filter(student => studentMatches(student, query))
        : orderedStudents;

      if (!filteredStudents.length) {
        const emptyMsg = document.createElement('p');
        emptyMsg.className = 'text-xs text-slate-500 py-1';
        emptyMsg.textContent = `Aucun élève ne correspond à « ${query} ».`;
        band.appendChild(emptyMsg);
        return { orderedStudents, st };
      }

      filteredStudents.forEach(student => {
        const isSel = Boolean(st && student.id === st.id);
        const status = getGlobalReportStudentStatus(student);
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.setAttribute('aria-pressed', String(isSel));
        btn.className = `gr-student-pill${isSel ? ' is-selected' : ''}`;
        const nameSpan = document.createElement('span');
        nameSpan.className = 'gr-student-pill-name';
        nameSpan.textContent = student.name;
        btn.appendChild(nameSpan);
        const metaWrap = document.createElement('span');
        metaWrap.className = 'gr-student-pill-meta';
        if (isMulti && student.gradeLevel) {
          const lvl = document.createElement('span');
          lvl.className = 'gr-student-pill-lvl';
          lvl.textContent = formatShortLevelTag(student.gradeLevel);
          metaWrap.appendChild(lvl);
        }
        if (status.hasAlert || status.hasFollowup) {
          const dot = document.createElement('span');
          dot.className = `gr-student-dot ${status.hasAlert ? 'is-alert' : 'is-warn'}`;
          dot.title = status.hasAlert
            ? 'Résultat sous le seuil ou cote D à suivre'
            : 'Bulletin modifié ou travail en suivi (NR/REP)';
          dot.setAttribute('aria-hidden', 'true');
          metaWrap.appendChild(dot);
        }
        if (metaWrap.childElementCount > 0) btn.appendChild(metaWrap);
        btn.addEventListener('click', () => {
          appState.selectedStudentId = student.id;
          renderGlobalReportView();
        });
        band.appendChild(btn);
      });
      return { orderedStudents, st };
    }

    function getGlobalReportOrderedStudents() {
      const students = Array.isArray(appState.students) ? appState.students.slice() : [];
      const sortMode = typeof prefs !== 'undefined' && prefs && prefs.summaryStudentSort === 'firstName'
        ? 'firstName'
        : 'lastName';
      const compareText = (a, b) => String(a || '').localeCompare(String(b || ''), 'fr', { sensitivity: 'base' });
      const getFirstName = student => (student.firstName || student.name || '').trim();
      const getLastName = student => {
        if (typeof student.lastName === 'string' && student.lastName.trim()) {
          return student.lastName.trim();
        }
        const rawName = String(student.name || '').trim();
        const firstSpace = rawName.indexOf(' ');
        return firstSpace > 0 ? rawName.slice(firstSpace + 1).trim() : '';
      };

      students.sort((a, b) => {
        if (sortMode === 'lastName') {
          const la = getLastName(a);
          const lb = getLastName(b);
          if (Boolean(la) !== Boolean(lb)) return la ? -1 : 1;
          const byLast = compareText(la, lb);
          if (byLast !== 0) return byLast;
        }
        return compareText(getFirstName(a), getFirstName(b)) || compareText(getLastName(a), getLastName(b));
      });
      return students;
    }

    let grCommentPopoverEl = null;
    let grCommentPopoverAnchor = null;
    function closeGrBulletinCommentPopover() {
      if (grCommentPopoverEl) {
        grCommentPopoverEl.remove();
        grCommentPopoverEl = null;
      }
      if (grCommentPopoverAnchor) {
        grCommentPopoverAnchor.setAttribute('aria-expanded', 'false');
        grCommentPopoverAnchor.classList.remove('is-open');
        grCommentPopoverAnchor = null;
      }
      if (document.removeEventListener) {
        document.removeEventListener('mousedown', onGrCommentPopoverOutside, true);
        document.removeEventListener('keydown', onGrCommentPopoverKey, true);
      }
      if (window.removeEventListener) {
        window.removeEventListener('resize', closeGrBulletinCommentPopover);
      }
    }
    function onGrCommentPopoverOutside(event) {
      if (!grCommentPopoverEl) return;
      if (grCommentPopoverEl.contains(event.target)) return;
      if (grCommentPopoverAnchor && grCommentPopoverAnchor.contains(event.target)) return;
      closeGrBulletinCommentPopover();
    }
    function onGrCommentPopoverKey(event) {
      if (event.key === 'Escape') {
        const anchor = grCommentPopoverAnchor;
        closeGrBulletinCommentPopover();
        if (anchor && anchor.isConnected) anchor.focus({ preventScroll: true });
      }
    }
    function openGrBulletinCommentPopover(anchorBtn, subjectId, subjectLabel, commentsList, studentId, onInsert) {
      const sameAnchor = grCommentPopoverAnchor === anchorBtn;
      closeGrBulletinCommentPopover();
      if (sameAnchor || !commentsList || !commentsList.length) return;

      const pop = document.createElement('div');
      pop.className = 'gr-comment-popover';
      pop.setAttribute('role', 'dialog');
      pop.setAttribute('aria-label', `Commentaires au bulletin — ${subjectLabel}`);

      const header = document.createElement('div');
      header.className = 'gr-comment-popover-head';
      header.innerHTML = `
        <div class="gr-comment-popover-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          <div>
            <strong>${escapeHtml(subjectLabel)}</strong>
            <span>Commentaire${commentsList.length > 1 ? 's' : ''} au bulletin</span>
          </div>
        </div>
        <button type="button" class="gr-comment-popover-close" aria-label="Fermer" title="Fermer">✕</button>
      `;
      header.querySelector('.gr-comment-popover-close').addEventListener('click', closeGrBulletinCommentPopover);
      pop.appendChild(header);

      const list = document.createElement('div');
      list.className = 'gr-comment-popover-list';
      commentsList.forEach(entry => {
        const card = document.createElement('div');
        card.className = 'gr-comment-popover-item';

        const meta = document.createElement('div');
        meta.className = 'gr-comment-popover-meta';
        meta.innerHTML = `<span class="gr-comment-popover-term">Étape ${escapeHtml(entry.term)}${entry.partLabel ? ` · ${escapeHtml(entry.partLabel)}` : ''}</span>`;

        const actions = document.createElement('div');
        actions.className = 'gr-comment-popover-actions';

        const copyBtn = document.createElement('button');
        copyBtn.type = 'button';
        copyBtn.className = 'gr-comment-popover-btn';
        copyBtn.textContent = 'Copier';
        copyBtn.addEventListener('click', () => {
          const done = () => { if (typeof showToast === 'function') showToast('Commentaire copié'); };
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(entry.text).then(done, done);
          } else {
            done();
          }
        });
        actions.appendChild(copyBtn);

        if (typeof onInsert === 'function') {
          const insBtn = document.createElement('button');
          insBtn.type = 'button';
          insBtn.className = 'gr-comment-popover-btn is-accent';
          insBtn.textContent = '+ Insérer';
          insBtn.title = 'Insérer dans le commentaire général';
          insBtn.addEventListener('click', () => onInsert(entry.text));
          actions.appendChild(insBtn);
        }

        const editBtn = document.createElement('button');
        editBtn.type = 'button';
        editBtn.className = 'gr-comment-popover-btn';
        editBtn.textContent = 'Carnet →';
        editBtn.title = `Ouvrir ${subjectLabel} (Étape ${entry.term}) dans le carnet`;
        editBtn.addEventListener('click', () => {
          closeGrBulletinCommentPopover();
          jumpFromReportToSubject(entry.sourceSubjectId || subjectId, studentId, entry.term);
        });
        actions.appendChild(editBtn);

        meta.appendChild(actions);
        const body = document.createElement('p');
        body.className = 'gr-comment-popover-text';
        body.textContent = entry.text;

        card.append(meta, body);
        list.appendChild(card);
      });
      pop.appendChild(list);

      pop.style.visibility = 'hidden';
      document.body.appendChild(pop);
      const rect = anchorBtn.getBoundingClientRect();
      const popW = pop.offsetWidth;
      const popH = pop.offsetHeight;
      const margin = 12;
      let left = rect.left;
      if (left + popW + margin > window.innerWidth) {
        left = Math.max(margin, window.innerWidth - popW - margin);
      }
      let top = rect.bottom + 8;
      if (top + popH + margin > window.innerHeight) {
        top = Math.max(margin, rect.top - popH - 8);
      }
      pop.style.left = `${Math.round(left)}px`;
      pop.style.top = `${Math.round(top)}px`;
      pop.style.visibility = '';

      grCommentPopoverEl = pop;
      grCommentPopoverAnchor = anchorBtn;
      anchorBtn.setAttribute('aria-expanded', 'true');
      anchorBtn.classList.add('is-open');
      document.addEventListener('mousedown', onGrCommentPopoverOutside, true);
      document.addEventListener('keydown', onGrCommentPopoverKey, true);
      window.addEventListener('resize', closeGrBulletinCommentPopover);
    }

    function renderGlobalReportView() {
      closeGrBulletinCommentPopover();
      const band = document.getElementById('grStudentBand');
      const container = document.getElementById('grReportContent');
      if (!band || !container) return;

      // Annual weight indicator (20-20-60 MEQ)
      appState.annualWeightMode = 'official';
      const weightMode = 'official';

      const selResult = renderGrStudentSelectorOnly();
      if (!selResult) return;
      const { orderedStudents, st } = selResult;

      if (!orderedStudents.length) {
        container.innerHTML = '<div class="gr-empty-card">Ajoutez un élève pour consulter sa synthèse.</div>';
        return;
      }

      if (!st) {
        container.innerHTML = '<div class="gr-empty-card">Sélectionner un nom ci-dessus pour afficher la synthèse de l’élève.</div>';
        return;
      }

      // 2. Gather grade data across the three terms and all subjects
      const subjectRows = [];
      const termGlobals = { '1': [], '2': [], '3': [] };
      const tagFrequency = {};
      const flagFrequency = {};
      const recordedComments = [];
      const bulletinCommentsBySubject = {};
      const pendingStatuses = [];
      const evalDetailsBySubject = {};
      const preschoolDomains = {};

      SUBJECTS_CONFIG.forEach(sub => {
        if (!isSubjectApplicableForStudent(sub, st)) return;
        if (sub.isIlss) {
          const ilssBulletins = [];
          ['1', '2', '3'].forEach(tKey => {
            const j = st.ilssByTerm?.[tKey]?.judgments?.[sub.ilssCompetency];
            if (j && j.comment && j.comment.trim()) {
              const text = j.comment.trim();
              recordedComments.push({ term: tKey, subject: sub.shortName, context: 'Jugement d’étape', text });
              ilssBulletins.push({ term: tKey, sourceSubjectId: sub.id, partLabel: '', text });
            }
            const sd = appState.terms?.[tKey]?.subjectData?.[sub.id];
            const rec = sd?.studentRecords?.[st.id];
            if (sd && rec) {
              (sd.assignments || []).forEach(asg => {
                const meta = rec.scoreMeta?.[asg.id];
                if (!meta) return;
                if (Array.isArray(meta.quickComments)) {
                  meta.quickComments.forEach(tg => { tagFrequency[tg] = (tagFrequency[tg] || 0) + 1; });
                }
                if (meta.comment && meta.comment.trim()) {
                  recordedComments.push({ term: tKey, subject: sub.shortName, context: asg.title || 'Trace ILSS', text: meta.comment.trim() });
                }
              });
            }
          });
          if (ilssBulletins.length) bulletinCommentsBySubject[sub.id] = ilssBulletins;
          return;
        }
        sub = getSubjectDisplayConfig(sub, getEffectiveGradeLevel(st, sub) || st.gradeLevel);
        const domain = preschoolDomains[sub.id] = { strengths: new Map(), challenges: new Map(), latestComment: null };
        const countTag = (map, tag) => map.set(tag, (map.get(tag) || 0) + 1);
        const s1 = computeStudentSubjectSummary('1', sub.id, st.id);
        const s2 = computeStudentSubjectSummary('2', sub.id, st.id);
        const s3 = computeStudentSubjectSummary('3', sub.id, st.id);
        const t1 = s1.finalPct;
        const t2 = s2.finalPct;
        const t3 = s3.finalPct;
        const termOverrides = {
          '1': { overridden: Boolean(appState.terms['1']?.subjectData?.[sub.id]?.studentRecords?.[st.id]?.finalJudgmentOverride !== ''), avg: s1.assignmentsAvg },
          '2': { overridden: Boolean(appState.terms['2']?.subjectData?.[sub.id]?.studentRecords?.[st.id]?.finalJudgmentOverride !== ''), avg: s2.assignmentsAvg },
          '3': { overridden: Boolean(appState.terms['3']?.subjectData?.[sub.id]?.studentRecords?.[st.id]?.finalJudgmentOverride !== ''), avg: s3.assignmentsAvg }
        };

        if (t1 !== null) termGlobals['1'].push(t1);
        if (t2 !== null) termGlobals['2'].push(t2);
        if (t3 !== null) termGlobals['3'].push(t3);

        const validTerms = [t1, t2, t3].filter(v => v !== null);
        const annualAvg = computeWeightedAnnualAverage(t1, t2, t3, weightMode);
        let delta = null;
        if (validTerms.length >= 2) {
          delta = validTerms[validTerms.length - 1] - validTerms[0];
        }

        const evalItems = [];
        ['1', '2', '3'].forEach(tKey => {
          const sd = appState.terms[tKey].subjectData[sub.id];
          const rec = sd.studentRecords[st.id];
          sd.assignments.forEach(asg => {
            if (!isAssignmentForStudent(asg, st)) return;
            const meta = rec.scoreMeta && rec.scoreMeta[asg.id];
            if (asg.isObservation && meta && meta.linkedCopy) return;
            if (meta && Array.isArray(meta.tags)) {
              meta.tags.forEach(tg => {
                tagFrequency[tg] = (tagFrequency[tg] || 0) + 1;
              });
              const observations = groupObservationTags(meta.tags);
              observations.strengths.forEach(tag => countTag(domain.strengths, tag));
              observations.challenges.forEach(tag => countTag(domain.challenges, tag));
              [['Forces', observations.strengths], ['Défis', observations.challenges], ['Observations précédentes', observations.previous]].forEach(([label, values]) => {
                if (values.length) recordedComments.push({ term: tKey, subject: sub.shortName, context: asg.title, text: `${label} : ${values.join(' · ')}`, fromTags: true });
              });
            }
            const flags = getCellFlags(rec, asg.id);
            flags.forEach(fl => {
              if (VALID_CELL_FLAG_CODES.has(fl)) {
                flagFrequency[fl] = (flagFrequency[fl] || 0) + 1;
              }
            });
            if (meta && typeof meta.strengths === 'string' && meta.strengths.trim()) {
              recordedComments.push({ term: tKey, subject: sub.shortName, context: asg.title, text: `Forces : ${meta.strengths.trim()}` });
            }
            if (meta && typeof meta.challenges === 'string' && meta.challenges.trim()) {
              recordedComments.push({ term: tKey, subject: sub.shortName, context: asg.title, text: `Défis : ${meta.challenges.trim()}` });
            }
            if (meta && meta.comment && meta.comment.trim()) {
              domain.latestComment = { term: tKey, text: meta.comment.trim() };
              recordedComments.push({
                term: tKey,
                subject: sub.shortName,
                context: asg.title,
                text: meta.comment.trim()
              });
            }

            const raw = rec.scores[asg.id] !== undefined ? String(rec.scores[asg.id]).trim() : '';
            const upper = raw.toUpperCase();
            const hasTraceFeedback = Boolean(asg.isObservation && meta &&
              (hasObservationFeedback(meta) || (Array.isArray(meta.checked) && meta.checked.length)));
            const hasNotEval = Boolean((meta && meta.notEvaluated) || (upper === '-' && !hasTraceFeedback));
            if (upper === 'NR' || upper === 'REP' || upper === 'JUST' || upper === 'JUS' || flags.includes('ABS')) {
              const statusCode = upper === 'NR' ? 'NR' : upper === 'REP' ? 'REP' : (upper === 'JUST' || upper === 'JUS') ? 'JUST' : 'ABS';
              const statusLabel = statusCode === 'NR' ? 'Non remis' : statusCode === 'REP' ? 'En reprise' : statusCode === 'JUST' ? 'Justifié' : 'À reprendre';
              pendingStatuses.push({
                term: tKey,
                subjectId: sub.id,
                subject: sub.shortName,
                title: asg.title || 'Évaluation',
                code: statusCode,
                label: statusLabel
              });
            }
            if (raw || hasNotEval) {
              const studentWeight = getAssignmentWeightForLevel(asg, st.gradeLevel, sub, appState.terms[tKey]);
              let resultDisplay = '';
              if (upper === 'NR') resultDisplay = 'NR (Non remis)';
              else if (upper === 'JUST' || upper === 'JUS') resultDisplay = 'JUST (Justifié)';
              else if (upper === 'REP') resultDisplay = 'REP (En reprise)';
              else if (hasNotEval) resultDisplay = 'Exempté (-)';
              else if (asg.isObservation) {
                if (upper === '-' && hasTraceFeedback) {
                  resultDisplay = 'En cours';
                } else {
                  const num = Number(raw);
                  const code = (meta && meta.code) ? meta.code : (Number.isFinite(num) ? pctToClosestGradeCode(num) : '');
                  resultDisplay = Number.isFinite(num) ? `${code} (${Math.round(num)} %)` : raw;
                }
              } else {
                const outOf = getAssignmentOutOf(asg);
                const num = Number(raw.replace(',', '.'));
                if (Number.isFinite(num)) {
                  const pct = outOf > 0 ? Math.round((num / outOf) * 100) : Math.round(num);
                  resultDisplay = outOf !== 100 ? `${formatScoreNumber(num)}/${formatScoreNumber(outOf)} (${pct} %)` : `${pct} %`;
                } else {
                  resultDisplay = raw;
                }
              }
              evalItems.push({
                term: tKey,
                title: asg.title || 'Évaluation',
                isObs: Boolean(asg.isObservation),
                weight: studentWeight,
                resultDisplay,
                flags
              });
            }
          });
          if (rec.comment && rec.comment.trim()) {
            const trimmedComment = rec.comment.trim();
            domain.latestComment = { term: tKey, text: trimmedComment };
            recordedComments.push({
              term: tKey,
              subject: sub.shortName,
              context: 'Commentaire au bulletin',
              text: trimmedComment
            });
            if (!bulletinCommentsBySubject[sub.id]) bulletinCommentsBySubject[sub.id] = [];
            bulletinCommentsBySubject[sub.id].push({
              term: tKey,
              sourceSubjectId: sub.id,
              partLabel: '',
              text: trimmedComment
            });
          }
        });
        evalDetailsBySubject[sub.id] = evalItems;

        subjectRows.push({
          sub,
          sourceSubjectIds: [sub.id],
          t1,
          t2,
          t3,
          termOverrides,
          annualAvg,
          annualCode: pctToClosestGradeCode(annualAvg),
          delta,
          isModified: isSubjectModifiedForStudent(st, sub),
          effectiveLevel: getEffectiveGradeLevel(st, sub)
        });
      });

      // Sciences et GHEC : un seul résultat au bulletin (les 3 compétences sont évaluées ensemble)
      [...new Set(SUBJECTS_CONFIG.filter(item => item.singleResult && item.group).map(item => item.group))].forEach(groupKey => {
        const parts = subjectRows.filter(r => r.sub.group === groupKey);
        if (!parts.length) return;
        const mean = vals => {
          const ok = vals.filter(v => v !== null);
          return ok.length ? Math.round(ok.reduce((a, b) => a + b, 0) / ok.length) : null;
        };
        const pooled = tk => computePooledGroupPct(tk, parts.map(r => r.sub), st.id, mean(parts.map(r => r['t' + tk])));
        const t1 = pooled('1');
        const t2 = pooled('2');
        const t3 = pooled('3');
        const terms = [t1, t2, t3].filter(v => v !== null);
        const annualAvg = computeWeightedAnnualAverage(t1, t2, t3, weightMode);
        const mergedSub = { ...parts[0].sub, id: groupKey, shortName: parts[0].sub.bulletinLabel };
        const merged = {
          sub: mergedSub,
          sourceSubjectIds: parts.flatMap(part => part.sourceSubjectIds || [part.sub.id]),
          t1, t2, t3,
          termOverrides: {
            '1': { overridden: parts.some(p => p.termOverrides?.['1']?.overridden), avg: null },
            '2': { overridden: parts.some(p => p.termOverrides?.['2']?.overridden), avg: null },
            '3': { overridden: parts.some(p => p.termOverrides?.['3']?.overridden), avg: null }
          },
          annualAvg,
          annualCode: pctToClosestGradeCode(annualAvg),
          delta: terms.length >= 2 ? terms[terms.length - 1] - terms[0] : null,
          isModified: isSubjectModifiedForStudent(st, mergedSub),
          effectiveLevel: getEffectiveGradeLevel(st, mergedSub)
        };
        evalDetailsBySubject[groupKey] = parts.flatMap(part =>
          (evalDetailsBySubject[part.sub.id] || []).map(item => ({ ...item, partLabel: part.sub.partLabel || part.sub.shortName }))
        );
        const mergedBulletinComments = [];
        const seenMergedComments = new Set();
        const partsWithComments = parts.filter(part => (bulletinCommentsBySubject[part.sub.id] || []).length > 0);
        parts.forEach(part => {
          (bulletinCommentsBySubject[part.sub.id] || []).forEach(entry => {
            const dedupeKey = `${entry.term}::${entry.text}`;
            if (seenMergedComments.has(dedupeKey)) return;
            seenMergedComments.add(dedupeKey);
            mergedBulletinComments.push({
              term: entry.term,
              sourceSubjectId: part.sub.id,
              partLabel: partsWithComments.length > 1 ? (part.sub.partLabel || part.sub.shortName) : '',
              text: entry.text
            });
          });
        });
        mergedBulletinComments.sort((a, b) => Number(a.term) - Number(b.term));
        if (mergedBulletinComments.length) bulletinCommentsBySubject[groupKey] = mergedBulletinComments;
        const firstIdx = subjectRows.indexOf(parts[0]);
        subjectRows.splice(firstIdx, 0, merged);
        parts.forEach(r => subjectRows.splice(subjectRows.indexOf(r), 1));
      });
      ['1', '2', '3'].forEach(k => {
        termGlobals[k] = subjectRows.map(r => r['t' + k]).filter(v => v !== null);
      });

      const avgT1 = computeDisciplineAverageForSummary(subjectRows, 't1');
      const avgT2 = computeDisciplineAverageForSummary(subjectRows, 't2');
      const avgT3 = computeDisciplineAverageForSummary(subjectRows, 't3');

      const populatedSubjects = subjectRows.filter(r => r.annualAvg !== null);
      const overallAnnualAvg = computeDisciplineAverageForSummary(subjectRows);
      const overallProvisional = populatedSubjects.length < subjectRows.length ||
        populatedSubjects.some(r => getAnnualResultInfo(r.t1, r.t2, r.t3).provisional);

      const sortedTags = Object.entries(tagFrequency).sort((a, b) => b[1] - a[1]);

      const studentCycle = getStudentCycle(st.gradeLevel);
      const compTerm = 'annual';
      const compPicks = getAnnualCompetencyPicks(st);
      const hasHistoricalCompetencies = ['1', '2', '3'].some(term =>
        st.competencyTerms && OWN.call(st.competencyTerms, term)
          && st.competencyTerms[term] && Object.keys(st.competencyTerms[term]).length
      );
      const competencyTabs = getCompetencyTabs();
      const selectedTab = competencyTabs.find(tab => tab.id === competencySubjectSelected && !tab.disabled) || null;
      if (!selectedTab) competencySubjectSelected = null;
      const selectedScale = selectedTab
        ? selectedTab.scales.find(scale => scale.id === competencyScaleSelected[selectedTab.id]) || selectedTab.scales[0] || null
        : null;
      if (selectedScale) competencyScaleSelected[selectedTab.id] = selectedScale.id;
      const getCompetencyResult = scale => computeCompetencyResult(scale, compPicks[scale.id]);
      const establishedScales = competencyTabs
        .flatMap(tab => tab.scales.map(scale => ({ scale, tabId: tab.id, result: getCompetencyResult(scale) })))
        .filter(entry => Boolean(entry.result));
      const establishedChipsHtml = establishedScales.length
        ? establishedScales.map(({ scale, tabId, result }) => {
            const meqChip = getMeqFinal(st, compTerm, scale, tabId, compPicks[scale.id]);
            const meqChipHtml = meqChip && meqChip.level ? ` <span class="comp-chip-meq" title="Repère indicatif sur l’échelle du MEQ : ${escapeHtml(MEQ5_LEVELS[meqChip.level].label)}">· MEQ ${meqChip.level}/5</span>` : '';
            return `<span class="comp-chip is-set">${escapeHtml(scale.chip)} <b>${result.level}/${scale.max}</b>${meqChipHtml}</span>`;
          }).join('')
        : '<span class="comp-summary-empty">Aucun niveau établi pour le moment — cliquez pour ouvrir les échelles.</span>';
      const renderScaleSection = scale => {
        const model = getCompetencyScaleModel(scale);
        if (!model.levels.length) {
          return '<p class="text-sm text-slate-600">Les échelles sont introuvables : le fichier echelles-niveaux.js doit rester dans le même dossier que le carnet.</p>';
        }
        const picked = compPicks[scale.id] || {};
        const result = computeCompetencyResult(scale, picked);
        const meq = result ? getMeqFinal(st, compTerm, scale, selectedTab.id, picked) : null;
        const meqHtml = meq && meq.level ? `
              <div class="comp-meq" role="group" aria-label="Repère indicatif sur l’échelle du MEQ à 5 niveaux">
                <span class="comp-meq-label" title="Repère suggéré par les phrases surlignées, selon les attentes du ${escapeHtml(CYCLE_LABELS[meq.cycle] || '')} de l’élève. Cliquez un niveau pour l’ajuster.">Échelle MEQ · ${escapeHtml(CYCLE_LABELS[meq.cycle] || '')}</span>
                <span class="comp-meq-steps">${[1, 2, 3, 4, 5].map(v => `<button type="button" class="comp-meq-btn${v === meq.level ? ' is-level' : ''}${v === meq.suggested ? ' is-suggested' : ''}" data-comp-meq="${scale.id}" data-meq-val="${v}" aria-pressed="${v === meq.level}" title="Niveau ${v} — ${escapeHtml(MEQ5_LEVELS[v].label)}${v === meq.suggested ? ' (suggéré par vos phrases)' : ''}">${v}</button>`).join('')}</span>
                <span class="comp-meq-name">${escapeHtml(MEQ5_LEVELS[meq.level].label)}${meq.override ? ' <em>· ajusté</em>' : ''}</span>
                ${meq.override ? `<button type="button" class="comp-meq-auto" data-comp-meq-auto="${scale.id}" title="Revenir au niveau suggéré par les phrases (${meq.suggested}/5)">↺ auto</button>` : ''}
              </div>` : '';
        const meqDetailHtml = meq && meq.level ? `
            <details class="comp-meq-detail">
              <summary>Comment le repère MEQ ${meq.level}/5 est-il déterminé ?</summary>
              <div class="comp-meq-body">
                <p>Chaque phrase surlignée est située par rapport aux <strong>attentes du ${escapeHtml(CYCLE_LABELS[meq.cycle] || '')}</strong> de l’élève (cycle modifié inclus) : fin de cycle → niveau 4, étapes en progression → niveau 2 ou 3, repères du cycle suivant → niveau 5. Le niveau suggéré est celui atteint par la majorité de vos phrases; aucun calcul à partir du /${scale.max}. Le niveau 5 peut aussi être choisi manuellement selon votre jugement. ${meq.override ? `<strong>Vous avez ajusté manuellement le niveau (suggestion : ${meq.suggested}/5).</strong>` : 'Un clic sur un autre niveau permet de l’ajuster.'}</p>
                <ul class="comp-meq-items">
                  ${meq.items.map(item => `<li><b>Éch. ${item.n}</b> → niv. ${item.q} <span class="comp-meq-why">(${escapeHtml(item.why)})</span><span class="comp-meq-quote">« ${escapeHtml(item.text.length > 120 ? item.text.slice(0, 117) + '…' : item.text)} »</span></li>`).join('')}
                </ul>
                <ol class="comp-meq-legend" reversed>
                  ${[5, 4, 3, 2, 1].map(v => `<li class="${v === meq.level ? 'is-level' : ''}"><b>${v} · ${escapeHtml(MEQ5_LEVELS[v].label)}</b> — ${escapeHtml(MEQ5_LEVELS[v].text)}</li>`).join('')}
                </ol>
                <p class="comp-meq-note">Ce calcul est propre au carnet : il ne constitue ni une méthode ministérielle ni un résultat officiel. Le jugement professionnel de l’enseignant demeure essentiel.
                  <a href="${getMeqScaleUrl(meq.cycle, selectedTab.id)}" target="_blank" rel="noopener noreferrer">Ouvrir l’échelle officielle ↗</a></p>
              </div>
            </details>` : (meq && meq.unavailable
          ? '<p class="comp-meq-note">Aucune échelle MEQ à 5 niveaux n’est disponible dans le carnet pour cette discipline à ce cycle.</p>' : '');
        const cycles = [...new Set(model.levels.map(level => level.cycle))];
        const sentenceHtml = (sentence, level) => {
          const pickedLevel = picked[sentence.row];
          const isPicked = pickedLevel !== undefined && Number(pickedLevel) === level.n;
          const isLocked = pickedLevel !== undefined && !isPicked;
          const rowLevels = (model.rows[sentence.row] || { levels: [] }).levels;
          const firstAligned = Math.min(...rowLevels);
          const lastAligned = Math.max(...rowLevels);
          const alignedLevels = new Set(rowLevels);
          const unaligned = rowLevels.length > 1
            ? Array.from({ length: lastAligned - firstAligned - 1 }, (_, index) => firstAligned + index + 1)
              .filter(number => !alignedLevels.has(number))
            : [];
          const rowTitle = rowLevels.length > 1
            ? `Rapprochement suggéré aux échelons ${rowLevels.join(', ')}${unaligned.length ? ` — aucun rapprochement suggéré aux échelons ${unaligned.join(', ')}` : ''}${isLocked ? ' — cliquer pour remplacer la phrase choisie' : ''}`
            : 'Précision propre à cet échelon';
          return `<span class="comp-sentence${isPicked ? ' is-picked' : ''}${isLocked ? ' is-locked' : ''}" title="${rowTitle}" role="button" tabindex="0" aria-pressed="${isPicked}" data-comp-scale="${scale.id}" data-comp-row="${sentence.row}" data-comp-level="${level.n}">${escapeHtml(sentence.text)}</span> `;
        };
        const meterHtml = model.levels.map(level => {
          const inRange = result && level.n >= result.min && level.n <= result.max;
          return `<span class="comp-meter-cell${inRange ? ' in-range' : ''}${result && level.n === result.level ? ' is-level' : ''}">${level.n}</span>`;
        }).join('');
        return `
          <section class="comp-scale${result ? ' has-picks' : ''}" aria-label="${escapeHtml(scale.label)}">
            <div>
              <h4 class="text-sm font-bold text-slate-900">${escapeHtml(scale.label)}</h4>
              <p class="mt-0.5 text-[11px] text-slate-500">Chaque phrase peut être choisie séparément. Sélectionnez les constats qui décrivent précisément l’élève.</p>
            </div>
            ${cycles.map(cycle => {
              const levels = model.levels.filter(level => level.cycle === cycle);
              const lastN = levels[levels.length - 1].n;
              return `
                <div class="space-y-1.5">
                  ${cycle ? `<div class="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                    <span>${escapeHtml(CYCLE_LABELS[cycle] || `Cycle ${cycle}`)}</span>
                    ${cycle === studentCycle ? '<span class="rounded-full bg-slate-100 px-2 py-0.5 normal-case text-[10px] text-slate-700">Cycle de l’élève</span>' : ''}
                  </div>` : ''}
                  <div class="comp-grid">
                    ${levels.map(level => `
                      <div class="comp-card${result && result.level === level.n ? ' is-level' : ''}">
                        <div class="comp-card-head">
                          <span>Échelon ${level.n} / ${scale.max}</span>
                          ${result && result.level === level.n ? '<span class="comp-badge">Niveau estimé</span>' : (cycle && level.n === lastN ? '<span class="comp-end">Attente de fin de cycle</span>' : '')}
                        </div>
                        <div class="comp-card-text">${level.sentences.map(sentence => sentenceHtml(sentence, level)).join('')}</div>
                      </div>
                    `).join('')}
                  </div>
                </div>
              `;
            }).join('')}
            <div class="comp-result">
              <div class="comp-result-text">
                ${result ? `
                  <span class="comp-result-label">Niveau estimé</span>
                  <strong class="comp-result-level">${result.level}<small> / ${scale.max}</small></strong>
                  <span class="comp-result-note">atteint par la majorité : ${result.atOrAbove} phrase${result.atOrAbove > 1 ? 's' : ''} sur ${result.count} à l’échelon ${result.level} ou plus${result.min !== result.max ? ` (échelons ${result.min} à ${result.max})` : ''}. Calcul par médiane pondérée; à égalité, l’échelon inférieur est retenu.</span>
                ` : `
                  <span class="comp-result-label">Aucune phrase choisie</span>
                  <span class="comp-result-note">Le niveau apparaîtra ici au fil de vos clics.</span>
                `}
              </div>
              <div class="comp-meter" aria-hidden="true">${meterHtml}</div>
              ${meqHtml}
              <button type="button" class="comp-reset" data-comp-reset="${scale.id}" ${result ? '' : 'disabled'}>Réinitialiser</button>
            </div>
            ${meqDetailHtml}
            ${result ? (() => {
              const comment = getCompetencyComment(st, compTerm, scale, picked);
              const pron = st.pronoun || 'prenom';
              return `
            <div class="comp-comment">
              <div class="comp-comment-head">
                <span>Commentaire de bulletin <span class="cc-tag">${comment.custom ? '· modifié manuellement' : '· généré à partir des phrases choisies'}</span></span>
                <span>
                  <select class="cc-btn" data-comp-pron aria-label="Formulation du commentaire">
                    <option value="prenom"${pron === 'prenom' ? ' selected' : ''}>Prénom + « il »</option>
                    <option value="prenom_elle"${pron === 'prenom_elle' ? ' selected' : ''}>Prénom + « elle »</option>
                    <option value="il"${pron === 'il' ? ' selected' : ''}>Avec « il » seulement</option>
                    <option value="elle"${pron === 'elle' ? ' selected' : ''}>Avec « elle » seulement</option>
                  </select>
                  <button type="button" class="cc-btn" data-comp-regen="${scale.id}" ${comment.custom ? '' : 'disabled'} title="Remplacer mes modifications par le texte généré">Régénérer</button>
                  <button type="button" class="cc-btn" data-comp-copy="${scale.id}">Copier</button>
                </span>
              </div>
              <textarea data-comp-comment="${scale.id}" aria-label="Commentaire de bulletin">${escapeHtml(comment.text)}</textarea>
            </div>`;
            })() : ''}
          </section>
        `;
      };

      const refSubject = selectedTab && SUBJECTS_CONFIG.find(s => (s.group || s.id) === ({ sciences_global: 'sciences', univers_social: 'social' }[selectedTab.id] || selectedTab.id));
      const refCycle = selectedTab && (getCompetencyEffectiveCycle(st, selectedTab.id) || studentCycle);
      const refAnchor = (href, label, strong) => href
        ? `<a href="${href}" target="_blank" rel="noopener noreferrer" class="${strong ? 'is-main' : ''}">${label} ↗</a>` : '';
      const referentielsHtml = selectedTab ? `
        <div class="comp-refs no-print" aria-label="Référentiels officiels">
          <span class="comp-refs-title">Référentiels</span>
          ${refCycle && CYCLE_SCALE_URLS[refCycle] ? refAnchor(getMeqScaleUrl(refCycle, selectedTab.id), `Échelle MEQ · ${escapeHtml(selectedTab.label)} · ${escapeHtml(CYCLE_LABELS[refCycle])}`, true) : ''}
          ${[1, 2, 3].filter(c => c !== refCycle).map(c => refAnchor(getMeqScaleUrl(c, selectedTab.id), escapeHtml(CYCLE_LABELS[c]))).join('')}
          ${refSubject && refSubject.refUrl ? refAnchor(refSubject.refUrl, 'Cadre d’évaluation (PFEQ)') : ''}
          ${refAnchor((refSubject && refSubject.cssmbUrl) || 'https://sre.servicescsmb.com/disciplines/', 'Ressources CSSMB')}
        </div>` : '';

      const missingModifiedCount = subjectRows.filter(r => r.isModified && getIncompleteModifiedCompetency(st, r.sub)).length;
      const competencyModuleHtml = st.gradeLevel === 'P' ||
        (typeof isAccueilGroup === 'function' && isAccueilGroup()) ||
        competencyTabs.every(tab => tab.disabled) ? '' : `
        <details id="competencyPositioning" class="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden" ${competencyPanelOpen ? 'open' : ''}>
          <summary class="comp-card-summary px-4 py-3 bg-slate-50 cursor-pointer flex flex-col gap-2.5">
            <div class="comp-card-summary-top flex flex-wrap items-center justify-between gap-2 w-full">
              <span>
                <span class="flex flex-wrap items-center gap-2 text-sm font-bold text-slate-900">
                  <span>Niveaux de compétence</span>
                  ${missingModifiedCount > 0 ? `<span class="gr-mod-pill">${missingModifiedCount} échelle${missingModifiedCount > 1 ? 's' : ''} à compléter</span>` : ''}
                </span>
                <span class="mt-0.5 block text-xs text-slate-600">Échelles du primaire · ${studentCycle ? escapeHtml(CYCLE_LABELS[studentCycle]) : 'Cycle à préciser'}</span>
              </span>
              <span class="inline-flex items-center gap-2 text-xs font-semibold text-slate-600">
                <button type="button" class="comp-recap-print no-print" data-comp-print="1" aria-label="Imprimer les niveaux de compétence" title="Imprimer les niveaux de compétence">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                </button>
                <span class="comp-toggle-label-closed">Échelles</span>
                <span class="comp-toggle-label-open">Réduire</span>
                <svg class="competency-chevron h-4 w-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="m5 7.5 5 5 5-5"/></svg>
              </span>
            </div>
            <div class="comp-summary-strip" id="grCompetencyLevelSummary" aria-label="Niveaux de compétence établis">
              ${establishedChipsHtml}
            </div>
          </summary>
          <div class="p-4 border-t border-slate-200 space-y-3">
            <div class="comp-tabs" role="group" aria-label="Choisir une matière">
              ${competencyTabs.map(tab => tab.disabled ? `
                <button type="button" class="competency-subject-button comp-tab is-disabled" disabled aria-disabled="true">
                  ${escapeHtml(tab.label)} <span class="comp-tab-note">Aucune échelle</span>
                </button>
              ` : `
                <button type="button" class="competency-subject-button comp-tab${selectedTab && tab.id === selectedTab.id ? ' is-active' : ''}" data-competency-subject="${tab.id}" aria-pressed="${Boolean(selectedTab && tab.id === selectedTab.id)}">
                  ${escapeHtml(tab.label)}
                </button>
              `).join('')}
            </div>
            ${selectedTab ? `
            ${hasHistoricalCompetencies ? '<p class="comp-history-note">Pour chaque échelle, le dernier choix par étape a été repris; les anciens choix restent dans la sauvegarde.</p>' : ''}
            ${selectedTab.scales.length > 1 ? `
              <div class="comp-subtabs" role="group" aria-label="Compétence de ${escapeHtml(selectedTab.label)}">
                ${selectedTab.scales.map(scale => {
                  const result = getCompetencyResult(scale);
                  const meqTab = result ? getMeqFinal(st, compTerm, scale, selectedTab.id, compPicks[scale.id]) : null;
                  return `<button type="button" class="comp-subtab${scale.id === selectedScale.id ? ' is-active' : ''}" data-comp-scale-tab="${scale.id}" aria-pressed="${scale.id === selectedScale.id}">${escapeHtml(scale.tab)} <b>${result ? `${result.level}/${scale.max}${meqTab && meqTab.level ? ` · MEQ ${meqTab.level}/5` : ''}` : '—'}</b></button>`;
                }).join('')}
              </div>
            ` : ''}
            ${selectedScale ? renderScaleSection(selectedScale) : '<p class="text-sm text-slate-600">Aucune échelle de niveaux de compétence pour les matières de ce groupe.</p>'}
            ${referentielsHtml}
            ` : ''}
          </div>
        </details>
      `;

      // Build Horizontal Bar Chart with 60% threshold line & modified badges
      const sortedFlags = Object.entries(flagFrequency).sort((a, b) => b[1] - a[1]);
      const competencyWarningHtml = row => {
        if (!row.isModified) return '';
        const incomplete = getIncompleteModifiedCompetency(st, row.sub);
        if (!incomplete) return '';
        return `<button type="button" class="competency-mod-warning no-print" data-competency-guide-student="${escapeHtml(st.id)}" data-competency-guide-tab="${escapeHtml(incomplete.tabId)}" data-competency-guide-scale="${escapeHtml(incomplete.missing[0].id)}" aria-label="Niveaux de compétence à compléter pour ${escapeHtml(row.sub.shortName)}" title="Niveau de compétence à compléter — cliquer pour ouvrir le parcours guidé"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 2.8 19h18.4Z"/><path d="M12 8v6M12 17.2h.01"/></svg></button>`;
      };
      const renderTrendBadge = (deltaVal, t1Val, t2Val, t3Val) => {
        const trailParts = [
          t1Val !== null ? `É1: ${t1Val}%` : null,
          t2Val !== null ? `É2: ${t2Val}%` : null,
          t3Val !== null ? `É3: ${t3Val}%` : null
        ].filter(Boolean);
        const titleAttr = trailParts.length ? ` title="Trajectoire : ${trailParts.join(' → ')}"` : '';
        if (deltaVal === null) return '<span class="text-slate-400">—</span>';
        if (deltaVal >= 3) {
          return `<span class="trend-badge trend-up" data-num="1"${titleAttr}><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3.5 11.5 12.5 4.5M12.5 4.5H6.5M12.5 4.5v6"/></svg>+${deltaVal} %</span>`;
        }
        if (deltaVal <= -3) {
          return `<span class="trend-badge trend-down" data-num="1"${titleAttr}><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3.5 4.5 12.5 11.5M12.5 11.5H6.5M12.5 11.5v-6"/></svg>${deltaVal} %</span>`;
        }
        const sign = deltaVal > 0 ? `+${deltaVal}` : `${deltaVal}`;
        return `<span class="trend-badge trend-flat" data-num="1"${titleAttr}><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 8h10M9.5 4.5 13 8l-3.5 3.5"/></svg>${sign} %</span>`;
      };

      const weightModeLabel = weightMode === 'official'
        ? 'Pondéré MEQ (20 % / 20 % / 60 %)'
        : 'Moyenne simple des étapes';
      const PRESCHOOL_CONSTATS = {
        4: { label: 'Se développe très bien', short: 'Très bien' },
        3: { label: 'Se développe adéquatement', short: 'Adéquatement' },
        2: { label: 'Se développe avec certaines difficultés', short: 'Certaines difficultés' },
        1: { label: 'Se développe avec des difficultés importantes', short: 'Difficultés importantes' }
      };
      const PRESCHOOL_DOMAIN_ICONS = {
        presco_c1: '<circle cx="13" cy="4" r="2"/><path d="m7 21 3-6 3 2v5"/><path d="m6 12 3-4 5 1 3 3"/><path d="m10 15 1-6"/>',
        presco_c2: '<path d="M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7Z"/>',
        presco_c3: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9"/><path d="M16 3.1a4 4 0 0 1 0 7.8"/>',
        presco_c4: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2Z"/><path d="M8 9h8"/><path d="M8 13h5"/>',
        presco_c5: '<path d="M9 18h6"/><path d="M10 22h4"/><path d="M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.3 1 2.3h6c0-1 .4-1.8 1-2.3A7 7 0 0 0 12 2Z"/>'
      };
      const constatRank = pct => pct === null ? 0 : ({ A: 4, B: 4, C: 3, D: 2, E: 1 }[String(pctToClosestGradeCode(pct)).charAt(0)] || 0);
      const shortContext = (context, sub) => String(context || '').replace(new RegExp(`\\s+—\\s+${(sub.partLabel || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`), '');
      const tagChips = (map, max) => [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, max)
        .map(([tag, count]) => `<span title="Observé ${count} fois">${escapeHtml(tag)}</span>`).join(', ');
      const preschoolCards = subjectRows.filter(r => r.sub.group === 'presco').map(r => {
        const sub = r.sub;
        const domain = preschoolDomains[sub.id] || { strengths: new Map(), challenges: new Map(), latestComment: null };
        const steps = [['1', r.t1], ['2', r.t2], ['3', r.t3]].map(([term, pct]) => ({ term, rank: constatRank(pct) }));
        const filled = steps.filter(step => step.rank);
        const latest = filled[filled.length - 1] || null;
        let trend = null;
        if (filled.length >= 2) {
          const diff = latest.rank - filled[0].rank;
          trend = diff > 0 ? ['up', 'En progression'] : diff < 0 ? ['down', 'À soutenir'] : ['flat', 'Stable'];
        }
        const notes = recordedComments.filter(item => item.subject === sub.shortName && !item.fromTags);
        const notesByTerm = ['1', '2', '3'].map(term => ({ term, items: notes.filter(item => item.term === term) })).filter(group => group.items.length);
        const strengths = tagChips(domain.strengths, 3);
        const challenges = tagChips(domain.challenges, 3);
        const descriptor = (sub.shortName || '').replace(`${sub.partLabel || ''} — `, '');
        const domainBulletinComments = bulletinCommentsBySubject[sub.id] || [];
        const domainCommentIconHtml = domainBulletinComments.length > 0
          ? `<button type="button" class="gr-comment-icon-btn no-print" data-gr-bulletin-comment="${escapeHtml(sub.id)}" aria-expanded="false" aria-label="Lire le commentaire au bulletin pour ${escapeHtml(sub.partLabel || sub.shortName)}" title="Commentaire au bulletin (${domainBulletinComments.length} étape${domainBulletinComments.length > 1 ? 's' : ''}) — cliquer pour lire"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>${domainBulletinComments.length > 1 ? `<span class="gr-comment-icon-count">${domainBulletinComments.length}</span>` : ''}</button>`
          : '';
        return {
          sub, latest, html: `
          <article class="ps-row" data-domain="${escapeHtml(sub.id)}">
            <div class="ps-row-main">
              <span class="ps-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${PRESCHOOL_DOMAIN_ICONS[sub.id] || ''}</svg></span>
              <span class="ps-title"><span class="inline-flex items-center gap-1.5 flex-wrap"><button type="button" class="gr-subject-jump gr-subject-jump--presco" data-jump-subject="${escapeHtml(sub.id)}" data-jump-student="${escapeHtml(st.id)}" title="Ouvrir ${escapeHtml(sub.partLabel || sub.shortName)} dans le Carnet pour ${escapeHtml(st.name)}"><span class="gr-subject-jump-label">${escapeHtml(sub.partLabel || sub.shortName)}</span><span class="gr-subject-jump-arrow" aria-hidden="true">→</span></button>${domainCommentIconHtml}</span>${descriptor && descriptor !== sub.partLabel ? `<small>${escapeHtml(descriptor)}</small>` : ''}</span>
              <ol class="ps-path" aria-label="Parcours de l’année">
                ${steps.map(step => `<li class="ps-k${step.rank}" title="Étape ${step.term} : ${step.rank ? PRESCHOOL_CONSTATS[step.rank].label : 'aucune trace cotée'}"><i></i><span>É${step.term}</span></li>`).join('')}
              </ol>
              <span class="ps-now ps-k${latest ? latest.rank : 0}">${latest ? PRESCHOOL_CONSTATS[latest.rank].label : 'À observer'}${trend && trend[0] !== 'flat' ? `<small>${trend[1]}</small>` : ''}</span>
            </div>
            ${(domain.latestComment || strengths || challenges || notes.length) ? `<div class="ps-row-detail">
              ${domain.latestComment ? `<p class="ps-quote">« ${escapeHtml(domain.latestComment.text)} » <cite>Étape ${escapeHtml(domain.latestComment.term)}</cite></p>` : ''}
              ${strengths ? `<p class="ps-tags"><b>Forces :</b> ${strengths}</p>` : ''}
              ${challenges ? `<p class="ps-tags"><b>À soutenir :</b> ${challenges}</p>` : ''}
              ${notes.length ? `<details class="ps-more">
                <summary>Voir les ${notes.length} observation${notes.length > 1 ? 's' : ''} écrite${notes.length > 1 ? 's' : ''}</summary>
                ${notesByTerm.map(group => `<div class="ps-more-term"><span class="ps-more-badge">Étape ${group.term}</span><ul>${group.items.map(item => `<li><b>${escapeHtml(shortContext(item.context, sub))}</b>${escapeHtml(item.text)}</li>`).join('')}</ul></div>`).join('')}
              </details>` : ''}
            </div>` : ''}
          </article>`
        };
      });
      const preschoolDomainsHtml = `
        <div class="ps-list">${preschoolCards.map(card => card.html).join('')}</div>
        <div class="ps-legend" aria-label="Légende des constats">
          ${[4, 3, 2, 1].map(rank => `<span class="ps-k${rank}"><i></i>${PRESCHOOL_CONSTATS[rank].label}</span>`).join('')}
        </div>
        <p class="ps-note">Constat déduit du résultat de chaque étape (A-B très bien · C adéquatement · D certaines difficultés · E difficultés importantes). À valider selon votre jugement professionnel.</p>`;

      const adaptSummary = getStudentAdaptationSummary(st);
      const adaptationsHtml = (() => {
        const pills = [];
        if (adaptSummary.hasPia) {
          pills.push('<span class="gr-pia-pill">Plan d’intervention</span>');
        }
        if (adaptSummary.hasModifiedBulletin) {
          const modLabel = adaptSummary.modifiedItems.length
            ? `Bulletin modifié · ${adaptSummary.modifiedItems.map(m => `${escapeHtml(m.label)} (${escapeHtml(m.levelLabel)})`).join(', ')}`
            : 'Bulletin modifié';
          pills.push(`<span class="gr-mod-pill">${modLabel}</span>`);
        }
        adaptSummary.adaptations
          .filter(item => item !== 'Plan d’intervention')
          .forEach(item => pills.push(`<span class="gr-adapt-pill">${escapeHtml(item)}</span>`));
        return pills.join('');
      })();

      const isAccueil = typeof isAccueilGroup === 'function' && isAccueilGroup();
      const activeGroupObj = appState.groups.find(g => g.id === appState.activeGroupId);
      const groupNameText = activeGroupObj && !activeGroupObj.placeholder ? activeGroupObj.name : '';
      const showNumericalResults = subjectRows.length > 0;
      const getBarToneClass = code => {
        const fam = String(code || '').charAt(0);
        return fam === 'A' ? 'is-tone-a' : fam === 'B' ? 'is-tone-b' : fam === 'C' ? 'is-tone-c' : fam === 'D' ? 'is-tone-d' : fam === 'E' ? 'is-tone-e' : '';
      };
      const renderTermCell = (val, ovr, termNum) => {
        if (val === null) return '<span class="gr-empty-cell">—</span>';
        const code = pctToClosestGradeCode(val);
        const isAdj = Boolean(ovr && ovr.overridden);
        const title = isAdj
          ? `Jugement ajusté manuellement${ovr.avg !== null ? ` (moy. travaux : ${ovr.avg} %)` : ''}`
          : `Étape ${termNum} : ${val} % (${code})`;
        return `<span class="px-1.5 py-0.5 rounded border text-[11px] font-bold ${getBadgeColorClasses(code)}" title="${escapeHtml(title)}">${code} (${val}%)${isAdj ? '<span class="adj-star">*</span>' : ''}</span>`;
      };

      const strengthTags = [];
      const challengeTags = [];
      const otherTags = [];
      sortedTags.forEach(([tg, count]) => {
        const grp = groupObservationTags([tg]);
        if (grp.strengths.length) strengthTags.push([tg, count]);
        else if (grp.challenges.length) challengeTags.push([tg, count]);
        else otherTags.push([tg, count]);
      });
      const writtenComments = recordedComments.filter(item => !item.fromTags);

      const resultsTableHtml = showNumericalResults ? `
        ${st.gradeLevel === 'P' ? '<details class="gr-card"><summary class="gr-legacy-summary">Voir les résultats numériques conservés</summary><p class="gr-legacy-note">Calcul local indicatif seulement : les pondérations 20/20/60 et le seuil de 60 % ne constituent pas une méthode officielle pour le préscolaire.</p>' : ''}
        <div class="${st.gradeLevel === 'P' ? '' : 'gr-card gr-results-card'}">
          <div class="gr-results-heading">
            <div>
              <h4>Résultats par ${st.gradeLevel === 'P' ? 'compétence' : 'matière'}</h4>
              ${overallProvisional ? '<p class="gr-provisional-note">Résultats provisoires : la pondération s’ajuste aux étapes complétées.</p>' : ''}
            </div>
            <span class="gr-weight-label">${st.gradeLevel === 'P' ? 'Calcul local indicatif (20 % / 20 % / 60 %)' : weightModeLabel}</span>
          </div>
          <div class="gr-results-scroll">
          <table class="gr-table w-full text-left border-collapse text-xs">
            <thead>
              <tr class="text-[11px] uppercase">
                <th class="gr-col-subject">${st.gradeLevel === 'P' ? 'Compétence' : 'Matière / Compétence'}</th>
                <th>Étape 1${weightMode === 'official' ? ' (20 %)' : ''}</th>
                <th>Étape 2${weightMode === 'official' ? ' (20 %)' : ''}</th>
                <th>Étape 3${weightMode === 'official' ? ' (60 %)' : ''}</th>
                <th>${weightMode === 'official' ? 'Annuel' : 'Moyenne'}</th>
                <th>Évolution</th>
              </tr>
            </thead>
            <tbody>
              ${subjectRows.map((r, i) => {
                const annualInfo = getAnnualResultInfo(r.t1, r.t2, r.t3);
                const evalSummary = getStudentAnnualEvaluationSummary(st, r.sourceSubjectIds || [r.sub.id]);
                const evalDetailList = evalDetailsBySubject[r.sub.id] || [];
                const subjectComments = bulletinCommentsBySubject[r.sub.id] || [];
                const commentIconHtml = subjectComments.length > 0
                  ? `<button type="button" class="gr-comment-icon-btn no-print" data-gr-bulletin-comment="${escapeHtml(r.sub.id)}" aria-expanded="false" aria-label="Lire le commentaire au bulletin pour ${escapeHtml(r.sub.shortName)}" title="Commentaire au bulletin (${subjectComments.length} étape${subjectComments.length > 1 ? 's' : ''}) — cliquer pour lire"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>${subjectComments.length > 1 ? `<span class="gr-comment-icon-count">${subjectComments.length}</span>` : ''}</button>`
                  : '';
                const evalBreakdown = ['1', '2', '3']
                  .filter(tk => evalSummary.byTerm[tk] > 0)
                  .map(tk => `Ét. ${tk} : ${evalSummary.byTerm[tk]}`)
                  .join(' · ');
                const pct = r.annualAvg !== null ? r.annualAvg : 0;
                return `
                <tr class="${i % 2 === 0 ? 'gr-row-even' : 'gr-row-odd'}">
                  <td class="gr-col-subject">
                    <div class="gr-subject-cell">
                      ${evalDetailList.length > 0 ? `<button type="button" class="gr-drawer-toggle no-print" data-gr-drawer-toggle="${escapeHtml(r.sub.id)}" aria-expanded="false" title="Voir les ${evalDetailList.length} évaluation(s) consignée(s)"><svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="m7.5 5 5 5-5 5"/></svg></button>` : '<span class="gr-drawer-spacer no-print" aria-hidden="true"></span>'}
                      <div class="gr-subject-info">
                        <div class="gr-subject-line">
                          <button type="button" class="gr-subject-jump" data-jump-subject="${escapeHtml(r.sub.id)}" data-jump-student="${escapeHtml(st.id)}" title="Ouvrir ${escapeHtml(r.sub.shortName)} dans le Carnet pour ${escapeHtml(st.name)}${r.sub.bulletinName && r.sub.bulletinName !== r.sub.shortName ? ` · Bulletin : ${escapeHtml(r.sub.bulletinName)}` : ''}"><span class="gr-subject-jump-label">${escapeHtml(r.sub.shortName)}</span><span class="gr-subject-jump-arrow" aria-hidden="true">→</span></button>
                          ${commentIconHtml}
                          ${r.sub.officialWeight !== null ? `<span class="gr-weight-chip">${r.sub.officialWeight} %</span>` : ''}
                          ${evalSummary.total > 0 ? `<em class="gr-evaluation-count" title="${escapeHtml(evalBreakdown || 'Évaluations consignées sur l’année')}">${evalSummary.total} éval${evalSummary.total > 1 ? 's' : ''}</em>` : ''}
                          ${r.isModified ? `<span class="gr-mod-pill gr-mod-pill--compact" title="Attentes modifiées : ${GRADE_LEVEL_LABELS[r.effectiveLevel]}">MOD. · ${GRADE_LEVEL_LABELS[r.effectiveLevel]}</span>${competencyWarningHtml(r)}` : ''}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td data-num="1">${renderTermCell(r.t1, r.termOverrides?.['1'], '1')}</td>
                  <td data-num="1">${renderTermCell(r.t2, r.termOverrides?.['2'], '2')}</td>
                  <td data-num="1">${renderTermCell(r.t3, r.termOverrides?.['3'], '3')}</td>
                  <td data-num="1">
                    ${r.annualAvg !== null
                      ? `<div class="gr-annual-cell" title="${annualInfo.provisional ? `Provisoire · ${annualInfo.weight} % des poids prévus` : `Résultat annuel (${r.annualAvg} %)`}">
                           <span class="px-2 py-0.5 rounded border font-extrabold ${getBadgeColorClasses(r.annualCode)}">${r.annualCode} (${r.annualAvg}%)</span>
                           <div class="bar-track-wrap gr-mini-bar"><div class="bar-fill-inner ${getBarToneClass(r.annualCode)}" style="width:${pct}%"></div><div class="bar-threshold-60"></div></div>
                         </div>`
                      : '<span class="gr-empty-cell">—</span>'}
                  </td>
                  <td>${renderTrendBadge(r.delta, r.t1, r.t2, r.t3)}</td>
                </tr>
                ${evalDetailList.length > 0 ? `
                <tr class="gr-eval-drawer-row hidden no-print" data-gr-drawer-row="${escapeHtml(r.sub.id)}">
                  <td colspan="6">
                    <div class="gr-eval-drawer">
                      ${evalDetailList.map(ev => `
                        <button type="button" class="gr-eval-chip" data-jump-subject="${escapeHtml(r.sub.id)}" data-jump-student="${escapeHtml(st.id)}" data-jump-term="${escapeHtml(ev.term)}" title="Ouvrir l’étape ${escapeHtml(ev.term)} dans le Carnet">
                          <span class="gr-eval-term">Ét.${escapeHtml(ev.term)}</span>
                          <span class="gr-eval-title">${escapeHtml(ev.title)}${ev.partLabel ? ` (${escapeHtml(ev.partLabel)})` : ''}</span>
                          <span class="gr-eval-meta">${Math.round(ev.weight * 10) / 10}%</span>
                          <strong class="gr-eval-res">${escapeHtml(ev.resultDisplay)}</strong>
                          ${ev.flags.length ? `<span class="gr-eval-flags">${ev.flags.map(escapeHtml).join(', ')}</span>` : ''}
                        </button>`).join('')}
                    </div>
                  </td>
                </tr>` : ''}`;
              }).join('')}
            </tbody>
          </table>
          </div>
        </div>
        ${st.gradeLevel === 'P' ? '</details>' : ''}` : '';

      const teacherCommentText = st.reportComment || '';

      container.innerHTML = `
        <!-- En-tête de portrait -->
        <div class="gr-card gr-identity-card">
          <div class="gr-identity-main min-w-0 flex-1">
            <div class="gr-identity-eyebrow">Portrait annuel${groupNameText ? ` · ${escapeHtml(groupNameText)}` : ''} · 2026-2027</div>
            <div class="gr-identity-title-row">
              <h3 class="text-xl sm:text-2xl font-extrabold">${escapeHtml(st.name)}</h3>
              <span class="gr-grade-meta">Niveau : <strong>${GRADE_LEVEL_LABELS[st.gradeLevel] || 'À choisir'}</strong>${studentCycle && studentCycle !== 'P' ? ` · ${escapeHtml(CYCLE_LABELS[studentCycle])}` : ''}</span>
              <button type="button" id="btnGrEditProfile" class="gr-inline-action no-print" title="Modifier le niveau, le plan d’intervention ou le bulletin modifié">Profil →</button>
            </div>
            ${adaptationsHtml ? `<div class="gr-adaptations-row" aria-label="Plan d’intervention et bulletin modifié">${adaptationsHtml}</div>` : ''}
          </div>
          <div class="gr-identity-kpis">
            <button type="button" id="btnGrPrintStudentSheet" class="gr-print-btn no-print" title="Imprimer la fiche synthèse individuelle de ${escapeHtml(st.name)}">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 9V3h10v6"/><path d="M7 17H5a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2"/><rect x="7" y="14" width="10" height="7" rx="1"/></svg>
              <span>Imprimer cette fiche</span>
            </button>
          </div>
        </div>

        <!-- Portrait principal (Préscolaire ou Tableau des résultats) -->
        ${st.gradeLevel === 'P' ? `
          <div class="gr-span-full ps-section gr-card">
            <div class="gr-section-head">
              <h4>Portrait du développement par domaine</h4>
            </div>
            <div class="space-y-2.5">${preschoolDomainsHtml}</div>
          </div>
          ${resultsTableHtml}
        ` : resultsTableHtml}

        <!-- Bloc inférieur : Commentaires, Travaux en suivi et Observations -->
        <div class="gr-notes-grid">
          <div class="gr-card gr-notes-comments">
            <div class="gr-section-head">
              <h4>Commentaire général</h4>
              <div class="gr-comment-actions no-print">
                <span id="grTeacherCommentCount" class="gr-char-count">${teacherCommentText.length} caract.</span>
                <button type="button" id="btnGrCopyComment" class="gr-mini-btn" title="Copier le commentaire général">Copier</button>
              </div>
            </div>
            <textarea id="grTeacherComment" class="gr-teacher-comment no-print" aria-label="Commentaires de l’enseignant(e)" placeholder="Ajoutez vos commentaires sur le parcours annuel de cet élève...">${escapeHtml(teacherCommentText)}</textarea>
            <div id="grTeacherCommentPrint" class="gr-teacher-comment-print">${escapeHtml(teacherCommentText)}</div>
            ${writtenComments.length > 0 ? `
              <details class="gr-carnet-comments no-print">
                <summary>Commentaires consignés au carnet (${writtenComments.length})</summary>
                <div class="gr-carnet-comments-body">
                  <div class="gr-carnet-filter" role="group" aria-label="Filtrer les commentaires par étape">
                    <button type="button" class="is-active" data-gr-comment-term="all" aria-pressed="true">Toutes</button>
                    <button type="button" data-gr-comment-term="1" aria-pressed="false">Ét. 1</button>
                    <button type="button" data-gr-comment-term="2" aria-pressed="false">Ét. 2</button>
                    <button type="button" data-gr-comment-term="3" aria-pressed="false">Ét. 3</button>
                  </div>
                  <div class="gr-carnet-list">
                    ${writtenComments.map(c => `
                      <div class="gr-carnet-item" data-comment-term="${escapeHtml(c.term)}">
                        <div class="gr-carnet-item-meta">
                          <strong>Ét. ${escapeHtml(c.term)} · ${escapeHtml(c.subject)}</strong>
                          <span>${escapeHtml(c.context || '')}</span>
                          <button type="button" class="gr-insert-comment" data-insert-comment="${escapeHtml(c.text)}" title="Ajouter au commentaire général">+ Insérer</button>
                        </div>
                        <p>${escapeHtml(c.text)}</p>
                      </div>`).join('')}
                  </div>
                </div>
              </details>` : ''}
          </div>

          <div class="gr-notes-side">
            ${pendingStatuses.length > 0 ? `
              <div class="gr-card gr-pending-card">
                <div class="gr-section-head">
                  <h4>Travaux en suivi (${pendingStatuses.length})</h4>
                </div>
                <div class="gr-pending-list">
                  ${pendingStatuses.map(p => `
                    <button type="button" class="gr-pending-item" data-jump-subject="${escapeHtml(p.subjectId)}" data-jump-student="${escapeHtml(st.id)}" data-jump-term="${escapeHtml(p.term)}" title="Ouvrir dans le Carnet (Étape ${escapeHtml(p.term)})">
                      <span class="gr-pending-code is-${escapeHtml(p.code.toLowerCase())}">${escapeHtml(p.code)}</span>
                      <span class="gr-pending-text"><strong>Ét. ${escapeHtml(p.term)} · ${escapeHtml(p.subject)}</strong> — ${escapeHtml(p.title)}</span>
                    </button>`).join('')}
                </div>
              </div>` : ''}

            <div class="gr-card gr-signals-card">
              <div class="gr-section-head">
                <h4>Observations et mesures d’appui</h4>
              </div>
              <div class="gr-signals-groups">
                ${strengthTags.length ? `
                  <div class="gr-signal-group">
                    <span class="gr-signal-label">Forces</span>
                    <div class="gr-signal-chips">${strengthTags.map(([tg, count]) => `<span class="gr-chip is-strength">${escapeHtml(tg)}${count > 1 ? ` <b>${count}×</b>` : ''}</span>`).join('')}</div>
                  </div>` : ''}
                ${challengeTags.length ? `
                  <div class="gr-signal-group">
                    <span class="gr-signal-label">Défis</span>
                    <div class="gr-signal-chips">${challengeTags.map(([tg, count]) => `<span class="gr-chip is-challenge">${escapeHtml(tg)}${count > 1 ? ` <b>${count}×</b>` : ''}</span>`).join('')}</div>
                  </div>` : ''}
                ${otherTags.length ? `
                  <div class="gr-signal-group">
                    <span class="gr-signal-label">Observations</span>
                    <div class="gr-signal-chips">${otherTags.map(([tg, count]) => `<span class="gr-chip">${escapeHtml(tg)}${count > 1 ? ` <b>${count}×</b>` : ''}</span>`).join('')}</div>
                  </div>` : ''}
                ${sortedFlags.length ? `
                  <div class="gr-signal-group">
                    <span class="gr-signal-label">Mesures d’appui</span>
                    <div class="gr-signal-chips">${sortedFlags.map(([fl, count]) => {
                      const def = CELL_FLAGS.find(f => f.code === fl);
                      return `<span class="gr-chip is-flag" title="${escapeHtml(def ? def.label : fl)}">${escapeHtml(getCellFlagBadge(fl))} <b>${count}×</b></span>`;
                    }).join('')}</div>
                  </div>` : ''}
                ${(!strengthTags.length && !challengeTags.length && !otherTags.length && !sortedFlags.length)
                  ? '<p class="gr-signals-empty">Aucun indicateur ou marqueur rapide consigné pour cet élève pour le moment.</p>'
                  : ''}
              </div>
            </div>
          </div>
        </div>

        ${competencyModuleHtml}
      `;

      if (typeof renderAccueilSummary === 'function') renderAccueilSummary(container, st);
      const commentArea = document.getElementById('grTeacherComment');
      const commentCountEl = document.getElementById('grTeacherCommentCount');
      commentArea.addEventListener('input', event => {
        st.reportComment = event.target.value;
        document.getElementById('grTeacherCommentPrint').textContent = event.target.value;
        if (commentCountEl) commentCountEl.textContent = `${event.target.value.length} caract.`;
        scheduleAppStateSave();
      });
      document.getElementById('btnGrCopyComment')?.addEventListener('click', () => {
        const text = commentArea.value.trim();
        if (!text) { showToast('Aucun commentaire à copier.'); return; }
        const done = () => showToast('Commentaire copié');
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, () => { commentArea.select(); document.execCommand('copy'); done(); });
        else { commentArea.select(); document.execCommand('copy'); done(); }
      });
      document.getElementById('btnGrEditProfile')?.addEventListener('click', () => navigateToView('viewStudents'));
      document.getElementById('btnGrPrintStudentSheet')?.addEventListener('click', () => {
        if (typeof printStudentIndividualSheet === 'function') printStudentIndividualSheet(st);
      });
      container.querySelectorAll('[data-gr-drawer-toggle]').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-gr-drawer-toggle');
          const row = container.querySelector(`[data-gr-drawer-row="${CSS.escape(id)}"]`);
          if (!row) return;
          const open = row.classList.toggle('hidden') === false;
          btn.setAttribute('aria-expanded', String(open));
        });
      });
      container.querySelectorAll('[data-gr-comment-term]').forEach(btn => {
        btn.addEventListener('click', () => {
          const term = btn.getAttribute('data-gr-comment-term');
          container.querySelectorAll('[data-gr-comment-term]').forEach(b => {
            const active = b === btn;
            b.classList.toggle('is-active', active);
            b.setAttribute('aria-pressed', String(active));
          });
          container.querySelectorAll('.gr-carnet-item').forEach(item => {
            item.classList.toggle('hidden', term !== 'all' && item.getAttribute('data-comment-term') !== term);
          });
        });
      });
      container.querySelectorAll('[data-insert-comment]').forEach(btn => {
        btn.addEventListener('click', () => {
          const snippet = btn.getAttribute('data-insert-comment') || '';
          if (!snippet) return;
          const current = commentArea.value.trim();
          commentArea.value = current ? `${current} ${snippet}` : snippet;
          st.reportComment = commentArea.value;
          document.getElementById('grTeacherCommentPrint').textContent = commentArea.value;
          if (commentCountEl) commentCountEl.textContent = `${commentArea.value.length} caract.`;
          scheduleAppStateSave();
          showToast('Commentaire inséré');
        });
      });
      const subjectLabelLookup = new Map(subjectRows.map(r => [r.sub.id, r.sub.shortName]));
      SUBJECTS_CONFIG.forEach(s => {
        if (!subjectLabelLookup.has(s.id)) subjectLabelLookup.set(s.id, s.partLabel || s.shortName);
      });
      container.querySelectorAll('[data-gr-bulletin-comment]').forEach(btn => {
        btn.addEventListener('click', event => {
          event.stopPropagation();
          const subId = btn.getAttribute('data-gr-bulletin-comment');
          const list = bulletinCommentsBySubject[subId] || [];
          const label = subjectLabelLookup.get(subId) || 'Matière';
          openGrBulletinCommentPopover(btn, subId, label, list, st.id, snippet => {
            if (!snippet || !commentArea) return;
            const current = commentArea.value.trim();
            commentArea.value = current ? `${current} ${snippet}` : snippet;
            st.reportComment = commentArea.value;
            const printEl = document.getElementById('grTeacherCommentPrint');
            if (printEl) printEl.textContent = commentArea.value;
            if (commentCountEl) commentCountEl.textContent = `${commentArea.value.length} caract.`;
            scheduleAppStateSave();
            if (typeof showToast === 'function') showToast('Commentaire inséré');
          });
        });
      });
      container.querySelectorAll('[data-jump-subject]').forEach(button => {
        button.addEventListener('click', () => {
          jumpFromReportToSubject(
            button.getAttribute('data-jump-subject'),
            button.getAttribute('data-jump-student'),
            button.getAttribute('data-jump-term')
          );
        });
      });
      container.querySelectorAll('[data-competency-guide-student]').forEach(button => {
        button.addEventListener('click', event => {
          event.preventDefault();
          beginMissingModifiedCompetencyGuide(
            button.getAttribute('data-competency-guide-student'),
            button.getAttribute('data-competency-guide-tab'),
            button.getAttribute('data-competency-guide-scale')
          );
        });
      });
      const compPrintBtn = document.querySelector('#competencyPositioning [data-comp-print]');
      if (compPrintBtn) {
        compPrintBtn.addEventListener('click', (event) => {
          event.preventDefault();
          event.stopPropagation();
          printCompetencySheet(st, compTerm);
        });
      }

      const competencyDetails = document.getElementById('competencyPositioning');
      if (competencyDetails) {
        competencyDetails.querySelector(':scope > summary').addEventListener('click', event => {
          if (competencyDetails.open || event.target.closest('button')) return;
          scrollToCompetencyElement(competencyDetails);
          if (competencyGuideTarget && competencyGuideTarget.studentId === st.id) {
            window.setTimeout(() => {
              const subjectButton = competencyDetails.querySelector(`[data-competency-subject="${CSS.escape(competencyGuideTarget.tabId)}"]`);
              flashCompetencyElement(subjectButton);
            }, 90);
          }
        });
        competencyDetails.addEventListener('toggle', () => {
          if (!competencyDetails.isConnected) return;
          competencyPanelOpen = competencyDetails.open;
          if (!competencyDetails.open && competencySubjectSelected !== null) {
            competencySubjectSelected = null;
            const restoreFocus = competencyDetails.contains(document.activeElement);
            const scrollY = window.scrollY;
            renderGlobalReportView();
            if (restoreFocus) document.querySelector('#competencyPositioning > summary').focus({ preventScroll: true });
            window.scrollTo(0, scrollY);
          }
        });

        const commitCompetencyChange = () => {
          const scrollY = window.scrollY;
          const activeSentence = document.activeElement && document.activeElement.classList.contains('comp-sentence')
            ? {
                scale: document.activeElement.getAttribute('data-comp-scale'),
                row: document.activeElement.getAttribute('data-comp-row'),
                level: document.activeElement.getAttribute('data-comp-level')
              }
            : null;
          competencyPanelOpen = competencyDetails.open;
          scheduleAppStateSave();
          renderGlobalReportView();
          if (activeSentence) {
            const replacement = [...document.querySelectorAll('#competencyPositioning .comp-sentence')].find(sentence =>
              sentence.getAttribute('data-comp-scale') === activeSentence.scale &&
              sentence.getAttribute('data-comp-row') === activeSentence.row &&
              sentence.getAttribute('data-comp-level') === activeSentence.level
            );
            if (replacement) replacement.focus({ preventScroll: true });
          }
          window.scrollTo(0, scrollY);
        };

        const togglePickedSentence = el => {
          const scaleId = el.getAttribute('data-comp-scale');
          const rowKey = el.getAttribute('data-comp-row');
          const level = Number(el.getAttribute('data-comp-level'));
          const editablePicks = getAnnualCompetencyPicks(st, true);
          const picked = editablePicks[scaleId] || (editablePicks[scaleId] = {});
          if (picked[rowKey] === level) {
            delete picked[rowKey];
          } else {
            picked[rowKey] = level;
          }
          if (!Object.keys(picked).length) { delete editablePicks[scaleId]; setMeqOverride(st, compTerm, scaleId, null); }
          commitCompetencyChange();
        };

        const highlightSiblings = el => {
          competencyDetails.querySelectorAll('.comp-sentence.is-sibling').forEach(node => node.classList.remove('is-sibling'));
          if (!el) return;
          competencyDetails.querySelectorAll('.comp-sentence').forEach(node => {
            if (node !== el
              && node.getAttribute('data-comp-scale') === el.getAttribute('data-comp-scale')
              && node.getAttribute('data-comp-row') === el.getAttribute('data-comp-row')) {
              node.classList.add('is-sibling');
            }
          });
        };

        competencyDetails.addEventListener('click', event => {
          competencyPanelOpen = competencyDetails.open;
          const sentence = event.target.closest('.comp-sentence');
          if (sentence) {
            togglePickedSentence(sentence);
            return;
          }
          const subjectButton = event.target.closest('.competency-subject-button');
          if (subjectButton && !subjectButton.disabled) {
            competencySubjectSelected = subjectButton.getAttribute('data-competency-subject');
            const guidedScaleId = competencyGuideTarget &&
              competencyGuideTarget.studentId === st.id &&
              competencyGuideTarget.tabId === competencySubjectSelected
              ? competencyGuideTarget.scaleId : null;
            if (guidedScaleId) competencyScaleSelected[competencySubjectSelected] = guidedScaleId;
            renderGlobalReportView();
            const tabs = document.querySelector('#competencyPositioning .comp-tabs');
            const selected = tabs && tabs.querySelector('.competency-subject-button.is-active');
            if (selected) selected.focus({ preventScroll: true });
            scrollToCompetencyElement(tabs);
            if (guidedScaleId) {
              window.setTimeout(() => {
                const scaleButton = document.querySelector(`[data-comp-scale-tab="${CSS.escape(guidedScaleId)}"]`);
                flashCompetencyElement(scaleButton);
              }, 80);
            }
            return;
          }
          const scaleTab = event.target.closest('[data-comp-scale-tab]');
          if (scaleTab) {
            competencyScaleSelected[competencySubjectSelected] = scaleTab.getAttribute('data-comp-scale-tab');
            renderGlobalReportView();
            return;
          }
          const resetButton = event.target.closest('[data-comp-reset]');
          if (resetButton && !resetButton.disabled) {
            const scaleId = resetButton.getAttribute('data-comp-reset');
            const editablePicks = getAnnualCompetencyPicks(st, true);
            const picked = editablePicks[scaleId] || {};
            if (Object.keys(picked).length > 2 && !window.confirm('Effacer toutes les phrases choisies pour cette échelle ?')) return;
            delete editablePicks[scaleId];
            setMeqOverride(st, compTerm, scaleId, null);
            setCompetencyComment(st, compTerm, scaleId, '');
            commitCompetencyChange();
          }
        });

        competencyDetails.addEventListener('input', event => {
          const area = event.target.closest && event.target.closest('[data-comp-comment]');
          if (!area) return;
          getAnnualCompetencyPicks(st, true);
          setCompetencyComment(st, compTerm, area.getAttribute('data-comp-comment'), area.value);
          scheduleAppStateSave();
          const regen = competencyDetails.querySelector('[data-comp-regen]');
          if (regen) regen.disabled = !area.value.trim();
        });

        competencyDetails.addEventListener('change', event => {
          const select = event.target.closest && event.target.closest('[data-comp-pron]');
          if (!select) return;
          st.pronoun = select.value;
          scheduleAppStateSave();
          renderGlobalReportView();
        });

        competencyDetails.addEventListener('click', event => {
          const meqBtn = event.target.closest('[data-comp-meq]');
          if (meqBtn) {
            getAnnualCompetencyPicks(st, true);
            const scaleId = meqBtn.getAttribute('data-comp-meq');
            const value = Number(meqBtn.getAttribute('data-meq-val'));
            const tabScale = competencyTabs.flatMap(tab => tab.scales.map(s => ({ s, tabId: tab.id }))).find(x => x.s.id === scaleId);
            const current = tabScale ? getMeqFinal(st, compTerm, tabScale.s, tabScale.tabId, compPicks[scaleId]) : null;
            // Un clic sur le niveau suggéré (ou sur le niveau déjà ajusté) revient au mode automatique.
            const backToAuto = current && (current.suggested === value || current.override === value);
            setMeqOverride(st, compTerm, scaleId, backToAuto ? null : value);
            commitCompetencyChange();
            return;
          }
          const meqAuto = event.target.closest('[data-comp-meq-auto]');
          if (meqAuto) {
            getAnnualCompetencyPicks(st, true);
            setMeqOverride(st, compTerm, meqAuto.getAttribute('data-comp-meq-auto'), null);
            commitCompetencyChange();
            return;
          }
          const regen = event.target.closest('[data-comp-regen]');
          if (regen && !regen.disabled) {
            getAnnualCompetencyPicks(st, true);
            setCompetencyComment(st, compTerm, regen.getAttribute('data-comp-regen'), '');
            commitCompetencyChange();
            return;
          }
          const copy = event.target.closest('[data-comp-copy]');
          if (copy) {
            const area = competencyDetails.querySelector('[data-comp-comment]');
            if (!area) return;
            const done = () => showToast('Commentaire copié');
            if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(area.value).then(done, () => { area.select(); document.execCommand('copy'); done(); });
            else { area.select(); document.execCommand('copy'); done(); }
          }
        });

        competencyDetails.addEventListener('keydown', event => {
          const sentence = event.target.closest && event.target.closest('.comp-sentence');
          if (sentence && (event.key === 'Enter' || event.key === ' ')) {
            event.preventDefault();
            togglePickedSentence(sentence);
          }
        });

        competencyDetails.addEventListener('mouseover', event => {
          const sentence = event.target.closest('.comp-sentence');
          highlightSiblings(sentence);
        });
        competencyDetails.addEventListener('mouseleave', () => highlightSiblings(null));
      }
      if (typeof window !== 'undefined' && window.ErikaTour) window.ErikaTour.onAppRender();
    }

    // =========================================================================
    // 5. EXCEL (.XLSX) FORMATTED EXPORT (USING XLSX-JS-STYLE)
    // =========================================================================
