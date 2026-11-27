    function updateHistoryButtons() {
      const u = document.getElementById('btnUndo');
      const r = document.getElementById('btnRedo');
      if (u) u.disabled = history.undo.length === 0;
      if (r) r.disabled = history.redo.length === 0;
    }
    const MAX_HISTORY_BYTES = 32 * 1024 * 1024;
    function trimHistory() {
      let bytes = [...history.undo, ...history.redo].reduce((sum, snap) => sum + snap.length * 2, 0);
      // Un très grand carnet garde au moins une action annulable.
      while (history.undo.length + history.redo.length > 60 ||
             (bytes > MAX_HISTORY_BYTES && history.undo.length + history.redo.length > 1)) {
        const stack = history.undo.length ? history.undo : history.redo;
        bytes -= stack.shift().length * 2;
      }
    }
    function recordHistory() {
      const snap = getEditableStateSnapshot();
      if (history.last === null) { history.last = snap; return; }
      if (snap === history.last) return;
      history.undo.push(history.last);
      history.redo = [];
      trimHistory();
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
        if (!SUBJECTS_CONFIG.some(s => s.id === appState.activeSubjectId)) appState.activeSubjectId = SUBJECTS_CONFIG[0]?.id || '';
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
      const snap = history.undo.pop();
      trimHistory();
      applyHistorySnapshot(snap);
      showToast('Action annulée');
    }
    function redoAction() {
      flushPendingSave();
      if (!history.redo.length) { showToast('Rien à rétablir'); return; }
      history.undo.push(getEditableStateSnapshot());
      const snap = history.redo.pop();
      trimHistory();
      applyHistorySnapshot(snap);
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

    const DEFAULT_ACCENT_COLOR = '#1d4ed8';
    const LEGACY_PALETTE_COLORS = {
      ocean: '#1d4ed8',
      foret: '#276749',
      boreal: '#4338ca',
      terracotta: '#b04332',
      prune: '#6b2f7a',
      ambre: '#a64d09',
      graphite: '#334155',
      azur: '#0369a1'
    };
    const VALID_PALETTES = ['ocean', 'foret', 'boreal', 'terracotta', 'prune', 'ambre', 'graphite'];
    const isValidHexColor = value => typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value.trim());
    const normalizeAccentHex = (color, fallbackPalette) => {
      if (isValidHexColor(color)) return color.trim().toLowerCase();
      if (fallbackPalette && LEGACY_PALETTE_COLORS[fallbackPalette]) return LEGACY_PALETTE_COLORS[fallbackPalette];
      return DEFAULT_ACCENT_COLOR;
    };
    function hexToHsl(hex) {
      const clean = normalizeAccentHex(hex).slice(1);
      const r = parseInt(clean.slice(0, 2), 16) / 255;
      const g = parseInt(clean.slice(2, 4), 16) / 255;
      const b = parseInt(clean.slice(4, 6), 16) / 255;
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      let h = 0;
      let s = 0;
      const l = (max + min) / 2;
      if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        else if (max === g) h = ((b - r) / d + 2) / 6;
        else h = ((r - g) / d + 4) / 6;
      }
      return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
    }
    function hslToHex(h, s, l) {
      const hh = ((h % 360) + 360) % 360;
      const ss = Math.max(0, Math.min(100, s)) / 100;
      const ll = Math.max(0, Math.min(100, l)) / 100;
      const c = (1 - Math.abs(2 * ll - 1)) * ss;
      const x = c * (1 - Math.abs(((hh / 60) % 2) - 1));
      const m = ll - c / 2;
      let r = 0, g = 0, b = 0;
      if (hh < 60) { r = c; g = x; }
      else if (hh < 120) { r = x; g = c; }
      else if (hh < 180) { g = c; b = x; }
      else if (hh < 240) { g = x; b = c; }
      else if (hh < 300) { r = x; b = c; }
      else { r = c; b = x; }
      const toHex = n => Math.round((n + m) * 255).toString(16).padStart(2, '0');
      return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    }
    function applyAccentColorVariables(root, hex, isDark) {
      const clamp = (val, min, max) => Math.max(min, Math.min(max, val));
      const { h, s, l } = hexToHsl(hex);
      const isNeutral = s < 10;
      const sBrand = isNeutral ? s : clamp(s, 42, 78);
      const sMist = isNeutral ? Math.min(s, 12) : clamp(s + 8, 48, 86);
      const compHue = (h + 26) % 360;
      if (isDark) {
        const darkBrandL = (h >= 42 && h <= 165) ? 44 : 52;
        const brand = hslToHex(h, isNeutral ? Math.min(s, 14) : clamp(sBrand, 48, 78), darkBrandL);
        const brandDeep = hslToHex(h, isNeutral ? Math.min(s, 14) : clamp(sBrand + 6, 52, 88), 80);
        const brandSoft = hslToHex(h, isNeutral ? Math.min(s, 12) : clamp(Math.round(sBrand * 0.52), 20, 46), 21);
        const accent = hslToHex(compHue, isNeutral ? Math.min(s, 12) : clamp(sBrand, 48, 82), 60);
        const mistA = hslToHex(h, sMist, 54);
        const mistB = hslToHex(compHue, isNeutral ? Math.min(s, 10) : clamp(sMist - 6, 44, 80), 58);
        root.style.setProperty('--brand', brand);
        root.style.setProperty('--brand-deep', brandDeep);
        root.style.setProperty('--brand-soft', brandSoft);
        root.style.setProperty('--accent', accent);
        root.style.setProperty('--mist-a', mistA);
        root.style.setProperty('--mist-b', mistB);
        root.style.setProperty('--studio-accent', brand);
        root.style.setProperty('--studio-accent-deep', brandDeep);
        root.style.setProperty('--studio-accent-soft', brandSoft);
        ['--paper', '--studio-bg', '--sidebar-bg-top', '--sidebar-bg-bottom', '--sidebar-border', '--sidebar-brand-border', '--studio-shadow-sm', '--studio-shadow-md']
          .forEach(prop => root.style.removeProperty(prop));
        return;
      }
      // Thème clair : texte neutre net, surfaces propres légèrement vivifiées, accent franc et dégradés équilibrés
      const lightBrandL = (h >= 42 && h <= 165) ? clamp(l, 32, 41) : clamp(l, 36, 47);
      const brand = hslToHex(h, sBrand, lightBrandL);
      const brandDeep = hslToHex(h, isNeutral ? s : clamp(sBrand + 6, 44, 82), clamp(lightBrandL - 13, 21, 30));
      const brandSoft = hslToHex(h, isNeutral ? Math.min(s, 12) : clamp(sBrand + 6, 48, 86), 93);
      const accent = hslToHex(compHue, isNeutral ? s : clamp(sBrand, 42, 78), 44);
      const mistA = hslToHex(h, sMist, 58);
      const mistB = hslToHex(compHue, isNeutral ? Math.min(s, 10) : clamp(sMist - 6, 42, 78), 64);
      const bgSat = isNeutral ? Math.min(s, 8) : Math.min(26, Math.round(sBrand * 0.34));
      const sideTopSat = isNeutral ? Math.min(s, 8) : Math.min(34, Math.round(sBrand * 0.44));
      const sideBotSat = isNeutral ? Math.min(s, 10) : Math.min(38, Math.round(sBrand * 0.5));
      const borderSat = isNeutral ? Math.min(s, 10) : Math.min(24, Math.round(sBrand * 0.32));
      const bgHex = hslToHex(h, bgSat, 95.5);
      const sideTopHex = hslToHex(h, sideTopSat, 97.4);
      const sideBotHex = hslToHex(h, sideBotSat, 94.6);
      const sideBorderHex = hslToHex(h, borderSat, 86.5);
      root.style.setProperty('--brand', brand);
      root.style.setProperty('--brand-deep', brandDeep);
      root.style.setProperty('--brand-soft', brandSoft);
      root.style.setProperty('--accent', accent);
      root.style.setProperty('--mist-a', mistA);
      root.style.setProperty('--mist-b', mistB);
      root.style.setProperty('--studio-accent', brand);
      root.style.setProperty('--studio-accent-deep', brandDeep);
      root.style.setProperty('--studio-accent-soft', brandSoft);
      root.style.setProperty('--paper', bgHex);
      root.style.setProperty('--studio-bg', bgHex);
      root.style.setProperty('--sidebar-bg-top', sideTopHex);
      root.style.setProperty('--sidebar-bg-bottom', sideBotHex);
      root.style.setProperty('--sidebar-border', sideBorderHex);
      root.style.setProperty('--sidebar-brand-border', sideBorderHex);
      root.style.setProperty('--studio-shadow-sm', `0 2px 8px -2px color-mix(in srgb, ${brand} 9%, rgba(15, 23, 42, .05)), 0 1px 2px rgba(15, 23, 42, .04)`);
      root.style.setProperty('--studio-shadow-md', `0 14px 32px -12px color-mix(in srgb, ${brand} 14%, rgba(15, 23, 42, .08)), 0 4px 12px -4px rgba(15, 23, 42, .05)`);
    }
    const prefs = { theme: 'light', palette: 'ocean', accentColor: DEFAULT_ACCENT_COLOR, textSize: 'md', backupReminder: true, coloredColumns: false, animations: true, summaryStudentListMode: 'grid', summaryStudentSort: 'lastName' };
    try {
      const savedPrefs = JSON.parse(window.localStorage.getItem('carnet_notes_prefs_2026_v1') || 'null');
      if (savedPrefs && typeof savedPrefs === 'object') {
        if (isValidHexColor(savedPrefs.accentColor)) prefs.accentColor = savedPrefs.accentColor.toLowerCase();
        else if (savedPrefs.palette && LEGACY_PALETTE_COLORS[savedPrefs.palette]) prefs.accentColor = LEGACY_PALETTE_COLORS[savedPrefs.palette];
        if (['xs', 'sm', 'md', 'lg', 'xl'].includes(savedPrefs.textSize)) prefs.textSize = savedPrefs.textSize;
        if (typeof savedPrefs.backupReminder === 'boolean') prefs.backupReminder = savedPrefs.backupReminder;
        if (typeof savedPrefs.coloredColumns === 'boolean') prefs.coloredColumns = savedPrefs.coloredColumns;
        if (['select', 'grid'].includes(savedPrefs.summaryStudentListMode)) prefs.summaryStudentListMode = savedPrefs.summaryStudentListMode;
        if (['firstName', 'lastName'].includes(savedPrefs.summaryStudentSort)) prefs.summaryStudentSort = savedPrefs.summaryStudentSort;
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
      arts: '#9e2a5b',
      ilss: '#0f766e'
    };
    let lastSavedFileSnapshot = null;
    let initialEditableSnapshot = null;
    function applyPrefs() {
      const root = document.documentElement;
      root.classList.add('design-studio');
      const activeColor = normalizeAccentHex(prefs.accentColor, prefs.palette);
      prefs.accentColor = activeColor;
      prefs.palette = 'ocean';
      root.setAttribute('data-palette', 'ocean');
      const isDark = prefs.theme === 'dark';
      root.classList.toggle('theme-dark', isDark);
      applyAccentColorVariables(root, activeColor, isDark);
      prefs.animations = true;
      root.classList.remove('reduce-motion');
      if (document.body) document.body.classList.remove('reduce-motion');
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
      const colorInput = document.getElementById('spAccentColor');
      const colorHexEl = document.getElementById('spAccentHex');
      const colorResetBtn = document.getElementById('btnResetAccentColor');
      if (colorInput && colorInput.value.toLowerCase() !== activeColor) colorInput.value = activeColor;
      if (colorHexEl) colorHexEl.textContent = activeColor.toUpperCase();
      if (colorResetBtn) colorResetBtn.disabled = activeColor === DEFAULT_ACCENT_COLOR;
      document.querySelectorAll('#settingsPanel [data-pref-check]').forEach(cb => {
        cb.checked = !!prefs[cb.getAttribute('data-pref-check')];
      });
      document.querySelectorAll('[data-gr-student-view]').forEach(btn => {
        const isActive = btn.getAttribute('data-gr-student-view') === prefs.summaryStudentListMode;
        btn.classList.toggle('is-active', isActive);
        btn.setAttribute('aria-pressed', String(isActive));
      });
      document.querySelectorAll('[data-gr-student-sort]').forEach(btn => {
        const isActive = btn.getAttribute('data-gr-student-sort') === prefs.summaryStudentSort;
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
      const accentColor = normalizeAccentHex(value.accentColor, value.palette);
      return {
        theme: value.theme,
        palette: 'ocean',
        accentColor,
        textSize: value.textSize,
        backupReminder: value.backupReminder,
        coloredColumns: typeof value.coloredColumns === 'boolean' ? value.coloredColumns : false,
        animations: true,
        summaryStudentListMode: ['select', 'grid'].includes(value.summaryStudentListMode)
          ? value.summaryStudentListMode
          : (prefs.summaryStudentListMode || 'grid'),
        summaryStudentSort: ['firstName', 'lastName'].includes(value.summaryStudentSort)
          ? value.summaryStudentSort
          : (prefs.summaryStudentSort || 'lastName')
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
    let activeCarnetTransition = null;

    function renderWithCarnetMerge(render, enabled = true) {
      const reducedMotion = typeof isReducedMotionEnabled === 'function' && isReducedMotionEnabled();
      if (!enabled || reducedMotion || activeCarnetTransition) {
        render();
        return;
      }
      if (document.startViewTransition) {
        try {
          activeCarnetTransition = document.startViewTransition(render);
          activeCarnetTransition.ready.catch(() => {});
          activeCarnetTransition.finished.catch(() => {}).finally(() => { activeCarnetTransition = null; });
        } catch {
          activeCarnetTransition = null;
          render();
        }
        return;
      }
      render();
      const workspace = document.getElementById('appWorkspace');
      if (!workspace) return;
      clearTimeout(gradebookTransitionTimer);
      workspace.classList.remove('is-carnet-merging');
      void workspace.offsetWidth;
      workspace.classList.add('is-carnet-merging');
      gradebookTransitionTimer = window.setTimeout(() => workspace.classList.remove('is-carnet-merging'), 170);
    }

    function navigateToView(viewId, updateState, options = {}) {
      const continueNavigation = () => {
        const changedView = appState.activeView !== viewId;
        const previousSubjectId = appState.activeSubjectId;
        const previousTerm = appState.activeTerm;
        const flashStudentId = options.flashStudentId || (
          appState.activeView === 'viewGlobalReport' && viewId === 'viewGradebook' && appState.selectedStudentId
            ? appState.selectedStudentId
            : null
        );
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
        renderWithCarnetMerge(renderAll, changedSubject || changedTerm);
        if (flashStudentId && viewId === 'viewGradebook') {
          window.setTimeout(() => {
            if (typeof flashGradebookStudentRow === 'function') flashGradebookStudentRow(flashStudentId);
          }, 50);
        } else if (!options.skipScrollTop && (changedView || updateState)) {
          const reducedMotion = isReducedMotionEnabled();
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

