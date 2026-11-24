    function updateHistoryButtons() {
      const u = document.getElementById('btnUndo');
      const r = document.getElementById('btnRedo');
      if (u) u.disabled = history.undo.length === 0;
      if (r) r.disabled = history.redo.length === 0;
    }
    function recordHistory() {
      const snap = getEditableStateSnapshot();
      if (history.last === null) { history.last = snap; return; }
      if (snap === history.last) return;
      history.undo.push(history.last);
      if (history.undo.length > 60) history.undo.shift();
      history.redo = [];
      history.last = snap;
      updateHistoryButtons();
    }
    function applyHistorySnapshot(snap) {
      const data = JSON.parse(snap);
      if (data.groups) {
        appState.groups = data.groups;
        appState.activeGroupId = data.activeGroupId;
        appState.groupStore = data.groupStore || {};
        applyActiveSubjects(appState);
        if (!SUBJECTS_CONFIG.some(s => s.id === appState.activeSubjectId)) appState.activeSubjectId = SUBJECTS_CONFIG[0].id;
      }
      appState.students = data.students;
      appState.terms = data.terms;
      if (data.tagCategories !== undefined) appState.tagCategories = data.tagCategories;
      history.last = snap;
      renderAll();
      updateHistoryButtons();
      scheduleAppStateSave();
    }
    function flushPendingSave() {
      if (autosaveTimer) {
        clearTimeout(autosaveTimer);
        autosaveTimer = null;
        recordHistory();
      }
    }
    function undoAction() {
      flushPendingSave();
      if (!history.undo.length) { showToast('Rien à annuler'); return; }
      history.redo.push(getEditableStateSnapshot());
      applyHistorySnapshot(history.undo.pop());
      showToast('Action annulée');
    }
    function redoAction() {
      flushPendingSave();
      if (!history.redo.length) { showToast('Rien à rétablir'); return; }
      history.undo.push(getEditableStateSnapshot());
      applyHistorySnapshot(history.redo.pop());
      showToast('Action rétablie');
    }

    // ---- Préférences d'affichage ----
    const CUSTOM_RUBRICS_STORAGE_KEY = 'carnet_notes_custom_rubrics_v1';
    function loadAllCustomWeightedPresets() {
      try {
        const parsed = JSON.parse(window.localStorage.getItem(CUSTOM_RUBRICS_STORAGE_KEY) || '{}');
        return (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) ? parsed : {};
      } catch (_) {
        return {};
      }
    }
    function getCustomWeightedPreset(subjectId, cycle, scoredCriteria = []) {
      const all = loadAllCustomWeightedPresets();
      const key = `${subjectId}__c${cycle}`;
      const saved = all[key];
      if (!saved || typeof saved !== 'object' || Array.isArray(saved) || !scoredCriteria.length) return null;
      const valid = scoredCriteria.every(c => Number.isFinite(Number(saved[c.id])) && Number(saved[c.id]) >= 0);
      if (!valid) return null;
      const out = {};
      scoredCriteria.forEach(c => { out[c.id] = Math.round(Number(saved[c.id])); });
      return out;
    }
    function saveCustomWeightedPreset(subjectId, cycle, weightsMap, scoredCriteria = []) {
      if (!subjectId || !weightsMap || !scoredCriteria.length) return false;
      const clean = {};
      scoredCriteria.forEach(c => {
        clean[c.id] = Math.round(Math.max(0, Number(weightsMap[c.id] || 0)));
      });
      const all = loadAllCustomWeightedPresets();
      all[`${subjectId}__c${cycle}`] = clean;
      try {
        window.localStorage.setItem(CUSTOM_RUBRICS_STORAGE_KEY, JSON.stringify(all));
        return true;
      } catch (_) {
        return false;
      }
    }

    const VALID_PALETTES = ['ocean', 'foret', 'boreal', 'terracotta', 'prune', 'ambre', 'graphite'];
    const PALETTE_LABELS = {
      ocean: 'Bleu Océan',
      foret: 'Vert Forêt',
      boreal: 'Indigo Boréal',
      terracotta: 'Argile & Terracotta',
      prune: 'Prune Éditoriale',
      ambre: 'Ocre & Ambre',
      graphite: 'Graphite & Encre'
    };
    const prefs = { theme: 'light', palette: 'ocean', textSize: 'md', backupReminder: true, coloredColumns: false, summaryStudentListMode: 'grid' };
    try {
      const savedPrefs = JSON.parse(window.localStorage.getItem('carnet_notes_prefs_2026_v1') || 'null');
      if (savedPrefs && typeof savedPrefs === 'object') {
        // Thème et palette viennent du carnet ouvert : un carnet vierge démarre en clair, palette bleue.
        if (['xs', 'sm', 'md', 'lg', 'xl'].includes(savedPrefs.textSize)) prefs.textSize = savedPrefs.textSize;
        if (typeof savedPrefs.backupReminder === 'boolean') prefs.backupReminder = savedPrefs.backupReminder;
        if (typeof savedPrefs.coloredColumns === 'boolean') prefs.coloredColumns = savedPrefs.coloredColumns;
        if (['select', 'grid'].includes(savedPrefs.summaryStudentListMode)) prefs.summaryStudentListMode = savedPrefs.summaryStudentListMode;
      }
    } catch (_) {}
    const SUBJECT_STUDIO_ACCENTS = {
      maths: '#1d4ed8',
      francais: '#8f3f2b',
      ccq: '#6d3b8e',
      sciences: '#16697a',
      social: '#9a5b13',
      education_physique: '#15803d',
      anglais: '#2563eb',
      arts: '#9e2a5b'
    };
    let lastSavedFileSnapshot = null;
    let initialEditableSnapshot = null;
    function applyPrefs() {
      const root = document.documentElement;
      root.classList.add('design-studio');
      const activePalette = VALID_PALETTES.includes(prefs.palette) ? prefs.palette : 'ocean';
      prefs.palette = activePalette;
      root.setAttribute('data-palette', activePalette);
      root.classList.toggle('theme-dark', prefs.theme === 'dark');
      ['xs', 'sm', 'lg', 'xl'].forEach(size => root.classList.toggle('ts-' + size, prefs.textSize === size));
      const sizeIndex = ['xs', 'sm', 'md', 'lg', 'xl'].indexOf(prefs.textSize);
      const sizeSlider = document.getElementById('spTextSize');
      const sizeValue = document.getElementById('spTextSizeValue');
      if (sizeSlider && sizeValue) {
        sizeSlider.value = String(sizeIndex);
        sizeSlider.setAttribute('aria-valuetext', `${sizeIndex + 1} sur 5`);
        sizeValue.textContent = `${sizeIndex + 1} / 5`;
      }
      document.querySelectorAll('#settingsPanel .sp-seg').forEach(seg => {
        const key = seg.getAttribute('data-pref');
        if (key && prefs[key] !== undefined) {
          seg.querySelectorAll('button').forEach(b => b.classList.toggle('is-on', b.getAttribute('data-val') === prefs[key]));
        }
      });
      const paletteNameEl = document.getElementById('spPaletteName');
      if (paletteNameEl) paletteNameEl.textContent = PALETTE_LABELS[activePalette] || 'Bleu Océan';
      document.querySelectorAll('#settingsPanel [data-palette-val]').forEach(btn => {
        const isOn = btn.getAttribute('data-palette-val') === activePalette;
        btn.classList.toggle('is-active', isOn);
        btn.setAttribute('aria-pressed', String(isOn));
      });
      document.querySelectorAll('#settingsPanel [data-pref-check]').forEach(cb => {
        cb.checked = !!prefs[cb.getAttribute('data-pref-check')];
      });
      document.querySelectorAll('[data-gr-student-view]').forEach(btn => {
        const isActive = btn.getAttribute('data-gr-student-view') === prefs.summaryStudentListMode;
        btn.classList.toggle('is-active', isActive);
        btn.setAttribute('aria-pressed', String(isActive));
      });
      try {
        window.localStorage.setItem('carnet_notes_prefs_2026_v1', JSON.stringify(prefs));
      } catch (_) {}
    }

    function getEditableStateSnapshot() {
      return JSON.stringify({
        groups: appState.groups,
        activeGroupId: appState.activeGroupId,
        groupStore: appState.groupStore,
        students: appState.students,
        terms: appState.terms,
        tagCategories: appState.tagCategories
      });
    }

    function getBackupSnapshot() {
      return JSON.stringify({ carnet: getEditableStateSnapshot(), annualWeightMode: appState.annualWeightMode, displayPreferences: prefs, customWeightedPresets: loadAllCustomWeightedPresets() });
    }

    function readDisplayPreferences(value) {
      if (value === undefined) return { ...prefs };
      if (!value || typeof value !== 'object' || Array.isArray(value) ||
          !['light', 'dark'].includes(value.theme) ||
          !['xs', 'sm', 'md', 'lg', 'xl'].includes(value.textSize) ||
          typeof value.backupReminder !== 'boolean') {
        throw new Error('Les paramètres d’affichage de ce fichier sont invalides.');
      }
      const palette = value.palette === 'azur' ? 'ocean' : (VALID_PALETTES.includes(value.palette) ? value.palette : (prefs.palette || 'ocean'));
      return {
        theme: value.theme,
        palette,
        textSize: value.textSize,
        backupReminder: value.backupReminder,
        coloredColumns: typeof value.coloredColumns === 'boolean' ? value.coloredColumns : false,
        summaryStudentListMode: ['select', 'grid'].includes(value.summaryStudentListMode)
          ? value.summaryStudentListMode
          : (prefs.summaryStudentListMode || 'grid')
      };
    }

    function getCurrentObservationSessionSnapshot(sessionOverride) {
      let session = sessionOverride;
      if (!session) {
        const activeTerm = appState.terms && appState.terms[appState.activeTerm];
        const subjectData = activeTerm && activeTerm.subjectData
          ? activeTerm.subjectData[appState.activeSubjectId]
          : null;
        session = subjectData && subjectData.currentObsSession;
      }
      if (!session) return 'null';
      const snapshot = JSON.parse(JSON.stringify(session));
      delete snapshot.savedDraftSnapshot;
      return JSON.stringify(snapshot);
    }

    function hasUncommittedObservationDraft() {
      if (appState.activeView !== 'viewQuickObs') return false;
      const activeTerm = appState.terms && appState.terms[appState.activeTerm];
      const subjectData = activeTerm && activeTerm.subjectData
        ? activeTerm.subjectData[appState.activeSubjectId]
        : null;
      const session = subjectData && subjectData.currentObsSession;
      if (!session) return false;
      const savedBaseline = session.savedDraftSnapshot || observationDraftBaseline;
      return savedBaseline !== null && getCurrentObservationSessionSnapshot(session) !== savedBaseline;
    }

    let pendingObservationExit = null;
    let modalUnsavedOpenedAt = 0;

    function closeObservationWarning(continueEditing) {
      if (continueEditing && Date.now() - modalUnsavedOpenedAt < 120) {
        return;
      }
      const modal = document.getElementById('modalUnsavedObservation');
      if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
      }
      const pendingAction = pendingObservationExit;
      pendingObservationExit = null;
      if (continueEditing) {
        if (appState.activeView === 'viewQuickObs') renderQuickObsView();
      } else if (pendingAction) {
        pendingAction();
      }
    }

    function requestObservationDraftExit(continueAction) {
      if (!hasUncommittedObservationDraft()) {
        continueAction();
        return true;
      }
      pendingObservationExit = continueAction;
      modalUnsavedOpenedAt = Date.now();
      const modal = document.getElementById('modalUnsavedObservation');
      modal.classList.remove('hidden');
      modal.classList.add('flex');
      window.setTimeout(() => {
        const stayBtn = document.getElementById('btnStayOnObservation');
        if (stayBtn && !modal.classList.contains('hidden')) stayBtn.focus();
      }, 60);
      return false;
    }

    let gradebookTransitionTimer = null;

    function navigateToView(viewId, updateState, options = {}) {
      const continueNavigation = () => {
        const changedView = appState.activeView !== viewId;
        const previousSubjectId = appState.activeSubjectId;
        const previousTerm = appState.activeTerm;
        if (viewId === 'viewGlobalReport' && appState.activeView !== 'viewGlobalReport') {
          competencyPanelOpen = false;
        }
        appState.selectedStudentId = null;
        if (updateState) updateState();
        const changedSubject = viewId === 'viewGradebook'
          && previousSubjectId !== appState.activeSubjectId;
        const changedTerm = viewId === 'viewGradebook'
          && previousTerm !== appState.activeTerm;
        if (viewId === 'viewStudents' || viewId === 'viewGlobalReport' || viewId === 'viewHome') expandedSubjectGroup = null;
        appState.activeView = viewId;
        renderAll();
        if (changedSubject || changedTerm) {
          const gradebook = document.getElementById('viewGradebook');
          if (gradebook) {
            clearTimeout(gradebookTransitionTimer);
            gradebook.classList.remove('is-subject-changing');
            void gradebook.offsetWidth;
            gradebook.classList.add('is-subject-changing');
            gradebookTransitionTimer = window.setTimeout(() => gradebook.classList.remove('is-subject-changing'), 180);
          }
        }
        if (!options.skipScrollTop && (changedView || updateState)) {
          const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
          window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' });
        }
      };
      return requestObservationDraftExit(continueNavigation);
    }

    function notifyUpdate(toastMsg) {
      if (toastMsg) {
        showToast(toastMsg);
      }
      scheduleAppStateSave();
    }

    let toastTimer = null;
    let toastHideTimer = null;
    function showToast(msg) {
      const toast = document.getElementById('toastNotification');
      const msgEl = document.getElementById('toastMessage');
      if (!toast || !msgEl) return;
      msgEl.textContent = msg;
      if (toastTimer) clearTimeout(toastTimer);
      if (toastHideTimer) clearTimeout(toastHideTimer);
      toast.classList.remove('toast-leaving', 'toast-entering');
      toast.classList.remove('hidden');
      toast.classList.add('flex');
      void toast.offsetWidth;
      toast.classList.add('toast-entering');
      toastTimer = setTimeout(() => {
        toast.classList.remove('toast-entering');
        toast.classList.add('toast-leaving');
        toastHideTimer = setTimeout(() => {
          toast.classList.add('hidden');
          toast.classList.remove('flex', 'toast-leaving');
        }, 160);
      }, 2400);
    }

    let autosaveTimer = null;

    function setupLegacyModalAccessibility() {
      const modalSelector = '#modalAddAssignment, #modalTargetLevels, #modalGroup, #modalDeleteLinked, #modalCommentBank, #modalUnsavedObservation';
      const openers = new WeakMap();
      const getVisibleModal = () => [...document.querySelectorAll(modalSelector)]
        .find(modal => !modal.classList.contains('hidden'));
      const getFocusable = modal => [...modal.querySelectorAll(
        'button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])'
      )].filter(element => element.getClientRects().length);
      document.querySelectorAll(modalSelector).forEach(modal => {
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-modal', 'true');
      });
      const observer = new MutationObserver(records => {
        records.forEach(record => {
          const modal = record.target;
          if (!(modal instanceof HTMLElement)) return;
          if (!modal.classList.contains('hidden')) {
            if (!openers.has(modal)) openers.set(modal, document.activeElement);
            window.setTimeout(() => {
              const controls = getFocusable(modal);
              if (controls.length && !modal.contains(document.activeElement)) controls[0].focus();
            }, 60);
          } else {
            const opener = openers.get(modal);
            openers.delete(modal);
            if (opener && opener.isConnected) opener.focus({ preventScroll: true });
          }
        });
      });
      document.querySelectorAll(modalSelector).forEach(modal => {
        observer.observe(modal, { attributes: true, attributeFilter: ['class'] });
      });
      document.addEventListener('keydown', event => {
        const modal = getVisibleModal();
        if (!modal) return;
        if (event.key === 'Escape') {
          event.preventDefault();
          const closeButton = modal.querySelector(
            '#btnCloseModalAssignment, #btnCancelModalAssignment, #btnCloseModalTargetLevels, #btnGroupClose, #btnGroupCancel, #btnDelLinkedClose, #btnDelLinkedCancel, #btnCbClose, #btnCbCancel, #btnStayOnObservation'
          );
          if (closeButton) closeButton.click();
          return;
        }
        if (event.key !== 'Tab') return;
        const controls = getFocusable(modal);
        if (!controls.length) return;
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      });
    }

    function scheduleAppStateSave() {
      if (autosaveTimer) clearTimeout(autosaveTimer);
      if (typeof updateCloseCarnetButton === 'function') updateCloseCarnetButton();
      if (activeFileHandle && getBackupSnapshot() !== lastSavedFileSnapshot && !fileWriteBlocked) {
        setFileSyncStatus('pending', activeFileWritable ? 'Modifications en attente' : 'À enregistrer : cliquez sur Sauvegarder');
      }
      autosaveTimer = setTimeout(() => {
        autosaveTimer = null;
        recordHistory();
        if (typeof updateUnlinkedSaveStatus === 'function') {
          updateUnlinkedSaveStatus();
        }
        if (!fileOperation && activeFileHandle && activeFileWritable && !fileWriteBlocked && getBackupSnapshot() !== lastSavedFileSnapshot) {
          queueLinkedFileSave();
        }
      }, 350);
    }

