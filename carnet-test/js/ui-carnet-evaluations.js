    function renderGradebookView() {
      const scrollContainerEl = document.getElementById('gradebookScrollContainer');
      const savedScrollLeft = scrollContainerEl ? scrollContainerEl.scrollLeft : 0;
      const sub = getCurrentSubjectConfig();
      const termData = getActiveTermData();
      const subData = termData.subjectData[sub.id];

      const displaySub = getSubjectContextDisplay(sub);
      const subjectTitle = displaySub.officialWeightLabel
        ? `${displaySub.fullName} — ${displaySub.officialWeightLabel}${displaySub.bulletinName && displaySub.bulletinName !== displaySub.partLabel ? ` · Bulletin : ${displaySub.bulletinName}` : ''}`
        : displaySub.fullName;
      document.getElementById('gbSubjectTitle').textContent = subjectTitle;
      document.getElementById('gbSubjectTitle').title = subjectTitle;
      document.getElementById('gbSubjectIcon').innerHTML = subjectIcons[sub.group || (sub.id === 'ccq_global' ? 'ccq' : 'maths')] || '';
      const presentLevels = getPresentStudentLevels();
      const isMulti = presentLevels.length > 1;
      const activeLvlFilter = isMulti ? ensureValidGbLevelFilter() : 'ALL';
      const currentWeightScope = [appState.activeGroupId, appState.activeTerm, sub.id].join('|');
      if (weightScope !== currentWeightScope) {
        unlockedWeights.clear();
        weightLevel = '';
        weightScope = currentWeightScope;
      }
      if (weightLevel && weightLevel !== 'ALL' && !presentLevels.includes(weightLevel)) {
        unlockedWeights.clear();
        weightLevel = '';
      }
      unlockedWeights.forEach(id => {
        const asg = subData.assignments.find(item => item.id === id);
        if (!asg || (weightLevel && weightLevel !== 'ALL' && !isAssignmentForLevel(asg, weightLevel))) {
          unlockedWeights.delete(id);
        }
      });
      if (!unlockedWeights.size) weightLevel = '';
      document.getElementById('btnWeightMode').setAttribute('aria-expanded', String(weightMode));
      const weightControls = document.getElementById('weightControls');
      if (weightMode) weightControls.classList.remove('is-closing');
      weightControls.classList.toggle('hidden', !weightMode);
      const filterButton = document.getElementById('btnClearStudentFilter');
      filterButton.classList.toggle('hidden', !gbFilter);
      filterButton.textContent = gbFilter ? `Recherche : ${gbFilter} ✕` : '';

      const visibleAssignments = (isMulti && activeLvlFilter !== 'ALL')
        ? subData.assignments.filter(a => isAssignmentForLevel(a, activeLvlFilter))
        : subData.assignments;
      const gradebookTable = scrollContainerEl.querySelector('table');
      gradebookTable.style.width = `${1165 + visibleAssignments.length * 162}px`;

      const hasWorks = subData.assignments.length > 0;
      const totalW = hasWorks ? getTotalAssignmentWeights(subData) : 0;
      const valid100 = isWeightSumValid100(subData);

      updateWeightIndicatorsUI(totalW, valid100, hasWorks, subData);
      document.getElementById('emptyRosterNotice').classList.toggle('hidden', appState.students.length > 0);
      const hasGroup = hasActiveGroup();
      document.getElementById('emptyRosterTitle').textContent = hasGroup ? 'Votre carnet est prêt.' : 'Créez d’abord un groupe.';
      document.getElementById('emptyRosterDescription').textContent = hasGroup
        ? 'Ajoutez vos élèves et choisissez leur niveau pour afficher les grilles du bon cycle.'
        : 'Un groupe est nécessaire avant d’ajouter des élèves.';
      document.getElementById('btnOpenStudentsFromEmpty').textContent = hasGroup ? 'Ajouter des élèves' : 'Créer un groupe';

      document.getElementById('kpiAssignmentCount').textContent = isMulti && activeLvlFilter !== 'ALL'
        ? `${visibleAssignments.length}`
        : String(subData.assignments.length);

      const headerRow = document.getElementById('gradebookHeaderRow');
      headerRow.innerHTML = '';

      const thStudent = document.createElement('th');
      thStudent.className = 'p-2.5 font-bold sticky left-0 bg-slate-900 z-10';
      thStudent.style.width = '380px';
      const studentHeading = document.createElement('div');
      studentHeading.textContent = appState.students.length > 1 ? 'Élèves' : 'Élève';
      const sortBtn = document.createElement('button');
      sortBtn.type = 'button';
      sortBtn.className = `gb-sort-btn no-print${gbSort.key ? ' is-active' : ''}`;
      sortBtn.title = 'Trier les élèves';
      sortBtn.setAttribute('aria-label', 'Trier les élèves');
      sortBtn.setAttribute('aria-haspopup', 'menu');
      sortBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 4v16M3.5 16.5 7 20l3.5-3.5M17 20V4M13.5 7.5 17 4l3.5 3.5"/></svg>';
      sortBtn.addEventListener('click', openGradebookSortBar);
      studentHeading.appendChild(sortBtn);
      thStudent.appendChild(studentHeading);
      if (isMulti) {
        const lvlBar = document.createElement('div');
        lvlBar.id = 'gbLevelFilterBar';
        lvlBar.className = 'gb-level-seg no-print';
        lvlBar.style.marginTop = '.35rem';
        lvlBar.setAttribute('role', 'group');
        lvlBar.setAttribute('aria-label', 'Filtrer le carnet par niveau');
        const levels = [{ id: 'ALL', label: `Tous (${appState.students.length})` }, ...presentLevels.map(lvl => ({
          id: lvl,
          label: `${GRADE_LEVEL_LABELS[lvl]} (${appState.students.filter(s => String(s.gradeLevel) === lvl).length})`
        }))];
        levels.forEach(level => {
          const button = document.createElement('button');
          button.type = 'button';
          button.className = activeLvlFilter === level.id ? 'is-active' : '';
          button.setAttribute('aria-pressed', String(activeLvlFilter === level.id));
          button.textContent = level.label;
          button.addEventListener('click', () => {
            gbLevelFilter = level.id;
            renderGradebookView();
          });
          lvlBar.appendChild(button);
        });
        thStudent.appendChild(lvlBar);
      }
      headerRow.appendChild(thStudent);

      const activeSub = SUBJECTS_CONFIG.find(s => s.id === appState.activeSubjectId);
      const isValidColumnColor = value => typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value);
      const applyColumnTint = (element, assignment) => {
        const colored = Boolean(prefs.coloredColumns && isValidColumnColor(assignment.columnColor));
        element.classList.toggle('gb-colored-column', colored);
        element.dataset.assignmentColumn = assignment.id;
        if (colored) element.style.setProperty('--assignment-column-color', assignment.columnColor);
        else element.style.removeProperty('--assignment-column-color');
      };
      visibleAssignments.forEach(asg => {
        const th = document.createElement('th');
        th.className = 'p-2 font-semibold text-center min-w-[162px] border-l border-slate-800 gb-assignment-column-header';
        th.style.width = '162px';
        applyColumnTint(th, asg);
        const boxValid = isAssignmentWeightBoxValid(subData, asg);
        const weightBoxClasses = boxValid
          ? 'bg-slate-800 border-slate-700 text-indigo-200 focus-within:ring-1 focus-within:ring-indigo-400'
          : 'bg-red-950 border-red-500 text-red-200 ring-2 ring-red-500';
        const displayedWeight = getAssignmentWeightForLevel(asg, activeLvlFilter !== 'ALL' ? activeLvlFilter : '');
        const targets = getAssignmentTargetLevels(asg);
        const linkedReadonly = asg.linkId && asg.linkOrigin === false && activeSub.singleResult;
        const isPinned = isWeightPinned(asg.id);
        const canEditWeight = !linkedReadonly;
        const lockTitle = linkedReadonly ? 'Pondération définie dans la compétence d’origine'
          : isPinned ? 'Pondération figée (ne bouge pas automatiquement) — cliquer pour libérer'
          : 'Pondération libre (s’ajuste automatiquement) — cliquer pour figer';
        const weightTools = weightMode ? `
          <span class="weight-tools no-print">
            <button type="button" class="weight-lock${isPinned ? ' is-pinned' : ''}" data-weight-lock="${escapeHtml(asg.id)}" aria-label="${escapeHtml(lockTitle + ' : ' + asg.title)}" aria-pressed="${isPinned}" title="${escapeHtml(lockTitle)}" ${linkedReadonly ? 'disabled' : ''}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="${isPinned ? 'M8 11V7a4 4 0 0 1 8 0v4' : 'M8 11V7a4 4 0 0 1 7.7-1.5'}"/><path d="M12 15v2"/></svg><span>${isPinned ? 'Figé' : 'Libre'}</span></button>
            ${canEditWeight ? `<button type="button" data-weight-step="-1" data-weight-id="${escapeHtml(asg.id)}" aria-label="Diminuer la pondération de ${escapeHtml(asg.title)}" title="Diminuer de 1 %">▼</button><button type="button" data-weight-step="1" data-weight-id="${escapeHtml(asg.id)}" aria-label="Augmenter la pondération de ${escapeHtml(asg.title)}" title="Augmenter de 1 %">▲</button>` : ''}
          </span>` : '';
        const targetBadgeHtml = isMulti
          ? `<button type="button" data-cycle-target-asg="${escapeHtml(asg.id)}" class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border transition shadow-2xs cursor-pointer ${targets.length ? 'bg-indigo-500/20 border-indigo-400/40 text-indigo-200 hover:bg-indigo-500/30' : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'}" title="Niveau(x) visé(s) — Cliquer pour choisir avec des cases à cocher">${escapeHtml(formatAssignmentTargetBadge(asg))} ▾</button>`
          : '';
        let multiWeightSubHtml = '';
        if (isMulti && activeLvlFilter === 'ALL') {
          const applicableLvls = presentLevels.filter(lvl => isAssignmentForLevel(asg, lvl));
          if (applicableLvls.length > 1) {
            const wList = applicableLvls.map(lvl => ({ lvl, w: getAssignmentWeightForLevel(asg, lvl) }));
            if (wList.some(x => x.w !== wList[0].w)) {
              multiWeightSubHtml = `<div class="mt-0.5 text-[9.5px] font-semibold text-slate-400">${wList.map(x => `${escapeHtml(formatShortLevelTag(x.lvl))}: ${x.w}%`).join(' · ')}</div>`;
            }
          }
        }
        th.innerHTML = `
          <div class="flex items-center justify-center gap-1 px-1">
            <button type="button" data-title-view="${escapeHtml(asg.id)}" class="asg-title-view" title="${asg.isObservation ? 'Modifier cette évaluation observable, sa grille et ses données' : 'Modifier cette évaluation et ses paramètres'}"><span class="asg-title-text">${escapeHtml(asg.title || 'Évaluation sans titre')}</span></button>
            ${prefs.coloredColumns ? `
              <button type="button" class="column-color-trigger no-print" data-column-color-trigger="${escapeHtml(asg.id)}" aria-label="Choisir la couleur de la colonne ${escapeHtml(asg.title || 'sans titre')}" title="Choisir une couleur de colonne" aria-expanded="false">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m14.5 5.5 4 4L9 19H5v-4Z"/><path d="m12.5 7.5 4 4M5 21h3"/><path d="M19 3l2 2-2.5 2.5-2-2Z"/></svg>
              </button>
            ` : ''}
            <button type="button" data-del-asg="${escapeHtml(asg.id)}" class="assignment-delete-button text-slate-400 hover:text-red-400 text-xs cursor-pointer no-print" aria-label="Supprimer l’évaluation ${escapeHtml(asg.title)}" title="Supprimer cette colonne">✕</button>
          </div>
          <div class="mt-1 flex items-center justify-center gap-1 flex-wrap">
            ${targetBadgeHtml}
            ${!asg.isObservation && getAssignmentOutOf(asg) !== 100 ? `<span class="text-[10px] font-bold text-slate-500" title="Note maximale de cette évaluation">/${formatScoreNumber(getAssignmentOutOf(asg))}</span>` : ''}
            ${asg.linkId ? `<span class="text-[10px] font-bold text-indigo-500" title="${escapeHtml('Évaluation partagée avec : ' + (getLinkedAssignments(asg).map(l => getSubjectContextDisplay(l.sub).partLabel || l.sub.shortName).join(', ') || '—'))}">🔗 aussi en ${escapeHtml(getLinkedAssignments(asg).map(l => (getSubjectContextDisplay(l.sub).partLabel || l.sub.shortName).match(/C\d/) ? (getSubjectContextDisplay(l.sub).partLabel || l.sub.shortName).match(/C\d/)[0] : (getSubjectContextDisplay(l.sub).partLabel || l.sub.shortName)).join(', '))}</span>` : ''}
            <div data-weight-box="${escapeHtml(asg.id)}" class="inline-flex items-center justify-center rounded-md border px-1.5 py-0.5 transition ${canEditWeight && !weightMode ? 'cursor-pointer ' : ''}${weightBoxClasses}" title="${canEditWeight && !weightMode ? 'Cliquer pour modifier la pondération (%)' : ''}">
              ${weightMode && canEditWeight ? `<input type="text" inputmode="numeric" pattern="[0-9]*" data-weight-input="${escapeHtml(asg.id)}" class="weight-input" value="${Math.round(Number(displayedWeight) || 0)}" aria-label="Pondération en pourcentage de ${escapeHtml(asg.title)}" title="Saisir un entier entre 0 et 100 %">` : `<span data-weight-asg="${escapeHtml(asg.id)}" class="text-[11px] font-bold" title="Pondération (%) — cliquer pour modifier">${Math.round(Number(displayedWeight) || 0)}</span>`}
              <span class="text-[10px] font-bold ml-0.5">%</span>
            </div>
            ${weightTools}
          </div>
          ${multiWeightSubHtml}
          ${prefs.coloredColumns ? `
            <div class="column-color-popover hidden no-print" data-column-color-popover="${escapeHtml(asg.id)}" role="group" aria-label="Couleur de la colonne ${escapeHtml(asg.title || 'sans titre')}">
              <label>
                <span>Couleur de colonne</span>
                <input type="color" data-column-color-picker="${escapeHtml(asg.id)}" value="${escapeHtml(isValidColumnColor(asg.columnColor) ? asg.columnColor : '#93b7ef')}" aria-label="Couleur de la colonne ${escapeHtml(asg.title || 'sans titre')}">
              </label>
              <button type="button" data-column-color-reset="${escapeHtml(asg.id)}" ${isValidColumnColor(asg.columnColor) ? '' : 'disabled'}>Réinitialiser</button>
            </div>
          ` : ''}
        `;
        headerRow.appendChild(th);
      });

      const extraHeaders = [
        { label: 'Moy. Travaux', sub: 'Pondérée /100', minW: 'min-w-[115px]', width: 115 },
        { label: 'Barème', sub: 'Repère de jugement', minW: 'min-w-[115px]', width: 115 },
        { label: 'Note finale', sub: 'Note modifiable en cliquant dessus', minW: 'min-w-[135px]', width: 135 },
        { label: 'Commentaires au bulletin', sub: 'Rédaction ou banque de choix', minW: '', width: 420 }
      ];

      extraHeaders.forEach(eh => {
        const th = document.createElement('th');
        th.className = `p-2 font-semibold text-center border-l border-slate-800 ${eh.minW}`;
        th.style.width = `${eh.width}px`;
        th.innerHTML = `<div>${eh.label}</div><div class="text-[10px] text-slate-400 font-normal">${eh.sub}</div>`;
        headerRow.appendChild(th);
      });

      headerRow.querySelectorAll('[data-title-view]').forEach(btn => {
        btn.addEventListener('click', () => {
          const asgId = btn.getAttribute('data-title-view');
          const assignment = subData.assignments.find(item => item.id === asgId);
          if (!assignment) return;
          if (assignment.isObservation) {
            openVisualTraceForEditing(asgId, null);
          } else if (typeof window.openAssignmentForEditing === 'function') {
            window.openAssignmentForEditing(asgId);
          }
        });
      });

      const refreshColumnTint = assignment => {
        document.querySelectorAll(`[data-assignment-column="${assignment.id}"]`).forEach(element => {
          applyColumnTint(element, assignment);
        });
      };
      headerRow.querySelectorAll('[data-column-color-trigger]').forEach(trigger => {
        trigger.addEventListener('click', event => {
          event.stopPropagation();
          const assignmentId = trigger.getAttribute('data-column-color-trigger');
          const popover = headerRow.querySelector(`[data-column-color-popover="${assignmentId}"]`);
          if (!popover) return;
          const willOpen = popover.classList.contains('hidden');
          headerRow.querySelectorAll('[data-column-color-popover]').forEach(item => item.classList.add('hidden'));
          headerRow.querySelectorAll('[data-column-color-trigger]').forEach(item => item.setAttribute('aria-expanded', 'false'));
          popover.classList.toggle('hidden', !willOpen);
          trigger.setAttribute('aria-expanded', String(willOpen));
        });
      });
      headerRow.querySelectorAll('[data-column-color-picker]').forEach(input => {
        const assignment = subData.assignments.find(item => item.id === input.getAttribute('data-column-color-picker'));
        if (!assignment) return;
        const reset = headerRow.querySelector(`[data-column-color-reset="${assignment.id}"]`);
        input.addEventListener('input', () => {
          assignment.columnColor = input.value.toLowerCase();
          if (reset) reset.disabled = false;
          refreshColumnTint(assignment);
          scheduleAppStateSave();
        });
        input.addEventListener('change', () => notifyUpdate(`Couleur appliquée à « ${assignment.title} »`));
      });
      headerRow.querySelectorAll('[data-column-color-reset]').forEach(button => {
        button.addEventListener('click', () => {
          const assignment = subData.assignments.find(item => item.id === button.getAttribute('data-column-color-reset'));
          if (!assignment) return;
          delete assignment.columnColor;
          const input = headerRow.querySelector(`[data-column-color-picker="${assignment.id}"]`);
          if (input) {
            input.value = '#93b7ef';
          }
          button.disabled = true;
          headerRow.querySelector(`[data-column-color-popover="${assignment.id}"]`)?.classList.add('hidden');
          headerRow.querySelector(`[data-column-color-trigger="${assignment.id}"]`)?.setAttribute('aria-expanded', 'false');
          refreshColumnTint(assignment);
          scheduleAppStateSave();
          notifyUpdate(`Couleur retirée de « ${assignment.title} »`);
        });
      });

      // Delete assignment listeners
      headerRow.querySelectorAll('[data-del-asg]').forEach(btn => {
        btn.addEventListener('click', () => {
          const asgId = btn.getAttribute('data-del-asg');
          const delTarget = subData.assignments.find(a => a.id === asgId);
          const linked = getLinkedAssignments(delTarget);
          const discardAssignmentData = (targetData, assignment) => {
            Object.values(targetData.studentRecords || {}).forEach(rec => {
              if (!isRecord(rec)) return;
              if (isRecord(rec.scores)) delete rec.scores[assignment.id];
              if (isRecord(rec.scoreMeta)) delete rec.scoreMeta[assignment.id];
            });
            if (targetData.currentObsSession && targetData.currentObsSession.editingAssignmentId === assignment.id) {
              targetData.currentObsSession = createBlankObsSession(appState.students);
            }
            const termData = getActiveTermData();
            if (Array.isArray(termData.observations)) {
              termData.observations = termData.observations.filter(observation =>
                !isRecord(observation) || observation.asgId !== assignment.id
              );
            }
          };
          const clearLinkedCopyMeta = (targetData, assignment) => {
            Object.values(targetData.studentRecords || {}).forEach(rec => {
              if (!isRecord(rec) || !isRecord(rec.scoreMeta)) return;
              const meta = rec.scoreMeta[assignment.id];
              if (!isRecord(meta)) return;
              delete meta.linkedCopy;
              if (!Object.keys(meta).length) delete rec.scoreMeta[assignment.id];
            });
          };
          const doDelete = everywhere => {
            if (everywhere) {
              linked.forEach(l => {
                discardAssignmentData(l.subData, l.asg);
                l.subData.assignments = l.subData.assignments.filter(a => a !== l.asg);
                if (l.subData.equalWeights) recalculateEqualWeights(l.subData);
              });
            }
            discardAssignmentData(subData, delTarget);
            subData.assignments = subData.assignments.filter(a => a.id !== asgId);
            if (subData.equalWeights) recalculateEqualWeights(subData);
            if (!everywhere && linked.length) {
              const remainingOrigin = linked.find(l => l.asg.linkOrigin !== false);
              if (!remainingOrigin && linked.length > 1) {
                linked[0].asg.linkOrigin = true;
              }
              if (linked.length === 1) {
                delete linked[0].asg.linkId;
                delete linked[0].asg.linkOrigin;
                clearLinkedCopyMeta(linked[0].subData, linked[0].asg);
              } else {
                const origin = remainingOrigin || linked[0];
                clearLinkedCopyMeta(origin.subData, origin.asg);
              }
            }
            notifyUpdate('Colonne supprimée');
            renderAll();
          };
          if (!linked.length) {
            if (btn.getAttribute('data-confirm') !== 'yes') {
              btn.setAttribute('data-confirm', 'yes');
              btn.textContent = 'Confirmer ?';
              btn.setAttribute('aria-label', `Confirmer la suppression de ${delTarget.title}`);
              window.setTimeout(() => {
                if (!btn.isConnected) return;
                btn.removeAttribute('data-confirm');
                btn.textContent = '✕';
                btn.setAttribute('aria-label', `Supprimer l’évaluation ${delTarget.title}`);
              }, 3000);
              return;
            }
            doDelete(false);
            return;
          }
          const modal = document.getElementById('modalDeleteLinked');
          document.getElementById('delLinkedTitle').textContent = delTarget.title;
          document.getElementById('delLinkedNames').textContent = linked.map(l => getSubjectContextDisplay(l.sub).partLabel || l.sub.shortName).join(', ');
          const close = () => { modal.classList.add('hidden'); modal.classList.remove('flex'); };
          const bind = (id, fn) => { document.getElementById(id).onclick = fn; };
          bind('btnDelLinkedAll', () => { close(); doDelete(true); });
          bind('btnDelLinkedHere', () => { close(); doDelete(false); });
          bind('btnDelLinkedCancel', close);
          bind('btnDelLinkedClose', close);
          modal.classList.remove('hidden');
          modal.classList.add('flex');
        });
      });

      // Choix des niveaux ciblés par cases à cocher depuis l'en-tête de colonne
      function openTargetLevelsModal(asgId) {
        const asg = subData.assignments.find(a => a.id === asgId);
        if (!asg) return;
        const modal = document.getElementById('modalTargetLevels');
        const titleEl = document.getElementById('modalTargetLevelsAsgTitle');
        const listEl = document.getElementById('modalTargetLevelsList');
        if (!modal || !listEl) return;

        titleEl.textContent = asg.title || 'Évaluation';
        let currentTargets = getAssignmentTargetLevels(asg).slice();

        const renderCheckboxes = () => {
          listEl.innerHTML = '';
          const isAll = currentTargets.length === 0;

          const allLbl = document.createElement('label');
          allLbl.className = `cursor-pointer flex items-center justify-between p-2.5 rounded-xl border text-xs font-bold transition shadow-2xs ${isAll ? 'bg-indigo-50 border-indigo-300 text-indigo-900 ring-1 ring-indigo-300' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'}`;
          allLbl.innerHTML = `<span>Tout le groupe (tous les niveaux)</span><input type="checkbox" class="rounded accent-indigo-600 w-4 h-4 cursor-pointer" ${isAll ? 'checked' : ''}>`;
          allLbl.querySelector('input').addEventListener('change', () => {
            currentTargets = [];
            renderCheckboxes();
          });
          listEl.appendChild(allLbl);

          presentLevels.forEach(lvl => {
            const isChecked = !isAll && currentTargets.includes(lvl);
            const count = appState.students.filter(s => String(s.gradeLevel) === lvl).length;
            const lvlLbl = document.createElement('label');
            lvlLbl.className = `cursor-pointer flex items-center justify-between p-2.5 rounded-xl border text-xs font-bold transition shadow-2xs ${isChecked ? 'bg-indigo-50 border-indigo-300 text-indigo-900 ring-1 ring-indigo-300' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`;
            lvlLbl.innerHTML = `<span>${escapeHtml(GRADE_LEVEL_LABELS[lvl] || lvl)} <span class="font-normal text-slate-500 text-[11px]">(${count} élève${count > 1 ? 's' : ''})</span></span><input type="checkbox" value="${lvl}" class="rounded accent-indigo-600 w-4 h-4 cursor-pointer" ${isChecked ? 'checked' : ''}>`;
            lvlLbl.querySelector('input').addEventListener('change', (e) => {
              if (isAll) currentTargets = [];
              if (e.target.checked) {
                if (!isAll && presentLevels.length === 2 && currentTargets.length === 1) currentTargets = [lvl];
                else if (!currentTargets.includes(lvl)) currentTargets.push(lvl);
              } else {
                if (currentTargets.length === 1) {
                  showToast('Choisissez au moins un niveau ou tout le groupe.');
                  renderCheckboxes();
                  return;
                }
                currentTargets = currentTargets.filter(x => x !== lvl);
              }
              renderCheckboxes();
            });
            listEl.appendChild(lvlLbl);
          });
        };

        renderCheckboxes();

        const close = () => {
          modal.classList.add('hidden');
          modal.classList.remove('flex');
        };

        document.getElementById('btnCloseModalTargetLevels').onclick = close;
        document.getElementById('btnConfirmTargetLevels').onclick = () => {
          asg.targetLevels = currentTargets.slice();
          getLinkedAssignments(asg).forEach(l => {
            l.asg.targetLevels = asg.targetLevels.slice();
          });
          if (subData.equalWeights) {
            recalculateEqualWeights(subData);
            getLinkedAssignments(asg).forEach(l => {
              if (l.subData.equalWeights) recalculateEqualWeights(l.subData);
            });
          }
          close();
          notifyUpdate(`Niveaux mis à jour pour « ${asg.title} »`);
          renderAll();
        };

        modal.classList.remove('hidden');
        modal.classList.add('flex');
      }

      headerRow.querySelectorAll('[data-cycle-target-asg]').forEach(btn => {
        btn.addEventListener('click', () => {
          openTargetLevelsModal(btn.getAttribute('data-cycle-target-asg'));
        });
      });

      headerRow.querySelectorAll('[data-weight-box], [data-weight-lock], [data-weight-step]').forEach(el => {
        el.addEventListener('pointerdown', () => {
          const inpEl = el.querySelector('[data-weight-input]');
          const lockId = el.getAttribute('data-weight-lock');
          const stepId = el.getAttribute('data-weight-id');
          const stepDir = el.getAttribute('data-weight-step');
          if (inpEl) pendingWeightFocusSelector = `[data-weight-input="${inpEl.getAttribute('data-weight-input')}"]`;
          else if (lockId) pendingWeightFocusSelector = `[data-weight-lock="${lockId}"]`;
          else if (stepId && stepDir) pendingWeightFocusSelector = `[data-weight-step="${stepDir}"][data-weight-id="${stepId}"]`;
        });
      });

      headerRow.querySelectorAll('[data-weight-box]').forEach(box => {
        box.addEventListener('click', (ev) => {
          if (ev.target.closest('button, input')) return;
          if (!weightMode) {
            weightMode = true;
            const id = box.getAttribute('data-weight-box');
            pendingWeightFocusSelector = `[data-weight-input="${id}"]`;
            renderGradebookView();
            showFirstMultiWeightTip();
          }
        });
      });
      headerRow.querySelectorAll('[data-weight-lock]').forEach(button => {
        button.addEventListener('click', (ev) => {
          ev.stopPropagation();
          const id = button.getAttribute('data-weight-lock');
          pendingWeightFocusSelector = `[data-weight-lock="${id}"]`;
          toggleWeightPin(id);
          renderGradebookView();
        });
      });
      headerRow.querySelectorAll('[data-weight-step]').forEach(button => {
        button.addEventListener('click', (ev) => {
          ev.stopPropagation();
          const id = button.getAttribute('data-weight-id');
          const direction = Number(button.getAttribute('data-weight-step'));
          const target = subData.assignments.find(asg => asg.id === id);
          const curRounded = target ? Math.round(Number(getAssignmentWeightForLevel(target, activeLvlFilter)) || 0) : 0;
          const next = target && Math.max(0, Math.min(100, curRounded + direction * 1));
          pendingWeightFocusSelector = `[data-weight-step="${direction}"][data-weight-id="${id}"]`;
          if (target && adjustUnlockedWeight(subData, target, activeLvlFilter, next)) {
            renderGradebookView();
          }
        });
      });
      headerRow.querySelectorAll('[data-weight-input]').forEach(input => {
        const id = input.getAttribute('data-weight-input');
        const target = subData.assignments.find(asg => asg.id === id);
        input.addEventListener('focus', () => input.select());
        input.addEventListener('keydown', event => {
          if (event.key === 'Enter') {
            event.preventDefault();
            pendingWeightFocusSelector = null;
            input.blur();
          } else if (event.key === 'Escape') {
            pendingWeightFocusSelector = null;
            input.value = String(Math.round(Number(getAssignmentWeightForLevel(target, activeLvlFilter)) || 0));
            input.blur();
          }
        });
        input.addEventListener('change', () => {
          const value = input.value.trim();
          if (!/^\d{1,3}$/.test(value)) {
            showToast('Entrez un pourcentage entier entre 0 et 100 % (bonds de 1 %).');
            input.value = String(Math.round(Number(getAssignmentWeightForLevel(target, activeLvlFilter)) || 0));
            return;
          }
          if (!adjustUnlockedWeight(subData, target, activeLvlFilter, Number(value), false)) {
            input.value = String(Math.round(Number(getAssignmentWeightForLevel(target, activeLvlFilter)) || 0));
            return;
          }
          renderGradebookView();
        });
      });

      const tbody = document.getElementById('gradebookBody');
      tbody.innerHTML = '';

      const allFinalPcts = [];

      getGradebookStudents(sub).forEach((st, idx) => {
        if (gbFilter && !studentMatches(st, gbFilter)) return;
        const rec = subData.studentRecords[st.id];
        const summary = computeStudentSubjectSummary(appState.activeTerm, sub.id, st.id);
        if (summary.finalPct !== null) allFinalPcts.push(summary.finalPct);
        if (isMulti && activeLvlFilter !== 'ALL' && String(st.gradeLevel) !== activeLvlFilter) return;

        const tr = document.createElement('tr');
        tr.className = idx % 2 === 0 ? 'bg-white hover:bg-slate-50/80' : 'bg-slate-50/40 hover:bg-slate-50/80';

        // 1. Student cell (sticky left)
        const tdStu = document.createElement('td');
        tdStu.className = 'p-2.5 sticky left-0 bg-inherit z-10 border-r border-slate-100';
        const studentName = document.createElement('div');
        studentName.className = 'gb-student-name font-bold text-slate-900';
        studentName.textContent = st.name;
        const studentLevel = document.createElement('div');
        studentLevel.className = 'gb-student-meta text-[10px] text-indigo-700 leading-tight mt-0.5 flex flex-wrap items-center gap-1';
        const effLevel = getEffectiveGradeLevel(st, sub);
        const isMod = isSubjectModifiedForStudent(st, sub);
        const studentCycle = getStudentCycle(effLevel);
        const levelSpan = document.createElement('span');
        levelSpan.textContent = studentCycle
          ? `${GRADE_LEVEL_LABELS[st.gradeLevel] || GRADE_LEVEL_LABELS[effLevel]} • ${CYCLE_LABELS[studentCycle]}`
          : 'Niveau à choisir';
        studentLevel.appendChild(levelSpan);
        if (isMod) {
          const modBadge = document.createElement('span');
          modBadge.className = 'px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 border border-amber-300 font-extrabold text-[9px] tracking-tight';
          modBadge.textContent = `MOD. · ${GRADE_LEVEL_LABELS[effLevel]}`;
          modBadge.title = `Bulletin modifié dans cette matière : évalué selon les attentes de ${GRADE_LEVEL_LABELS[effLevel]} (élève inscrit en ${GRADE_LEVEL_LABELS[st.gradeLevel] || 'autre niveau'})`;
          studentLevel.appendChild(modBadge);
        }
        tdStu.append(studentName, studentLevel);
        tr.appendChild(tdStu);

        // 2. Assignment inputs (/100) OR Visual Trace clickable/editable cells
        visibleAssignments.forEach(asg => {
          const td = document.createElement('td');
          if (!isAssignmentForStudent(asg, st)) {
            td.className = 'p-2 text-center border-r border-slate-100 cell-not-targeted';
            applyColumnTint(td, asg);
            const badgeLbl = formatAssignmentTargetBadge(asg);
            td.innerHTML = `<span class="text-[10px] font-semibold" title="Évaluation ciblée pour : ${escapeHtml(badgeLbl)} — non comptabilisée pour ${escapeHtml(st.name)} (${escapeHtml(GRADE_LEVEL_LABELS[st.gradeLevel] || 'autre niveau')})">— ${escapeHtml(badgeLbl)}</span>`;
            tr.appendChild(td);
            return;
          }
          td.className = 'p-2 text-center border-r border-slate-100';
          applyColumnTint(td, asg);
          const rawScore = rec.scores[asg.id] !== undefined ? String(rec.scores[asg.id]) : '';
          const meta = (rec.scoreMeta && rec.scoreMeta[asg.id]) ? rec.scoreMeta[asg.id] : null;
          const currentFlags = getCellFlags(rec, asg.id);

          const cellWrap = document.createElement('div');
          cellWrap.className = 'score-cell-wrap';
          const cellTop = document.createElement('div');
          cellTop.className = 'score-cell-top';
          const flagsRow = document.createElement('div');
          flagsRow.className = 'cell-flags-row';

          const flagTrigger = document.createElement('button');
          flagTrigger.type = 'button';
          flagTrigger.className = `cell-flag-trigger no-print${currentFlags.length ? ' has-flags' : ''}`;
          flagTrigger.textContent = '•••';
          flagTrigger.title = 'Marqueurs rapides';
          flagTrigger.setAttribute('aria-label', `Marqueurs rapides pour ${st.name} (${asg.title})`);

          const renderFlagsChips = () => {
            const flags = getCellFlags(rec, asg.id);
            flagTrigger.classList.toggle('has-flags', flags.length > 0);
            flagsRow.innerHTML = '';
            flags.forEach(code => {
              const def = CELL_FLAGS.find(f => f.code === code);
              const chip = document.createElement('span');
              chip.className = 'cell-flag-chip';
              chip.textContent = getCellFlagBadge(code);
              chip.title = def ? `${def.label} — cliquer pour modifier` : code;
              chip.addEventListener('click', (ev) => {
                ev.stopPropagation();
                openFlagMenu(ev);
              });
              flagsRow.appendChild(chip);
            });
          };

          const openFlagMenu = (ev) => {
            const rect = (ev && ev.currentTarget ? ev.currentTarget : flagTrigger).getBoundingClientRect();
            openCellFlagPicker(rect.left, rect.bottom, {
              studentName: st.name,
              assignmentTitle: asg.title,
              getStatus: () => {
                const s = String(rec.scores[asg.id] ?? '').trim().toUpperCase();
                if (s === 'NR' || s === 'JUST' || s === 'REP') return s;
                if (s === '-' || (meta && meta.notEvaluated)) return '-';
                return '';
              },
              onStatusChange: (statusCode) => {
                const curStatus = String(rec.scores[asg.id] ?? '').trim().toUpperCase();
                const nextVal = (curStatus === statusCode || statusCode === '') ? '' : statusCode;
                rec.scores[asg.id] = nextVal;
                if (asg.isObservation && rec.scoreMeta && rec.scoreMeta[asg.id]) {
                  rec.scoreMeta[asg.id].notEvaluated = (nextVal === '-');
                }
                scheduleAppStateSave();
                renderGradebookView();
              },
              getFlags: () => getCellFlags(rec, asg.id),
              onToggle: (code) => {
                const cur = getCellFlags(rec, asg.id);
                const next = cur.includes(code) ? cur.filter(c => c !== code) : [...cur, code];
                setCellFlags(rec, asg.id, next);
                syncLinkedFlags(asg, st.id, next);
                renderFlagsChips();
                scheduleAppStateSave();
              },
              onClear: () => {
                setCellFlags(rec, asg.id, []);
                syncLinkedFlags(asg, st.id, []);
                renderFlagsChips();
                scheduleAppStateSave();
              }
            });
          };

          flagTrigger.addEventListener('click', (ev) => {
            ev.stopPropagation();
            openFlagMenu(ev);
          });

          if (asg.isObservation) {
            const btnTrace = document.createElement('button');
            btnTrace.type = 'button';
            const upperRaw = rawScore.trim().toUpperCase();
            const isStatusNR = upperRaw === 'NR';
            const isStatusJUST = upperRaw === 'JUST' || upperRaw === 'JUS';
            const isStatusREP = upperRaw === 'REP';
            const scoreNumber = Number(rawScore);
            const hasScore = !isStatusNR && !isStatusJUST && !isStatusREP && rawScore !== '' && rawScore !== '-' && Number.isFinite(scoreNumber) && scoreNumber >= 0 && scoreNumber <= 100;
            const traceEffLvl = meta ? (meta.gradeLevel || getEffectiveGradeLevel(st, sub)) : getEffectiveGradeLevel(st, sub);
            const traceCriteria = meta ? getObservationCriteria(sub, traceEffLvl, asg) : [];
            const traceObsOptions = {
              obsMode: (meta && meta.obsMode) || asg.obsMode || 'portrait',
              criteriaWeights: (meta && meta.criteriaWeights) || asg.criteriaWeights || null,
              customRubric: (meta && meta.customRubric) || asg.customRubric || null,
              subjectId: sub.id,
              cycle: getStudentCycle(traceEffLvl)
            };
            const traceObsRes = meta ? computeObservableResult(meta.checked, meta.overrideCode, traceCriteria, meta.notEvaluated, traceObsOptions) : null;
            const scoredTraceCriteriaCount = getScoredObservableCriteria(traceCriteria).length;
            const hasPartialTrace = !hasScore && !isStatusNR && !isStatusJUST && !isStatusREP && traceObsRes && traceObsRes.hasData;
            const hasNotEvaluatedTrace = Boolean((meta && meta.notEvaluated) ||
              (upperRaw === '-' && !(traceObsRes && (traceObsRes.hasEvidence || hasObservationFeedback(meta)))));
            const hasFormativeOnlyTrace = !hasScore && !hasPartialTrace && !hasNotEvaluatedTrace && !isStatusNR && !isStatusJUST && !isStatusREP &&
              traceObsRes && (traceObsRes.hasEvidence || hasObservationFeedback(meta));
            const codeStr = (meta && meta.code) ? String(meta.code) : (hasScore ? pctToClosestGradeCode(scoreNumber) : '-');
            const badgeStyle = isStatusNR
              ? 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
              : isStatusJUST
                ? 'bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100'
                : isStatusREP
                  ? 'bg-purple-50 text-purple-800 border-purple-200 hover:bg-purple-100'
                  : hasNotEvaluatedTrace
                    ? 'bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200'
                    : hasScore
                      ? getBadgeColorClasses(codeStr)
                      : hasPartialTrace
                        ? 'bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-200'
                        : hasFormativeOnlyTrace
                          ? 'bg-indigo-50 text-indigo-800 border-indigo-200 hover:bg-indigo-100'
                          : 'bg-slate-100 text-slate-400 border-slate-200 hover:bg-amber-50 hover:text-amber-800 hover:border-amber-300';
            btnTrace.className = `px-2.5 py-1.5 rounded-lg border text-xs font-bold transition cursor-pointer inline-flex items-center justify-center gap-1 whitespace-nowrap ${badgeStyle}`;
            btnTrace.title = isStatusNR
              ? 'Non remis (NR) — exclu de la moyenne en attendant la remise'
              : isStatusJUST
                ? 'Absence justifiée (JUST) — exclu de la moyenne'
                : isStatusREP
                  ? 'En reprise (REP) — exclu de la moyenne en attendant la reprise'
                  : hasNotEvaluatedTrace
                    ? 'Élève coté N/A pour cette trace — cliquez pour modifier son évaluation'
                    : hasPartialTrace
                      ? 'Trace partielle : cliquez pour compléter les critères cotés'
                      : hasFormativeOnlyTrace
                        ? 'Rétroaction formative consignée (non comptabilisée dans la moyenne)'
                        : 'Cliquez pour consulter ou modifier la trace observable de cet élève';
            if (meta && meta.linkedCopy && hasScore) {
              btnTrace.title = 'Note recopiée d’une autre compétence : remplissez cette grille pour confirmer le résultat.';
              btnTrace.setAttribute('aria-label', `${st.name}, ${asg.title} : ${codeStr}, ${rawScore} %. Note recopiée d’une autre compétence, grille à remplir.`);
            }
            btnTrace.innerHTML = isStatusNR
              ? `<span>NR · Non remis</span>`
              : isStatusJUST
                ? `<span>JUST · Justifié</span>`
                : isStatusREP
                  ? `<span>REP · En reprise</span>`
                  : hasNotEvaluatedTrace
                    ? `<span>N/A (coté)</span>`
                    : hasScore
                      ? `<span>${escapeHtml(codeStr)} (${escapeHtml(rawScore)}%)${meta && meta.overrideCode ? '<span class="adj-star" title="Note ajustée manuellement par l’enseignant">*</span>' : ''}</span>`
                      : hasPartialTrace
                        ? `<span>En cours (${traceObsRes.total}/${scoredTraceCriteriaCount})</span>`
                        : hasFormativeOnlyTrace
                          ? `<span>Rétroaction (*)</span>`
                          : `<span>- (Modifier)</span>`;
            if (meta && meta.linkedCopy && hasScore) {
              btnTrace.insertAdjacentHTML('beforeend', '<span class="linked-grade-warning" aria-hidden="true">!</span>');
            }
            btnTrace.addEventListener('click', () => {
              openVisualTraceForEditing(asg.id, st.id);
            });
            cellTop.append(btnTrace, flagTrigger);
          } else {
            const outOf = getAssignmentOutOf(asg);
            const input = document.createElement('input');
            input.type = 'text';
            input.placeholder = `/${formatScoreNumber(outOf)}`;
            input.value = rawScore;
            input.setAttribute('data-score-asg', asg.id);
            input.setAttribute('data-score-stu', st.id);
            const pctPill = document.createElement('span');
            pctPill.className = 'asg-pct';
            // Sur /100, aucun % n'est affiché; sinon on réserve l'espace pour garder les boîtes alignées.
            const setPct = text => {
              pctPill.textContent = text;
              pctPill.classList.toggle('hidden', outOf === 100);
              pctPill.style.visibility = text ? '' : 'hidden';
            };
            const refreshPct = () => {
              const val = String(rec.scores[asg.id] ?? '').trim().toUpperCase();
              const isSpecial = val === 'NR' || val === 'JUST' || val === 'REP' || val === '-' || val === 'N/A';
              if (isSpecial) {
                setPct('');
                return;
              }
              const n = Number(String(rec.scores[asg.id] ?? '').replace(',', '.'));
              const ok = outOf !== 100 && rec.scores[asg.id] !== undefined && rec.scores[asg.id] !== '' && Number.isFinite(n);
              setPct(ok ? `${Math.round(n / outOf * 100)} %` : '');
            };
            const updateInputStyle = () => {
              const val = String(rec.scores[asg.id] ?? '').trim().toUpperCase();
              input.classList.remove('bg-amber-50', 'text-amber-800', 'border-amber-300',
                                     'bg-blue-50', 'text-blue-800', 'border-blue-200',
                                     'bg-purple-50', 'text-purple-800', 'border-purple-200',
                                     'bg-slate-100', 'text-slate-400', 'border-slate-200',
                                     'bg-white', 'text-slate-900', 'border-slate-300');
              if (val === 'NR') {
                input.classList.add('bg-amber-50', 'text-amber-800', 'border-amber-300');
                input.title = "Non remis — exclu du calcul en attendant la remise";
              } else if (val === 'JUST') {
                input.classList.add('bg-blue-50', 'text-blue-800', 'border-blue-200');
                input.title = "Absence justifiée / motivée — exclu du calcul de la moyenne";
              } else if (val === 'REP') {
                input.classList.add('bg-purple-50', 'text-purple-800', 'border-purple-200');
                input.title = "En reprise — exclu du calcul en attendant la nouvelle note";
              } else if (val === '-') {
                input.classList.add('bg-slate-100', 'text-slate-400', 'border-slate-200');
                input.title = "Non évalué / dispensé";
              } else {
                input.classList.add('bg-white', 'text-slate-900', 'border-slate-300');
                input.title = `Entrez une note de 0 à ${formatScoreNumber(outOf)}, ou NR (non remis), JUST (justifié), REP (en reprise), - (non évalué)`;
              }
            };
            input.inputMode = 'decimal';
            input.className = 'w-16 px-1.5 py-1 text-center rounded-lg border text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors';
            refreshPct();
            updateInputStyle();
            input.addEventListener('input', (e) => {
              const parsed = parsePercentageInput(e.target.value, outOf);
              input.setAttribute('aria-invalid', String(!parsed.valid));
              if (!parsed.valid) return;
              if (parsed.empty) delete rec.scores[asg.id];
              else rec.scores[asg.id] = parsed.value;
              syncLinkedScore(asg, st.id, parsed.empty ? undefined : parsed.value);
              refreshPct();
              updateInputStyle();
              updateGradebookRowSummaryOnly();
            });
            input.addEventListener('keydown', (ev) => {
              if (ev.key === 'ArrowDown' || ev.key === 'ArrowUp' || ev.key === 'Enter') {
                const inputsInCol = [...tbody.querySelectorAll(`input[data-score-asg="${asg.id}"]`)];
                const curIdx = inputsInCol.indexOf(input);
                if (curIdx !== -1) {
                  ev.preventDefault();
                  const step = ev.key === 'ArrowUp' ? -1 : 1;
                  const targetInput = inputsInCol[curIdx + step];
                  if (targetInput) {
                    targetInput.focus();
                    targetInput.select();
                  } else if (ev.key === 'Enter') {
                    input.blur();
                  }
                }
              }
            });
            input.addEventListener('blur', () => {
              const parsed = parsePercentageInput(input.value, outOf);
              if (!parsed.valid) {
                input.value = rec.scores[asg.id] === undefined ? '' : String(rec.scores[asg.id]);
                showToast(`La note doit être entre 0 et ${formatScoreNumber(outOf)}, ou un statut : NR (non remis), JUST (justifié), REP (en reprise), - (non évalué).`);
              } else if (!parsed.empty) {
                input.value = parsed.value;
              }
              input.setAttribute('aria-invalid', 'false');
              refreshPct();
              updateInputStyle();
              updateGradebookRowSummaryOnly();
            });
            if (outOf !== 100) {
              input.classList.add('asg-raw');
              const wrap = document.createElement('div');
              wrap.className = 'inline-flex items-center gap-1.5';
              wrap.append(input, pctPill);
              cellTop.append(wrap, flagTrigger);
            } else {
              cellTop.append(input, flagTrigger);
            }
          }
          renderFlagsChips();
          cellWrap.append(cellTop, flagsRow);
          td.appendChild(cellWrap);
          tr.appendChild(td);
        });

        // 3. Moyenne Travaux
        const tdAvg = document.createElement('td');
        tdAvg.className = 'p-2 text-center font-bold text-slate-800 border-r border-slate-100 whitespace-nowrap';
        tdAvg.id = `cell_avg_${st.id}`;
        tdAvg.innerHTML = renderAssignmentAverage(summary);
        tr.appendChild(tdAvg);

        // 4. Barème button
        const tdBareme = document.createElement('td');
        tdBareme.className = 'p-2 text-center border-r border-slate-100';
        const btnBareme = document.createElement('button');
        btnBareme.type = 'button';
        const barBadgeClass = summary.baremeRes.hasFinalGrade
          ? getBadgeColorClasses(summary.baremeRes.code)
          : 'bg-slate-100 text-slate-600 border-slate-300 hover:bg-indigo-50 hover:text-indigo-700';
        btnBareme.className = `px-2.5 py-1 rounded-lg border text-[11px] font-bold transition cursor-pointer inline-flex items-center justify-center gap-1 whitespace-nowrap ${barBadgeClass}`;
        btnBareme.innerHTML = summary.baremeRes.hasFinalGrade
          ? `<span>${summary.baremeRes.code} (${summary.baremeRes.pct}%)${rec.baremeOverrideCode ? '<span class="adj-star" title="Note ajustée manuellement par l’enseignant">*</span>' : ''}</span>`
          : summary.baremeRes.hasData
            ? `<span>En cours (${summary.baremeRes.total}/${BAREME_ECOLE_ROWS.length})</span>`
            : `<span>Barème</span>`;
        btnBareme.addEventListener('click', () => {
          navigateToView('viewBareme', () => {
            appState.selectedStudentId = st.id;
          });
        });
        tdBareme.appendChild(btnBareme);
        tr.appendChild(tdBareme);

        // 5. Final Judgment (% input + Letter badge)
        const tdFinal = document.createElement('td');
        tdFinal.className = 'p-2 text-center border-r border-slate-100';
        const finalWrap = document.createElement('div');
        finalWrap.className = 'flex items-center justify-center gap-1';

        const inputFinal = document.createElement('input');
        inputFinal.type = 'text';
        inputFinal.readOnly = true;
        inputFinal.setAttribute('aria-label', 'Jugement final (cliquer pour ajuster)');
        inputFinal.placeholder = summary.autoCombinedPct !== null ? String(summary.autoCombinedPct) : 'Auto';
        inputFinal.value = rec.finalJudgmentOverride !== '' ? rec.finalJudgmentOverride : '';
        inputFinal.title = 'Cliquer pour choisir une note finale';
        inputFinal.className = 'final-grade-trigger px-1 py-1 text-center rounded border border-slate-300 text-xs font-bold cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500';
        const openFinalPicker = (ev) => {
          const r = inputFinal.getBoundingClientRect();
          const x = ev && ev.clientX ? ev.clientX : r.left;
          const y = ev && ev.clientY ? ev.clientY : r.bottom;
          const cur = computeStudentSubjectSummary(appState.activeTerm, sub.id, st.id).finalLetter;
          openGradePicker(x, y, {
            current: rec.finalJudgmentOverride !== '' ? cur : null,
            onPick: (g) => {
              rec.finalJudgmentOverride = g ? g.pct : '';
              inputFinal.value = g ? String(g.pct) : '';
              updateGradebookRowSummaryOnly();
              notifyUpdate(g ? `Note finale de ${st.name} : ${g.code} (${g.pct}%)` : `Note finale de ${st.name} : automatique`);
            }
          });
        };
        inputFinal.addEventListener('click', openFinalPicker);
        inputFinal.addEventListener('keydown', ev => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); openFinalPicker(null); } });

        const badgeFinal = document.createElement('span');
        badgeFinal.id = `cell_final_badge_${st.id}`;
        badgeFinal.className = `px-1.5 py-0.5 rounded border text-[11px] font-extrabold whitespace-nowrap ${getBadgeColorClasses(summary.finalLetter)}`;
        badgeFinal.textContent = summary.finalPct !== null ? `${summary.finalLetter} (${summary.finalPct}%)${rec.finalJudgmentOverride !== '' ? '*' : ''}` : '—';

        finalWrap.appendChild(inputFinal);
        finalWrap.appendChild(badgeFinal);
        tdFinal.appendChild(finalWrap);
        tr.appendChild(tdFinal);

        // 6. Comment input + Banque de commentaires button
        const tdComm = document.createElement('td');
        tdComm.className = 'p-2';
        const commWrap = document.createElement('div');
        commWrap.className = 'comment-cell-wrap';
        const inputComm = document.createElement('input');
        inputComm.type = 'text';
        inputComm.placeholder = 'Commentaire au bulletin…';
        inputComm.value = rec.comment || '';
        inputComm.id = `cell_comm_${st.id}`;
        inputComm.className = 'w-full px-2 py-1 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500';
        inputComm.addEventListener('input', (e) => {
          rec.comment = e.target.value;
        });
        const btnCb = document.createElement('button');
        btnCb.type = 'button';
        btnCb.className = 'btn-open-cb no-print';
        btnCb.title = 'Banque et synthèse de commentaires (sans répétition du prénom)';
        btnCb.setAttribute('aria-label', `Ouvrir la banque de commentaires pour ${st.name}`);
        btnCb.innerHTML = `<svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><path d="M8 9h8"/><path d="M8 13h5"/></svg>`;
        btnCb.addEventListener('click', () => {
          openCommentBankModal(st.id, sub.id, appState.activeTerm);
        });
        commWrap.append(inputComm, btnCb);
        tdComm.appendChild(commWrap);
        tr.appendChild(tdComm);

        tbody.appendChild(tr);
      });

      updateGradebookRowSummaryOnly();
      if (scrollContainerEl && savedScrollLeft > 0) {
        scrollContainerEl.scrollLeft = savedScrollLeft;
      }
      updateGradebookTopScroll();
      if (pendingWeightFocusSelector) {
        const sel = pendingWeightFocusSelector;
        pendingWeightFocusSelector = null;
        const focusEl = headerRow.querySelector(sel);
        if (focusEl) {
          focusEl.focus({ preventScroll: true });
          if (typeof focusEl.select === 'function') focusEl.select();
        }
      }
    }

