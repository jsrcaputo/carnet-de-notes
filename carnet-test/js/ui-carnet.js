    function renderAssignmentAverage(summary) {
      const value = summary.assignmentsAvg !== null ? `${summary.assignmentsAvg} %` : '—';
      if (!summary.weightDetails.length) return value;
      return `${value}
        <details class="gb-weight-details">
          <summary>Poids utilisé : ${formatScoreNumber(summary.totalWeightUsed)} %</summary>
          <div class="gb-weight-explanation">
            <p>Poids prévu pour chaque évaluation applicable; seuls les résultats valides avec un poids positif sont utilisés. La moyenne est recalculée sur ces poids, sans transformer les statuts en zéro.</p>
            <ul>${summary.weightDetails.map(item => `<li>${escapeHtml(item.title)} : ${formatScoreNumber(item.weight)} % — ${escapeHtml(item.status)}</li>`).join('')}</ul>
          </div>
        </details>`;
    }

    function renderAll() {
      renderTermSwitcher();
      renderSubjectTabs();
      renderNavTabs();
      renderGradebookView();
      renderBaremeView();
      renderQuickObsView();
      renderStudentsView();
      renderGlobalReportView();
    }

    function renderTermSwitcher() {
      const isGlobal = appState.activeView === 'viewGlobalReport';
      const studentButton = document.getElementById('btnNavStudentsTop');
      const studentCount = document.getElementById('headerStudentCount');
      if (studentCount) studentCount.textContent = String(appState.students.length);
      document.getElementById('sidebarStudentsLabel').textContent = appState.students.length === 0
        ? 'Élève(s)' : appState.students.length === 1 ? 'Élève' : 'Élèves';
      const hasGroup = hasActiveGroup();
      document.getElementById('sidebarTermEmpty').classList.toggle('hidden', hasGroup);
      document.getElementById('testTermNavigation').classList.toggle('is-unavailable', !hasGroup);
      document.getElementById('testReportNavigation').classList.toggle('is-unavailable', !hasGroup);
      if (studentButton) {
        const isStudentsView = hasActiveGroup() && appState.activeView === 'viewStudents';
        studentButton.setAttribute('aria-pressed', String(isStudentsView));
        studentButton.className = isStudentsView
          ? 'px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer bg-indigo-500 text-white border border-indigo-400 flex items-center gap-1'
          : 'px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-700 flex items-center gap-1';
      }
      document.querySelectorAll('.term-btn').forEach(btn => {
        const t = btn.getAttribute('data-term');
        btn.setAttribute('aria-pressed', String(!isGlobal && t === appState.activeTerm));
        if (!isGlobal && t === appState.activeTerm) {
          btn.className = 'term-btn px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer bg-indigo-600 text-white shadow-xs';
        } else {
          btn.className = 'term-btn px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer text-slate-300 hover:text-white';
        }
      });
      const grBtn = document.getElementById('btnNavGlobalReport');
      if (grBtn) {
        grBtn.setAttribute('aria-pressed', String(isGlobal));
        if (isGlobal) {
          grBtn.className = 'px-3 py-1 rounded-lg text-xs font-extrabold transition cursor-pointer bg-amber-400 text-slate-950 shadow-xs flex items-center gap-1';
        } else {
          grBtn.className = 'px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer text-amber-300 hover:bg-amber-500/20 flex items-center gap-1';
        }
      }
    }

    let expandedSubjectGroup = null;

    const subjectIcons = {
      maths: '<path d="M4 6h6M7 3v6M14 5l5 5m0-5-5 5M4 15h6m-6 3h6m4-1.5h6"/>',
      francais: '<path d="M12 19c-2-2-5-2.5-9-2V5c4-.5 7 0 9 2m0 12c2-2 5-2.5 9-2V5c-4-.5-7 0-9 2m0 0v12"/>',
      ccq: '<circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2"/><path d="M3 19c0-3 2.5-5 6-5s6 2 6 5M16 14c2.8 0 5 1.8 5 4"/>',
      sciences: '<path d="M9 3h6m-5 0v6L5 18a2 2 0 0 0 1.7 3h10.6a2 2 0 0 0 1.7-3l-5-9V3M8 15h8"/>',
      social: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 2.5 4 5.5 4 9s-1 6.5-4 9c-3-2.5-4-5.5-4-9s1-6.5 4-9z"/>',
      art_dram: '<path d="M3 5c3 1 6 1 9 0v5c0 3-2 5-4.5 6C5 15 3 13 3 10V5zm9 4c3 1 6 1 9 0v4c0 3-2 5-4.5 6-1.4-.5-2.5-1.3-3.3-2.4M6 9h.01M9 9h.01M15 13h.01M18 13h.01M6 12c1 1 2 1 3 0"/>',
      art_plast: '<path d="M12 3a9 9 0 1 0 0 18h1a2 2 0 0 0 1.4-3.4 1.8 1.8 0 0 1 1.3-3.1H18a3 3 0 0 0 3-3A9 9 0 0 0 12 3z"/><path d="M7.5 11h.01M10 7.5h.01M14 7.5h.01M17 10h.01"/>',
      presco: '<path d="M12 3l2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>'
    };

    function renderSubjectTabs() {
      const container = document.getElementById('subjectTabsContainer');
      const subContainer = document.getElementById('subjectSubTabsContainer');
      if (!container) return;

      if (subContainer && subContainer.parentElement === container) subContainer.remove();
      container.innerHTML = '';
      if (!hasActiveGroup()) {
        expandedSubjectGroup = null;
        const empty = document.createElement('div');
        empty.className = 'test-subject-empty';
        empty.textContent = 'Aucun groupe créé';
        container.appendChild(empty);
        if (subContainer) {
          subContainer.innerHTML = '';
          subContainer.classList.add('hidden');
          container.appendChild(subContainer);
        }
        return;
      }
      const neutralBar = appState.activeView === 'viewStudents' || appState.activeView === 'viewGlobalReport';
      const activeSub = SUBJECTS_CONFIG.find(s => s.id === appState.activeSubjectId);
      const activeGroup = !neutralBar && activeSub ? activeSub.group : null;
      const seenGroups = new Set();
      SUBJECTS_CONFIG.forEach(sub => {
        if (sub.group) {
          if (seenGroups.has(sub.group)) return;
          seenGroups.add(sub.group);
        }
        const isActive = expandedSubjectGroup
          ? sub.group === expandedSubjectGroup
          : !neutralBar && (sub.group ? sub.group === activeGroup : sub.id === appState.activeSubjectId);
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.dataset.subjectId = sub.id;
        const grpKey = sub.group || (sub.id === 'ccq_global' ? 'ccq' : 'maths');
        btn.style.setProperty('--tab-accent', SUBJECT_STUDIO_ACCENTS[grpKey] || '#1d4ed8');
        btn.className = isActive
          ? 'px-2 py-1.5 rounded-lg text-[11px] sm:text-xs font-bold bg-indigo-600 text-white shadow-xs transition flex items-center justify-start gap-1.5 cursor-pointer truncate'
          : 'px-2 py-1.5 rounded-lg text-[11px] sm:text-xs font-medium bg-slate-700/80 hover:bg-slate-700 text-slate-200 transition flex items-center justify-start gap-1.5 cursor-pointer truncate';
        btn.setAttribute('aria-pressed', String(isActive));
        if (sub.group) {
          btn.setAttribute('aria-expanded', String(expandedSubjectGroup === sub.group));
          btn.setAttribute('aria-controls', 'subjectSubTabsContainer');
        }
        btn.title = sub.group ? sub.groupLabel : sub.shortName;
        const icon = subjectIcons[grpKey] || '';
        const label = sub.id === 'ccq_global' ? 'Culture et citoyenneté' : (sub.tabLabel || (sub.group ? sub.groupLabel : sub.shortName));
        if (sub.id === 'ccq_global') btn.setAttribute('aria-label', sub.shortName);
        btn.innerHTML = `<svg class="subject-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icon}</svg><span class="truncate">${escapeHtml(label)}</span>`;
        btn.addEventListener('click', () => {
          if (sub.group) {
            expandedSubjectGroup = expandedSubjectGroup === sub.group ? null : sub.group;
            renderSubjectTabs();
            if (expandedSubjectGroup) {
              const replacement = [...container.children].find(el => el.getAttribute('aria-controls') === 'subjectSubTabsContainer' && el.title === sub.groupLabel);
              if (replacement) replacement.focus();
            } else {
              const replacement = container.querySelector(`[data-subject-id="${sub.id}"]`);
              if (replacement) replacement.focus();
            }
            return;
          }
          const navigated = navigateToView('viewGradebook', () => {
            expandedSubjectGroup = null;
            appState.activeSubjectId = sub.id;
          });
          if (navigated) container.querySelector(`[data-subject-id="${sub.id}"]`).focus();
        });
        container.appendChild(btn);
      });

      if (!subContainer) return;
      subContainer.innerHTML = '';
      const parts = expandedSubjectGroup ? SUBJECTS_CONFIG.filter(s => s.group === expandedSubjectGroup) : [];
      subContainer.classList.toggle('hidden', !parts.length);
      if (!parts.length) {
        container.appendChild(subContainer);
        return;
      }
      parts.forEach(part => {
        const isActive = !neutralBar && part.id === appState.activeSubjectId;
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.dataset.subjectId = part.id;
        btn.className = isActive
          ? 'px-2.5 py-1 rounded-lg text-[11px] font-bold bg-indigo-600 text-white cursor-pointer'
          : 'px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-700/80 hover:bg-slate-700 text-slate-200 cursor-pointer';
        btn.setAttribute('aria-pressed', String(isActive));
        btn.textContent = part.partLabel;
        btn.addEventListener('click', () => {
          if (isActive && appState.activeView === 'viewGradebook') return;
          const navigated = navigateToView('viewGradebook', () => {
            appState.activeSubjectId = part.id;
          });
          if (navigated) subContainer.querySelector(`[data-subject-id="${part.id}"]`).focus();
        });
        subContainer.appendChild(btn);
      });
      const activeTab = [...container.children].find(tab => tab.getAttribute('aria-expanded') === 'true');
      if (activeTab) activeTab.after(subContainer);
      else container.appendChild(subContainer);
    }

    function renderNavTabs() {
      const hasGroup = hasActiveGroup();
      document.documentElement.classList.toggle('no-active-group', !hasGroup);
      const views = ['viewGradebook', 'viewBareme', 'viewQuickObs', 'viewStudents', 'viewGlobalReport'];
      views.forEach(v => {
        const sec = document.getElementById(v);
        if (sec) {
          if (hasGroup && appState.activeView === v) sec.classList.remove('hidden');
          else sec.classList.add('hidden');
        }
      });

    }

    let pendingWeightFocusSelector = null;

    // -------------------------------------------------------------------------
    // VIEW 1: CARNET & TRAVAUX (STARTS WITH 0 WORKS, EDITABLE TITLES, HORIZONTAL SCROLL AS WORKS GROW)
    // -------------------------------------------------------------------------
    function renderGradebookView() {
      const scrollContainerEl = document.getElementById('gradebookScrollContainer');
      const savedScrollLeft = scrollContainerEl ? scrollContainerEl.scrollLeft : 0;
      const sub = getCurrentSubjectConfig();
      const termData = getActiveTermData();
      const subData = termData.subjectData[sub.id];

      const subjectTitle = sub.fullName;
      document.getElementById('gbSubjectTitle').textContent = subjectTitle;
      document.getElementById('gbSubjectTitle').title = subjectTitle;
      document.getElementById('gbSubjectIcon').innerHTML = subjectIcons[sub.group || (sub.id === 'ccq_global' ? 'ccq' : 'maths')] || '';
      const subjectAtmosphere = document.getElementById('gbSubjectAtmosphere');
      const heroImageUrl = STUDIO_ATMOSPHERE_IMAGES[sub.id] || sub.imageUrl;
      if (subjectAtmosphere && heroImageUrl) subjectAtmosphere.src = heroImageUrl;

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
      document.getElementById('weightControls').classList.toggle('hidden', !weightMode);
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
      visibleAssignments.forEach(asg => {
        const th = document.createElement('th');
        th.className = 'p-2 font-semibold text-center min-w-[162px] border-l border-slate-800';
        th.style.width = '162px';
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
          ? `<button type="button" data-cycle-target-asg="${asg.id}" class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border transition shadow-2xs cursor-pointer ${targets.length ? 'bg-indigo-500/20 border-indigo-400/40 text-indigo-200 hover:bg-indigo-500/30' : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'}" title="Niveau(x) visé(s) — Cliquer pour choisir avec des cases à cocher">${escapeHtml(formatAssignmentTargetBadge(asg))} ▾</button>`
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
            <button type="button" data-title-view="${asg.id}" class="asg-title-view${asg.title && asg.title.trim() ? '' : ' hidden'}" title="Renommer ce travail ou cette trace"><span class="asg-title-text">${escapeHtml(asg.title)}</span><svg class="asg-title-pencil" viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg></button>
            <textarea rows="1" data-title-asg="${asg.id}" placeholder="Nom du travail..." class="${asg.title && asg.title.trim() ? 'hidden ' : ''}w-36 resize-none overflow-hidden leading-tight bg-white text-slate-800 text-center text-[11px] font-bold px-1.5 py-0.5 rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-400" title="Cliquez pour renommer ce travail ou cette trace">${escapeHtml(asg.title)}</textarea>
            <button type="button" data-del-asg="${asg.id}" class="text-slate-400 hover:text-red-400 text-xs cursor-pointer no-print flex-shrink-0" title="Supprimer cette colonne">✕</button>
          </div>
          <div class="mt-1 flex items-center justify-center gap-1 flex-wrap">
            ${targetBadgeHtml}
            ${!asg.isObservation && getAssignmentOutOf(asg) !== 100 ? `<span class="text-[10px] font-bold text-slate-500" title="Note maximale de cette évaluation">/${formatScoreNumber(getAssignmentOutOf(asg))}</span>` : ''}
            ${asg.linkId ? `<span class="text-[10px] font-bold text-indigo-500" title="${escapeHtml('Évaluation partagée avec : ' + (getLinkedAssignments(asg).map(l => l.sub.partLabel || l.sub.shortName).join(', ') || '—'))}">🔗 aussi en ${escapeHtml(getLinkedAssignments(asg).map(l => (l.sub.partLabel || l.sub.shortName).match(/C\d/) ? (l.sub.partLabel || l.sub.shortName).match(/C\d/)[0] : (l.sub.partLabel || l.sub.shortName)).join(', '))}</span>` : ''}
            <div data-weight-box="${asg.id}" class="inline-flex items-center justify-center rounded-md border px-1.5 py-0.5 transition ${canEditWeight && !weightMode ? 'cursor-pointer ' : ''}${weightBoxClasses}" title="${canEditWeight && !weightMode ? 'Cliquer pour modifier la pondération (%)' : ''}">
              ${weightMode && canEditWeight ? `<input type="text" inputmode="numeric" pattern="[0-9]*" data-weight-input="${escapeHtml(asg.id)}" class="weight-input" value="${Math.round(Number(displayedWeight) || 0)}" aria-label="Pondération en pourcentage de ${escapeHtml(asg.title)}" title="Saisir un entier entre 0 et 100 %">` : `<span data-weight-asg="${asg.id}" class="text-[11px] font-bold" title="Pondération (%) — cliquer pour modifier">${Math.round(Number(displayedWeight) || 0)}</span>`}
              <span class="text-[10px] font-bold ml-0.5">%</span>
            </div>
            ${weightTools}
            ${asg.isObservation
              ? `<button type="button" data-edit-trace-hdr="${asg.id}" class="px-1.5 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-amber-300 text-[10px] font-bold cursor-pointer no-print" title="Ouvrir la grille de cette trace observable">Grille</button>`
              : ''
            }
          </div>
          ${multiWeightSubHtml}
        `;
        headerRow.appendChild(th);
      });

      const extraHeaders = [
        { label: 'Moy. Travaux', sub: 'Pondérée /100', minW: 'min-w-[115px]', width: 115 },
        { label: 'Barème', sub: 'Repère de jugement', minW: 'min-w-[115px]', width: 115 },
        { label: 'Note finale', sub: 'Jugement', hint: 'Cliquer sur la note pour l’ajuster', minW: 'min-w-[135px]', width: 135 },
        { label: 'Commentaires', sub: 'Notes', minW: '', width: 420 }
      ];

      extraHeaders.forEach(eh => {
        const th = document.createElement('th');
        th.className = `p-2 font-semibold text-center border-l border-slate-800 ${eh.minW}`;
        th.style.width = `${eh.width}px`;
        th.innerHTML = `<div>${eh.label}</div><div class="text-[10px] text-slate-400 font-normal">${eh.sub}</div>${eh.hint ? `<div class="text-[10px] text-slate-400 font-normal italic leading-tight mt-1">${eh.hint}</div>` : ''}`;
        headerRow.appendChild(th);
      });

      // Editable column title listeners
      headerRow.querySelectorAll('[data-title-asg]').forEach(inp => {
        const fit = () => {
          inp.style.height = 'auto';
          inp.style.height = (inp.scrollHeight + inp.offsetHeight - inp.clientHeight) + 'px';
        };
        fit();
        requestAnimationFrame(fit);
        const asgIdForView = inp.getAttribute('data-title-asg');
        const viewBtn = headerRow.querySelector(`[data-title-view="${asgIdForView}"]`);
        const startEdit = () => {
          if (viewBtn) viewBtn.classList.add('hidden');
          inp.classList.remove('hidden');
          fit();
          inp.focus();
          inp.setSelectionRange(inp.value.length, inp.value.length);
        };
        if (viewBtn) viewBtn.addEventListener('click', startEdit);
        inp.addEventListener('blur', () => {
          if (!viewBtn || !inp.value.trim()) return;
          viewBtn.querySelector('.asg-title-text').textContent = inp.value;
          inp.classList.add('hidden');
          viewBtn.classList.remove('hidden');
        });
        inp.addEventListener('keydown', ev => { if (ev.key === 'Enter') { ev.preventDefault(); inp.blur(); } });
        inp.addEventListener('input', (e) => {
          fit();
          const asgId = inp.getAttribute('data-title-asg');
          const target = subData.assignments.find(a => a.id === asgId);
          if (target) {
            target.title = e.target.value;
            getLinkedAssignments(target).forEach(l => { l.asg.title = e.target.value; });
          }
        });
      });

      // Edit visual trace from column header listener
      headerRow.querySelectorAll('[data-edit-trace-hdr]').forEach(btn => {
        btn.addEventListener('click', () => {
          const asgId = btn.getAttribute('data-edit-trace-hdr');
          openVisualTraceForEditing(asgId, null);
        });
      });

      // Delete assignment listeners
      headerRow.querySelectorAll('[data-del-asg]').forEach(btn => {
        btn.addEventListener('click', () => {
          const asgId = btn.getAttribute('data-del-asg');
          const delTarget = subData.assignments.find(a => a.id === asgId);
          const linked = getLinkedAssignments(delTarget);
          const doDelete = everywhere => {
            if (everywhere) {
              linked.forEach(l => {
                l.subData.assignments = l.subData.assignments.filter(a => a !== l.asg);
                if (l.subData.equalWeights) recalculateEqualWeights(l.subData);
              });
            }
            subData.assignments = subData.assignments.filter(a => a.id !== asgId);
            if (subData.equalWeights) recalculateEqualWeights(subData);
            if (subData.currentObsSession && subData.currentObsSession.editingAssignmentId === asgId) {
              subData.currentObsSession = createBlankObsSession(appState.students);
            }
            notifyUpdate('Colonne supprimée');
            renderAll();
          };
          if (!linked.length) { doDelete(false); return; }
          const modal = document.getElementById('modalDeleteLinked');
          document.getElementById('delLinkedTitle').textContent = delTarget.title;
          document.getElementById('delLinkedNames').textContent = linked.map(l => l.sub.partLabel || l.sub.shortName).join(', ');
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
        studentName.className = 'font-bold text-slate-900';
        studentName.textContent = st.name;
        const studentLevel = document.createElement('div');
        studentLevel.className = 'text-[10px] text-indigo-700 leading-tight mt-0.5 flex flex-wrap items-center gap-1';
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
            const badgeLbl = formatAssignmentTargetBadge(asg);
            td.innerHTML = `<span class="text-[10px] font-semibold" title="Évaluation ciblée pour : ${escapeHtml(badgeLbl)} — non comptabilisée pour ${escapeHtml(st.name)} (${escapeHtml(GRADE_LEVEL_LABELS[st.gradeLevel] || 'autre niveau')})">— ${escapeHtml(badgeLbl)}</span>`;
            tr.appendChild(td);
            return;
          }
          td.className = 'p-2 text-center border-r border-slate-100';
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
              chip.textContent = code;
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
                renderAllPreserveScroll();
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
            const codeStr = (meta && meta.code) ? meta.code : (hasScore ? pctToClosestGradeCode(scoreNumber) : '-');
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
                      ? `<span>${codeStr} (${rawScore}%)${meta && meta.overrideCode ? '<span class="adj-star" title="Note ajustée manuellement par l’enseignant">*</span>' : ''}</span>`
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
            const refreshPct = () => {
              const val = String(rec.scores[asg.id] ?? '').trim().toUpperCase();
              const isSpecial = val === 'NR' || val === 'JUST' || val === 'REP' || val === '-' || val === 'N/A';
              if (isSpecial) {
                pctPill.textContent = '';
                pctPill.classList.add('hidden');
                return;
              }
              const n = Number(String(rec.scores[asg.id] ?? '').replace(',', '.'));
              const ok = outOf !== 100 && rec.scores[asg.id] !== undefined && rec.scores[asg.id] !== '' && Number.isFinite(n);
              pctPill.textContent = ok ? `${Math.round(n / outOf * 100)} %` : '';
              pctPill.classList.toggle('hidden', !ok);
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
        inputComm.placeholder = 'Note / commentaire...';
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

    function hideNewEvalChoicesPopover() {
      const choices = document.getElementById('newEvaluationChoices');
      const btn = document.getElementById('btnNewEvaluation');
      if (choices && !choices.classList.contains('hidden')) {
        choices.classList.add('hidden');
        if (btn) btn.setAttribute('aria-expanded', 'false');
      }
    }

    let mouseBarEl = null;
    function closeMouseBar() {
      if (mouseBarEl) { mouseBarEl.remove(); mouseBarEl = null; }
      document.removeEventListener('mousedown', onMouseBarOutside, true);
      document.removeEventListener('keydown', onMouseBarKey, true);
      window.removeEventListener('scroll', closeMouseBar, true);
    }
    function onMouseBarOutside(e) { if (mouseBarEl && !mouseBarEl.contains(e.target)) closeMouseBar(); }
    function onMouseBarKey(e) { if (e.key === 'Escape') closeMouseBar(); }

    // Petite barre d'options près du curseur; se ferme après un choix, un clic à l'extérieur ou Échap.
    function openMouseBar(x, y, options, current) {
      closeMouseBar();
      closeGradePicker();
      closeCellFlagPicker();
      hideNewEvalChoicesPopover();
      const el = document.createElement('div');
      el.className = 'mouse-bar';
      el.setAttribute('role', 'menu');
      options.forEach(option => {
        const b = document.createElement('button');
        b.type = 'button';
        b.setAttribute('role', 'menuitem');
        b.className = option.id && option.id === current ? 'is-current' : '';
        b.textContent = option.label;
        b.addEventListener('click', () => { closeMouseBar(); option.onPick(); });
        el.appendChild(b);
      });
      el.style.visibility = 'hidden';
      document.body.appendChild(el);
      const w = el.offsetWidth, h = el.offsetHeight, m = 8;
      let left = x + 10, top = y + 12;
      if (left + w + m > window.innerWidth) left = Math.max(m, x - w - 10);
      if (top + h + m > window.innerHeight) top = Math.max(m, y - h - 12);
      el.style.left = Math.min(Math.max(m, left), Math.max(m, window.innerWidth - w - m)) + 'px';
      el.style.top = Math.min(Math.max(m, top), Math.max(m, window.innerHeight - h - m)) + 'px';
      el.style.visibility = '';
      mouseBarEl = el;
      document.addEventListener('mousedown', onMouseBarOutside, true);
      document.addEventListener('keydown', onMouseBarKey, true);
      window.addEventListener('scroll', closeMouseBar, true);
      const first = el.querySelector('button');
      if (first) first.focus({ preventScroll: true });
    }

    let gradePickerEl = null;
    function closeGradePicker() {
      if (gradePickerEl) { gradePickerEl.remove(); gradePickerEl = null; }
      document.removeEventListener('mousedown', onGradePickerOutside, true);
      document.removeEventListener('keydown', onGradePickerKey, true);
      window.removeEventListener('scroll', closeGradePicker, true);
    }
    function onGradePickerOutside(e) {
      if (gradePickerEl && !gradePickerEl.contains(e.target)) closeGradePicker();
    }
    function onGradePickerKey(e) { if (e.key === 'Escape') closeGradePicker(); }

    // Bandeau de cotes cliquables près du curseur; se ferme par un clic dedans ou à l'extérieur.
    function openGradePicker(x, y, { current, onPick }) {
      closeGradePicker();
      closeMouseBar();
      closeCellFlagPicker();
      hideNewEvalChoicesPopover();
      const el = document.createElement('div');
      el.className = 'grade-picker';
      el.setAttribute('role', 'dialog');
      el.setAttribute('aria-label', 'Choisir une cote');
      GRADE_SCALE.forEach(g => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = `grade-picker-btn border ${getBadgeColorClasses(g.code)}${current === g.code ? ' is-current' : ''}`;
        b.textContent = `${g.code} ${g.pct}`;
        b.title = `${g.code} (${g.pct}%)`;
        b.addEventListener('click', () => { closeGradePicker(); onPick(g); });
        el.appendChild(b);
      });
      const auto = document.createElement('button');
      auto.type = 'button';
      auto.className = 'grade-picker-auto';
      auto.textContent = 'Auto';
      auto.title = 'Revenir au calcul automatique';
      auto.addEventListener('click', () => { closeGradePicker(); onPick(null); });
      el.appendChild(auto);
      el.style.visibility = 'hidden';
      document.body.appendChild(el);
      const w = el.offsetWidth, h = el.offsetHeight, m = 8;
      let left = x + 10, top = y + 12;
      if (left + w + m > window.innerWidth) left = Math.max(m, x - w - 10);
      if (top + h + m > window.innerHeight) top = Math.max(m, y - h - 12);
      left = Math.min(Math.max(m, left), Math.max(m, window.innerWidth - w - m));
      el.style.left = left + 'px';
      el.style.top = top + 'px';
      el.style.visibility = '';
      gradePickerEl = el;
      document.addEventListener('mousedown', onGradePickerOutside, true);
      document.addEventListener('keydown', onGradePickerKey, true);
      window.addEventListener('scroll', closeGradePicker, true);
    }

    // Sélecteur sobre et monochrome de marqueurs rapides sur cellule (AIDE, T+, REP, ABS, SUIVI)
    let cellFlagPickerEl = null;
    function closeCellFlagPicker() {
      if (cellFlagPickerEl) { cellFlagPickerEl.remove(); cellFlagPickerEl = null; }
      document.removeEventListener('mousedown', onCellFlagPickerOutside, true);
      document.removeEventListener('keydown', onCellFlagPickerKey, true);
      window.removeEventListener('scroll', closeCellFlagPicker, true);
    }
    function onCellFlagPickerOutside(e) {
      if (cellFlagPickerEl && !cellFlagPickerEl.contains(e.target)) closeCellFlagPicker();
    }
    function onCellFlagPickerKey(e) { if (e.key === 'Escape') closeCellFlagPicker(); }

    function openCellFlagPicker(x, y, { studentName, assignmentTitle, getStatus, onStatusChange, getFlags, onToggle, onClear }) {
      closeCellFlagPicker();
      closeGradePicker();
      closeMouseBar();
      hideNewEvalChoicesPopover();
      const el = document.createElement('div');
      el.className = 'flag-picker no-print';
      el.setAttribute('role', 'dialog');
      el.setAttribute('aria-label', 'Statut de remise et marqueurs rapides');

      const renderContent = () => {
        const activeFlags = getFlags();
        const activeStatus = typeof getStatus === 'function' ? getStatus() : '';
        el.innerHTML = '';

        if (typeof onStatusChange === 'function') {
          const statusSection = document.createElement('div');
          statusSection.className = 'flag-picker-status-section';
          const statusHead = document.createElement('div');
          statusHead.className = 'flag-picker-group-title mb-1.5 flex items-center justify-between';
          statusHead.innerHTML = `<span>Statut de remise (exclu de la moyenne)</span>`;
          statusSection.appendChild(statusHead);

          const statusGrid = document.createElement('div');
          statusGrid.className = 'grid grid-cols-4 gap-1.5 mb-2.5 pb-2.5 border-b border-slate-200';
          const statusDefs = [
            { code: 'NR', label: 'Non remis', hint: 'Travail non remis temporairement (exclu de la moyenne)', cls: 'border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100' },
            { code: 'JUST', label: 'Justifié', hint: 'Absence motivée / justifiée (exclu de la moyenne)', cls: 'border-blue-200 bg-blue-50 text-blue-900 hover:bg-blue-100' },
            { code: 'REP', label: 'Reprise', hint: 'En attente de reprise (exclu de la moyenne)', cls: 'border-purple-200 bg-purple-50 text-purple-900 hover:bg-purple-100' },
            { code: '-', label: 'Exempté', hint: 'Non évalué / exempté (-)', cls: 'border-slate-300 bg-slate-100 text-slate-700 hover:bg-slate-200' }
          ];
          statusDefs.forEach(stDef => {
            const isSel = activeStatus === stDef.code;
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = `px-2 py-1.5 rounded-lg border text-[11px] font-bold flex flex-col items-center justify-center transition cursor-pointer ${stDef.cls} ${isSel ? 'ring-2 ring-offset-1 ring-slate-700 shadow-sm' : 'opacity-85 hover:opacity-100'}`;
            btn.title = stDef.hint + (isSel ? ' — Cliquer pour retirer ce statut' : '');
            btn.innerHTML = `<span class="font-extrabold text-xs">${escapeHtml(stDef.code)}</span><span class="text-[9px] font-medium leading-tight">${escapeHtml(stDef.label)}</span>`;
            btn.addEventListener('click', () => {
              onStatusChange(stDef.code);
              closeCellFlagPicker();
            });
            statusGrid.appendChild(btn);
          });
          statusSection.appendChild(statusGrid);
          el.appendChild(statusSection);
        }

        const head = document.createElement('div');
        head.className = 'flag-picker-title';
        const titleSpan = document.createElement('span');
        titleSpan.textContent = 'Marqueurs d’adaptation / soutien';
        head.appendChild(titleSpan);
        if (activeFlags.length > 0) {
          const clearBtn = document.createElement('button');
          clearBtn.type = 'button';
          clearBtn.className = 'text-[10px] font-semibold text-slate-500 hover:text-slate-800 underline cursor-pointer normal-case tracking-normal';
          clearBtn.textContent = 'Effacer';
          clearBtn.addEventListener('click', () => {
            onClear();
            renderContent();
          });
          head.appendChild(clearBtn);
        }
        el.appendChild(head);

        const list = document.createElement('div');
        list.className = 'flag-picker-list';
        const columns = ['adaptation', 'modification'].map(group => {
          const column = document.createElement('div');
          const heading = document.createElement('div');
          heading.className = 'flag-picker-group-title';
          heading.textContent = group === 'adaptation' ? 'Adaptation' : 'Modification';
          column.appendChild(heading);
          list.appendChild(column);
          return column;
        });
        CELL_FLAGS.forEach(flag => {
          const column = flag.group === 'adaptation' ? columns[0] : columns[1];
          if (flag.group === 'autre' && flag.code === 'REP') {
            const heading = document.createElement('div');
            heading.className = 'flag-picker-group-title';
            heading.textContent = 'Autres suivis';
            column.appendChild(heading);
          }
          const isOn = activeFlags.includes(flag.code);
          const item = document.createElement('button');
          item.type = 'button';
          item.className = `flag-picker-item${isOn ? ' is-active' : ''}`;
          item.title = flag.hint;
          item.setAttribute('aria-pressed', String(isOn));
          item.innerHTML = `
            <span class="truncate">${escapeHtml(flag.label)}</span>
            <span class="flag-picker-code">${escapeHtml(flag.code)}</span>
          `;
          item.addEventListener('click', () => {
            onToggle(flag.code);
            renderContent();
          });
          column.appendChild(item);
        });
        el.appendChild(list);
      };

      renderContent();
      el.style.visibility = 'hidden';
      document.body.appendChild(el);
      const w = el.offsetWidth, h = el.offsetHeight, m = 8;
      let left = x, top = y + 6;
      if (left + w + m > window.innerWidth) left = Math.max(m, window.innerWidth - w - m);
      if (top + h + m > window.innerHeight) top = Math.max(m, y - h - 8);
      left = Math.max(m, left);
      el.style.left = left + 'px';
      el.style.top = top + 'px';
      el.style.visibility = '';
      cellFlagPickerEl = el;
      document.addEventListener('mousedown', onCellFlagPickerOutside, true);
      document.addEventListener('keydown', onCellFlagPickerKey, true);
      window.addEventListener('scroll', closeCellFlagPicker, true);
    }

    // Modale Banque & Assistant de commentaires
    let activeCommentBankContext = null;
    let activeCommentBankCategoryId = COMMENT_BANK_CATEGORIES[0].id;

    function updateCommentBankCharCount() {
      const area = document.getElementById('cbTextarea');
      const countEl = document.getElementById('cbCharCount');
      if (area && countEl) {
        countEl.textContent = `${area.value.length} caract.`;
      }
    }

    function renderCommentBankPhrases() {
      if (!activeCommentBankContext) return;
      const st = appState.students.find(s => s.id === activeCommentBankContext.studentId);
      if (!st) return;
      const modeSelect = document.getElementById('cbPronounSelect');
      const mode = (modeSelect && modeSelect.value) || st.pronoun || 'prenom';
      const tabsEl = document.getElementById('cbCategoryTabs');
      const listEl = document.getElementById('cbPhraseList');
      const area = document.getElementById('cbTextarea');
      if (!tabsEl || !listEl || !area) return;

      tabsEl.innerHTML = '';
      COMMENT_BANK_CATEGORIES.forEach(cat => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `cb-tab-btn${cat.id === activeCommentBankCategoryId ? ' is-active' : ''}`;
        btn.textContent = cat.label.replace(/ & /g, ' et ');
        btn.addEventListener('click', () => {
          activeCommentBankCategoryId = cat.id;
          renderCommentBankPhrases();
        });
        tabsEl.appendChild(btn);
      });

      const activeCat = COMMENT_BANK_CATEGORIES.find(c => c.id === activeCommentBankCategoryId) || COMMENT_BANK_CATEGORIES[0];
      listEl.innerHTML = '';
      const firstName = extractStudentFirstName(st);
      const isFem = mode === 'elle' || mode === 'prenom_elle';
      const pron = isFem ? 'elle' : 'il';
      const currentTextNow = area.value.trim();

      const getPhraseVariants = (raw) => [
        personalizeSingleSentence(raw, firstName, 'il', true),
        personalizeSingleSentence(raw, firstName, 'il', false),
        personalizeSingleSentence(raw, firstName, 'elle', true),
        personalizeSingleSentence(raw, firstName, 'elle', false)
      ];

      const findMatchedVariant = (text, raw) => {
        if (!text) return null;
        const variants = getPhraseVariants(raw);
        return variants.find(v => v && text.includes(v)) || null;
      };

      activeCat.phrases.forEach(rawPhrase => {
        const previewWithPronoun = personalizeSingleSentence(rawPhrase, firstName, pron, false);
        const previewWithName = personalizeSingleSentence(rawPhrase, firstName, pron, mode === 'prenom' || mode === 'prenom_elle');
        const matchedNow = findMatchedVariant(currentTextNow, rawPhrase);
        const isAlreadyInText = Boolean(matchedNow);

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `cb-phrase-item${isAlreadyInText ? ' is-selected' : ''}`;
        btn.setAttribute('aria-pressed', String(isAlreadyInText));
        btn.innerHTML = `
          <span>${escapeHtml(previewWithName)}</span>
          <span class="text-[11px] font-bold ${isAlreadyInText ? 'text-indigo-800' : 'text-slate-500'} shrink-0">${isAlreadyInText ? '✓ Ajouté · retirer' : '＋ Insérer'}</span>
        `;
        btn.addEventListener('click', () => {
          const textNow = area.value.trim();
          const existingMatch = findMatchedVariant(textNow, rawPhrase);
          if (existingMatch) {
            // Bascule : retire l'énoncé sans jamais le dupliquer
            let nextText = textNow.replace(existingMatch, '').replace(/\s{2,}/g, ' ').trim();
            // Si on utilisait le prénom et que la phrase retirée était la première (celle qui portait le prénom),
            // on rétablit le prénom sur la nouvelle première phrase si elle provient de la banque
            if (nextText && (mode === 'prenom' || mode === 'prenom_elle') && !nextText.toLowerCase().includes(firstName.toLowerCase())) {
              const allRaw = COMMENT_BANK_CATEGORIES.flatMap(c => c.phrases);
              for (const candidateRaw of allRaw) {
                const pronVar = personalizeSingleSentence(candidateRaw, firstName, pron, false);
                if (pronVar && nextText.startsWith(pronVar)) {
                  const nameVar = personalizeSingleSentence(candidateRaw, firstName, pron, true);
                  nextText = nameVar + nextText.slice(pronVar.length);
                  break;
                }
              }
            }
            area.value = nextText;
          } else {
            const alreadyHasFirstName = textNow.length > 0 && textNow.toLowerCase().includes(firstName.toLowerCase());
            const useNameNow = (mode === 'prenom' || mode === 'prenom_elle') && !alreadyHasFirstName && textNow.length === 0;
            const sentenceToInsert = useNameNow ? previewWithName : previewWithPronoun;
            area.value = textNow ? `${textNow} ${sentenceToInsert}` : sentenceToInsert;
          }
          updateCommentBankCharCount();
          renderCommentBankPhrases();
          area.focus();
        });
        listEl.appendChild(btn);
      });
    }

    function openCommentBankModal(studentId, subjectId, termId) {
      const st = appState.students.find(s => s.id === studentId);
      const sub = SUBJECTS_CONFIG.find(s => s.id === subjectId) || getCurrentSubjectConfig();
      if (!st || !sub) return;
      const tId = String(termId || appState.activeTerm);
      const subData = appState.terms[tId].subjectData[sub.id];
      const rec = subData.studentRecords[st.id];
      const sum = computeStudentSubjectSummary(tId, sub.id, st.id);

      activeCommentBankContext = { studentId: st.id, subjectId: sub.id, termId: tId };
      const modal = document.getElementById('modalCommentBank');
      const subtitle = document.getElementById('cbModalSubtitle');
      const modeSelect = document.getElementById('cbPronounSelect');
      const area = document.getElementById('cbTextarea');
      if (!modal || !area) return;

      if (subtitle) {
        const gradeInfo = sum.finalPct !== null ? `${sum.finalLetter} (${sum.finalPct} %)` : 'Aucune note finale';
        subtitle.textContent = `${st.name} · ${sub.shortName} · Étape ${tId} · Résultat : ${gradeInfo}`;
      }
      if (modeSelect) {
        modeSelect.value = st.pronoun || 'prenom';
      }
      area.value = rec.comment || '';
      updateCommentBankCharCount();
      renderCommentBankPhrases();

      modal.classList.remove('hidden');
      modal.classList.add('flex');
      setTimeout(() => area.focus(), 40);
    }

    function closeCommentBankModal() {
      const modal = document.getElementById('modalCommentBank');
      if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
      }
      activeCommentBankContext = null;
    }

    function updateWeightIndicatorsUI(totalW, valid100, hasWorks, subDataOverride) {
      const warnBanner = document.getElementById('weightWarningBanner');
      const btnWeight = document.getElementById('btnWeightMode');
      const subData = subDataOverride || (getActiveTermData().subjectData[appState.activeSubjectId]);
      const presentLevels = getPresentStudentLevels();
      const isMulti = presentLevels.length > 1;

      if (!hasWorks) {
        if (warnBanner) warnBanner.classList.add('hidden');
        if (btnWeight) btnWeight.classList.remove('is-weight-error');
        return;
      }

      if (btnWeight) btnWeight.classList.toggle('is-weight-error', !valid100);

      if (isMulti && subData) {
        const levelBreakdown = presentLevels.map(lvl => {
          const count = subData.assignments.filter(a => isAssignmentForLevel(a, lvl)).length;
          const tot = getTotalAssignmentWeightsForLevel(subData, lvl);
          const ok = count === 0 || Math.abs(tot - 100) <= 0.15;
          return { lvl, label: GRADE_LEVEL_LABELS[lvl], short: formatShortLevelTag(lvl), count, tot, ok };
        });

        if (warnBanner) {
          if (!valid100) {
            warnBanner.classList.remove('hidden');
            warnBanner.innerHTML = `Erreur pondération : ${levelBreakdown.map(b => `${escapeHtml(b.short)} : <strong>${b.tot} %</strong>${b.ok ? ' ✓' : (b.tot > 100 ? ' (dépasse 100 %)' : ' (≠ 100 %)')}`).join(' · ')}`;
          } else {
            warnBanner.classList.add('hidden');
          }
        }

      } else {
        if (warnBanner) {
          const dispTotal = Math.round(Number(totalW) || 0);
          warnBanner.innerHTML = `Total : <span id="weightTotalVal">${escapeHtml(String(dispTotal))}</span> % ${dispTotal > 100 ? '(dépasse 100 %)' : '(doit donner 100 %)'}`;
          if (!valid100) warnBanner.classList.remove('hidden');
          else warnBanner.classList.add('hidden');
        }
      }
    }

    function updateGradebookRowSummaryOnly() {
      const sub = getCurrentSubjectConfig();
      const allFinalPcts = [];
      const pctsByLevel = {};
      const presentLevels = getPresentStudentLevels();
      const isMulti = presentLevels.length > 1;
      const activeLvlFilter = isMulti ? ensureValidGbLevelFilter() : 'ALL';

      appState.students.forEach(st => {
        const summary = computeStudentSubjectSummary(appState.activeTerm, sub.id, st.id);
        if (summary.finalPct !== null) {
          allFinalPcts.push(summary.finalPct);
          const lvl = String(st.gradeLevel || '');
          if (lvl) {
            if (!pctsByLevel[lvl]) pctsByLevel[lvl] = [];
            pctsByLevel[lvl].push(summary.finalPct);
          }
        }
        const avgCell = document.getElementById(`cell_avg_${st.id}`);
        if (avgCell) {
          avgCell.innerHTML = renderAssignmentAverage(summary);
        }
        const finalBadge = document.getElementById(`cell_final_badge_${st.id}`);
        if (finalBadge) {
          const recNow = appState.terms[appState.activeTerm].subjectData[sub.id].studentRecords[st.id];
          finalBadge.className = `px-1.5 py-0.5 rounded border text-[11px] font-extrabold whitespace-nowrap ${getBadgeColorClasses(summary.finalLetter)}`;
          finalBadge.textContent = summary.finalPct !== null ? `${summary.finalLetter} (${summary.finalPct}%)${recNow.finalJudgmentOverride !== '' ? '*' : ''}` : '—';
        }
      });
      const kpiAvg = document.getElementById('kpiClassAverage');
      if (kpiAvg) {
        const targetList = (isMulti && activeLvlFilter !== 'ALL')
          ? (pctsByLevel[activeLvlFilter] || [])
          : allFinalPcts;
        if (targetList.length > 0) {
          const avg = Math.round(targetList.reduce((a, b) => a + b, 0) / targetList.length);
          kpiAvg.textContent = `${avg}% (${pctToClosestGradeCode(avg)})${isMulti && activeLvlFilter !== 'ALL' ? ` · ${formatShortLevelTag(activeLvlFilter)}` : ''}`;
        } else {
          kpiAvg.textContent = '—';
        }
      }
    }

    // -------------------------------------------------------------------------
    // VIEW 2: BARÈME ÉCOLE (1 SEULE CASE PAR RANGÉE !)
    // -------------------------------------------------------------------------
