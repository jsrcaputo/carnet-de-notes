    function getDisciplines() {
      const seen = new Map();
      ALL_SUBJECTS_CONFIG.forEach(s => {
        if (s.hiddenFromGroupSelector) return;
        const key = s.group || s.id;
        if (!seen.has(key)) {
          seen.set(key, {
            key,
            label: s.prescoOnly ? 'Préscolaire (5 compétences)' : (s.tabLabel || s.groupLabel || s.shortName),
            ids: []
          });
        }
        seen.get(key).ids.push(s.id);
      });
      return [...seen.values()];
    }

    let groupModalMode = { type: 'new', id: null };

    function openGroupModal(type, groupId) {
      groupModalMode = { type, id: groupId || null };
      const modal = document.getElementById('modalGroup');
      const group = type === 'edit' ? appState.groups.find(g => g.id === groupId) : null;
      document.getElementById('groupModalTitle').textContent = type === 'edit'
        ? 'Modifier le groupe'
        : (!hasActiveGroup() ? 'Créer votre premier groupe' : 'Nouveau groupe');
      document.getElementById('groupNameInput').value = group ? group.name : '';
      const lvlSel = document.getElementById('groupLevelSelect');
      lvlSel.value = group ? (group.level || '') : '';
      const chosen = new Set(type === 'edit' && group ? group.subjectIds : []);
      const list = document.getElementById('groupSubjectList');
      list.innerHTML = getDisciplines().map(d => `
        <label class="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
          <input type="checkbox" data-discipline="${d.key}" ${d.ids.every(id => chosen.has(id)) ? 'checked' : ''} class="h-3.5 w-3.5" aria-label="${escapeHtml(d.label)}">
          <span>${escapeHtml(d.label)}</span>
        </label>`).join('');
      const syncLevel = resetDefaults => {
        const level = lvlSel.value;
        const isP = level === 'P';
        const isAccueil = level === 'accueil';
        list.querySelectorAll('input[data-discipline]').forEach(cb => {
          const k = cb.getAttribute('data-discipline');
          if (k === 'art_plast') return;
          if (resetDefaults) {
            cb.checked = isP ? k === 'presco'
              : isAccueil ? k === 'maths'
                : k !== 'presco';
          }
          cb.disabled = isAccueil && k === 'francais';
          if (isAccueil && k === 'francais') cb.checked = false;
          if (isAccueil && k === 'maths' && !resetDefaults) cb.checked = true;
        });
        const frenchLabel = list.querySelector('[data-discipline="francais"] + span');
        if (frenchLabel) frenchLabel.textContent = isAccueil
          ? 'Français (ILSS dans Accueil)'
          : 'Français';
        let accueilHint = document.getElementById('groupAccueilHint');
        if (!accueilHint) {
          accueilHint = document.createElement('p');
          accueilHint.id = 'groupAccueilHint';
          accueilHint.className = 'mt-1.5 text-[11px] text-slate-600 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 hidden';
          accueilHint.textContent = 'Les 3 compétences ILSS (Oral, Lecture, Écriture) sont incluses automatiquement avec suivi par paliers 1–5 et cotes A–D.';
          list.after(accueilHint);
        }
        accueilHint.classList.toggle('hidden', !isAccueil);
      };
      lvlSel.onchange = () => syncLevel(true);
      syncLevel(false);
      const copyBox = document.getElementById('groupCopyBox');
      const copySel = document.getElementById('groupCopySelect');
      copyBox.classList.toggle('hidden', type !== 'new');
      copySel.replaceChildren();
      const emptyCopyOption = document.createElement('option');
      emptyCopyOption.value = '';
      emptyCopyOption.textContent = 'Aucune (liste vide)';
      copySel.appendChild(emptyCopyOption);
      appState.groups
        .filter(g => !g.placeholder)
        .forEach(g => {
          const option = document.createElement('option');
          option.value = g.id;
          option.textContent = g.name;
          copySel.appendChild(option);
        });
      copySel.value = '';
      const old = document.getElementById('btnGroupDelete');
      if (old) old.remove();
      if (type === 'edit' && appState.groups.length > 1) {
        const del = document.createElement('button');
        del.id = 'btnGroupDelete';
        del.type = 'button';
        del.className = 'mr-auto px-3 py-2 rounded-lg text-xs font-semibold bg-rose-100 hover:bg-rose-200 text-rose-900 border border-rose-200 cursor-pointer';
        del.textContent = 'Supprimer le groupe';
        let armed = false;
        del.addEventListener('click', () => {
          if (!armed) {
            armed = true;
            del.textContent = 'Confirmer : élèves et notes perdus';
            return;
          }
          closeGroupModal();
          deleteGroup(groupId);
        });
        document.getElementById('btnGroupCancel').parentElement.prepend(del);
      }
      modal.classList.remove('hidden');
      modal.classList.add('flex');
      document.getElementById('groupNameInput').focus();
    }

    function closeGroupModal() {
      const modal = document.getElementById('modalGroup');
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    }

    function saveGroupModal() {
      const name = document.getElementById('groupNameInput').value.trim();
      if (!name) { showToast('Donnez un nom au groupe.'); return; }
      const ids = [];
      document.querySelectorAll('#groupSubjectList input[data-discipline]').forEach(cb => {
        if (!cb.checked) return;
        const d = getDisciplines().find(x => x.key === cb.getAttribute('data-discipline'));
        if (d) ids.push(...d.ids);
      });
      const level = document.getElementById('groupLevelSelect').value;
      if (level === 'accueil') {
        const mathIds = getDisciplines().find(item => item.key === 'maths');
        if (mathIds) mathIds.ids.forEach(id => { if (!ids.includes(id)) ids.push(id); });
        ids.push(...ALL_SUBJECTS_CONFIG.filter(subject => subject.isIlss).map(subject => subject.id));
        const regularFrenchIds = new Set(ALL_SUBJECTS_CONFIG.filter(subject => subject.group === 'francais').map(subject => subject.id));
        for (let index = ids.length - 1; index >= 0; index--) {
          if (regularFrenchIds.has(ids[index])) ids.splice(index, 1);
        }
      }
      if (!ids.length) { showToast('Cochez au moins une matière.'); return; }
      closeGroupModal();
      if (groupModalMode.type === 'new') {
        const shouldOpenStudents = !hasActiveGroup() || appState.activeView === 'viewHome';
        if (shouldOpenStudents) appState.activeView = 'viewStudents';
        createGroup(name, ids, document.getElementById('groupCopySelect').value || null, level);
        applyPrefs();
      } else {
        const g = appState.groups.find(x => x.id === groupModalMode.id);
        if (!g) return;
        g.name = name;
        g.subjectIds = ids;
        if (level !== g.level) {
          g.level = level;
          if (level !== 'accueil' && GRADE_LEVEL_LABELS[level]) {
            const list = g.id === appState.activeGroupId ? appState.students : ((appState.groupStore[g.id] || {}).students || []);
            list.forEach(s => { s.gradeLevel = level; });
          }
        }
        if (g.id === appState.activeGroupId) {
          applyActiveSubjects(appState);
          if (!SUBJECTS_CONFIG.some(s => s.id === appState.activeSubjectId)) appState.activeSubjectId = SUBJECTS_CONFIG[0]?.id || '';
        }
        notifyUpdate('Groupe modifié');
        renderAll();
      }
    }

    function renderGroupBar() {
      const bar = document.getElementById('groupBar');
      const sel = document.getElementById('headerGroupSelect');
      const activeGroup = appState.groups.find(g => g.id === appState.activeGroupId) || {};
      const activeIsPlaceholder = !!activeGroup.placeholder;
      const managedGroups = appState.groups.filter(g => !g.placeholder);
      const heading = document.getElementById('studentPageHeading');
      if (heading) {
        heading.textContent = managedGroups.length > 1 ? 'Listes d’élèves' : 'Liste d’élèves';
      }
      const groupLabel = () => 'Groupe';
      const activeGroupLabel = document.getElementById('sidebarActiveGroup');
      if (activeGroupLabel) activeGroupLabel.textContent = activeIsPlaceholder ? '' : (activeGroup.name || '');
      if (sel) {
        const choices = appState.groups.filter(g => !g.placeholder);
        const needsChoice = activeIsPlaceholder && choices.length > 0;
        const showSelect = choices.length > 0;
        document.getElementById('sidebarGroupLabel').textContent = groupLabel(choices.length);
        const single = document.getElementById('sidebarSingleGroup');
        const hasChoice = choices.length > 0;
        single.classList.toggle('hidden', showSelect);
        single.textContent = hasChoice ? choices[0].name : 'Créer un groupe';
        single.title = hasChoice ? choices[0].name : 'Créer un nouveau groupe';
        single.classList.toggle('is-create-trigger', !hasChoice);
        single.onclick = !hasChoice ? () => openGroupModal('new') : null;
        document.querySelector('.test-group-actions').classList.toggle('hidden', showSelect);
        sel.classList.toggle('hidden', !showSelect);
        sel.replaceChildren();
        if (needsChoice) {
          const placeholder = document.createElement('option');
          placeholder.value = '';
          placeholder.textContent = 'Choisir un groupe…';
          placeholder.disabled = true;
          sel.appendChild(placeholder);
        }
        choices.forEach(g => {
          const option = document.createElement('option');
          option.value = g.id;
          option.textContent = g.name;
          sel.appendChild(option);
        });
        const addGroup = document.createElement('optgroup');
        addGroup.label = 'Ajouter';
        const addOption = document.createElement('option');
        addOption.textContent = 'Nouveau groupe';
        addOption.dataset.action = 'new';
        addGroup.appendChild(addOption);
        sel.appendChild(addGroup);
        sel.value = needsChoice ? '' : appState.activeGroupId;
      }
      if (!bar) return;
      bar.innerHTML = `<span class="text-[11px] font-bold uppercase tracking-wide text-slate-500 mr-1">${groupLabel(managedGroups.length)}</span>`;
      managedGroups.forEach(g => {
        const active = g.id === appState.activeGroupId;
        const b = document.createElement('button');
        b.type = 'button';
        b.className = active
          ? 'px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-600 text-white cursor-pointer inline-flex items-center gap-1.5'
          : 'px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer';
        b.setAttribute('aria-pressed', String(active));
        if (active) {
          const nameSpan = document.createElement('span');
          nameSpan.textContent = g.name;
          const editIcon = document.createElement('span');
          editIcon.className = 'inline-flex items-center opacity-85 shrink-0';
          editIcon.setAttribute('aria-hidden', 'true');
          editIcon.innerHTML = '<svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>';
          b.append(nameSpan, editIcon);
          b.title = 'Modifier le nom, le niveau ou les matières de ce groupe';
          b.setAttribute('aria-label', `Modifier le groupe ${g.name}`);
        } else {
          b.textContent = g.name;
          b.title = 'Passer à ce groupe';
        }
        b.addEventListener('click', () => active ? openGroupModal('edit', g.id) : switchGroup(g.id));
        bar.appendChild(b);
      });
      const addStudent = document.createElement('button');
      addStudent.id = 'btnOpenAddStudent';
      addStudent.type = 'button';
      addStudent.className = 'px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer';
      addStudent.textContent = '＋ Ajout d’élève';
      addStudent.disabled = !hasActiveGroup();
      addStudent.title = addStudent.disabled ? 'Créez d’abord un groupe' : 'Ajouter un élève';
      addStudent.addEventListener('click', () => {
        document.getElementById('addStudentForm').reset();
        document.getElementById('addStudentDialog').showModal();
      });
      bar.appendChild(addStudent);
    }

    function renderStudentsView() {
      renderGroupBar();
      const hasGroup = hasActiveGroup();
      if (!hasGroup) document.getElementById('viewStudents').classList.remove('hidden');
      const notice = document.getElementById('noGroupNotice');
      notice.classList.toggle('hidden', hasGroup);
      const activeGroup = appState.groups.find(g => g.id === appState.activeGroupId);
      notice.textContent = appState.students.length
        ? `Créez un groupe avant d’ajouter des élèves. Les élèves déjà présents seront conservés dans « ${activeGroup ? activeGroup.name : 'Mon groupe'} ».`
        : 'Pour ajouter des élèves, créez d’abord un groupe depuis « Groupe » dans le menu à gauche.';
      document.getElementById('studentListTools').hidden = !hasGroup && !appState.students.length;
      const listEl = document.getElementById('studentManagerList');
      if (!listEl) return;
      listEl.innerHTML = '';

      appState.students.forEach(st => {
        if (stFilter && !studentMatches(st, stFilter)) return;
        if (!Array.isArray(st.adaptations)) st.adaptations = [];
        const row = document.createElement('div');
        row.dataset.studentId = st.id;
        row.className = 'py-3 px-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2';
        row.addEventListener('dragover', event => {
          event.preventDefault();
          event.dataTransfer.dropEffect = 'move';
          row.classList.add('ring-2', 'ring-indigo-400');
        });
        row.addEventListener('dragleave', () => {
          row.classList.remove('ring-2', 'ring-indigo-400');
        });
        row.addEventListener('drop', event => {
          event.preventDefault();
          const draggedId = event.dataTransfer.getData('text/plain');
          const fromIndex = appState.students.findIndex(student => student.id === draggedId);
          const targetIndex = appState.students.findIndex(student => student.id === st.id);
          if (fromIndex < 0 || targetIndex < 0 || fromIndex === targetIndex) return;

          const [draggedStudent] = appState.students.splice(fromIndex, 1);
          const adjustedTargetIndex = appState.students.findIndex(student => student.id === st.id);
          const dropAfterTarget = event.clientY > row.getBoundingClientRect().top + row.offsetHeight / 2;
          appState.students.splice(adjustedTargetIndex + (dropAfterTarget ? 1 : 0), 0, draggedStudent);
          notifyUpdate('Ordre des élèves mis à jour');
          renderAll();
        });

        const left = document.createElement('div');
        left.className = 'space-y-2 flex-1';
        const profileRow = document.createElement('div');
        profileRow.className = 'flex flex-wrap items-center gap-2';
        const dragHandle = document.createElement('span');
        dragHandle.className = 'text-slate-400 font-bold select-none cursor-grab';
        dragHandle.draggable = true;
        dragHandle.textContent = '⠿';
        dragHandle.title = 'Glisser pour réorganiser les élèves';
        dragHandle.setAttribute('aria-hidden', 'true');
        dragHandle.addEventListener('dragstart', event => {
          event.dataTransfer.setData('text/plain', st.id);
          event.dataTransfer.effectAllowed = 'move';
          dragHandle.style.cursor = 'grabbing';
          row.classList.add('opacity-50');
        });
        dragHandle.addEventListener('dragend', () => {
          dragHandle.style.cursor = '';
          row.classList.remove('opacity-50');
          listEl.querySelectorAll('[data-student-id]').forEach(item => item.classList.remove('ring-2', 'ring-indigo-400'));
        });
        profileRow.appendChild(dragHandle);
        const moveControls = document.createElement('div');
        moveControls.className = 'inline-flex items-center rounded-md border border-slate-200 bg-white overflow-hidden no-print';
        const studentIndex = appState.students.findIndex(student => student.id === st.id);
        [-1, 1].forEach(direction => {
          const moveButton = document.createElement('button');
          moveButton.type = 'button';
          moveButton.className = 'px-1.5 py-0.5 text-xs font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed';
          moveButton.dataset.studentMoveId = st.id;
          moveButton.dataset.moveDirection = direction < 0 ? 'up' : 'down';
          moveButton.textContent = direction < 0 ? '↑' : '↓';
          moveButton.disabled = direction < 0 ? studentIndex === 0 : studentIndex === appState.students.length - 1;
          moveButton.setAttribute('aria-label', `${direction < 0 ? 'Monter' : 'Descendre'} ${st.name}`);
          moveButton.addEventListener('click', () => {
            const fromIndex = appState.students.findIndex(student => student.id === st.id);
            const toIndex = fromIndex + direction;
            if (fromIndex < 0 || toIndex < 0 || toIndex >= appState.students.length) return;
            [appState.students[fromIndex], appState.students[toIndex]] =
              [appState.students[toIndex], appState.students[fromIndex]];
            notifyUpdate('Ordre des élèves mis à jour');
            renderAll();
            const sameMove = [...document.querySelectorAll('[data-student-move-id]')].find(button =>
              button.dataset.studentMoveId === st.id &&
              button.dataset.moveDirection === (direction < 0 ? 'up' : 'down') &&
              !button.disabled
            );
            const alternateMove = [...document.querySelectorAll('[data-student-move-id]')].find(button =>
              button.dataset.studentMoveId === st.id && !button.disabled
            );
            (sameMove || alternateMove)?.focus({ preventScroll: true });
          });
          moveControls.appendChild(moveButton);
        });
        profileRow.appendChild(moveControls);
        const firstNameInput = document.createElement('input');
        const lastNameInput = document.createElement('input');
        firstNameInput.value = typeof st.firstName === 'string' ? st.firstName : st.name;
        lastNameInput.value = typeof st.lastName === 'string' ? st.lastName : '';
        [firstNameInput, lastNameInput].forEach((input, index) => {
          input.type = 'text';
          input.autocomplete = 'off';
          input.spellcheck = false;
          input.placeholder = index ? 'Nom de famille' : 'Prénom';
          input.setAttribute('aria-label', index ? 'Nom de famille de l’élève' : 'Prénom de l’élève');
          input.className = 'student-name-field px-2.5 py-1.5 rounded-lg border border-slate-300 text-sm font-bold';
          input.addEventListener('input', () => {
            const first = firstNameInput.value.trim();
            if (!first) return;
            st.firstName = first;
            st.lastName = lastNameInput.value.trim();
            st.name = [st.firstName, st.lastName].filter(Boolean).join(' ');
            renderGradebookView();
          });
          input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              input.blur();
            }
          });
          input.addEventListener('blur', () => {
            if (!firstNameInput.value.trim()) {
              firstNameInput.value = st.firstName || st.name;
              showToast('Le prénom de l’élève ne peut pas être vide.');
            }
          });
          profileRow.appendChild(input);
        });

        const gradeSelect = document.createElement('select');
        gradeSelect.setAttribute('aria-label', `Niveau scolaire de ${st.name}`);
        gradeSelect.className = 'px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-sm';
        const unsetOption = document.createElement('option');
        unsetOption.value = '';
        unsetOption.textContent = 'Choisir le niveau';
        gradeSelect.appendChild(unsetOption);
        const activeGroupLevel = (appState.groups.find(g => g.id === appState.activeGroupId) || {}).level;
        Object.entries(GRADE_LEVEL_LABELS).sort((a, b) => (a[0] === 'P' ? -1 : b[0] === 'P' ? 1 : 0)).forEach(([level, label]) => {
          if (activeGroupLevel === 'P' && level !== 'P' && level !== '1' && level !== st.gradeLevel) return;
          if (activeGroupLevel === 'accueil' && level === 'P' && level !== st.gradeLevel) return;
          const option = document.createElement('option');
          option.value = level;
          option.textContent = label;
          gradeSelect.appendChild(option);
        });
        gradeSelect.value = st.gradeLevel || '';
        gradeSelect.addEventListener('change', () => {
          st.gradeLevel = gradeSelect.value;
          const cycle = getStudentCycle(st.gradeLevel);
          notifyUpdate(cycle ? `Grilles adaptées au ${CYCLE_LABELS[cycle]}` : 'Niveau non défini');
          renderAll();
        });
        profileRow.appendChild(gradeSelect);
        const cycle = getStudentCycle(st.gradeLevel);
        if (cycle) {
          const cycleLabel = document.createElement('span');
          cycleLabel.className = 'text-xs text-slate-500';
          cycleLabel.textContent = CYCLE_LABELS[cycle];
          profileRow.appendChild(cycleLabel);
        }
        left.appendChild(profileRow);

        const studentUiState = renderStudentsView._state || (renderStudentsView._state = {
          modStudentId: null,
          outsideBound: false
        });
        if (!studentUiState.outsideBound) {
          studentUiState.outsideBound = true;
          document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && studentUiState.modStudentId) {
              studentUiState.modStudentId = null;
              renderStudentsView();
            }
          });
        }

        const adaptSummary = getStudentAdaptationSummary(st);
        const hasPia = Boolean(adaptSummary.hasPia);
        const hasModifiedBulletin = st.gradeLevel !== 'P' && st.adaptations.includes('Bulletin modifié');
        const isModOpen = hasModifiedBulletin && studentUiState.modStudentId === st.id;

        const actionsBar = document.createElement('div');
        actionsBar.className = 'student-options-bar flex flex-wrap items-center gap-1.5';

        const piaBtn = document.createElement('button');
        piaBtn.type = 'button';
        piaBtn.dataset.studentPiaId = st.id;
        piaBtn.className = `student-option-btn btn-student-pia${hasPia ? ' is-active' : ''}`;
        piaBtn.setAttribute('aria-pressed', String(hasPia));
        piaBtn.innerHTML = `${hasPia ? '<svg class="student-option-check" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M3.5 8.5 6.5 11.5 12.5 4.5"/></svg>' : ''}<span>Plan d’intervention</span>`;
        piaBtn.addEventListener('click', () => {
          const normalized = (st.adaptations || []).map(normalizeAdaptationLabel);
          const alreadyHas = normalized.includes('Plan d’intervention');
          if (alreadyHas) {
            st.adaptations = normalized.filter(item => item !== 'Plan d’intervention');
            notifyUpdate(`Plan d’intervention retiré pour ${st.name}`);
          } else {
            st.adaptations = [...new Set([...normalized, 'Plan d’intervention'])];
            notifyUpdate(`Plan d’intervention activé pour ${st.name}`);
          }
          renderAll();
          [...document.querySelectorAll('[data-student-pia-id]')]
            .find(button => button.dataset.studentPiaId === st.id)
            ?.focus({ preventScroll: true });
        });
        actionsBar.appendChild(piaBtn);

        if (st.gradeLevel !== 'P') {
          const modBtn = document.createElement('button');
          modBtn.type = 'button';
          modBtn.dataset.studentModId = st.id;
          modBtn.className = `student-option-btn btn-student-mod${hasModifiedBulletin ? ' is-active' : ''}${isModOpen ? ' is-open' : ''}`;
          modBtn.setAttribute('aria-pressed', String(hasModifiedBulletin));
          modBtn.setAttribute('aria-expanded', String(isModOpen));
          if (hasModifiedBulletin) modBtn.setAttribute('aria-controls', `modified-expectations-${st.id}`);
          const modCount = adaptSummary.modifiedItems.length;
          const modText = document.createElement('span');
          modText.textContent = 'Bulletin modifié';
          modBtn.appendChild(modText);
          if (hasModifiedBulletin && modCount > 0) {
            const modCnt = document.createElement('span');
            modCnt.className = 'student-option-count';
            modCnt.textContent = String(modCount);
            modBtn.appendChild(modCnt);
          }
          if (hasModifiedBulletin) {
            const chev = document.createElement('span');
            chev.className = 'student-option-caret';
            chev.setAttribute('aria-hidden', 'true');
            chev.textContent = isModOpen ? '▴' : '▾';
            modBtn.appendChild(chev);
          }
          modBtn.addEventListener('click', () => {
            if (st.adaptations.includes('Bulletin modifié')) {
              studentUiState.modStudentId = isModOpen ? null : st.id;
            } else {
              st.adaptations.push('Bulletin modifié');
              studentUiState.modStudentId = st.id;
              notifyUpdate(`Bulletin modifié activé pour ${st.name}`);
            }
            renderAll();
            [...document.querySelectorAll('[data-student-mod-id]')]
              .find(button => button.dataset.studentModId === st.id)
              ?.focus({ preventScroll: true });
          });
          actionsBar.appendChild(modBtn);
        }

        left.appendChild(actionsBar);

        // Bulletin modifié (Modification des attentes du PFEQ par matière)
        if (hasModifiedBulletin) {
          st.modifiedExpectations = (st.modifiedExpectations && typeof st.modifiedExpectations === 'object') ? st.modifiedExpectations : {};
          const modSummaryList = getStudentModifiedSummaryList(st);

          if (!isModOpen) {
            const compactStrip = document.createElement('button');
            compactStrip.type = 'button';
            compactStrip.id = `modified-expectations-${st.id}`;
            compactStrip.className = 'mod-summary-strip';
            compactStrip.title = 'Cliquer pour choisir ou modifier les matières';
            if (modSummaryList.length) {
              compactStrip.innerHTML = `${modSummaryList.map(item =>
                `<span class="mod-summary-chip"><strong>${escapeHtml(item.label)}</strong> → ${escapeHtml(item.levelLabel)}</span>`
              ).join('')}<span class="mod-summary-edit">Modifier</span>`;
            } else {
              compactStrip.innerHTML = '<span class="mod-summary-placeholder">Aucune matière sélectionnée — cliquer pour préciser</span>';
            }
            compactStrip.addEventListener('click', () => {
              studentUiState.modStudentId = st.id;
              renderStudentsView();
            });
            left.appendChild(compactStrip);
          } else {
            const modPanel = document.createElement('div');
            modPanel.id = `modified-expectations-${st.id}`;
            modPanel.className = 'mod-panel';

            const panelHead = document.createElement('div');
            panelHead.className = 'mod-panel-head';

            const headCopy = document.createElement('div');
            headCopy.className = 'mod-panel-copy';
            const headTitle = document.createElement('strong');
            headTitle.textContent = 'Attentes modifiées par matière';
            const headSub = document.createElement('span');
            headSub.textContent = st.gradeLevel
              ? `Choisissez un niveau différent du niveau régulier (${GRADE_LEVEL_LABELS[st.gradeLevel]})`
              : 'Choisissez le niveau visé pour les matières modifiées';
            headCopy.append(headTitle, headSub);

            const headActions = document.createElement('div');
            headActions.className = 'mod-panel-actions';

            const removeMod = document.createElement('button');
            removeMod.type = 'button';
            removeMod.className = 'mod-panel-remove';
            removeMod.textContent = 'Désactiver';
            removeMod.setAttribute('aria-label', `Retirer le bulletin modifié de ${st.name}`);
            removeMod.addEventListener('click', () => {
              if (removeMod.dataset.confirm !== 'yes') {
                removeMod.dataset.confirm = 'yes';
                removeMod.textContent = 'Confirmer ?';
                setTimeout(() => {
                  if (!removeMod.isConnected) return;
                  delete removeMod.dataset.confirm;
                  removeMod.textContent = 'Désactiver';
                }, 4000);
                return;
              }
              st.adaptations = st.adaptations.filter(adaptation => adaptation !== 'Bulletin modifié');
              st.modifiedExpectations = {};
              studentUiState.modStudentId = null;
              notifyUpdate(`Bulletin modifié retiré pour ${st.name}`);
              renderAll();
              [...document.querySelectorAll('[data-student-mod-id]')]
                .find(button => button.dataset.studentModId === st.id)
                ?.focus({ preventScroll: true });
            });

            const closeModBtn = document.createElement('button');
            closeModBtn.type = 'button';
            closeModBtn.className = 'mod-panel-close';
            closeModBtn.textContent = 'Fermer';
            closeModBtn.addEventListener('click', () => {
              studentUiState.modStudentId = null;
              renderStudentsView();
            });

            headActions.append(removeMod, closeModBtn);
            panelHead.append(headCopy, headActions);
            modPanel.appendChild(panelHead);

            const modGrid = document.createElement('div');
            modGrid.className = 'mod-subject-grid';

            const modTargets = [];
            const seenGroups = new Set();
            getVisibleSubjectsForContext(SUBJECTS_CONFIG).forEach(s => {
              if (s.prescoOnly || s.isIlss) return;
              if (s.group && s.singleResult) {
                if (seenGroups.has(s.group)) return;
                seenGroups.add(s.group);
                modTargets.push({ key: s.group, label: s.groupLabel || s.bulletinLabel || s.shortName });
              } else {
                modTargets.push({ key: s.id, label: s.shortName });
              }
            });

            modTargets.forEach(target => {
              const itemWrap = document.createElement('label');
              itemWrap.className = 'mod-subject-row';
              const lbl = document.createElement('span');
              lbl.className = 'mod-subject-label';
              lbl.textContent = target.label;
              const sel = document.createElement('select');
              sel.className = 'mod-subject-select';
              const optReg = document.createElement('option');
              optReg.value = '';
              optReg.textContent = 'Régulier';
              sel.appendChild(optReg);
              ['1', '2', '3', '4', '5', '6'].forEach(lvl => {
                if (lvl === String(st.gradeLevel)) return;
                const opt = document.createElement('option');
                opt.value = lvl;
                opt.textContent = GRADE_LEVEL_LABELS[lvl];
                sel.appendChild(opt);
              });
              const currentVal = st.modifiedExpectations[target.key] && st.modifiedExpectations[target.key] !== String(st.gradeLevel)
                ? String(st.modifiedExpectations[target.key])
                : '';
              sel.value = currentVal;
              if (currentVal) itemWrap.classList.add('is-modified');
              sel.addEventListener('change', () => {
                if (!sel.value || sel.value === String(st.gradeLevel)) {
                  delete st.modifiedExpectations[target.key];
                } else {
                  st.modifiedExpectations[target.key] = sel.value;
                }
                studentUiState.modStudentId = st.id;
                notifyUpdate(`Attentes mises à jour pour ${st.name} (${target.label})`);
                renderAll();
              });
              itemWrap.append(lbl, sel);
              modGrid.appendChild(itemWrap);
            });

            modPanel.appendChild(modGrid);
            left.appendChild(modPanel);
          }
        }

        row.appendChild(left);

        const delBtn = document.createElement('button');
        delBtn.type = 'button';
        delBtn.className = 'student-remove px-1 py-0.5 text-xs font-medium cursor-pointer self-start sm:self-center';
        delBtn.textContent = 'Retirer';
        delBtn.addEventListener('click', () => {
          if (delBtn.getAttribute("data-confirm") !== "yes") {
            delBtn.setAttribute("data-confirm", "yes");
            delBtn.textContent = "Confirmer ?";
            delBtn.className = "student-remove px-1 py-0.5 text-xs font-bold cursor-pointer self-start sm:self-center";
            setTimeout(() => {
              if (delBtn.isConnected) {
                delBtn.removeAttribute("data-confirm");
                delBtn.textContent = "Retirer";
                delBtn.className = "student-remove px-1 py-0.5 text-xs font-medium cursor-pointer self-start sm:self-center";
              }
            }, 3000);
            return;
          }
          appState.students = appState.students.filter(s => s.id !== st.id);
          if (appState.selectedStudentId === st.id) {
            appState.selectedStudentId = null;
          }
          Object.values(appState.terms).forEach(term => {
            SUBJECTS_CONFIG.forEach(sub => {
              const subData = term.subjectData[sub.id];
              delete subData.studentRecords[st.id];
              if (subData.currentObsSession) delete subData.currentObsSession.studentDrafts[st.id];
            });
            term.observations = term.observations.filter(observation => observation.studentId !== st.id);
          });
          notifyUpdate('Élève retiré');
          renderAll();
        });
        row.appendChild(delBtn);

        listEl.appendChild(row);
      });
    }


    // -------------------------------------------------------------------------
    // VIEW 5: Bulletin global
    // -------------------------------------------------------------------------
