    function getDisciplines() {
      const seen = new Map();
      ALL_SUBJECTS_CONFIG.forEach(s => {
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
      document.getElementById('groupModalTitle').textContent = type === 'edit' ? 'Modifier le groupe' : 'Nouveau groupe';
      document.getElementById('groupNameInput').value = group ? group.name : '';
      const lvlSel = document.getElementById('groupLevelSelect');
      lvlSel.value = group ? (group.level || '') : '';
      const chosen = new Set(type === 'edit' && group ? group.subjectIds : []);
      const list = document.getElementById('groupSubjectList');
      list.innerHTML = getDisciplines().map(d => `
        <label class="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
          <input type="checkbox" data-discipline="${d.key}" ${d.ids.every(id => chosen.has(id)) ? 'checked' : ''} class="h-3.5 w-3.5">
          <span>${escapeHtml(d.label)}</span>
        </label>`).join('');
      lvlSel.onchange = () => {
        if (type === 'new' || returnToWelcomeAfterGroup) return;
        const isP = lvlSel.value === 'P';
        list.querySelectorAll('input[data-discipline]').forEach(cb => {
          const k = cb.getAttribute('data-discipline');
          if (k === 'art_plast') return;
          cb.checked = isP ? k === 'presco' : k !== 'presco';
        });
      };
      const copyBox = document.getElementById('groupCopyBox');
      const copySel = document.getElementById('groupCopySelect');
      copyBox.classList.toggle('hidden', type !== 'new');
      copySel.innerHTML = '<option value="">Aucune (liste vide)</option>' + appState.groups.filter(g => !g.placeholder && (returnToWelcomeAfterGroup || !isExampleGroup(g)))
        .map(g => `<option value="${g.id}">${escapeHtml(g.name)}</option>`).join('');
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
          returnToWelcomeAfterGroup = false;
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
      if (!ids.length) { showToast('Cochez au moins une matière.'); return; }
      closeGroupModal();
      returnToWelcomeAfterGroup = false;
      const level = document.getElementById('groupLevelSelect').value;
      if (groupModalMode.type === 'new') {
        createGroup(name, ids, document.getElementById('groupCopySelect').value || null, level);
      } else {
        const g = appState.groups.find(x => x.id === groupModalMode.id);
        if (!g) return;
        g.name = name;
        g.subjectIds = ids;
        if (level !== g.level) {
          g.level = level;
          if (level) {
            const list = g.id === appState.activeGroupId ? appState.students : ((appState.groupStore[g.id] || {}).students || []);
            list.forEach(s => { s.gradeLevel = level; });
          }
        }
        if (g.id === appState.activeGroupId) {
          applyActiveSubjects(appState);
          if (!SUBJECTS_CONFIG.some(s => s.id === appState.activeSubjectId)) appState.activeSubjectId = SUBJECTS_CONFIG[0].id;
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
      const visibleGroups = appState.groups.filter(g => !g.placeholder && !isExampleGroup(g));
      const managedGroups = isExampleGroup(activeGroup)
        ? [...appState.groups.filter(g => !g.placeholder && isExampleGroup(g)), ...visibleGroups]
        : visibleGroups;
      if (sel) {
        const choices = appState.groups.filter(g => !g.placeholder && (isExampleGroup(activeGroup) || !isExampleGroup(g)));
        const needsChoice = activeIsPlaceholder && choices.length > 0;
        const showSelect = choices.length > 0;
        document.getElementById('sidebarGroupLabel').textContent = choices.length > 1 ? 'Groupes' : 'Groupe';
        const single = document.getElementById('sidebarSingleGroup');
        single.classList.toggle('hidden', showSelect);
        single.textContent = choices.length ? choices[0].name : 'Aucun groupe';
        single.title = single.textContent;
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
      bar.innerHTML = '<span class="text-[11px] font-bold uppercase tracking-wide text-slate-500 mr-1">Groupes</span>';
      managedGroups.forEach(g => {
        const active = g.id === appState.activeGroupId;
        const b = document.createElement('button');
        b.type = 'button';
        b.className = active
          ? 'px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-600 text-white cursor-pointer'
          : 'px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer';
        b.textContent = g.name;
        b.title = active ? 'Cliquer pour modifier ce groupe' : 'Passer à ce groupe';
        b.addEventListener('click', () => active ? openGroupModal('edit', g.id) : switchGroup(g.id));
        bar.appendChild(b);
      });
      const add = document.createElement('button');
      add.type = 'button';
      add.className = 'px-2.5 py-1 rounded-lg text-xs font-semibold border border-dashed border-slate-300 text-slate-600 hover:bg-slate-50 cursor-pointer';
      add.textContent = '＋ Nouveau groupe';
      add.addEventListener('click', () => openGroupModal('new'));
      bar.appendChild(add);
    }

    function renderStudentsView() {
      renderGroupBar();
      const hasGroup = hasActiveGroup();
      const notice = document.getElementById('noGroupNotice');
      notice.classList.toggle('hidden', hasGroup);
      const activeGroup = appState.groups.find(g => g.id === appState.activeGroupId);
      notice.textContent = appState.students.length
        ? `Créez un groupe avant d’ajouter des élèves. Les élèves déjà présents seront conservés dans « ${activeGroup ? activeGroup.name : 'Mon groupe'} ».`
        : 'Pour ajouter des élèves, créez d’abord un groupe avec « Nouveau groupe ».';
      document.getElementById('studentAddRow').hidden = !hasGroup;
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
        const firstNameInput = document.createElement('input');
        const lastNameInput = document.createElement('input');
        firstNameInput.value = typeof st.firstName === 'string' ? st.firstName : st.name;
        lastNameInput.value = typeof st.lastName === 'string' ? st.lastName : '';
        [firstNameInput, lastNameInput].forEach((input, index) => {
          input.type = 'text';
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

        const pillsWrap = document.createElement('div');
        pillsWrap.className = 'flex flex-wrap items-center gap-1.5';

        ADAPTATION_PRESETS.forEach(preset => {
          const hasIt = st.adaptations.includes(preset);
          const pBtn = document.createElement('button');
          pBtn.type = 'button';
          pBtn.className = hasIt
            ? 'px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-600 text-white shadow-2xs cursor-pointer transition'
            : 'px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-600 cursor-pointer transition';
          pBtn.textContent = `${hasIt ? '✓ ' : '+ '}${preset}`;
          pBtn.addEventListener('click', () => {
            const idx = st.adaptations.indexOf(preset);
            if (idx >= 0) st.adaptations.splice(idx, 1);
            else st.adaptations.push(preset);
            notifyUpdate(`Adaptations mises à jour pour ${st.name}`);
            renderAll();
          });
          pillsWrap.appendChild(pBtn);
        });

        const customInput = document.createElement('input');
        customInput.type = 'text';
        customInput.placeholder = 'Autre adaptation...';
        customInput.value = st.customAdapt || '';
        customInput.className = 'px-2 py-0.5 rounded-lg border border-slate-200 text-xs w-36';
        customInput.addEventListener('input', (e) => {
          st.customAdapt = e.target.value;
          renderGradebookView();
        });
        customInput.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            customInput.blur();
          }
        });
        pillsWrap.appendChild(customInput);

        left.appendChild(pillsWrap);

        // Option 2 — Bulletin modifié (Modification des attentes du PFEQ par matière)
        if (st.gradeLevel !== 'P' && st.adaptations.includes('Bulletin modifié')) {
          st.modifiedExpectations = (st.modifiedExpectations && typeof st.modifiedExpectations === 'object') ? st.modifiedExpectations : {};
          const modSummaryList = getStudentModifiedSummaryList(st);
          const modDetails = document.createElement('details');
          modDetails.className = 'modified-expectations mt-1 rounded-lg border border-slate-200 bg-slate-50/70 px-2.5 py-1.5 text-xs';
          const modSummary = document.createElement('summary');
          modSummary.className = 'cursor-pointer font-semibold text-slate-700 flex flex-wrap items-center justify-between gap-2 select-none';
          const summaryLeft = document.createElement('span');
          summaryLeft.className = 'inline-flex flex-wrap items-center gap-1.5';
          summaryLeft.textContent = 'Attentes modifiées par matière';
          modSummary.appendChild(summaryLeft);
          modDetails.appendChild(modSummary);

          const modStatus = document.createElement('p');
          modStatus.className = 'mt-2 text-[11px] text-slate-500';
          modStatus.textContent = modSummaryList.length
            ? modSummaryList.map(item => `${item.label} : ${item.levelLabel}`).join(' · ')
            : 'Aucune (programme régulier partout)';
          modDetails.appendChild(modStatus);

          const modGrid = document.createElement('div');
          modGrid.className = 'mt-2 pt-2 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2';

          // Liste des matières / compétences configurables pour ce groupe
          const modTargets = [];
          const seenGroups = new Set();
          SUBJECTS_CONFIG.forEach(s => {
            if (s.prescoOnly) return;
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
            itemWrap.className = 'flex items-center justify-between gap-2 bg-white px-2 py-1 rounded border border-slate-200';
            const lbl = document.createElement('span');
            lbl.className = 'text-[11px] font-semibold text-slate-700 truncate';
            lbl.textContent = target.label;
            const sel = document.createElement('select');
            sel.className = 'px-1.5 py-0.5 rounded border border-slate-300 bg-white text-[11px] font-bold text-slate-800';
            const optReg = document.createElement('option');
            optReg.value = '';
            optReg.textContent = st.gradeLevel ? `Niveau régulier (${GRADE_LEVEL_LABELS[st.gradeLevel]})` : 'Niveau régulier';
            sel.appendChild(optReg);
            ['1', '2', '3', '4', '5', '6'].forEach(lvl => {
              if (lvl === String(st.gradeLevel)) return;
              const opt = document.createElement('option');
              opt.value = lvl;
              opt.textContent = `MOD. → ${GRADE_LEVEL_LABELS[lvl]}`;
              sel.appendChild(opt);
            });
            const currentVal = st.modifiedExpectations[target.key] && st.modifiedExpectations[target.key] !== String(st.gradeLevel)
              ? String(st.modifiedExpectations[target.key])
              : '';
            sel.value = currentVal;
            if (currentVal) {
              itemWrap.classList.add('border-amber-300', 'bg-amber-50/40');
            }
            sel.addEventListener('change', () => {
              if (!sel.value || sel.value === String(st.gradeLevel)) {
                delete st.modifiedExpectations[target.key];
              } else {
                st.modifiedExpectations[target.key] = sel.value;
              }
              notifyUpdate(`Attentes mises à jour pour ${st.name} (${target.label})`);
              renderAll();
            });
            itemWrap.append(lbl, sel);
            modGrid.appendChild(itemWrap);
          });

          modDetails.appendChild(modGrid);
          left.appendChild(modDetails);
        }

        row.appendChild(left);

        const delBtn = document.createElement('button');
        delBtn.type = 'button';
        delBtn.className = 'student-remove px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer self-start sm:self-center';
        delBtn.textContent = 'Retirer';
        delBtn.addEventListener('click', () => {
          if (delBtn.getAttribute("data-confirm") !== "yes") {
            delBtn.setAttribute("data-confirm", "yes");
            delBtn.textContent = "Confirmer ?";
            delBtn.className = "student-remove px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer self-start sm:self-center";
            setTimeout(() => {
              if (delBtn.isConnected) {
                delBtn.removeAttribute("data-confirm");
                delBtn.textContent = "Retirer";
                delBtn.className = "student-remove px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer self-start sm:self-center";
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
