    function renderAssignmentAverage(summary) {
      return summary.assignmentsAvg !== null ? `${summary.assignmentsAvg} %` : '—';
    }

    function renderAll() {
      renderGroupBar();
      renderTermSwitcher();
      renderSubjectTabs();
      renderNavTabs();
      if (!hasActiveGroup()) {
        renderHomeView();
        return;
      }
      switch (appState.activeView) {
        case 'viewHome':
          renderHomeView();
          break;
        case 'viewBareme':
          renderBaremeView();
          break;
        case 'viewQuickObs':
          renderQuickObsView();
          break;
        case 'viewStudents':
          renderStudentsView();
          break;
        case 'viewGlobalReport':
          renderGlobalReportView();
          break;
        default:
          renderGradebookView();
      }
    }

    function renderTermSwitcher() {
      const isGlobal = appState.activeView === 'viewGlobalReport';
      const isHome = appState.activeView === 'viewHome';
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
        btn.setAttribute('aria-pressed', String(!isGlobal && !isHome && t === appState.activeTerm));
        if (!isGlobal && !isHome && t === appState.activeTerm) {
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
      education_physique: '<circle cx="14.5" cy="4.5" r="2"/><path d="m5 21 4-8 3 2 3 6M9 13 5 11l-2 2m10 1 4-4 3 1"/>',
      anglais: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M7 9h10M7 13h6M7 16h4M14 13h3"/>',
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
      const neutralBar = appState.activeView === 'viewStudents' || appState.activeView === 'viewGlobalReport' || appState.activeView === 'viewHome';
      const visibleSubjects = getVisibleSubjectsForContext(SUBJECTS_CONFIG);
      if (!neutralBar && visibleSubjects.length && !visibleSubjects.some(subject => subject.id === appState.activeSubjectId)) {
        appState.activeSubjectId = visibleSubjects[0].id;
      }
      const activeSub = SUBJECTS_CONFIG.find(s => s.id === appState.activeSubjectId);
      const activeGroup = !neutralBar && activeSub ? activeSub.group : null;
      const seenGroups = new Set();
      visibleSubjects.forEach(sub => {
        if (sub.group && sub.group !== 'presco') {
          if (seenGroups.has(sub.group)) return;
          seenGroups.add(sub.group);
        }
        const isActive = expandedSubjectGroup
          ? sub.group === expandedSubjectGroup
          : !neutralBar && (sub.group && sub.group !== 'presco'
            ? sub.group === activeGroup
            : sub.id === appState.activeSubjectId);
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.dataset.subjectId = sub.id;
        const grpKey = sub.group || (sub.id === 'ccq_global' ? 'ccq' : 'maths');
        btn.style.setProperty('--tab-accent', SUBJECT_STUDIO_ACCENTS[grpKey] || '#1d4ed8');
        btn.className = isActive
          ? 'px-2 py-1.5 rounded-lg text-[11px] sm:text-xs font-bold bg-indigo-600 text-white shadow-xs transition flex items-center justify-start gap-1.5 cursor-pointer truncate'
          : 'px-2 py-1.5 rounded-lg text-[11px] sm:text-xs font-medium bg-slate-700/80 hover:bg-slate-700 text-slate-200 transition flex items-center justify-start gap-1.5 cursor-pointer truncate';
        btn.setAttribute('aria-pressed', String(isActive));
        if (sub.group && sub.group !== 'presco') {
          btn.setAttribute('aria-expanded', String(expandedSubjectGroup === sub.group));
          btn.setAttribute('aria-controls', 'subjectSubTabsContainer');
        }
        btn.title = sub.group && sub.group !== 'presco' ? sub.groupLabel : sub.shortName;
        const icon = subjectIcons[grpKey] || '';
        const label = sub.id === 'ccq_global'
          ? 'Culture et citoyenneté'
          : sub.prescoOnly
            ? sub.partLabel
            : (sub.tabLabel || (sub.group ? sub.groupLabel : sub.shortName));
        if (sub.id === 'ccq_global') btn.setAttribute('aria-label', sub.shortName);
        btn.innerHTML = `<svg class="subject-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icon}</svg><span class="truncate">${escapeHtml(label)}</span>`;
        btn.addEventListener('click', () => {
          if (sub.group && sub.group !== 'presco') {
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
      const parts = expandedSubjectGroup ? visibleSubjects.filter(s => s.group === expandedSubjectGroup) : [];
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
        const displayPart = getSubjectContextDisplay(part);
        btn.textContent = displayPart.partLabel;
        if (displayPart.officialWeightLabel) btn.title = displayPart.officialWeightLabel;
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
      const isLandingPortal = Boolean(landingPortalRequested);
      document.documentElement.classList.toggle('no-active-group', !hasGroup || isLandingPortal);
      const views = ['viewHome', 'viewGradebook', 'viewBareme', 'viewQuickObs', 'viewStudents', 'viewGlobalReport'];
      const activeView = hasGroup ? appState.activeView : 'viewHome';
      views.forEach(v => {
        const sec = document.getElementById(v);
        if (sec) {
          sec.classList.toggle('hidden', v !== activeView);
        }
      });
      const brandBtn = document.getElementById('btnSidebarBrandHome');
      if (brandBtn) {
        brandBtn.classList.remove('is-active');
        brandBtn.removeAttribute('aria-current');
      }
      const dashboardButton = document.getElementById('btnSidebarDashboard');
      if (dashboardButton) {
        const isDashboard = hasGroup && !isLandingPortal && appState.activeView === 'viewHome';
        dashboardButton.setAttribute('aria-pressed', String(isDashboard));
        if (isDashboard) dashboardButton.setAttribute('aria-current', 'page');
        else dashboardButton.removeAttribute('aria-current');
      }
    }

    let pendingWeightFocusSelector = null;

    // -------------------------------------------------------------------------
    // VIEW 1: CARNET & TRAVAUX (STARTS WITH 0 WORKS, EDITABLE TITLES, HORIZONTAL SCROLL AS WORKS GROW)
    // -------------------------------------------------------------------------
