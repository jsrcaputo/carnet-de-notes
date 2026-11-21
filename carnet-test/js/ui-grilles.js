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

