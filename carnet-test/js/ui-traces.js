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

      const displaySub = getSubjectContextDisplay(sub);
      document.getElementById('baremeSubjectLabel').textContent =
        `${displaySub.shortName}${displaySub.officialWeightLabel ? ` — ${displaySub.officialWeightLabel}` : ''} (Étape ${appState.activeTerm})`;
      document.getElementById('baremeCurrentStudentName').textContent = st ? st.name : 'Sélectionner un nom';
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
        btn.setAttribute('aria-pressed', String(isSel));
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
              <span aria-hidden="true" class="rubric-stmt-check mt-0.5 w-3.5 h-3.5 rounded-full flex-shrink-0 flex items-center justify-center border ${
                isChecked ? 'bg-slate-900 text-white border-slate-900' : 'border-slate-300 bg-white'
              } text-[9px] font-bold">${isChecked ? '✓' : ''}</span>
              <span class="rubric-stmt-text">${stmtText}</span>
            `;
            itemBtn.addEventListener('click', () => {
              const hadFocus = document.activeElement === itemBtn;
              rec.baremeChecked = toggleSingleChoiceInRow(rec.baremeChecked, row.id, key);
              rec.baremeOverrideCode = null;
              scheduleAppStateSave();
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
    // Éditeur de trace observable (Modes 1: Grille d’appréciation, 2: Grille pondérée MEQ)
    // -------------------------------------------------------------------------
    function isWeightedRubricAvailableForSubject(sub) {
      return Boolean(
        sub &&
        !sub.prescoOnly &&
        typeof WEIGHTED_RUBRIC_SUBJECT_IDS !== 'undefined' &&
        WEIGHTED_RUBRIC_SUBJECT_IDS.has(sub.id)
      );
    }

    function getEffectiveSessionObsMode(session, sub) {
      const raw = session && session.obsMode ? session.obsMode : 'portrait';
      if (raw === 'custom' && normalizeCustomRubric(session.customRubric, true)) return 'custom';
      if (raw === 'weighted' && isWeightedRubricAvailableForSubject(sub)) {
        return 'weighted';
      }
      return 'portrait';
    }

    function buildStudentObsOptions(session, sub, gradeLevel) {
      const effectiveMode = getEffectiveSessionObsMode(session, sub);
      return {
        obsMode: effectiveMode,
        criteriaWeights: (session && session.criteriaWeights && typeof session.criteriaWeights === 'object')
          ? session.criteriaWeights
          : null,
        customRubric: session && session.customRubric ? cloneCustomRubric(session.customRubric) : null,
        subjectId: sub ? sub.id : '',
        cycle: getStudentCycle(gradeLevel) || 2
      };
    }

    let customRubricEditorDraft = null;
    let customRubricEditorOpener = null;
    let customRubricEditorId = null;

    function getCustomRubricValidation(rubric) {
      if (!rubric) return { valid: false, message: 'Créez une grille avant de l’appliquer.' };
      const total = (rubric.criteria || []).reduce((sum, item) => sum + Number(item.weight || 0), 0);
      if (!String(rubric.title || '').trim()) return { valid: false, total, message: 'Donnez un titre à la grille.' };
      if (Math.abs(total - 100) > 0.0001) return { valid: false, total, message: `Le poids total doit être de 100 % (actuellement ${formatScoreNumber(total)} %).` };
      if (!(rubric.levels || []).every(level => String(level.name || '').trim())) {
        return { valid: false, total, message: 'Nommez chaque niveau de performance.' };
      }
      if (!(rubric.criteria || []).every(criterion => String(criterion.title || '').trim())) {
        return { valid: false, total, message: 'Nommez chaque critère.' };
      }
      if (!(rubric.criteria || []).every(criterion =>
        (rubric.levels || []).every(level => String((criterion.cells[level.key] || [''])[0] || '').trim()))) {
        return { valid: false, total, message: 'Rédigez un descripteur pour chaque case.' };
      }
      return { valid: true, total, message: 'Grille prête à être sauvegardée.' };
    }

    function remapCustomRubricLevelKeys() {
      const count = customRubricEditorDraft.levels.length;
      const keys = CUSTOM_RUBRIC_LEVEL_KEYS[count];
      customRubricEditorDraft.levels = customRubricEditorDraft.levels.map((level, index) => ({ ...level, key: keys[index] }));
      customRubricEditorDraft.criteria.forEach(criterion => {
        const oldCells = criterion.cells || {};
        const oldKeys = Object.keys(oldCells);
        criterion.cells = {};
        keys.forEach((key, index) => {
          criterion.cells[key] = oldCells[key] || oldCells[oldKeys[index]] || ['Nouveau descripteur'];
        });
      });
    }

    function updateCustomRubricEditorValidation() {
      const status = document.getElementById('customRubricValidation');
      const totalBadge = document.getElementById('customRubricWeightTotal');
      const apply = document.getElementById('btnApplyCustomRubric');
      if (!status || !totalBadge || !apply) return;
      const validation = getCustomRubricValidation(customRubricEditorDraft);
      totalBadge.textContent = `Poids total : ${formatScoreNumber(validation.total || 0)} %`;
      totalBadge.classList.toggle('is-valid', Math.abs((validation.total || 0) - 100) < 0.0001);
      totalBadge.classList.toggle('is-invalid', Math.abs((validation.total || 0) - 100) >= 0.0001);
      status.textContent = validation.message;
      status.classList.toggle('is-valid', validation.valid);
      status.classList.toggle('is-invalid', !validation.valid);
      apply.disabled = !validation.valid;
    }

    function renderCustomRubricEditor() {
      const editor = document.getElementById('customRubricEditor');
      if (!editor || !customRubricEditorDraft) return;
      editor.innerHTML = '';
      const title = document.createElement('label');
      title.className = 'custom-rubric-title-field';
      title.innerHTML = '<span>Titre de la grille</span>';
      const titleInput = document.createElement('input');
      titleInput.id = 'customRubricTitleFocus';
      titleInput.type = 'text';
      titleInput.maxLength = 160;
      titleInput.value = customRubricEditorDraft.title || '';
      titleInput.setAttribute('aria-label', 'Titre de la grille personnalisée');
      titleInput.addEventListener('input', () => {
        customRubricEditorDraft.title = titleInput.value;
        updateCustomRubricEditorValidation();
      });
      title.appendChild(titleInput);
      editor.appendChild(title);

      const controls = document.createElement('div');
      controls.className = 'custom-rubric-counts';
      const makeCount = (labelText, kind, min, max) => {
        const wrap = document.createElement('div');
        wrap.className = 'custom-rubric-count';
        wrap.innerHTML = `<span>${escapeHtml(labelText)}</span>`;
        const buttons = document.createElement('div');
        buttons.className = 'custom-rubric-count-buttons';
        const remove = document.createElement('button');
        remove.type = 'button';
        remove.textContent = '−';
        remove.setAttribute('aria-label', `Retirer ${labelText.toLowerCase()}`);
        const value = document.createElement('output');
        value.textContent = String(customRubricEditorDraft[kind].length);
        const add = document.createElement('button');
        add.type = 'button';
        add.textContent = '+';
        add.setAttribute('aria-label', `Ajouter ${labelText.toLowerCase()}`);
        remove.disabled = customRubricEditorDraft[kind].length <= min;
        add.disabled = customRubricEditorDraft[kind].length >= max;
        remove.addEventListener('click', () => {
          if (customRubricEditorDraft[kind].length <= min) return;
          customRubricEditorDraft[kind].pop();
          if (kind === 'levels') remapCustomRubricLevelKeys();
          renderCustomRubricEditor();
        });
        add.addEventListener('click', () => {
          if (customRubricEditorDraft[kind].length >= max) return;
          if (kind === 'criteria') {
            const index = customRubricEditorDraft.criteria.length;
            customRubricEditorDraft.criteria.push({
              id: `custom_c${Date.now()}`,
              title: `Critère ${index + 1}`,
              weight: 0,
              cells: Object.fromEntries(customRubricEditorDraft.levels.map(level => [level.key, ['Nouveau descripteur']]))
            });
          } else {
            customRubricEditorDraft.levels.push({ key: 'A', name: `Niveau ${customRubricEditorDraft.levels.length + 1}`, percent: 0 });
            remapCustomRubricLevelKeys();
          }
          renderCustomRubricEditor();
        });
        buttons.append(remove, value, add);
        wrap.appendChild(buttons);
        return wrap;
      };
      controls.append(
        makeCount('critères', 'criteria', 1, 8),
        makeCount('niveaux', 'levels', 2, 5)
      );
      editor.appendChild(controls);

      const scroll = document.createElement('div');
      scroll.className = 'custom-rubric-scroll';
      const table = document.createElement('table');
      table.className = 'custom-rubric-table';
      const thead = document.createElement('thead');
      const headerRow = document.createElement('tr');
      const criterionHead = document.createElement('th');
      criterionHead.scope = 'col';
      criterionHead.textContent = 'Critère et poids';
      headerRow.appendChild(criterionHead);
      customRubricEditorDraft.levels.forEach((level, levelIndex) => {
        const th = document.createElement('th');
        th.scope = 'col';
        const name = document.createElement('input');
        name.type = 'text';
        name.maxLength = 100;
        name.value = level.name;
        name.setAttribute('aria-label', `Nom du niveau ${levelIndex + 1}`);
        name.addEventListener('input', () => {
          level.name = name.value;
          updateCustomRubricEditorValidation();
        });
        const percentWrap = document.createElement('label');
        const percent = document.createElement('input');
        percent.type = 'number';
        percent.min = '0';
        percent.max = '100';
        percent.step = '1';
        percent.value = String(level.percent);
        percent.setAttribute('aria-label', `Pourcentage du niveau ${levelIndex + 1}`);
        percent.addEventListener('input', () => {
          level.percent = Math.max(0, Math.min(100, Number(percent.value) || 0));
        });
        percentWrap.append(percent, document.createTextNode(' %'));
        th.append(name, percentWrap);
        headerRow.appendChild(th);
      });
      thead.appendChild(headerRow);
      table.appendChild(thead);
      const tbody = document.createElement('tbody');
      customRubricEditorDraft.criteria.forEach((criterion, criterionIndex) => {
        const row = document.createElement('tr');
        const criterionCell = document.createElement('th');
        criterionCell.scope = 'row';
        const criterionTitle = document.createElement('input');
        criterionTitle.type = 'text';
        criterionTitle.maxLength = 180;
        criterionTitle.value = criterion.title;
        criterionTitle.setAttribute('aria-label', `Titre du critère ${criterionIndex + 1}`);
        criterionTitle.addEventListener('input', () => {
          criterion.title = criterionTitle.value;
          updateCustomRubricEditorValidation();
        });
        const weightLabel = document.createElement('label');
        const weight = document.createElement('input');
        weight.type = 'number';
        weight.min = '0';
        weight.max = '100';
        weight.step = '1';
        weight.value = String(criterion.weight);
        weight.setAttribute('aria-label', `Poids du critère ${criterionIndex + 1}`);
        weight.addEventListener('input', () => {
          criterion.weight = Math.max(0, Math.min(100, Number(weight.value) || 0));
          updateCustomRubricEditorValidation();
        });
        weightLabel.append(weight, document.createTextNode(' %'));
        criterionCell.append(criterionTitle, weightLabel);
        row.appendChild(criterionCell);
        customRubricEditorDraft.levels.forEach(level => {
          const td = document.createElement('td');
          const descriptor = document.createElement('textarea');
          descriptor.rows = 4;
          descriptor.maxLength = 2000;
          descriptor.required = true;
          descriptor.value = (criterion.cells[level.key] || [''])[0];
          descriptor.setAttribute('aria-label', `${criterion.title || `Critère ${criterionIndex + 1}`} — ${level.name || level.key}`);
          descriptor.addEventListener('input', () => {
            criterion.cells[level.key] = [descriptor.value];
            updateCustomRubricEditorValidation();
          });
          td.appendChild(descriptor);
          row.appendChild(td);
        });
        tbody.appendChild(row);
      });
      table.appendChild(tbody);
      scroll.appendChild(table);
      editor.appendChild(scroll);
      updateCustomRubricEditorValidation();
    }

    function openCustomRubricEditor(opener, rubricId = null) {
      const subData = getActiveTermData().subjectData[getCurrentSubjectConfig().id];
      const library = Array.isArray(subData.customRubrics) ? subData.customRubrics : [];
      if (!rubricId && library.length >= 5) {
        showToast('Vous avez atteint le maximum de 5 grilles personnelles. Supprimez-en une avant d’en créer une nouvelle.');
        return;
      }
      const savedItem = rubricId ? library.find(item => item.id === rubricId) : null;
      if (rubricId && !savedItem) {
        showToast('Cette grille personnelle est introuvable.');
        return;
      }
      const source = savedItem ? savedItem.customRubric : createDefaultCustomRubric();
      customRubricEditorDraft = cloneCustomRubric(source);
      customRubricEditorId = savedItem ? savedItem.id : null;
      customRubricEditorOpener = opener || document.activeElement;
      document.getElementById('customRubricDialogTitle').textContent = savedItem
        ? 'Modifier ma grille personnalisée'
        : 'Créer ma grille personnalisée';
      document.getElementById('btnDeleteCustomRubric').hidden = !savedItem;
      renderCustomRubricEditor();
      const dialog = document.getElementById('customRubricDialog');
      dialog.showModal();
      window.setTimeout(() => {
        const focusTarget = document.getElementById('customRubricTitleFocus');
        if (focusTarget) focusTarget.focus();
      }, 0);
    }

    function closeCustomRubricEditor() {
      const dialog = document.getElementById('customRubricDialog');
      if (dialog.open) dialog.close();
      if (customRubricEditorOpener && customRubricEditorOpener.isConnected) {
        customRubricEditorOpener.focus({ preventScroll: true });
      }
      customRubricEditorDraft = null;
      customRubricEditorId = null;
    }

    function applyCustomRubricEditor() {
      const normalized = normalizeCustomRubric(customRubricEditorDraft, true);
      if (!normalized) {
        updateCustomRubricEditorValidation();
        return;
      }
      const subData = getActiveTermData().subjectData[getCurrentSubjectConfig().id];
      subData.customRubrics = Array.isArray(subData.customRubrics) ? subData.customRubrics : [];
      const now = new Date().toISOString();
      let savedItem;
      if (customRubricEditorId) {
        savedItem = subData.customRubrics.find(item => item.id === customRubricEditorId);
        if (!savedItem) {
          showToast('Cette grille personnelle n’existe plus.');
          return;
        }
        savedItem.title = normalized.title;
        savedItem.updatedAt = now;
        savedItem.createdAt = savedItem.createdAt || now;
        savedItem.customRubric = cloneCustomRubric(normalized);
      } else {
        if (subData.customRubrics.length >= 5) {
          showToast('Vous avez atteint le maximum de 5 grilles personnelles. Supprimez-en une avant d’en créer une nouvelle.');
          return;
        }
        const id = `custom_rubric_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        savedItem = {
          id,
          title: normalized.title,
          createdAt: now,
          updatedAt: now,
          customRubric: cloneCustomRubric(normalized)
        };
        subData.customRubrics.push(savedItem);
      }
      const session = subData.currentObsSession;
      session.customRubric = cloneCustomRubric(normalized);
      session.selectedCustomRubricId = savedItem.id;
      session.obsMode = 'custom';
      session.criteriaWeights = null;
      session.studentDrafts = session.studentDrafts || {};
      Object.values(session.studentDrafts).forEach(draft => {
        const validLevelKeys = new Set(normalized.levels.map(level => level.key));
        draft.checked = (draft.checked || []).filter(key => {
          const parts = key.split('_');
          const family = parts[parts.length - 2];
          const criterionId = parts.slice(0, -2).join('_');
          return validLevelKeys.has(family) && normalized.criteria.some(criterion => criterion.id === criterionId);
        });
        draft.overrideCode = null;
      });
      const wasEditing = Boolean(customRubricEditorId);
      closeCustomRubricEditor();
      scheduleAppStateSave();
      renderQuickObsView();
      showToast(wasEditing ? 'Grille personnelle modifiée et sélectionnée.' : 'Grille personnelle sauvegardée et sélectionnée.');
    }

    function deleteCustomRubricEditorItem() {
      if (!customRubricEditorId) return;
      const subData = getActiveTermData().subjectData[getCurrentSubjectConfig().id];
      const item = (subData.customRubrics || []).find(rubric => rubric.id === customRubricEditorId);
      if (!item) return;
      if (!window.confirm(`Supprimer la grille « ${item.title} » ?\n\nLes traces déjà enregistrées avec cette grille seront conservées.`)) return;
      subData.customRubrics = (subData.customRubrics || []).filter(rubric => rubric.id !== item.id);
      if (subData.currentObsSession.selectedCustomRubricId === item.id) {
        subData.currentObsSession.selectedCustomRubricId = null;
      }
      closeCustomRubricEditor();
      scheduleAppStateSave();
      renderQuickObsView();
      showToast('Grille personnelle supprimée de la bibliothèque. Les traces existantes sont conservées.');
    }

    function renderObservationMatrixHeader(obsMode, customRubric) {
      const matrixHead = document.getElementById('sgMatrixHead');
      if (!matrixHead) return [];
      const activeLevels = obsMode === 'custom' && customRubric
        ? customRubric.levels
        : [
            { key: 'A', name: 'Niveau A', percentLabel: '90–100 %' },
            { key: 'B', name: 'Niveau B', percentLabel: '75–85 %' },
            { key: 'C', name: 'Niveau C', percentLabel: '60–70 %' },
            { key: 'D', name: 'Niveau D', percentLabel: '50–55 %' },
            { key: 'E', name: 'Niveau E', percentLabel: '≤ 40 %' }
          ];
      const headRow = document.createElement('tr');
      headRow.className = 'bg-slate-100 text-slate-800 text-[11px]';
      const criterionHead = document.createElement('th');
      criterionHead.className = 'p-2 border border-slate-200 w-[15%] font-bold text-left';
      criterionHead.innerHTML = 'Critère observé<br>(1 choix / rangée)';
      headRow.appendChild(criterionHead);
      activeLevels.forEach(level => {
        const th = document.createElement('th');
        th.className = `p-2 border border-slate-200 text-center rubric-col-${level.key}`;
        if (obsMode !== 'custom') th.classList.add('w-[17%]');
        else th.style.width = `${85 / activeLevels.length}%`;
        const name = document.createElement('div');
        name.className = 'font-extrabold';
        name.textContent = level.name;
        const percent = document.createElement('div');
        percent.className = 'mt-1 text-[10px] font-semibold';
        percent.textContent = obsMode === 'custom' ? `${formatScoreNumber(level.percent)} %` : level.percentLabel;
        th.append(name, percent);
        headRow.appendChild(th);
      });
      matrixHead.replaceChildren(headRow);
      return activeLevels;
    }

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
          wrap.className = 'qo-target-wrap inline-flex items-center gap-1 px-2.5 py-1 rounded-xl border border-slate-200 bg-white shadow-2xs flex-wrap';
          const lbl = document.createElement('span');
          lbl.className = 'text-[11px] font-bold text-slate-700 mr-1';
          lbl.textContent = 'Niveaux visés :';
          wrap.appendChild(lbl);

          const isAll = !Array.isArray(session.targetLevels) || session.targetLevels.length === 0;
          const applyTargetLevels = (nextLevels) => {
            session.targetLevels = nextLevels;
            if (appState.selectedStudentId) {
              const curSt = appState.students.find(s => s.id === appState.selectedStudentId);
              if (curSt && !isAssignmentForStudent(session, curSt)) {
                appState.selectedStudentId = null;
              }
            }
            scheduleAppStateSave();
            renderQuickObsView();
          };

          const allBtn = document.createElement('button');
          allBtn.type = 'button';
          allBtn.setAttribute('aria-pressed', String(isAll));
          allBtn.className = `qo-target-btn inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-bold transition cursor-pointer ${
            isAll
              ? 'is-active bg-indigo-600 border-indigo-600 text-white shadow-2xs'
              : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
          }`;
          allBtn.textContent = 'Tous';
          allBtn.addEventListener('click', () => applyTargetLevels([]));
          wrap.appendChild(allBtn);

          presentLevels.forEach(lvl => {
            const isSelected = !isAll && session.targetLevels.includes(lvl);
            const lvlBtn = document.createElement('button');
            lvlBtn.type = 'button';
            lvlBtn.setAttribute('aria-pressed', String(isSelected));
            lvlBtn.className = `qo-target-btn inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-bold transition cursor-pointer ${
              isSelected
                ? 'is-active bg-indigo-600 border-indigo-600 text-white shadow-2xs'
                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
            }`;
            lvlBtn.textContent = GRADE_LEVEL_LABELS[lvl] || lvl;
            lvlBtn.addEventListener('click', () => {
              // Switcher directement au niveau cliqué (ex. 5e -> 6e passe bien à 6e, jamais à « Tous »)
              if (isSelected && session.targetLevels.length === 1) {
                applyTargetLevels([]);
              } else {
                applyTargetLevels([lvl]);
              }
            });
            wrap.appendChild(lvlBtn);
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

      // Sélecteur de format d'outil (Modes 1, 2 et 3)
      const canUseWeighted = isWeightedRubricAvailableForSubject(sub);
      const effectiveObsMode = getEffectiveSessionObsMode(session, sub);
      session.obsMode = effectiveObsMode;

      const repStudent = st || targetedStudents.find(s => getStudentCycle(getEffectiveGradeLevel(s, sub))) || targetedStudents[0] || null;
      const repGradeLevel = st && draft && draft.gradeLevel
        ? draft.gradeLevel
        : repStudent
          ? getEffectiveGradeLevel(repStudent, sub)
          : '4';
      const repCycle = getStudentCycle(repGradeLevel) || 2;
      const repCriteria = criteria.length ? criteria : getObservationCriteria(sub, repGradeLevel, session);
      const repScoredCriteria = getScoredObservableCriteria(repCriteria);
      const activeCustomRubric = effectiveObsMode === 'custom'
        ? normalizeCustomRubric(session.customRubric, true)
        : null;
      const activeWeightsMap = effectiveObsMode === 'custom' && activeCustomRubric
        ? Object.fromEntries(activeCustomRubric.criteria.map(criterion => [criterion.id, criterion.weight]))
        : canUseWeighted
          ? getEffectiveCriteriaWeights(sub.id, repCycle, repScoredCriteria, session.criteriaWeights)
          : {};
      if (effectiveObsMode === 'weighted' && !session.criteriaWeights) {
        session.criteriaWeights = { ...activeWeightsMap };
      }

      const toolModeBar = document.getElementById('qoToolModeBar');
      const modeSegment = document.getElementById('qoModeSegment');
      const modeSubtitle = document.getElementById('qoModeSubtitle');
      const inspirationCaption = document.getElementById('qoInspirationCaption');
      if (toolModeBar) toolModeBar.classList.remove('hidden');
      if (modeSegment) {
        modeSegment.innerHTML = '';
        const modeOptions = [
          {
            id: 'portrait',
            label: 'Grille d’appréciation',
            hint: 'Portrait global par tendance centrale (A à E) sur les critères du cycle'
          },
          ...(canUseWeighted ? [{
            id: 'weighted',
            label: 'Grille pondérée',
            hint: sub.id === 'fra_ecriture' && repCycle === 1
              ? 'Pondération analytique locale par critère (/100) pour le 1er cycle'
              : 'Pondération analytique par critère (/100) selon les barèmes ministériels'
          }] : [])
        ];
        modeOptions.forEach(opt => {
          const isAct = effectiveObsMode === opt.id;
          const mBtn = document.createElement('button');
          mBtn.type = 'button';
          mBtn.setAttribute('aria-pressed', String(isAct));
          mBtn.title = opt.hint;
          mBtn.className = isAct
            ? 'px-2.5 py-1 rounded-md text-xs font-bold bg-indigo-600 text-white shadow-2xs transition cursor-pointer'
            : 'qo-mode-choice px-2.5 py-1 rounded-md text-xs font-semibold text-slate-700 hover:bg-slate-100 transition cursor-pointer';
          mBtn.textContent = opt.label;
          mBtn.addEventListener('click', () => {
            if (session.obsMode === opt.id) return;
            session.obsMode = opt.id;
            session.selectedCustomRubricId = null;
            if (opt.id === 'weighted' && !session.criteriaWeights) {
              session.criteriaWeights = getEffectiveCriteriaWeights(sub.id, repCycle, repScoredCriteria, null);
              session.usingPersoPreset = false;
            }
            scheduleAppStateSave();
            renderQuickObsView();
          });
          modeSegment.appendChild(mBtn);
        });
        const personalRubrics = Array.isArray(subData.customRubrics) ? subData.customRubrics : [];
        personalRubrics.forEach(item => {
          const isActive = effectiveObsMode === 'custom' && session.selectedCustomRubricId === item.id;
          const wrap = document.createElement('div');
          wrap.className = 'qo-personal-rubric-wrap';
          const selectButton = document.createElement('button');
          selectButton.type = 'button';
          selectButton.className = `qo-mode-choice qo-personal-rubric-button${isActive ? ' is-active' : ''}`;
          selectButton.setAttribute('aria-pressed', String(isActive));
          selectButton.setAttribute('aria-label', `Sélectionner la grille personnelle ${item.title}`);
          selectButton.title = item.title;
          selectButton.textContent = item.title;
          selectButton.addEventListener('click', () => {
            session.obsMode = 'custom';
            session.selectedCustomRubricId = item.id;
            session.customRubric = cloneCustomRubric(item.customRubric);
            session.criteriaWeights = null;
            session.studentDrafts = session.studentDrafts || {};
            Object.values(session.studentDrafts).forEach(draft => {
              const validLevelKeys = new Set(item.customRubric.levels.map(level => level.key));
              draft.checked = (draft.checked || []).filter(key => {
                const parts = key.split('_');
                const family = parts[parts.length - 2];
                const criterionId = parts.slice(0, -2).join('_');
                return validLevelKeys.has(family) && item.customRubric.criteria.some(criterion => criterion.id === criterionId);
              });
              draft.overrideCode = null;
            });
            scheduleAppStateSave();
            renderQuickObsView();
          });
          const editButton = document.createElement('button');
          editButton.type = 'button';
          editButton.className = 'qo-personal-rubric-edit';
          editButton.setAttribute('aria-label', `Modifier la grille personnelle ${item.title}`);
          editButton.title = `Modifier « ${item.title} »`;
          editButton.textContent = '✎';
          editButton.addEventListener('click', () => openCustomRubricEditor(editButton, item.id));
          wrap.append(selectButton, editButton);
          modeSegment.appendChild(wrap);
        });
        const customAction = document.createElement('button');
        customAction.type = 'button';
        customAction.id = 'btnOpenCustomRubric';
        customAction.className = 'qo-custom-rubric-action';
        customAction.setAttribute('aria-label', 'Créer une grille personnelle');
        customAction.textContent = '+ Créer une grille';
        customAction.addEventListener('click', () => openCustomRubricEditor(customAction));
        modeSegment.appendChild(customAction);
      }
      if (modeSubtitle) {
        modeSubtitle.textContent = effectiveObsMode === 'weighted'
          ? ''
          : effectiveObsMode === 'custom'
            ? `${activeCustomRubric ? activeCustomRubric.title : 'Grille personnelle'} · pondération et descripteurs personnalisés.`
            : 'Portrait descriptif par critère (1 choix par rangée).';
      }
      if (inspirationCaption) {
        inspirationCaption.textContent = effectiveObsMode === 'weighted'
          ? (sub.id === 'fra_ecriture' && repCycle === 1
            ? 'Grille analytique locale pondérée pour les critères d’écriture du 1er cycle.'
            : 'Grille analytique pondérée selon les barèmes ministériels pour cette compétence.')
          : effectiveObsMode === 'custom'
            ? 'Grille personnelle enregistrée dans cette trace et dans le carnet.'
            : 'Grille locale inspirée des cadres MEQ conçue pour évaluer les apprentissages selon les attentes et le contexte.';
      }
      renderObservationMatrixHeader(effectiveObsMode, activeCustomRubric);

      // Bandeau de configuration des pondérations MEQ & Variante personnelle (Mode 2 uniquement)
      const weightPresetBar = document.getElementById('qoWeightPresetBar');
      if (weightPresetBar) {
        const showWeightBar = effectiveObsMode === 'weighted' && canUseWeighted && repScoredCriteria.length > 0;
        weightPresetBar.classList.toggle('hidden', !showWeightBar);
        weightPresetBar.innerHTML = '';
        if (showWeightBar) {
          const presets = getOfficialWeightPresets(sub.id, repCycle, repScoredCriteria);
          const savedPerso = typeof getCustomWeightedPreset === 'function'
            ? getCustomWeightedPreset(sub.id, repCycle, repScoredCriteria)
            : null;
          const matchingOfficial = presets.find(preset => repScoredCriteria.every(c =>
            Math.abs(Number(activeWeightsMap[c.id] || 0) - Number(preset.weights[c.id] || 0)) < 0.05
          ));
          const isPersoActive = Boolean(session.usingPersoPreset) || !matchingOfficial;

          const topRow = document.createElement('div');
          topRow.className = 'flex flex-wrap items-center justify-between gap-2';

          const presetLeft = document.createElement('div');
          presetLeft.className = 'flex flex-wrap items-center gap-1.5';
          const presetTitle = document.createElement('span');
          presetTitle.className = 'text-[11px] font-bold uppercase tracking-wider text-slate-700 mr-1';
          presetTitle.textContent = 'Barèmes :';
          presetLeft.appendChild(presetTitle);

          presets.forEach(preset => {
            const isMatchingPreset = !isPersoActive && matchingOfficial && matchingOfficial.id === preset.id;
            const pBtn = document.createElement('button');
            pBtn.type = 'button';
            pBtn.setAttribute('aria-pressed', String(isMatchingPreset));
            pBtn.title = preset.hint || preset.label;
            pBtn.className = isMatchingPreset
              ? 'px-2.5 py-1 rounded-lg text-[11px] font-bold bg-indigo-600 text-white shadow-2xs cursor-pointer transition'
              : 'px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 cursor-pointer transition';
            pBtn.textContent = preset.label;
            pBtn.addEventListener('click', () => {
              session.usingPersoPreset = false;
              session.criteriaWeights = { ...preset.weights };
              scheduleAppStateSave();
              renderQuickObsView();
            });
            presetLeft.appendChild(pBtn);
          });

          const persoBtn = document.createElement('button');
          persoBtn.type = 'button';
          persoBtn.id = 'btnQoPersoPreset';
          persoBtn.setAttribute('aria-pressed', String(isPersoActive));
          const persoNumbers = savedPerso
            ? ` (${repScoredCriteria.map(c => savedPerso[c.id]).join(' / ')})`
            : '';
          persoBtn.textContent = `Variante personnelle${persoNumbers}`;
          persoBtn.title = savedPerso
            ? 'Appliquer votre variante personnelle sauvegardée ou ajuster vos pourcentages'
            : 'Entrer vos propres pourcentages pour cette compétence';
          persoBtn.className = isPersoActive
            ? 'px-2.5 py-1 rounded-lg text-[11px] font-bold bg-indigo-600 text-white shadow-2xs cursor-pointer transition'
            : 'px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 cursor-pointer transition';
          persoBtn.addEventListener('click', () => {
            session.usingPersoPreset = true;
            if (savedPerso) {
              session.criteriaWeights = { ...savedPerso };
            } else {
              session.criteriaWeights = { ...activeWeightsMap };
            }
            scheduleAppStateSave();
            renderQuickObsView();
            if (!savedPerso) {
              const firstInp = weightPresetBar.querySelector('input[data-qo-crit-weight]');
              if (firstInp) {
                firstInp.focus();
                firstInp.select();
              }
            }
          });
          presetLeft.appendChild(persoBtn);
          topRow.appendChild(presetLeft);

          const totalWeightVal = Math.round(repScoredCriteria.reduce((acc, c) => acc + Number(activeWeightsMap[c.id] || 0), 0));
          const isTotal100 = totalWeightVal === 100;
          const totalWrap = document.createElement('div');
          totalWrap.className = 'flex items-center gap-2';
          const totalBadge = document.createElement('span');
          totalBadge.id = 'qoWeightTotalBadge';
          totalBadge.className = isTotal100
            ? 'qo-weight-total is-ok is-valid px-2 py-0.5 rounded-md text-[11px] font-extrabold border'
            : 'qo-weight-total is-warn is-invalid px-2 py-0.5 rounded-md text-[11px] font-extrabold border';
          totalBadge.textContent = `Total : ${totalWeightVal} %`;
          totalWrap.appendChild(totalBadge);
          if (!isTotal100 && presets.length > 0) {
            const resetBtn = document.createElement('button');
            resetBtn.type = 'button';
            resetBtn.className = 'text-[11px] font-bold text-indigo-700 hover:underline cursor-pointer';
            resetBtn.textContent = 'Rétablir 100 % (MEQ)';
            resetBtn.addEventListener('click', () => {
              session.usingPersoPreset = false;
              session.criteriaWeights = { ...presets[0].weights };
              scheduleAppStateSave();
              renderQuickObsView();
            });
            totalWrap.appendChild(resetBtn);
          }
          topRow.appendChild(totalWrap);
          weightPresetBar.appendChild(topRow);

          // Deuxième ligne : saisie personnelle des pourcentages + icône de sauvegarde
          const critRow = document.createElement('div');
          critRow.className = 'flex flex-wrap items-center gap-2 pt-1.5 border-t border-slate-200/80';
          const inputRefs = [];
          const readLiveWeights = () => {
            const nextMap = {};
            let sum = 0;
            inputRefs.forEach(({ crit, inp }) => {
              const rawNum = Number(String(inp.value || '').replace(',', '.'));
              const val = Number.isFinite(rawNum) && rawNum >= 0 && rawNum <= 100
                ? Math.round(rawNum)
                : Math.round(Number(activeWeightsMap[crit.id] || 0));
              nextMap[crit.id] = val;
              sum += val;
            });
            return { nextMap, sum: Math.round(sum) };
          };

          repScoredCriteria.forEach(crit => {
            const shortCritTitle = crit.title.replace(/^\d+\.\s*/, '').split('(')[0].trim();
            const itemWrap = document.createElement('label');
            itemWrap.className = 'qo-crit-weight-item inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white border border-slate-200 text-[11px] font-semibold text-slate-700';
            const spanLbl = document.createElement('span');
            spanLbl.className = 'truncate max-w-[165px]';
            spanLbl.textContent = shortCritTitle;
            spanLbl.title = crit.title;
            const inp = document.createElement('input');
            inp.type = 'number';
            inp.min = '0';
            inp.max = '100';
            inp.step = '1';
            inp.setAttribute('data-qo-crit-weight', crit.id);
            inp.value = String(Math.round(Number(activeWeightsMap[crit.id] ?? 0)));
            inp.className = 'w-12 px-1 py-0.5 text-center rounded border border-slate-300 text-[11px] font-extrabold text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500';
            inp.addEventListener('input', () => {
              const { sum } = readLiveWeights();
              const okNow = sum === 100;
              totalBadge.textContent = `Total : ${sum} %`;
              totalBadge.className = okNow
                ? 'qo-weight-total is-ok is-valid px-2 py-0.5 rounded-md text-[11px] font-extrabold border'
                : 'qo-weight-total is-warn is-invalid px-2 py-0.5 rounded-md text-[11px] font-extrabold border';
            });
            inp.addEventListener('change', () => {
              const num = Number(String(inp.value || '').replace(',', '.'));
              if (!Number.isFinite(num) || num < 0 || num > 100) {
                inp.value = String(Math.round(Number(activeWeightsMap[crit.id] ?? 0)));
                return;
              }
              session.usingPersoPreset = true;
              session.criteriaWeights = { ...activeWeightsMap, [crit.id]: Math.round(num) };
              renderQuickObsView();
            });
            const pctSign = document.createElement('span');
            pctSign.className = 'text-[10px] font-bold text-slate-500';
            pctSign.textContent = '%';
            itemWrap.append(spanLbl, inp, pctSign);
            critRow.appendChild(itemWrap);
            inputRefs.push({ crit, inp });
          });

          const savePersoBtn = document.createElement('button');
          savePersoBtn.type = 'button';
          savePersoBtn.id = 'btnQoSavePersoPreset';
          savePersoBtn.title = 'Sauvegarder ces pourcentages dans « Variante personnelle »';
          savePersoBtn.setAttribute('aria-label', 'Sauvegarder ma variante personnelle');
          savePersoBtn.className = 'qo-save-perso-btn inline-flex items-center justify-center w-8 h-8 rounded-lg border border-slate-300 bg-white hover:bg-indigo-50 text-slate-700 cursor-pointer transition';
          savePersoBtn.innerHTML = '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>';
          savePersoBtn.addEventListener('click', () => {
            const { nextMap, sum } = readLiveWeights();
            if (sum !== 100) {
              showToast(`Le total actuel est de ${sum} %. Ajustez vos pourcentages pour atteindre 100 % avant de sauvegarder.`);
              return;
            }
            session.usingPersoPreset = true;
            session.criteriaWeights = { ...nextMap };
            if (typeof saveCustomWeightedPreset === 'function') {
              saveCustomWeightedPreset(sub.id, repCycle, nextMap, repScoredCriteria);
            }
            showToast('Variante personnelle sauvegardée !');
            renderQuickObsView();
          });
          critRow.appendChild(savePersoBtn);

          weightPresetBar.appendChild(critRow);
        }
      }

      document.getElementById('qoSubjectBadge').textContent = `${sub.fullName} • Étape ${appState.activeTerm}`;
      const isModSub = st ? isSubjectModifiedForStudent(st, sub) : false;
      document.getElementById('sgCurrentStudentName').textContent = st
        ? `${st.name} — ${GRADE_LEVEL_LABELS[draft.gradeLevel] || 'niveau à choisir'}${cycle ? ` (${CYCLE_LABELS[cycle]})` : ''}${isModSub ? ` [Bulletin modifié · inscrit en ${GRADE_LEVEL_LABELS[st.gradeLevel] || '—'}]` : ''}`
        : 'Sélectionner un nom';
      document.getElementById('qoBottomStudentName').textContent = st ? st.name : 'Sélectionner un nom';
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
        ? getVisibleSubjectsForContext(SUBJECTS_CONFIG).filter(s => s.group === sub.group && s.id !== sub.id) : [];
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
        label.append(cb, document.createTextNode(getSubjectContextDisplay(s).partLabel));
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
        const stuLvl = getObservationDraftGradeLevel(d, student, session);
        const studentCriteria = getObservationCriteria(sub, stuLvl, session);
        const r = computeObservableResult(d.checked, d.overrideCode, studentCriteria, d.notEvaluated, buildStudentObsOptions(session, sub, stuLvl));
        if (r.hasFinalGrade || r.isNotEvaluated) evaluatedCount++;
        else if (r.hasData) partialCount++;
        else if (r.hasEvidence || hasObservationFeedback(d)) feedbackCount++;
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
        const stuLvl = getObservationDraftGradeLevel(d, student, session);
        const studentCriteria = getObservationCriteria(sub, stuLvl, session);
        const stuRes = computeObservableResult(d.checked, d.overrideCode, studentCriteria, d.notEvaluated, buildStudentObsOptions(session, sub, stuLvl));
        const isSel = Boolean(st && student.id === st.id);
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.setAttribute('aria-pressed', String(isSel));
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
            : stuRes.hasEvidence || hasObservationFeedback(d)
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

      const liveBadgeEmpty = document.getElementById('qoSideLiveBadge');
      const resetOverrideBtnEmpty = document.getElementById('btnQoResetOverride');
      if (liveBadgeEmpty) {
        liveBadgeEmpty.classList.add('hidden');
        liveBadgeEmpty.textContent = '';
      }
      if (resetOverrideBtnEmpty) resetOverrideBtnEmpty.classList.add('hidden');

      if (!st) {
        document.getElementById('sgMajorityExplanation').textContent = 'Sélectionner un nom ci-dessus pour remplir la grille d’évaluation.';
        document.getElementById('sgMatrixBody').innerHTML =
          `<tr><td colspan="${(activeCustomRubric ? activeCustomRubric.levels.length : 5) + 1}" class="p-6 text-center text-sm font-semibold text-slate-600 bg-slate-50">Sélectionner un nom ci-dessus pour afficher et remplir la grille d’évaluation de l’élève.</td></tr>`;
        const selCountElEmpty = document.getElementById('qoSelectedTagsCount');
        if (selCountElEmpty) selCountElEmpty.textContent = '0 sélectionné(s)';
        const catTabsEmpty = document.getElementById('qoCategoryTabs');
        if (catTabsEmpty) catTabsEmpty.innerHTML = '';
        document.getElementById('qoQuickTags').innerHTML =
          '<div class="text-xs text-slate-500">Sélectionner un nom pour cocher des observations.</div>';
        document.getElementById('qoActiveStudentTagsStrip').innerHTML = '';
        document.getElementById('qoPreviousWritten').classList.add('hidden');
        ['qoCommentInput', 'qoStrengthsInput', 'qoChallengesInput'].forEach(id => {
          const input = document.getElementById(id);
          input.value = '';
          input.disabled = true;
        });
        return;
      }

      // 2. Compute the current student's live mark from the selected rubric statements
      const studentObsOptions = buildStudentObsOptions(session, sub, draft.gradeLevel);
      const res = computeObservableResult(draft.checked, draft.overrideCode, criteria, draft.notEvaluated, studentObsOptions);
      const scoredCriteria = getScoredObservableCriteria(criteria);
      const scoredCriteriaCount = scoredCriteria.length;
      const studentWeightsMap = effectiveObsMode === 'custom' && activeCustomRubric
        ? Object.fromEntries(activeCustomRubric.criteria.map(criterion => [criterion.id, criterion.weight]))
        : effectiveObsMode === 'weighted'
          ? getEffectiveCriteriaWeights(sub.id, cycle || 2, scoredCriteria, session.criteriaWeights)
          : {};
      const expEl = document.getElementById('sgMajorityExplanation');

      if (liveBadgeEmpty) {
        if (res.isNotEvaluated) {
          liveBadgeEmpty.className = 'shrink-0 px-2 py-0.5 rounded-md border text-[11px] font-extrabold whitespace-nowrap bg-slate-100 text-slate-600 border-slate-200';
          liveBadgeEmpty.textContent = 'N/A';
        } else if (res.hasFinalGrade) {
          liveBadgeEmpty.className = `shrink-0 px-2 py-0.5 rounded-md border text-[11px] font-extrabold whitespace-nowrap ${getBadgeColorClasses(res.code)}`;
          liveBadgeEmpty.textContent = `${res.code} (${res.pct}%)${draft.overrideCode ? '*' : ''}`;
        } else if (res.hasData) {
          liveBadgeEmpty.className = `shrink-0 px-2 py-0.5 rounded-md border text-[11px] font-extrabold whitespace-nowrap ${getBadgeColorClasses(res.code)}`;
          liveBadgeEmpty.textContent = `${res.total}/${scoredCriteriaCount} · ${res.code}`;
        } else {
          liveBadgeEmpty.classList.add('hidden');
          liveBadgeEmpty.textContent = '';
        }
      }
      if (resetOverrideBtnEmpty) {
        resetOverrideBtnEmpty.classList.toggle('hidden', !res.isOverride);
        resetOverrideBtnEmpty.onclick = () => {
          draft.overrideCode = null;
          scheduleAppStateSave();
          renderQuickObsView();
        };
      }

      if (res.isNotEvaluated) {
        expEl.textContent = 'N/A — élève non évalué pour cette trace. Vous pouvez encore sélectionner des critères.';
      } else if (res.hasData) {
        const weightedSummaryHtml = (['weighted', 'custom'].includes(effectiveObsMode) && res.isWeighted && res.rawWeightedPct !== null)
          ? `<span class="mr-1.5 text-indigo-300">Score analytique${res.isComplete ? '' : ' provisoire'} : <strong>${formatScoreNumber(res.earnedPointsTotal)} / ${formatScoreNumber(res.evaluatedWeightSum)} pts</strong> (${res.rawWeightedPct} % des critères cotés) ·</span>`
          : '';
        expEl.innerHTML = `
          ${weightedSummaryHtml}<strong>${res.total} / ${scoredCriteriaCount} critère(s) coté(s)</strong>
          → ${res.hasFinalGrade ? 'Cote finale :' : 'Cote provisoire :'}
          <span class="px-2 py-0.5 rounded border ${getBadgeColorClasses(res.code)} font-extrabold">${res.code} (${res.pct}%)${draft.overrideCode ? '*' : ''}</span>
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

      // 3A. Render cycle-adapted rubric table (Modes 1 & 2)
      const activeLevels = renderObservationMatrixHeader(effectiveObsMode, activeCustomRubric);
      const tbody = document.getElementById('sgMatrixBody');
      tbody.innerHTML = '';
      if (!criteria.length) {
        const tr = document.createElement('tr');
        const td = document.createElement('td');
        td.colSpan = 6;
        td.className = 'qo-unavailable-cell p-6 text-center text-sm text-amber-900 bg-amber-50';
        td.textContent = cycle
          ? CYCLE_RUBRIC_UNAVAILABLE_MESSAGES[sub.id] || 'Aucun critère n’est disponible pour ce niveau.'
          : 'Choisissez le niveau de cet élève dans la liste d’élèves pour afficher ses repères de cycle.';
        tr.appendChild(td);
        tbody.appendChild(tr);
      }

      criteria.forEach(crit => {
        const tr = document.createElement('tr');
        tr.className = crit.formativeOnly
          ? 'qo-formative-row border-b border-amber-200 bg-amber-50/40 align-top'
          : 'border-b border-slate-200 align-top';

        const tdTitle = document.createElement('td');
        tdTitle.className = crit.formativeOnly
          ? 'qo-formative-title p-2 font-bold text-amber-950 bg-amber-50/90 border border-amber-200 break-words'
          : 'qo-crit-title p-2 font-bold text-slate-900 bg-slate-50 border border-slate-200 break-words';
        const titleText = document.createElement('div');
        const isLocalFormative = LOCAL_FORMATIVE_CRITERIA.has(crit.id);
        titleText.textContent = crit.title.replace(/^\d+\.\s*/, '');
        if (isLocalFormative) titleText.textContent = titleText.textContent.replace(/\s*\(\*\)/, '');
        tdTitle.appendChild(titleText);

        const badgeWrap = document.createElement('div');
        badgeWrap.className = 'mt-1 flex flex-wrap items-center gap-1';
        const roleBadge = document.createElement('span');
        roleBadge.className = crit.formativeOnly
          ? 'qo-badge-formative inline-block max-w-full px-1.5 py-0.5 rounded text-[9px] leading-tight font-bold bg-amber-100 text-amber-900 border border-amber-300'
          : 'qo-badge-scored inline-block max-w-full px-1.5 py-0.5 rounded text-[9px] leading-tight font-semibold bg-indigo-50 text-indigo-800 border border-indigo-200';
        roleBadge.textContent = crit.formativeOnly
          ? (isLocalFormative ? 'Repère local • Non coté' : 'Formatif • Non coté')
          : 'Critère coté';
        badgeWrap.appendChild(roleBadge);

        const critWeight = (!crit.formativeOnly && ['weighted', 'custom'].includes(effectiveObsMode))
          ? Number(studentWeightsMap[crit.id] ?? 0)
          : null;
        if (critWeight !== null && critWeight > 0) {
          const wBadge = document.createElement('span');
          wBadge.className = 'qo-weight-badge inline-block px-1.5 py-0.5 rounded text-[9px] leading-tight font-extrabold';
          const earnedPts = (res.earnedPointsMap && res.earnedPointsMap[crit.id] !== undefined)
            ? `${res.earnedPointsMap[crit.id]} / ${critWeight} pts`
            : `Pond. ${critWeight} %`;
          wBadge.textContent = earnedPts;
          badgeWrap.appendChild(wBadge);
        }
        tdTitle.appendChild(badgeWrap);
        tr.appendChild(tdTitle);

        activeLevels.forEach(level => {
          const fam = level.key;
          const td = document.createElement('td');
          td.className = 'p-1.5 border border-slate-200 space-y-1';
          const statements = crit.cells[fam] || [];
          const levelPercentages = effectiveObsMode === 'custom' && activeCustomRubric
            ? Object.fromEntries(activeCustomRubric.levels.map(item => [item.key, item.percent]))
            : WEIGHTED_RUBRIC_FAMILY_PERCENTAGES;
          const cellPts = (critWeight !== null && critWeight > 0)
            ? Math.round(critWeight * levelPercentages[fam] / 100)
            : null;
          statements.forEach((stmtText, idx) => {
            const key = `${crit.id}_${fam}_${idx}`;
            const isChecked = draft.checked.includes(key);
            const itemBtn = document.createElement('button');
            itemBtn.type = 'button';
            itemBtn.dataset.rubricKey = key;
            itemBtn.setAttribute('aria-pressed', String(isChecked));
            itemBtn.className = `rubric-stmt-btn${cellPts !== null ? ' is-weighted' : ''} p-1.5 rounded-lg border text-[11px] leading-snug transition cursor-pointer ${
              isChecked
                ? `stmt-checked-${fam}`
                : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
            }`;
            if (cellPts !== null) {
              itemBtn.innerHTML = `
                <span class="flex items-center justify-between gap-1.5 w-full">
                  <span aria-hidden="true" class="rubric-stmt-check w-3.5 h-3.5 rounded-full flex-shrink-0 flex items-center justify-center border ${
                    isChecked ? 'bg-slate-900 text-white border-slate-900' : 'border-slate-300 bg-white'
                  } text-[9px] font-bold">${isChecked ? '✓' : ''}</span>
                  <span class="text-[9.5px] font-extrabold ${isChecked ? 'opacity-95' : 'text-slate-500'} shrink-0 tabular-nums leading-none">${cellPts} pts</span>
                </span>
                <span class="rubric-stmt-text w-full">${stmtText}</span>
              `;
            } else {
              itemBtn.innerHTML = `
                <span aria-hidden="true" class="rubric-stmt-check mt-0.5 w-3.5 h-3.5 rounded-full flex-shrink-0 flex items-center justify-center border ${
                  isChecked ? 'bg-slate-900 text-white border-slate-900' : 'border-slate-300 bg-white'
                } text-[9px] font-bold">${isChecked ? '✓' : ''}</span>
                <span class="rubric-stmt-text flex-1">${stmtText}</span>
              `;
            }
            itemBtn.addEventListener('click', () => {
              const hadFocus = document.activeElement === itemBtn;
              draft.notEvaluated = false;
              draft.checked = toggleSingleChoiceInRow(draft.checked, crit.id, key);
              draft.overrideCode = null;
              scheduleAppStateSave();
              renderQuickObsView();
              if (hadFocus) restoreRubricFocus(tbody, key);
            });
            td.appendChild(itemBtn);
          });
          tr.appendChild(td);
        });

        tbody.appendChild(tr);
      });

      const categories = getObservationAreasForSubject(sub);
      const domainCategory = categories.find(c => c.id === sub.id);
      if ((domainCategory && appState.tagCategorySubjectId !== sub.id) || !categories.some(c => c.id === appState.activeTagCategoryId)) {
        appState.activeTagCategoryId = (domainCategory || categories[0]).id;
      }
      appState.tagCategorySubjectId = sub.id;
      const activeCat = categories.find(c => c.id === appState.activeTagCategoryId) || categories[0];

      const catTabsEl = document.getElementById('qoCategoryTabs');
      if (catTabsEl) {
        catTabsEl.innerHTML = '';
        categories.forEach(cat => {
          const countInCat = cat.items.flat().filter(t => draft.tags.includes(t)).length;
          const isAct = cat.id === activeCat.id;
          const cBtn = document.createElement('button');
          cBtn.type = 'button';
          cBtn.title = cat.label;
          cBtn.className = 'qo-category';
          cBtn.setAttribute('aria-pressed', String(isAct));
          cBtn.innerHTML = `
            <span>${escapeHtml(cat.label)}</span>
            ${countInCat > 0 ? `<span class="qo-category-count">${countInCat}</span>` : ''}
          `;
          cBtn.addEventListener('click', () => {
            appState.activeTagCategoryId = cat.id;
            renderQuickObsView();
          });
          catTabsEl.appendChild(cBtn);
        });
      }

      const selCountEl = document.getElementById('qoSelectedTagsCount');
      const groups = groupObservationTags(draft.tags);
      if (selCountEl) selCountEl.textContent = `${groups.strengths.length} force(s) · ${groups.challenges.length} défi(s)`;

      const tagsContainer = document.getElementById('qoQuickTags');
      tagsContainer.innerHTML = '';
      ['Forces', 'Défis'].forEach((heading, side) => {
        const fieldset = document.createElement('fieldset');
        fieldset.className = 'qo-choice-column';
        const legend = document.createElement('legend');
        legend.textContent = heading;
        fieldset.appendChild(legend);
        activeCat.items.forEach(pair => {
          const tag = pair[side];
          const label = document.createElement('label');
          label.className = 'qo-choice';
          const checkbox = document.createElement('input');
          checkbox.type = 'checkbox';
          checkbox.checked = draft.tags.includes(tag);
          checkbox.addEventListener('change', () => {
            if (checkbox.checked) {
              draft.tags = draft.tags.filter(value => value !== pair[1 - side]);
              draft.tags.push(tag);
            }
            else draft.tags = draft.tags.filter(value => value !== tag);
            draft.notEvaluated = false;
            renderQuickObsView();
            const replacement = [...document.querySelectorAll('#qoQuickTags input')].find(input => input.dataset.tag === tag);
            if (replacement) replacement.focus({ preventScroll: true });
          });
          checkbox.dataset.tag = tag;
          label.append(checkbox, document.createTextNode(tag));
          fieldset.appendChild(label);
        });
        tagsContainer.appendChild(fieldset);
      });

      const activeStrip = document.getElementById('qoActiveStudentTagsStrip');
      activeStrip.innerHTML = '';
      [['Forces', groups.strengths], ['Défis', groups.challenges], ['Observations précédentes', groups.previous]].forEach(([heading, tags]) => {
        if (!tags.length) return;
        const section = document.createElement('div');
        const title = document.createElement('strong');
        title.textContent = `${heading} : `;
        section.appendChild(title);
        tags.forEach(tag => {
          const chip = document.createElement('span');
          chip.className = 'qo-selected-chip';
          chip.textContent = tag;
          const remove = document.createElement('button');
          remove.type = 'button';
          remove.textContent = '×';
          remove.setAttribute('aria-label', `Retirer : ${tag}`);
          remove.addEventListener('click', () => {
            draft.tags = draft.tags.filter(value => value !== tag);
            scheduleAppStateSave();
            renderQuickObsView();
          });
          chip.appendChild(remove);
          section.appendChild(chip);
        });
        activeStrip.appendChild(section);
      });

      const previousWritten = document.getElementById('qoPreviousWritten');
      previousWritten.classList.toggle('hidden', !(draft.strengths || draft.challenges) &&
        !previousWritten.contains(document.activeElement));
      [['qoCommentInput', 'comment'], ['qoStrengthsInput', 'strengths'], ['qoChallengesInput', 'challenges']].forEach(([id, field]) => {
        const input = document.getElementById(id);
        input.disabled = false;
        if (document.activeElement !== input) input.value = draft[field] || '';
      });

    }

    function hasObservationFeedback(draft) {
      const hasText = value => typeof value === 'string' && value.trim();
      return Boolean(hasText(draft.comment) || hasText(draft.strengths) ||
        hasText(draft.challenges) || (Array.isArray(draft.tags) && draft.tags.length));
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
      const effectiveObsMode = getEffectiveSessionObsMode(session, sub);
      if (effectiveObsMode === 'custom' && !normalizeCustomRubric(session.customRubric, true)) {
        showToast('Complétez la grille personnelle avant de l’enregistrer.');
        return;
      }
      if (effectiveObsMode === 'weighted') {
        const weights = session.criteriaWeights && typeof session.criteriaWeights === 'object'
          ? Object.values(session.criteriaWeights).map(Number)
          : [];
        const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
        if (!weights.length || weights.some(weight => !Number.isFinite(weight) || weight < 0) ||
            Math.abs(totalWeight - 100) > 0.0001) {
          showToast(`Le total des pondérations doit être exactement de 100 % (actuellement ${formatScoreNumber(totalWeight)} %).`);
          return;
        }
      }
      const savedCriteriaWeights = (effectiveObsMode === 'weighted' && session.criteriaWeights && typeof session.criteriaWeights === 'object')
        ? { ...session.criteriaWeights }
        : null;
      const savedCustomRubric = effectiveObsMode === 'custom'
        ? cloneCustomRubric(normalizeCustomRubric(session.customRubric, true))
        : null;
      let draftsWithData = 0;
      targetedStudents.forEach(st => {
        const d = session.studentDrafts[st.id];
        const stuLvl = getObservationDraftGradeLevel(d, st, session);
        const criteria = getObservationCriteria(sub, stuLvl, session);
        const r = computeObservableResult(d.checked, d.overrideCode, criteria, d.notEvaluated, buildStudentObsOptions(session, sub, stuLvl));
        if (r.hasEvidence || hasObservationFeedback(d)) draftsWithData++;
      });

      if (draftsWithData === 0) {
        showToast('Ajoutez au moins un critère ou une observation.');
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
          existingAsg.obsMode = effectiveObsMode;
          if (savedCriteriaWeights) existingAsg.criteriaWeights = { ...savedCriteriaWeights };
          else delete existingAsg.criteriaWeights;
          if (savedCustomRubric) existingAsg.customRubric = cloneCustomRubric(savedCustomRubric);
          else delete existingAsg.customRubric;
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
            rubricVersion: session.rubricVersion,
            obsMode: effectiveObsMode
          };
          if (savedCriteriaWeights) newEntry.criteriaWeights = { ...savedCriteriaWeights };
          if (savedCustomRubric) newEntry.customRubric = cloneCustomRubric(savedCustomRubric);
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
          rubricVersion: session.rubricVersion,
          obsMode: effectiveObsMode
        };
        if (savedCriteriaWeights) newEntry.criteriaWeights = { ...savedCriteriaWeights };
        if (savedCustomRubric) newEntry.customRubric = cloneCustomRubric(savedCustomRubric);
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
        const r = computeObservableResult(d.checked, d.overrideCode, criteria, d.notEvaluated, buildStudentObsOptions(session, sub, gradeLevel));

        if (rec.scoreMeta[targetAsgId] && rec.scoreMeta[targetAsgId].linkedCopy &&
            !r.hasEvidence && !hasObservationFeedback(d) && !d.notEvaluated) return;

        if (r.hasEvidence || hasObservationFeedback(d)) {
          rec.scores[targetAsgId] = r.hasFinalGrade ? r.pct : '-';
          rec.scoreMeta[targetAsgId] = {
            checked: d.checked.slice(),
            overrideCode: d.overrideCode,
            code: r.hasFinalGrade ? r.code : null,
            pct: r.hasFinalGrade ? r.pct : null,
            tags: d.tags.slice(),
            comment: d.comment,
            strengths: d.strengths || '',
            challenges: d.challenges || '',
            gradeLevel,
            isComplete: r.isComplete,
            notEvaluated: r.isNotEvaluated,
            obsMode: effectiveObsMode
          };
          if (savedCriteriaWeights) rec.scoreMeta[targetAsgId].criteriaWeights = { ...savedCriteriaWeights };
          if (savedCustomRubric) rec.scoreMeta[targetAsgId].customRubric = cloneCustomRubric(savedCustomRubric);
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
            comment: d.comment,
            strengths: d.strengths || '',
            challenges: d.challenges || ''
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
          const linkedSubObj = SUBJECTS_CONFIG.find(s => s.id === subId);
          const linkedMode = (effectiveObsMode === 'weighted' && !isWeightedRubricAvailableForSubject(linkedSubObj))
            ? 'portrait'
            : effectiveObsMode;
          const linkedAsg = { id: `obs_asg_${Date.now()}_${subId}`, title: actTitle, date: todayStr, weight: 100, isObservation: true, rubricVersion: session.rubricVersion, obsMode: linkedMode, linkId: traceLinkId, linkOrigin: false };
          if (savedCustomRubric && linkedMode === 'custom') linkedAsg.customRubric = cloneCustomRubric(savedCustomRubric);
          if (targetLevels.length) linkedAsg.targetLevels = targetLevels.slice();
          sd.assignments.push(linkedAsg);
          if (sd.equalWeights) recalculateEqualWeights(sd);
        });
        getLinkedAssignments(origAsg).forEach(({ sub: otherSubObj, subData: otherData, asg: other }) => {
          const otherSubId = otherSubObj.id;
          other.title = actTitle;
          other.obsMode = (effectiveObsMode === 'weighted' && !isWeightedRubricAvailableForSubject(otherSubObj))
            ? 'portrait'
            : effectiveObsMode;
          if (savedCustomRubric && other.obsMode === 'custom') {
            other.customRubric = cloneCustomRubric(savedCustomRubric);
          } else {
            delete other.customRubric;
          }
          if (other.obsMode === 'weighted' && session.criteriaWeights && typeof session.criteriaWeights === 'object') {
            const linkedStudent = appState.students.find(st => isAssignmentForStudent(other, st));
            const linkedLevel = linkedStudent ? getEffectiveGradeLevel(linkedStudent, otherSubObj) : (targetLevels[0] || '');
            const linkedCycle = getStudentCycle(linkedLevel) || 2;
            const linkedCriteria = getScoredObservableCriteria(getObservationCriteria(otherSubObj, linkedLevel, session));
            const linkedDefaults = getEffectiveCriteriaWeights(otherSubObj.id, linkedCycle, linkedCriteria, null);
            other.criteriaWeights = { ...linkedDefaults };
            Object.keys(linkedDefaults).forEach(criterionId => {
              if (session.criteriaWeights[criterionId] !== undefined) {
                other.criteriaWeights[criterionId] = Number(session.criteriaWeights[criterionId]);
              }
            });
          } else {
            delete other.criteriaWeights;
          }
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
                 dstMeta.comment || dstMeta.strengths || dstMeta.challenges ||
                 (Array.isArray(dstMeta.tags) && dstMeta.tags.length) || dstMeta.notEvaluated)) return;
            if ((!dstMeta || !dstMeta.linkedCopy) && dstScore !== undefined && dstScore !== '' && dstScore !== '-') return;
            const dstFlags = getCellFlags(dst, other.id);
            dst.scores[other.id] = src.scores[targetAsgId];
            if (srcMeta) {
              dst.scoreMeta[other.id] = { ...srcMeta, linkedCopy: true };
              if (other.criteriaWeights) {
                dst.scoreMeta[other.id].criteriaWeights = { ...other.criteriaWeights };
              } else {
                delete dst.scoreMeta[other.id].criteriaWeights;
              }
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
