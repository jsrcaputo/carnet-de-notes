    function restoreRubricFocus(tbody, key) {
      const button = Array.from(tbody.querySelectorAll('.rubric-stmt-btn'))
        .find(item => item.dataset.rubricKey === key);
      if (button) button.focus({ preventScroll: true });
    }

    function renderBaremeView() {
      const sub = getCurrentSubjectConfig();
      const termData = getActiveTermData();
      const subData = termData.subjectData[sub.id];
      const st = appState.students.find(s => s.id === appState.selectedStudentId) || null;

      document.getElementById('baremeSubjectLabel').textContent = `${sub.shortName} (Étape ${appState.activeTerm})`;
      document.getElementById('baremeCurrentStudentName').textContent = st ? st.name : 'Sélectionner un nom';
      const baremeAtm = document.getElementById('baremeSubjectAtmosphere');
      const baremeImg = STUDIO_ATMOSPHERE_IMAGES[sub.id] || sub.imageUrl;
      if (baremeAtm && baremeImg) baremeAtm.src = baremeImg;

      const pillsContainer = document.getElementById('baremeStudentPills');
      pillsContainer.innerHTML = '';
      appState.students.forEach(student => {
        const stuRec = subData.studentRecords[student.id];
        const stuRes = computeMajorityFromChecked(
          stuRec.baremeChecked,
          stuRec.baremeOverrideCode,
          BAREME_ECOLE_ROWS.length
        );
        const isSel = Boolean(st && student.id === st.id);
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = isSel
          ? 'px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-900 text-white shadow-xs flex items-center gap-1 cursor-pointer'
          : 'px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-1 cursor-pointer';
        btn.innerHTML = `
          <span>${escapeHtml(student.name)}</span>
          ${stuRes.hasFinalGrade
            ? `<span class="bareme-student-grade px-1.5 py-0.2 rounded border text-[10px] ${getBadgeColorClasses(stuRes.code)}">${stuRes.code}${stuRec.baremeOverrideCode ? '*' : ''}</span>`
            : stuRes.hasData
              ? `<span class="px-1.5 py-0.2 rounded text-[10px] bg-amber-100 text-amber-900">${stuRes.total}/${BAREME_ECOLE_ROWS.length}</span>`
              : ''}
        `;
        btn.addEventListener('click', () => {
          appState.selectedStudentId = student.id;
          renderBaremeView();
        });
        pillsContainer.appendChild(btn);
      });

      if (!st) {
        ['A', 'B', 'C', 'D', 'E'].forEach(fam => {
          const el = document.getElementById(`colCountBareme_${fam}`);
          if (el) el.textContent = '0';
        });
        document.getElementById('baremeMajorityExplanation').textContent = appState.students.length
          ? 'Sélectionner un nom ci-dessus pour remplir le barème.'
          : 'Ajoutez d’abord un élève dans la liste d’élèves.';
        document.getElementById('baremeFineGradeButtons').innerHTML = '';
        document.getElementById('baremeMatrixBody').innerHTML =
          '<tr><td colspan="6" class="p-6 text-center text-sm font-semibold text-slate-600 bg-slate-50">Sélectionner un nom ci-dessus pour afficher le barème de l’élève.</td></tr>';
        return;
      }
      const rec = subData.studentRecords[st.id];
      const res = computeMajorityFromChecked(
        rec.baremeChecked,
        rec.baremeOverrideCode,
        BAREME_ECOLE_ROWS.length
      );
      ['A', 'B', 'C', 'D', 'E'].forEach(fam => {
        const el = document.getElementById(`colCountBareme_${fam}`);
        if (el) el.textContent = `${res.counts[fam]}`;
      });

      const expEl = document.getElementById('baremeMajorityExplanation');
      if (!res.hasData) {
        expEl.textContent = 'Aucun critère sélectionné.';
      } else if (!res.hasFinalGrade) {
        expEl.textContent = `Cote provisoire : ${res.code} (${res.pct}%)`;
      } else {
        expEl.textContent = rec.baremeOverrideCode ? '* Note ajustée manuellement.' : '';
      }

      const fineBtns = document.getElementById('baremeFineGradeButtons');
      fineBtns.innerHTML = '';
      GRADE_SCALE.forEach(g => {
        const isSelected = res.hasFinalGrade && res.code === g.code;
        const b = document.createElement('button');
        b.type = 'button';
        b.className = `px-1.5 py-1 rounded text-[11px] font-semibold border cursor-pointer ${getBadgeColorClasses(g.code)}${isSelected ? ' is-selected' : ''}`;
        b.textContent = `${g.code}`;
        b.title = `${g.code} (${g.pct}%)`;
        b.addEventListener('click', () => {
          if (rec.baremeOverrideCode === g.code) rec.baremeOverrideCode = null;
          else rec.baremeOverrideCode = g.code;
          notifyUpdate(`Barème de ${st.name} : ${g.code} (${g.pct}%)`);
          renderBaremeView();
          renderGradebookView();
        });
        fineBtns.appendChild(b);
      });

      const tbody = document.getElementById('baremeMatrixBody');
      tbody.innerHTML = '';

      BAREME_ECOLE_ROWS.forEach(row => {
        const tr = document.createElement('tr');
        tr.className = 'border-b border-slate-200 align-top';

        const tdTitle = document.createElement('td');
        tdTitle.className = 'p-2 font-bold text-slate-900 bg-slate-50 border border-slate-200 break-words';
        tdTitle.textContent = row.title.replace(/ & /g, ' et ');
        tr.appendChild(tdTitle);

        ['A', 'B', 'C', 'D', 'E'].forEach(fam => {
          const td = document.createElement('td');
          td.className = 'p-1.5 border border-slate-200 space-y-1';
          const statements = row.cells[fam] || [];
          statements.forEach((stmtText, idx) => {
            const key = `${row.id}_${fam}_${idx}`;
            const isChecked = rec.baremeChecked.includes(key);
            const itemBtn = document.createElement('button');
            itemBtn.type = 'button';
            itemBtn.dataset.rubricKey = key;
            itemBtn.setAttribute('aria-pressed', String(isChecked));
            itemBtn.className = `rubric-stmt-btn p-1.5 rounded-lg border text-[11px] leading-snug transition cursor-pointer ${
              isChecked
                ? `stmt-checked-${fam}`
                : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
            }`;
            itemBtn.innerHTML = `
              <span aria-hidden="true" class="mt-0.5 w-3.5 h-3.5 rounded-full flex-shrink-0 flex items-center justify-center border ${
                isChecked ? 'bg-slate-900 text-white border-slate-900' : 'border-slate-300 bg-white'
              } text-[9px] font-bold">${isChecked ? '✓' : ''}</span>
              <span class="rubric-stmt-text">${stmtText}</span>
            `;
            itemBtn.addEventListener('click', () => {
              const hadFocus = document.activeElement === itemBtn;
              rec.baremeChecked = toggleSingleChoiceInRow(rec.baremeChecked, row.id, key);
              rec.baremeOverrideCode = null;
              renderBaremeView();
              renderGradebookView();
              if (hadFocus) restoreRubricFocus(tbody, key);
            });
            td.appendChild(itemBtn);
          });
          tr.appendChild(td);
        });

        tbody.appendChild(tr);
      });
    }

    // -------------------------------------------------------------------------
    // Éditeur de trace observable
    // -------------------------------------------------------------------------
    function renderQuickObsView() {
      const sub = getCurrentSubjectConfig();
      const termData = getActiveTermData();
      const subData = termData.subjectData[sub.id];
      const session = subData.currentObsSession;
      const presentLevels = getPresentStudentLevels();
      const isMulti = presentLevels.length > 1;
      if (Array.isArray(session.targetLevels)) {
        session.targetLevels = session.targetLevels.filter(l => presentLevels.includes(l));
      } else {
        session.targetLevels = [];
      }

      const qoTargetBox = document.getElementById('qoTargetLevelsBox');
      if (qoTargetBox) {
        qoTargetBox.classList.toggle('hidden', !isMulti);
        qoTargetBox.innerHTML = '';
        if (isMulti) {
          const wrap = document.createElement('div');
          wrap.className = 'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white shadow-2xs flex-wrap';
          const lbl = document.createElement('span');
          lbl.className = 'text-xs font-bold text-slate-700 mr-1';
          lbl.textContent = 'Niveaux visés :';
          wrap.appendChild(lbl);

          const isAll = !Array.isArray(session.targetLevels) || session.targetLevels.length === 0;

          // Checkbox Tous
          const allLabel = document.createElement('label');
          allLabel.className = `cursor-pointer inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-bold transition shadow-2xs ${isAll ? 'bg-emerald-50 border-emerald-300 text-emerald-900 ring-1 ring-emerald-300' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'}`;
          allLabel.innerHTML = `<input type="checkbox" class="rounded accent-emerald-600 w-3.5 h-3.5 cursor-pointer" ${isAll ? 'checked' : ''}><span>Tous</span>`;
          allLabel.querySelector('input').addEventListener('change', () => {
            session.targetLevels = [];
            if (appState.selectedStudentId) {
              const curSt = appState.students.find(s => s.id === appState.selectedStudentId);
              if (curSt && !isAssignmentForStudent(session, curSt)) {
                appState.selectedStudentId = null;
              }
            }
            renderQuickObsView();
          });
          wrap.appendChild(allLabel);

          presentLevels.forEach(lvl => {
            const isChecked = !isAll && session.targetLevels.includes(lvl);
            const lLabel = document.createElement('label');
            lLabel.className = `cursor-pointer inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-bold transition shadow-2xs ${isChecked ? 'bg-indigo-50 border-indigo-300 text-indigo-900 ring-1 ring-indigo-300' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'}`;
            lLabel.innerHTML = `<input type="checkbox" value="${lvl}" class="rounded accent-indigo-600 w-3.5 h-3.5 cursor-pointer" ${isChecked ? 'checked' : ''}><span>${escapeHtml(GRADE_LEVEL_LABELS[lvl] || lvl)}</span>`;
            lLabel.querySelector('input').addEventListener('change', (e) => {
              let cur = isAll ? [] : session.targetLevels.slice();
              if (e.target.checked) {
                if (!cur.includes(lvl)) cur.push(lvl);
              } else {
                cur = cur.filter(x => x !== lvl);
              }
              if (cur.length === 0 || cur.length === presentLevels.length) {
                session.targetLevels = [];
              } else {
                session.targetLevels = cur;
              }
              if (appState.selectedStudentId) {
                const curSt = appState.students.find(s => s.id === appState.selectedStudentId);
                if (curSt && !isAssignmentForStudent(session, curSt)) {
                  appState.selectedStudentId = null;
                }
              }
              renderQuickObsView();
            });
            wrap.appendChild(lLabel);
          });
          qoTargetBox.appendChild(wrap);
        }
      }

      const targetedStudents = appState.students.filter(student => isAssignmentForStudent(session, student));
      let st = appState.students.find(s => s.id === appState.selectedStudentId) || null;
      if (st && !isAssignmentForStudent(session, st)) {
        appState.selectedStudentId = null;
        st = null;
      }
      const draft = st ? session.studentDrafts[st.id] : null;
      if (st && draft) {
        draft.gradeLevel = getObservationDraftGradeLevel(draft, st, session);
      }
      const cycle = st && draft ? getStudentCycle(draft.gradeLevel) : null;
      const criteria = st && draft ? getObservationCriteria(sub, draft.gradeLevel, session) : [];
      document.getElementById('prescoRubricNotice').classList.toggle('hidden', !sub.prescoOnly);
      document.getElementById('firstCycleExplorationNotice').classList.toggle('hidden',
        cycle !== 1 || !['sciences_global', 'univers_social'].includes(sub.id));

      document.getElementById('qoSubjectBadge').textContent = `${sub.fullName} • Étape ${appState.activeTerm}`;
      const isModSub = st ? isSubjectModifiedForStudent(st, sub) : false;
      document.getElementById('sgCurrentStudentName').textContent = st
        ? `${st.name} — ${GRADE_LEVEL_LABELS[draft.gradeLevel] || 'niveau à choisir'}${cycle ? ` (${CYCLE_LABELS[cycle]})` : ''}${isModSub ? ` [Bulletin modifié · inscrit en ${GRADE_LEVEL_LABELS[st.gradeLevel] || '—'}]` : ''}`
        : 'Sélectionner un nom';
      document.getElementById('qoBottomStudentName').textContent = st ? st.name : 'Sélectionner un nom';
      const qoAtm = document.getElementById('qoSubjectAtmosphere');
      const qoImg = STUDIO_ATMOSPHERE_IMAGES[sub.id] || sub.imageUrl;
      if (qoAtm && qoImg) qoAtm.src = qoImg;
      const modeBadge = document.getElementById('qoEditModeBadge');
      const topCommitLbl = document.getElementById('btnCommitTopLabel');

      if (session.editingAssignmentId) {
        if (modeBadge) {
          modeBadge.classList.remove('hidden');
          modeBadge.className = 'px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300';
          modeBadge.textContent = `Mode modification : ${session.title || 'Trace observable'}`;
        }
        if (topCommitLbl) topCommitLbl.textContent = 'Enregistrer au carnet';
      } else {
        if (modeBadge) {
          modeBadge.classList.add('hidden');
          modeBadge.textContent = '';
        }
        if (topCommitLbl) topCommitLbl.textContent = 'Enregistrer au carnet';
      }

      const titleInput = document.getElementById('qoSessionTitleInput');
      if (titleInput && document.activeElement !== titleInput) {
        titleInput.value = session.title || '';
      }

      const linkBox = document.getElementById('qoLinkedPartsBox');
      const linkList = document.getElementById('qoLinkedParts');
      const editingAsg = session.editingAssignmentId ? subData.assignments.find(a => a.id === session.editingAssignmentId) : null;
      const siblings = sub.group && !(editingAsg && editingAsg.linkId)
        ? SUBJECTS_CONFIG.filter(s => s.group === sub.group && s.id !== sub.id) : [];
      linkBox.classList.toggle('hidden', !siblings.length);
      linkList.innerHTML = '';
      session.linkTargets = (session.linkTargets || []).filter(id => siblings.some(s => s.id === id));
      siblings.forEach(s => {
        const label = document.createElement('label');
        label.className = 'inline-flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer';
        const cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.checked = session.linkTargets.includes(s.id);
        cb.addEventListener('change', () => {
          session.linkTargets = cb.checked ? [...session.linkTargets, s.id] : session.linkTargets.filter(id => id !== s.id);
        });
        label.append(cb, document.createTextNode(s.partLabel));
        linkList.appendChild(label);
      });
      document.getElementById('qoLinkedHint').textContent = sub.singleResult
        ? 'Résultat unique au bulletin : cette évaluation compte une seule fois (pondération fixée ici).'
        : 'La cote est copiée dans l’autre compétence (pondération indépendante).';

      let evaluatedCount = 0;
      let partialCount = 0;
      let feedbackCount = 0;
      targetedStudents.forEach(student => {
        const d = session.studentDrafts[student.id];
        const studentCriteria = getObservationCriteria(sub, getObservationDraftGradeLevel(d, student, session), session);
        const r = computeObservableResult(d.checked, d.overrideCode, studentCriteria, d.notEvaluated);
        if (r.hasFinalGrade || r.isNotEvaluated) evaluatedCount++;
        else if (r.hasData) partialCount++;
        else if (r.hasEvidence) feedbackCount++;
      });
      const counterEl = document.getElementById('qoEvaluatedCounter');
      if (counterEl) {
        counterEl.textContent = `${evaluatedCount}/${targetedStudents.length} coté(s)${partialCount ? ` · ${partialCount} en cours` : ''}`;
      }

      // 1. Top Student Selector Pills
      const stuGrid = document.getElementById('qoStudentGrid');
      stuGrid.innerHTML = '';
      targetedStudents.forEach(student => {
        const d = session.studentDrafts[student.id];
        const studentCriteria = getObservationCriteria(sub, getObservationDraftGradeLevel(d, student, session), session);
        const stuRes = computeObservableResult(d.checked, d.overrideCode, studentCriteria, d.notEvaluated);
        const isSel = Boolean(st && student.id === st.id);
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = isSel
          ? 'w-full px-2.5 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 text-white shadow-xs transition cursor-pointer flex items-center justify-between gap-1 truncate'
          : 'w-full px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 transition cursor-pointer flex items-center justify-between gap-1 truncate';
        const shortLvl = isMulti && student.gradeLevel ? ` <span class="opacity-70 text-[10px]">(${escapeHtml(formatShortLevelTag(student.gradeLevel))})</span>` : '';
        btn.innerHTML = `
          <span class="truncate">${escapeHtml(student.name)}${shortLvl}</span>
          ${stuRes.isNotEvaluated
            ? `<span class="px-1.5 py-0.2 rounded text-[10px] bg-slate-200 text-slate-600 font-bold">N/A</span>`
            : stuRes.hasFinalGrade
            ? `<span class="px-1.5 py-0.2 rounded border text-[10px] font-extrabold ${getBadgeColorClasses(stuRes.code)}">${stuRes.code} (${stuRes.pct}%)${d.overrideCode ? '<span class="adj-star" title="Note ajustée manuellement">*</span>' : ''}</span>`
            : stuRes.hasData
              ? `<span class="px-1.5 py-0.2 rounded text-[10px] bg-amber-100 text-amber-900 font-bold">${stuRes.total}/${getScoredObservableCriteria(studentCriteria).length}</span>`
            : stuRes.hasEvidence
              ? `<span class="px-1.5 py-0.2 rounded text-[10px] bg-indigo-100 text-indigo-800 font-bold">Obs.</span>`
              : `<span class="px-1.5 py-0.2 rounded text-[10px] bg-slate-200 text-slate-500 font-bold">-</span>`
          }
        `;
        btn.addEventListener('click', () => {
          appState.selectedStudentId = student.id;
          renderQuickObsView();
        });
        stuGrid.appendChild(btn);
      });

      if (!st) {
        document.getElementById('sgMajorityExplanation').textContent = 'Sélectionner un nom ci-dessus pour remplir la grille d’évaluation.';
        document.getElementById('sgMatrixBody').innerHTML =
          '<tr><td colspan="6" class="p-6 text-center text-sm font-semibold text-slate-600 bg-slate-50">Sélectionner un nom ci-dessus pour afficher et remplir la grille d’évaluation de l’élève.</td></tr>';
        document.getElementById('qoGradePills').innerHTML =
          '<div class="col-span-full text-xs text-slate-500 py-1">Sélectionner un nom pour ajuster la note.</div>';
        const selCountElEmpty = document.getElementById('qoSelectedTagsCount');
        if (selCountElEmpty) selCountElEmpty.textContent = '0 sélectionné(s)';
        const catTabsEmpty = document.getElementById('qoCategoryTabs');
        if (catTabsEmpty) catTabsEmpty.innerHTML = '';
        document.getElementById('qoQuickTags').innerHTML =
          '<div class="text-xs text-slate-500">Sélectionner un nom pour cocher des observations.</div>';
        const activeStripEmpty = document.getElementById('qoActiveStudentTagsStrip');
        if (activeStripEmpty) activeStripEmpty.innerHTML = '';
        const commInputEmpty = document.getElementById('qoCommentInput');
        if (commInputEmpty) {
          commInputEmpty.value = '';
          commInputEmpty.disabled = true;
          commInputEmpty.placeholder = 'Sélectionner un nom pour noter vos observations...';
        }
        return;
      }

      // 2. Compute the current student's live mark from the selected rubric statements
      const res = computeObservableResult(draft.checked, draft.overrideCode, criteria, draft.notEvaluated);
      const scoredCriteriaCount = getScoredObservableCriteria(criteria).length;
      const expEl = document.getElementById('sgMajorityExplanation');

      if (res.isNotEvaluated) {
        expEl.textContent = 'N/A — élève non évalué pour cette trace. Vous pouvez encore sélectionner des critères ou une cote.';
      } else if (res.hasData) {
        expEl.innerHTML = `
          <strong>${res.total} / ${scoredCriteriaCount} critère(s) coté(s)</strong>
          → ${res.hasFinalGrade ? 'Cote finale :' : 'Cote provisoire :'}
          <span class="px-2 py-0.5 rounded ${res.hasFinalGrade ? 'bg-emerald-400 text-slate-950' : 'bg-amber-300 text-slate-950'} font-extrabold">${res.code} (${res.pct}%)${draft.overrideCode ? '*' : ''}</span>
          ${draft.overrideCode ? '<span class="adj-star">* note ajustée manuellement</span>' : ''}
        `;
      } else {
        expEl.textContent = res.hasEvidence
          ? 'Observation consignée pour rétroaction; elle ne contribue pas à la cote.'
          : cycle && !criteria.length
            ? CYCLE_RUBRIC_UNAVAILABLE_MESSAGES[sub.id] || 'Aucun critère n’est disponible pour ce niveau.'
            : cycle
              ? ''
              : 'Choisissez le niveau de cet élève dans sa fiche avant de remplir sa grille.';
      }

      // 3. Render cycle-adapted rubric (one choice per criterion).
      const tbody = document.getElementById('sgMatrixBody');
      tbody.innerHTML = '';
      if (!criteria.length) {
        const tr = document.createElement('tr');
        const td = document.createElement('td');
        td.colSpan = 6;
        td.className = 'p-6 text-center text-sm text-amber-900 bg-amber-50';
        td.textContent = cycle
          ? CYCLE_RUBRIC_UNAVAILABLE_MESSAGES[sub.id] || 'Aucun critère n’est disponible pour ce niveau.'
          : 'Choisissez le niveau de cet élève dans la liste d’élèves pour afficher ses repères de cycle.';
        tr.appendChild(td);
        tbody.appendChild(tr);
      }
      criteria.forEach(crit => {
        const tr = document.createElement('tr');
        tr.className = crit.formativeOnly
          ? 'border-b border-amber-200 bg-amber-50/40 align-top'
          : 'border-b border-slate-200 align-top';

        const tdTitle = document.createElement('td');
        tdTitle.className = crit.formativeOnly
          ? 'p-2 font-bold text-amber-950 bg-amber-50/90 border border-amber-200 break-words'
          : 'p-2 font-bold text-slate-900 bg-slate-50 border border-slate-200 break-words';
        const titleText = document.createElement('div');
        const isLocalFormative = LOCAL_FORMATIVE_CRITERIA.has(crit.id);
        titleText.textContent = crit.title.replace(/^\d+\.\s*/, '');
        if (isLocalFormative) titleText.textContent = titleText.textContent.replace(/\s*\(\*\)/, '');
        tdTitle.appendChild(titleText);
        const roleBadge = document.createElement('span');
        roleBadge.className = crit.formativeOnly
          ? 'mt-1 inline-block max-w-full px-1.5 py-0.5 rounded text-[9px] leading-tight font-bold bg-amber-100 text-amber-900 border border-amber-300'
          : 'mt-1 inline-block max-w-full px-1.5 py-0.5 rounded text-[9px] leading-tight font-semibold bg-indigo-50 text-indigo-800 border border-indigo-200';
        roleBadge.textContent = crit.formativeOnly
          ? (isLocalFormative ? 'Repère local • Non coté' : 'Formatif • Non coté')
          : 'Critère coté';
        tdTitle.appendChild(roleBadge);
        tr.appendChild(tdTitle);

        ['A', 'B', 'C', 'D', 'E'].forEach(fam => {
          const td = document.createElement('td');
          td.className = 'p-1.5 border border-slate-200 space-y-1';
          const statements = crit.cells[fam] || [];
          statements.forEach((stmtText, idx) => {
            const key = `${crit.id}_${fam}_${idx}`;
            const isChecked = draft.checked.includes(key);
            const itemBtn = document.createElement('button');
            itemBtn.type = 'button';
            itemBtn.dataset.rubricKey = key;
            itemBtn.setAttribute('aria-pressed', String(isChecked));
            itemBtn.className = `rubric-stmt-btn p-1.5 rounded-lg border text-[11px] leading-snug transition cursor-pointer ${
              isChecked
                ? `stmt-checked-${fam}`
                : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
            }`;
            itemBtn.innerHTML = `
              <span aria-hidden="true" class="mt-0.5 w-3.5 h-3.5 rounded-full flex-shrink-0 flex items-center justify-center border ${
                isChecked ? 'bg-slate-900 text-white border-slate-900' : 'border-slate-300 bg-white'
              } text-[9px] font-bold">${isChecked ? '✓' : ''}</span>
              <span class="rubric-stmt-text">${stmtText}</span>
            `;
            itemBtn.addEventListener('click', () => {
              const hadFocus = document.activeElement === itemBtn;
              draft.notEvaluated = false;
              draft.checked = toggleSingleChoiceInRow(draft.checked, crit.id, key);
              draft.overrideCode = null;
              renderQuickObsView();
              if (hadFocus) restoreRubricFocus(tbody, key);
            });
            td.appendChild(itemBtn);
          });
          tr.appendChild(td);
        });

        tbody.appendChild(tr);
      });

      // 4. Cote de la trace observable (13 compact buttons on a single line)
      const gradePills = document.getElementById('qoGradePills');
      gradePills.innerHTML = '';
      GRADE_SCALE.forEach(g => {
        const isSel = res.isOverride && res.code === g.code;
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.disabled = !scoredCriteriaCount;
        btn.className = isSel
          ? 'grade-pill-compact grade-pill-selected cursor-pointer'
          : `grade-pill-compact font-bold border cursor-pointer ${getBadgeColorClasses(g.code)} ${scoredCriteriaCount ? '' : 'opacity-50 cursor-not-allowed'}`;
        btn.innerHTML = `<span>${g.code}</span><span class="text-[9px] font-medium opacity-80">${g.pct}</span>`;
        if (res.isOverride && !isSel) btn.classList.add('grade-pill-dim');
        btn.title = scoredCriteriaCount
          ? `${g.code} (${g.pct}%) — ajuster la note`
          : CYCLE_RUBRIC_UNAVAILABLE_MESSAGES[sub.id] || 'Aucun critère coté n’est disponible pour ce niveau.';
        btn.addEventListener('click', () => {
          if (!scoredCriteriaCount) return;
          draft.notEvaluated = false;
          if (draft.overrideCode === g.code) {
            draft.overrideCode = null;
          } else {
            draft.overrideCode = g.code;
          }
          renderQuickObsView();
        });
        gradePills.appendChild(btn);
      });

      // 5. Categorized PIA Quick Tags for current student
      const categories = appState.tagCategories || PIA_TAG_CATEGORIES;
      if (!appState.activeTagCategoryId) appState.activeTagCategoryId = categories[0].id;
      const activeCat = categories.find(c => c.id === appState.activeTagCategoryId) || categories[0];

      const catTabsEl = document.getElementById('qoCategoryTabs');
      if (catTabsEl) {
        catTabsEl.innerHTML = '';
        categories.forEach(cat => {
          const countInCat = cat.tags.filter(t => draft.tags.includes(t)).length;
          const isAct = cat.id === activeCat.id;
          const cBtn = document.createElement('button');
          cBtn.type = 'button';
          cBtn.className = isAct
            ? 'px-2 py-1.5 rounded-lg text-[11px] font-bold bg-slate-900 text-white shadow-2xs flex items-center justify-between gap-1 cursor-pointer truncate'
            : 'px-2 py-1.5 rounded-lg text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-between gap-1 cursor-pointer truncate';
          cBtn.innerHTML = `
            <span class="truncate">${escapeHtml(cat.label.replace(/ & /g, ' et '))}</span>
            ${countInCat > 0 ? `<span class="px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-500 text-white font-extrabold">${countInCat}</span>` : ''}
          `;
          cBtn.addEventListener('click', () => {
            appState.activeTagCategoryId = cat.id;
            renderQuickObsView();
          });
          catTabsEl.appendChild(cBtn);
        });
      }

      const selCountEl = document.getElementById('qoSelectedTagsCount');
      if (selCountEl) {
        selCountEl.textContent = `${draft.tags.length} sélectionné(s)`;
      }

      const tagsContainer = document.getElementById('qoQuickTags');
      tagsContainer.innerHTML = '';
      activeCat.tags.forEach(tag => {
        const isSel = draft.tags.includes(tag);
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = isSel
          ? 'px-2.5 py-1 rounded-full text-[11px] font-bold bg-indigo-600 text-white shadow-2xs cursor-pointer transition'
          : 'px-2.5 py-1 rounded-full text-[11px] font-medium bg-white hover:bg-indigo-50 text-slate-700 border border-slate-200 cursor-pointer transition';
        btn.textContent = `${isSel ? '✓ ' : ''}${tag}`;
        btn.addEventListener('click', () => {
          const idx = draft.tags.indexOf(tag);
          if (idx >= 0) draft.tags.splice(idx, 1);
          else draft.tags.push(tag);
          draft.notEvaluated = false;
          renderQuickObsView();
        });
        tagsContainer.appendChild(btn);
      });

      const activeStrip = document.getElementById('qoActiveStudentTagsStrip');
      if (activeStrip) {
        activeStrip.innerHTML = '';
        if (draft.tags.length > 0) {
          draft.tags.forEach(t => {
            const chip = document.createElement('span');
            chip.className = 'inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 border border-indigo-200 text-[10px] font-semibold text-indigo-800';
            chip.innerHTML = `<span>${t}</span><button type="button" class="hover:text-red-600 font-bold cursor-pointer">✕</button>`;
            chip.querySelector('button').addEventListener('click', () => {
              draft.tags = draft.tags.filter(x => x !== t);
              renderQuickObsView();
            });
            activeStrip.appendChild(chip);
          });
        }
      }

      // 6. Comment textarea for current student
      const commInput = document.getElementById('qoCommentInput');
      if (commInput) {
        commInput.disabled = false;
        commInput.placeholder = 'Notez vos observations pour cet élève...';
        if (document.activeElement !== commInput) {
          commInput.value = draft.comment || '';
        }
      }

    }

    function commitObservationSessionToGradebook() {
      const sub = getCurrentSubjectConfig();
      const termData = getActiveTermData();
      const subData = termData.subjectData[sub.id];
      const session = subData.currentObsSession;
      const titleInput = document.getElementById('qoSessionTitleInput');
      const enteredTitle = (session.title || (titleInput ? titleInput.value : '')).trim();

      if (!enteredTitle) {
        showToast('Veuillez donner un nom à cette trace observable avant de l’enregistrer');
        if (titleInput) titleInput.focus();
        return;
      }

      const targetedStudents = appState.students.filter(st => isAssignmentForStudent(session, st));
      let draftsWithData = 0;
      targetedStudents.forEach(st => {
        const d = session.studentDrafts[st.id];
        const criteria = getObservationCriteria(sub, getObservationDraftGradeLevel(d, st, session), session);
        const r = computeObservableResult(d.checked, d.overrideCode, criteria, d.notEvaluated);
        if (r.hasEvidence || d.comment.trim() || d.tags.length) draftsWithData++;
      });

      if (draftsWithData === 0) {
        showToast('Ajoutez au moins un critère, une cote, une note ou un indicateur.');
        return;
      }

      const todayStr = new Date().toISOString().slice(0, 10);
      const isEditing = Boolean(session.editingAssignmentId);
      let targetAsgId = session.editingAssignmentId;
      const actTitle = enteredTitle;
      const targetLevels = getAssignmentTargetLevels(session);

      if (isEditing) {
        const existingAsg = subData.assignments.find(a => a.id === targetAsgId);
        if (existingAsg) {
          existingAsg.title = actTitle;
          if (targetLevels.length) existingAsg.targetLevels = targetLevels.slice();
          else delete existingAsg.targetLevels;
          if (subData.equalWeights) recalculateEqualWeights(subData);
        } else {
          targetAsgId = 'obs_asg_' + Date.now();
          const newEntry = {
            id: targetAsgId,
            title: actTitle,
            date: todayStr,
            weight: 100,
            isObservation: true,
            rubricVersion: session.rubricVersion
          };
          if (targetLevels.length) newEntry.targetLevels = targetLevels.slice();
          subData.assignments.push(newEntry);
          if (subData.equalWeights) recalculateEqualWeights(subData);
        }
      } else {
        targetAsgId = 'obs_asg_' + Date.now();
        const newEntry = {
          id: targetAsgId,
          title: actTitle,
          date: todayStr,
          weight: 100,
          isObservation: true,
          rubricVersion: session.rubricVersion
        };
        if (targetLevels.length) newEntry.targetLevels = targetLevels.slice();
        subData.assignments.push(newEntry);
        if (subData.equalWeights) {
          recalculateEqualWeights(subData);
        }
      }

      const origAsg = subData.assignments.find(a => a.id === targetAsgId);
      appState.students.forEach(st => {
        const rec = subData.studentRecords[st.id];
        rec.scoreMeta = rec.scoreMeta || {};
        const prevFlags = getCellFlags(rec, targetAsgId);
        if (origAsg && !isAssignmentForStudent(origAsg, st)) {
          rec.scores[targetAsgId] = '-';
          if (prevFlags.length) rec.scoreMeta[targetAsgId] = { flags: prevFlags };
          else delete rec.scoreMeta[targetAsgId];
          termData.observations = termData.observations.filter(o => !(o.asgId === targetAsgId && o.studentId === st.id));
          return;
        }
        const d = session.studentDrafts[st.id];
        const gradeLevel = getObservationDraftGradeLevel(d, st, session);
        d.gradeLevel = gradeLevel;
        const criteria = getObservationCriteria(sub, gradeLevel, session);
        const r = computeObservableResult(d.checked, d.overrideCode, criteria, d.notEvaluated);

        if (rec.scoreMeta[targetAsgId] && rec.scoreMeta[targetAsgId].linkedCopy &&
            !r.hasEvidence && !d.comment.trim() && !d.tags.length && !d.notEvaluated) return;

        if (r.hasEvidence || d.comment.trim() || d.tags.length) {
          rec.scores[targetAsgId] = r.hasFinalGrade ? r.pct : '-';
          rec.scoreMeta[targetAsgId] = {
            checked: d.checked.slice(),
            overrideCode: d.overrideCode,
            code: r.hasFinalGrade ? r.code : null,
            pct: r.hasFinalGrade ? r.pct : null,
            tags: d.tags.slice(),
            comment: d.comment,
            gradeLevel,
            isComplete: r.isComplete,
            notEvaluated: r.isNotEvaluated
          };
          if (prevFlags.length) rec.scoreMeta[targetAsgId].flags = prevFlags;
          termData.observations = termData.observations.filter(o => !(o.asgId === targetAsgId && o.studentId === st.id));
          termData.observations.push({
            id: 'obs_' + Date.now() + '_' + st.id,
            asgId: targetAsgId,
            studentId: st.id,
            subjectId: sub.id,
            date: todayStr,
            traceType: 'Trace observable',
            activity: actTitle,
            gradeCode: r.isNotEvaluated ? 'N/A' : r.hasFinalGrade ? r.code : r.hasData ? 'En cours' : 'Rétroaction',
            tags: d.tags.slice(),
            comment: d.comment
          });
        } else {
          rec.scores[targetAsgId] = '-'; // Dash for non-evaluated students (never 0!)
          if (prevFlags.length) rec.scoreMeta[targetAsgId] = { flags: prevFlags };
          else delete rec.scoreMeta[targetAsgId];
          termData.observations = termData.observations.filter(o => !(o.asgId === targetAsgId && o.studentId === st.id));
        }
      });

      let traceLinkId = origAsg && origAsg.linkId;
      const newLinkTargets = isEditing ? [] : (session.linkTargets || []);
      if (origAsg && !traceLinkId && newLinkTargets.length) {
        traceLinkId = 'lnk_' + Date.now();
        origAsg.linkId = traceLinkId;
        origAsg.linkOrigin = true;
      }
      if (origAsg && traceLinkId) {
        newLinkTargets.forEach(subId => {
          const sd = termData.subjectData[subId];
          if (!sd) return;
          const linkedAsg = { id: `obs_asg_${Date.now()}_${subId}`, title: actTitle, date: todayStr, weight: 100, isObservation: true, rubricVersion: session.rubricVersion, linkId: traceLinkId, linkOrigin: false };
          if (targetLevels.length) linkedAsg.targetLevels = targetLevels.slice();
          sd.assignments.push(linkedAsg);
          if (sd.equalWeights) recalculateEqualWeights(sd);
        });
        getLinkedAssignments(origAsg).forEach(({ subData: otherData, asg: other }) => {
          other.title = actTitle;
          if (targetLevels.length) other.targetLevels = targetLevels.slice();
          else delete other.targetLevels;
          if (otherData.equalWeights) recalculateEqualWeights(otherData);
          appState.students.forEach(st => {
            const src = subData.studentRecords[st.id];
            const dst = otherData.studentRecords[st.id];
            if (!src || !dst) return;
            dst.scoreMeta = dst.scoreMeta || {};
            const srcMeta = src.scoreMeta && src.scoreMeta[targetAsgId];
            const dstMeta = dst.scoreMeta[other.id];
            const dstScore = dst.scores[other.id];
            if (srcMeta && srcMeta.linkedCopy) return;
            if (dstMeta && !dstMeta.linkedCopy &&
                ((Array.isArray(dstMeta.checked) && dstMeta.checked.length) || dstMeta.overrideCode ||
                 dstMeta.comment || (Array.isArray(dstMeta.tags) && dstMeta.tags.length) || dstMeta.notEvaluated)) return;
            if ((!dstMeta || !dstMeta.linkedCopy) && dstScore !== undefined && dstScore !== '' && dstScore !== '-') return;
            const dstFlags = getCellFlags(dst, other.id);
            dst.scores[other.id] = src.scores[targetAsgId];
            if (srcMeta) {
              dst.scoreMeta[other.id] = { ...srcMeta, linkedCopy: true };
              if (dstFlags.length) dst.scoreMeta[other.id].flags = dstFlags;
              else delete dst.scoreMeta[other.id].flags;
            } else if (dstFlags.length) dst.scoreMeta[other.id] = { flags: dstFlags };
            else delete dst.scoreMeta[other.id];
          });
        });
      }

      subData.currentObsSession = createBlankObsSession(appState.students);
      subData.currentObsSession.savedDraftSnapshot = getCurrentObservationSessionSnapshot(subData.currentObsSession);
      observationDraftBaseline = subData.currentObsSession.savedDraftSnapshot;
      notifyUpdate(isEditing ? `Trace observable "${actTitle}" mise à jour!` : `Trace observable "${actTitle}" ajoutée au carnet!`);
      appState.activeView = 'viewGradebook';
      renderAll();
    }

    // -------------------------------------------------------------------------
    // VIEW 4: LISTE D'ÉLÈVES & ADAPTATIONS À LA PIÈCE
    // -------------------------------------------------------------------------
