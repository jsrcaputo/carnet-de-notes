// Les paliers et les cotes ILSS sont des repères qualitatifs, jamais des pourcentages.
const ACCUEIL_COMPETENCIES = [
  { id: 'oral', label: 'Communiquer oralement en français' },
  { id: 'lecture', label: 'Lire des textes variés en français' },
  { id: 'ecriture', label: 'Écrire des textes variés en français' }
];
const ACCUEIL_PALIERS_URL = 'https://cdn-contenu.quebec.ca/cdn-contenu/education/pfeq/primaire/PFEQ-paliers-evaluation-integration-scolaire-linguistique-primaire.pdf';
const ACCUEIL_INSTRUCTION_URL = 'https://cdn-contenu.quebec.ca/cdn-contenu/adm/min/education/publications-adm/education/instruction-annuelle/Instruction-annuelle-2026-2027.pdf';

function isAccueilGroup() {
  const group = appState.groups.find(item => item.id === appState.activeGroupId);
  return Boolean(group && (group.level === 'accueil' || group.classType === 'accueil'));
}

function normalizeAccueilData(value) {
  const source = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  const result = {};
  const text = value => typeof value === 'string' ? value : '';
  const palier = value => ['1', '2', '3', '4', '5'].includes(String(value)) ? String(value) : '';
  const cote = value => ['A', 'B', 'C', 'D'].includes(value) ? value : '';
  ['1', '2', '3'].forEach(term => {
    const raw = source[term];
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return;
    const judgments = {};
    const rawJudgments = raw.judgments && typeof raw.judgments === 'object' ? raw.judgments : {};
    ACCUEIL_COMPETENCIES.forEach(comp => {
      const item = rawJudgments[comp.id];
      if (!item || typeof item !== 'object' || Array.isArray(item)) return;
      const hasExplicitOverride = Object.prototype.hasOwnProperty.call(item, 'overridePalier') ||
        Object.prototype.hasOwnProperty.call(item, 'overrideCote');
      judgments[comp.id] = {
        palier: palier(item.palier), cote: cote(item.cote),
        overridePalier: hasExplicitOverride ? palier(item.overridePalier) : palier(item.palier),
        overrideCote: hasExplicitOverride ? cote(item.overrideCote) : cote(item.cote),
        comment: text(item.comment), culture: text(item.culture)
      };
    });
    const assessments = (Array.isArray(raw.assessments) ? raw.assessments : [])
      .filter(item => item && typeof item === 'object' && ACCUEIL_COMPETENCIES.some(comp => comp.id === item.competency))
      .map(item => ({
        competency: item.competency, palier: palier(item.palier), cote: cote(item.cote),
        date: /^\d{4}-\d{2}-\d{2}$/.test(item.date || '') ? item.date : '',
        activity: text(item.activity), observation: text(item.observation), culture: text(item.culture)
      }));
    const disciplines = {};
    Object.entries(raw.disciplines && typeof raw.disciplines === 'object' ? raw.disciplines : {}).forEach(([key, item]) => {
      if (!/^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/.test(key) ||
          ['__proto__', 'prototype', 'constructor'].includes(key) ||
          !item || typeof item !== 'object' || Array.isArray(item)) return;
      disciplines[key] = { label: text(item.label), cote: cote(item.cote), comment: text(item.comment) };
    });
    result[term] = { judgments, assessments, disciplines };
  });
  return result;
}

function accueilTerm(student, term) {
  if (!student.ilssByTerm) student.ilssByTerm = {};
  if (!student.ilssByTerm[term]) student.ilssByTerm[term] = { judgments: {}, assessments: [], disciplines: {} };
  if (!student.ilssByTerm[term].disciplines) student.ilssByTerm[term].disciplines = {};
  return student.ilssByTerm[term];
}

function getAccueilDisciplines() {
  const group = appState.groups.find(item => item.id === appState.activeGroupId);
  const selectedIds = new Set(group && group.subjectIds || []);
  const disciplines = new Map();
  ALL_SUBJECTS_CONFIG.filter(subject => selectedIds.has(subject.id)).forEach(subject => {
    const key = subject.group || subject.id;
    if (!disciplines.has(key)) disciplines.set(key, {
      key,
      label: subject.groupLabel || subject.shortName || subject.fullName
    });
  });
  return [...disciplines.values()];
}

function accueilLabel(item) {
  return [item && item.palier ? `Palier ${item.palier}` : '', item && item.cote ? `cote ${item.cote}` : '']
    .filter(Boolean).join(' · ') || 'Non établi';
}

function accueilOptions(values, selected, emptyLabel) {
  return `<option value="">${escapeHtml(emptyLabel)}</option>` + values.map(value =>
    `<option value="${value}"${selected === value ? ' selected' : ''}>${value}</option>`).join('');
}

let ilssEditorStudentId = '';
let ilssActiveAssignmentId = '';

function getIlssAssignments(subject, termId = appState.activeTerm) {
  const data = appState.terms && appState.terms[termId] &&
    appState.terms[termId].subjectData && appState.terms[termId].subjectData[subject.id];
  return data && Array.isArray(data.assignments) ? data.assignments.filter(item => item.isIlssAssessment) : [];
}

function getIlssAssignmentMeta(subject, termId, assignmentId, student, create = false) {
  const data = appState.terms[termId].subjectData[subject.id];
  const record = data.studentRecords[student.id];
  if (!record) return null;
  if (!record.scoreMeta[assignmentId] && create) record.scoreMeta[assignmentId] = {};
  const meta = record.scoreMeta[assignmentId] || null;
  if (meta && !Array.isArray(meta.quickComments)) meta.quickComments = [];
  if (meta && (!meta.criteria || typeof meta.criteria !== 'object' || Array.isArray(meta.criteria))) meta.criteria = {};
  return meta;
}

function medianQualitative(values, ranker) {
  const ranked = values
    .filter(value => value !== '' && value !== null && value !== undefined)
    .map(ranker)
    .filter(value => Number.isFinite(value))
    .sort((a, b) => a - b);
  if (!ranked.length) return '';
  return String(ranked[Math.floor((ranked.length - 1) / 2)]);
}

function getIlssAssignmentResult(subject, termId, assignment, student) {
  const meta = getIlssAssignmentMeta(subject, termId, assignment.id, student);
  if (!meta) return { palier: '', cote: '', meta: null };
  const criterionPalier = medianQualitative(
    Object.values(meta.criteria || {}),
    value => Number(value)
  );
  return {
    palier: String(meta.ilssPalier || criterionPalier || ''),
    cote: String(meta.ilssCote || ''),
    meta
  };
}

function suggestIlssJudgment(subject, termId, student) {
  const results = getIlssAssignments(subject, termId)
    .map(assignment => getIlssAssignmentResult(subject, termId, assignment, student));
  const palier = medianQualitative(results.map(item => item.palier), value => Number(value));
  const coteRanks = { D: 1, C: 2, B: 3, A: 4 };
  const coteRank = Number(medianQualitative(
    results.filter(item => item.cote && (!palier || !item.palier || item.palier === palier)).map(item => item.cote),
    value => coteRanks[value]
  ));
  const cote = Object.keys(coteRanks).find(key => coteRanks[key] === coteRank) || '';
  return { palier, cote };
}

function getIlssFinalJudgment(subject, termId, student) {
  const data = student.ilssByTerm && student.ilssByTerm[termId];
  const item = data && data.judgments && data.judgments[subject.ilssCompetency] || {};
  const suggestion = suggestIlssJudgment(subject, termId, student);
  const hasNewOverrides = item.overridePalier !== undefined || item.overrideCote !== undefined;
  const legacyPalier = !hasNewOverrides ? item.palier : '';
  const legacyCote = !hasNewOverrides ? item.cote : '';
  return {
    palier: item.overridePalier || legacyPalier || suggestion.palier,
    cote: item.overrideCote || legacyCote || suggestion.cote,
    suggestion,
    overridden: Boolean(item.overridePalier || item.overrideCote || legacyPalier || legacyCote)
  };
}

function getIlssDraftResult(draft) {
  const source = draft || {};
  const criterionPalier = medianQualitative(Object.values(source.criteria || {}), value => Number(value));
  return {
    palier: String(source.ilssPalier || criterionPalier || ''),
    cote: String(source.ilssCote || '')
  };
}

function startIlssObservationSession(subject, assignmentId = '', focusStudentId = '') {
  if (!appState.students.length) {
    showToast('Ajoutez d’abord un élève et choisissez son niveau.');
    navigateToView('viewStudents');
    return;
  }
  requestObservationDraftExit(() => {
    const subData = getActiveTermData().subjectData[subject.id];
    const assignment = assignmentId
      ? subData.assignments.find(item => item.id === assignmentId && item.isObservation)
      : null;
    const session = createBlankObsSession(appState.students);
    session.isIlss = true;
    session.editingAssignmentId = assignment ? assignment.id : null;
    session.title = assignment ? assignment.title || '' : '';
    session.date = assignment ? assignment.date || '' : new Date().toISOString().slice(0, 10);
    session.description = assignment ? assignment.description || '' : '';
    session.evidenceType = assignment ? assignment.evidenceType || 'observation' : 'observation';
    appState.students.forEach(student => {
      const meta = assignment && subData.studentRecords[student.id] &&
        subData.studentRecords[student.id].scoreMeta[assignment.id];
      session.studentDrafts[student.id] = {
        ...session.studentDrafts[student.id],
        criteria: meta && meta.criteria ? { ...meta.criteria } : {},
        ilssPalier: meta && meta.ilssPalier || '',
        ilssCote: meta && meta.ilssCote || '',
        quickComments: meta && Array.isArray(meta.quickComments) ? [...meta.quickComments] : [],
        comment: meta && meta.comment || ''
      };
    });
    session.savedDraftSnapshot = getCurrentObservationSessionSnapshot(session);
    subData.currentObsSession = session;
    appState.selectedStudentId = focusStudentId || ilssEditorStudentId || appState.students[0]?.id || null;
    ilssActiveAssignmentId = assignment ? assignment.id : '';
    ilssEditorStudentId = appState.selectedStudentId || '';
    appState.activeView = 'viewQuickObs';
    renderAll();
    observationDraftBaseline = session.savedDraftSnapshot;
    const title = document.getElementById('qoSessionTitleInput');
    if (title && !session.title) title.focus();
  });
}

function formatIlssResult(result) {
  const palier = result && result.palier ? `P${result.palier}` : '';
  const cote = result && result.cote ? result.cote : '';
  if (palier && cote) return `${palier} · ${cote}`;
  if (palier) return palier;
  if (cote) return `Cote ${cote}`;
  return '';
}

function getIlssResultClasses(result) {
  if (result && result.cote) return getBadgeColorClasses(result.cote);
  if (result && result.palier) return 'ilss-badge-palier';
  return 'ilss-badge-empty';
}

const ILSS_EVIDENCE_LABELS = Object.freeze({
  observation: 'Observation',
  conversation: 'Conversation',
  production: 'Production'
});

function formatIlssShortDate(isoDate) {
  if (!isoDate || !/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return isoDate || '';
  try {
    return new Date(`${isoDate}T12:00:00`).toLocaleDateString('fr-CA', { day: 'numeric', month: 'short' });
  } catch (_) {
    return isoDate;
  }
}

function getIlssJudgmentRecord(student, termId, competency) {
  const term = accueilTerm(student, termId);
  if (!term.judgments[competency]) {
    term.judgments[competency] = { palier: '', cote: '', comment: '', culture: '', overridePalier: '', overrideCote: '' };
  }
  return term.judgments[competency];
}

// Sélecteur palier/cote près du curseur, construit sur le modèle du sélecteur de cotes régulier.
function openIlssPicker(x, y, { current, suggestion, onPick, allowAuto, commentValue, onCommentSave }) {
  closeGradePicker();
  closeMouseBar();
  closeCellFlagPicker();
  hideNewEvalChoicesPopover();
  const state = { palier: current && current.palier || '', cote: current && current.cote || '' };
  let activeHint = '';
  const el = document.createElement('div');
  el.className = 'grade-picker ilss-picker';
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-label', 'Choisir un palier et une cote');
  const getHintText = () => {
    if (activeHint) return activeHint;
    if (state.cote) {
      const found = ILSS_COTES.find(([c]) => c === state.cote);
      if (found) return `${found[0]} : ${found[1]}`;
    }
    if (state.palier) {
      const desc = (ILSS_PALIERS[current && current.competency] || [])[Number(state.palier) - 1];
      if (desc) return `P${state.palier} : ${desc}`;
    }
    return 'Sélectionnez un palier (1–5) et une cote (A–D).';
  };
  const render = () => {
    el.innerHTML = '';
    const addLabel = text => {
      const label = document.createElement('div');
      label.className = 'ilss-picker-label';
      label.textContent = text;
      el.appendChild(label);
    };
    addLabel('Palier');
    const paliersRow = document.createElement('div');
    paliersRow.className = 'ilss-picker-paliers';
    ['1', '2', '3', '4', '5'].forEach(palier => {
      const desc = (ILSS_PALIERS[current && current.competency] || [])[Number(palier) - 1] || `Palier ${palier}`;
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `grade-picker-btn ilss-picker-palier${state.palier === palier ? ' is-current' : ''}`;
      button.textContent = `P${palier}`;
      button.title = desc;
      button.setAttribute('aria-pressed', String(state.palier === palier));
      button.addEventListener('mouseenter', () => {
        activeHint = `P${palier} : ${desc}`;
        const hintEl = el.querySelector('.ilss-picker-hint');
        if (hintEl) hintEl.textContent = activeHint;
      });
      button.addEventListener('mouseleave', () => {
        activeHint = '';
        const hintEl = el.querySelector('.ilss-picker-hint');
        if (hintEl) hintEl.textContent = getHintText();
      });
      button.addEventListener('click', () => {
        state.palier = state.palier === palier ? '' : palier;
        if (allowAuto && !state.palier && !state.cote) {
          closeGradePicker();
          onPick(null);
          return;
        }
        onPick({ palier: state.palier, cote: state.cote });
        render();
      });
      paliersRow.appendChild(button);
    });
    el.appendChild(paliersRow);

    addLabel('Cote');
    const cotesRow = document.createElement('div');
    cotesRow.className = 'ilss-picker-cotes';
    ILSS_COTES.forEach(([cote, description]) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `grade-picker-btn border ${getBadgeColorClasses(cote)}${state.cote === cote ? ' is-current' : ''}`;
      button.textContent = cote;
      button.title = description;
      button.setAttribute('aria-pressed', String(state.cote === cote));
      button.addEventListener('mouseenter', () => {
        activeHint = `${cote} : ${description}`;
        const hintEl = el.querySelector('.ilss-picker-hint');
        if (hintEl) hintEl.textContent = activeHint;
      });
      button.addEventListener('mouseleave', () => {
        activeHint = '';
        const hintEl = el.querySelector('.ilss-picker-hint');
        if (hintEl) hintEl.textContent = getHintText();
      });
      button.addEventListener('click', () => {
        state.cote = state.cote === cote ? '' : cote;
        if (allowAuto && !state.palier && !state.cote) {
          closeGradePicker();
          onPick(null);
          return;
        }
        onPick({ palier: state.palier, cote: state.cote });
        render();
      });
      cotesRow.appendChild(button);
    });
    el.appendChild(cotesRow);

    const hint = document.createElement('div');
    hint.className = 'ilss-picker-hint';
    hint.textContent = getHintText();
    el.appendChild(hint);

    if (typeof onCommentSave === 'function') {
      const noteWrap = document.createElement('div');
      noteWrap.className = 'ilss-picker-note-wrap';
      const noteInput = document.createElement('input');
      noteInput.type = 'text';
      noteInput.autocomplete = 'off';
      noteInput.className = 'ilss-picker-note-input';
      noteInput.placeholder = 'Note rapide d’observation…';
      noteInput.setAttribute('aria-label', 'Note rapide d’observation');
      noteInput.value = commentValue || '';
      noteInput.addEventListener('input', () => onCommentSave(noteInput.value));
      noteInput.addEventListener('keydown', event => {
        if (event.key === 'Enter') {
          event.preventDefault();
          closeGradePicker();
        }
      });
      noteWrap.appendChild(noteInput);
      el.appendChild(noteWrap);
    }

    if (allowAuto) {
      const auto = document.createElement('button');
      auto.type = 'button';
      auto.className = 'grade-picker-auto';
      const suggestionLabel = formatIlssResult(suggestion);
      auto.textContent = suggestionLabel ? `Auto (${suggestionLabel})` : 'Auto';
      auto.title = 'Revenir au jugement proposé à partir des évaluations';
      auto.addEventListener('click', () => {
        closeGradePicker();
        onPick(null);
      });
      el.appendChild(auto);
    }
  };
  render();
  el.style.visibility = 'hidden';
  document.body.appendChild(el);
  const w = el.offsetWidth, h = el.offsetHeight, m = 8;
  let left = x + 10, top = y + 12;
  if (left + w + m > window.innerWidth) left = Math.max(m, x - w - 10);
  if (top + h + m > window.innerHeight) top = Math.max(m, y - h - 12);
  el.style.left = `${Math.min(Math.max(m, left), Math.max(m, window.innerWidth - w - m))}px`;
  el.style.top = `${top}px`;
  el.style.visibility = '';
  gradePickerEl = el;
  document.addEventListener('mousedown', onGradePickerOutside, true);
  document.addEventListener('keydown', onGradePickerKey, true);
  window.addEventListener('scroll', closeGradePicker, true);
  const first = el.querySelector('button');
  if (first) first.focus({ preventScroll: true });
}

function openIlssCommentBank(anchor, competency, onPick) {
  const rect = anchor.getBoundingClientRect();
  openMouseBar(rect.left, rect.bottom, (ILSS_COMMENT_BANK[competency] || []).map(text => ({
    label: text,
    onPick: () => onPick(text)
  })));
  if (mouseBarEl) {
    mouseBarEl.classList.add('ilss-comment-bank');
    const w = mouseBarEl.offsetWidth, h = mouseBarEl.offsetHeight, m = 8;
    mouseBarEl.style.left = `${Math.min(Math.max(m, rect.right - w), window.innerWidth - w - m)}px`;
    mouseBarEl.style.top = `${Math.min(rect.bottom + 6, Math.max(m, window.innerHeight - h - m))}px`;
  }
}

function setIlssGradebookChrome(isIlss) {
  if (isIlss && typeof weightMode !== 'undefined' && weightMode) {
    weightMode = false;
    unlockedWeights.clear();
    weightLevel = '';
  }
  const weightButton = document.getElementById('btnWeightMode');
  if (weightButton) {
    weightButton.classList.toggle('hidden', isIlss);
    if (isIlss) weightButton.setAttribute('aria-expanded', 'false');
  }
  // Hors ILSS, le rendu régulier rétablit ces éléments selon weightMode et l’état des pondérations.
  ['weightControls', 'weightWarningBanner'].forEach(id => {
    const element = document.getElementById(id);
    if (!element) return;
    delete element.dataset.ilssHidden;
    if (isIlss) element.classList.remove('is-closing');
    if (isIlss) element.classList.add('hidden');
  });
  const average = document.getElementById('kpiClassAverage');
  const averageMetric = average && average.closest ? average.closest('.gradebook-metric') : null;
  if (averageMetric) averageMetric.classList.toggle('hidden', isIlss);
  const ilssMetric = document.getElementById('kpiIlssPositionedMetric');
  if (ilssMetric) ilssMetric.classList.toggle('hidden', !isIlss);
  const countMetric = document.getElementById('kpiAssignmentCount');
  const countLabel = countMetric && countMetric.previousElementSibling;
  if (countLabel) countLabel.textContent = isIlss ? 'Évaluations consignées' : 'Travaux et traces observables';
}

function renderIlssGradebookView(subject) {
  if (!subject || !subject.isIlss) return;
  const termId = appState.activeTerm;
  const competency = subject.ilssCompetency;
  const subData = appState.terms[termId].subjectData[subject.id];
  const assignments = getIlssAssignments(subject, termId);
  const scrollContainerEl = document.getElementById('gradebookScrollContainer');
  const savedScrollLeft = scrollContainerEl ? scrollContainerEl.scrollLeft : 0;
  const presentLevels = getPresentStudentLevels();
  const isMulti = presentLevels.length > 1;
  const activeLvlFilter = isMulti ? ensureValidGbLevelFilter() : 'ALL';
  const showGradeGroupLabels = isMulti && activeLvlFilter === 'ALL' && !isAccueilGroup();

  const filterButton = document.getElementById('btnClearStudentFilter');
  filterButton.classList.toggle('hidden', !gbFilter);
  filterButton.textContent = gbFilter ? `Recherche : ${gbFilter} ✕` : '';
  document.getElementById('kpiAssignmentCount').textContent = String(assignments.length);
  const positionedEl = document.getElementById('kpiIlssPositionedCount');
  if (positionedEl) {
    const positionedCount = appState.students.filter(st => {
      const f = getIlssFinalJudgment(subject, termId, st);
      return Boolean(f.palier || f.cote);
    }).length;
    positionedEl.textContent = `${positionedCount} / ${appState.students.length}`;
  }
  const hasGroup = typeof hasActiveGroup === 'function' ? hasActiveGroup() : true;
  const emptyTitle = document.getElementById('emptyRosterTitle');
  const emptyDesc = document.getElementById('emptyRosterDescription');
  const emptyBtn = document.getElementById('btnOpenStudentsFromEmpty');
  if (emptyTitle) emptyTitle.textContent = hasGroup ? 'Votre carnet ILSS est prêt.' : 'Créez d’abord un groupe.';
  if (emptyDesc) emptyDesc.textContent = hasGroup
    ? 'Ajoutez vos élèves et choisissez leur année scolaire pour consigner leurs paliers et cotes sans pourcentage.'
    : 'Un groupe est nécessaire avant d’ajouter des élèves.';
  if (emptyBtn) emptyBtn.textContent = hasGroup ? 'Ajouter des élèves' : 'Créer un groupe';

  const extraHeaders = [
    { label: 'Jugement d’étape', sub: 'Modifiable', minW: 'min-w-[145px]', width: 145 },
    { label: 'Commentaires au bulletin', sub: 'Rédaction ou banque de choix', minW: '', width: 420 }
  ];
  const extraColsWidth = extraHeaders.reduce((sum, header) => sum + header.width, 0);
  scrollContainerEl.querySelector('table').style.width =
    `calc(var(--gradebook-student-width) + ${extraColsWidth + assignments.length * 162}px)`;

  const headerRow = document.getElementById('gradebookHeaderRow');
  headerRow.innerHTML = '';
  const thStudent = document.createElement('th');
  thStudent.className = 'p-2.5 font-bold sticky left-0 bg-slate-900 z-10';
  thStudent.style.width = 'var(--gradebook-student-width)';
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
    [{ id: 'ALL', label: `Tous (${appState.students.length})` }, ...presentLevels.map(level => ({
      id: level,
      label: `${presentLevels.length > 2 ? formatShortLevelTag(level) : GRADE_LEVEL_LABELS[level]} (${appState.students.filter(student => String(student.gradeLevel) === level).length})`
    }))].forEach(level => {
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

  assignments.forEach(assignment => {
    const th = document.createElement('th');
    th.className = 'p-2 font-semibold text-center min-w-[162px] border-l border-slate-800 gb-assignment-column-header';
    th.style.width = '162px';
    th.dataset.assignmentColumn = assignment.id;
    const modeLabel = assignment.isObservation
      ? 'Observable'
      : (ILSS_EVIDENCE_LABELS[assignment.evidenceType] || 'Déjà réalisée');
    const dateShort = formatIlssShortDate(assignment.date);
    th.innerHTML = `
      <div class="flex items-center justify-center gap-1 px-1">
        <button type="button" data-title-view="${escapeHtml(assignment.id)}" class="asg-title-view" title="${assignment.isObservation ? 'Modifier cette évaluation observable, sa grille et ses données' : 'Modifier cette évaluation et ses paramètres'}"><span class="asg-title-text">${escapeHtml(assignment.title || 'Évaluation sans titre')}</span></button>
        <button type="button" data-del-asg="${escapeHtml(assignment.id)}" class="assignment-delete-button text-slate-400 hover:text-red-400 text-xs cursor-pointer no-print" aria-label="Supprimer l’évaluation ${escapeHtml(assignment.title)}" title="Supprimer cette colonne">✕</button>
      </div>
      <div class="mt-1 flex items-center justify-center gap-1 flex-wrap">
        <span class="text-[10px] font-semibold text-slate-400 normal-case tracking-normal">${escapeHtml(modeLabel)}${dateShort ? ` · ${escapeHtml(dateShort)}` : ''}</span>
      </div>`;
    headerRow.appendChild(th);
  });

  extraHeaders.forEach(header => {
    const th = document.createElement('th');
    th.className = `p-2 font-semibold text-center border-l border-slate-800 ${header.minW}`;
    th.style.width = `${header.width}px`;
    th.innerHTML = `<div>${header.label}</div><div class="text-[10px] text-slate-400 font-normal">${header.sub}</div>`;
    headerRow.appendChild(th);
  });

  headerRow.querySelectorAll('[data-title-view]').forEach(button => button.addEventListener('click', () => {
    const assignment = assignments.find(item => item.id === button.dataset.titleView);
    if (!assignment) return;
    if (assignment.isObservation) startIlssObservationSession(subject, assignment.id);
    else if (typeof window.openAssignmentForEditing === 'function') window.openAssignmentForEditing(assignment.id);
  }));
  headerRow.querySelectorAll('[data-del-asg]').forEach(button => button.addEventListener('click', () => {
    const assignment = assignments.find(item => item.id === button.dataset.delAsg);
    if (!assignment) return;
    if (button.dataset.confirm !== 'yes') {
      button.dataset.confirm = 'yes';
      button.textContent = 'Confirmer ?';
      button.setAttribute('aria-label', `Confirmer la suppression de ${assignment.title}`);
      window.setTimeout(() => {
        if (!button.isConnected) return;
        delete button.dataset.confirm;
        button.textContent = '✕';
        button.setAttribute('aria-label', `Supprimer l’évaluation ${assignment.title}`);
      }, 3000);
      return;
    }
    subData.assignments = subData.assignments.filter(item => item.id !== assignment.id);
    Object.values(subData.studentRecords).forEach(record => {
      if (record && record.scoreMeta) delete record.scoreMeta[assignment.id];
    });
    if (subData.currentObsSession && subData.currentObsSession.editingAssignmentId === assignment.id) {
      subData.currentObsSession = createBlankObsSession(appState.students);
    }
    notifyUpdate('Colonne supprimée');
    renderAll();
  }));

  const tbody = document.getElementById('gradebookBody');
  tbody.innerHTML = '';
  const orderedStudents = getGradebookStudents(subject);
  const gradebookStudents = isMulti && activeLvlFilter === 'ALL'
    ? [
        ...presentLevels.flatMap(level => orderedStudents.filter(student => String(student.gradeLevel) === level)),
        ...orderedStudents.filter(student => !presentLevels.includes(String(student.gradeLevel)))
      ]
    : orderedStudents;
  let lastRenderedLevel = null;
  let renderedStudentIndex = 0;

  gradebookStudents.forEach(student => {
    if (gbFilter && !studentMatches(student, gbFilter)) return;
    if (isMulti && activeLvlFilter !== 'ALL' && String(student.gradeLevel) !== activeLvlFilter) return;
    const gradeLevel = String(student.gradeLevel || '');
    const startsGradeGroup = showGradeGroupLabels && gradeLevel !== lastRenderedLevel;
    lastRenderedLevel = gradeLevel;

    const tr = document.createElement('tr');
    tr.dataset.studentId = student.id;
    tr.className = `${renderedStudentIndex % 2 === 0 ? 'bg-white hover:bg-slate-50/80' : 'bg-slate-50/40 hover:bg-slate-50/80'}${startsGradeGroup ? ' gb-grade-group-start' : ''}`;
    renderedStudentIndex += 1;

    const tdStudent = document.createElement('td');
    tdStudent.className = 'p-2.5 sticky left-0 bg-inherit z-10 border-r border-slate-100';
    if (startsGradeGroup) {
      const groupLabel = document.createElement('div');
      groupLabel.className = 'gb-grade-group-label';
      const groupCount = gradebookStudents.filter(item => String(item.gradeLevel) === gradeLevel &&
        (!gbFilter || studentMatches(item, gbFilter))).length;
      groupLabel.textContent = `${GRADE_LEVEL_LABELS[gradeLevel] || 'Niveau à choisir'} (${groupCount})`;
      tdStudent.appendChild(groupLabel);
    }
    const studentName = document.createElement('div');
    studentName.className = 'gb-student-name font-bold text-slate-900';
    studentName.textContent = student.name;
    tdStudent.appendChild(studentName);
    if (!showGradeGroupLabels) {
      const studentMeta = document.createElement('div');
      studentMeta.className = 'gb-student-meta text-[10px] text-indigo-700 leading-tight mt-0.5 flex flex-wrap items-center gap-1';
      const cycle = getStudentCycle(gradeLevel);
      studentMeta.textContent = cycle
        ? `${GRADE_LEVEL_LABELS[gradeLevel]} • ${CYCLE_LABELS[cycle]}`
        : 'Niveau à choisir';
      tdStudent.appendChild(studentMeta);
    }
    tr.appendChild(tdStudent);

    assignments.forEach(assignment => {
      const td = document.createElement('td');
      td.className = 'p-2 text-center border-r border-slate-100';
      td.dataset.assignmentColumn = assignment.id;
      const result = getIlssAssignmentResult(subject, termId, assignment, student);
      const label = formatIlssResult(result);
      const cellWrap = document.createElement('div');
      cellWrap.className = 'score-cell-wrap';
      const cellTop = document.createElement('div');
      cellTop.className = 'score-cell-top';
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.ilssCell = assignment.id;
      button.className = `px-2.5 py-1.5 rounded-lg border text-xs font-bold transition cursor-pointer inline-flex items-center justify-center gap-1.5 whitespace-nowrap ${getIlssResultClasses(result)}`;
      const hasNotes = Boolean(result.meta && ((result.meta.quickComments || []).length > 0 || String(result.meta.comment || '').trim()));
      const noteIcon = hasNotes
        ? '<svg class="ilss-cell-note-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>'
        : '';
      button.innerHTML = `<span>${escapeHtml(label || '—')}</span>${noteIcon}`;
      const noteText = result.meta && String(result.meta.comment || '').trim()
        ? `\nObservation : ${String(result.meta.comment).trim()}`
        : '';
      button.title = (assignment.isObservation
        ? 'Cliquez pour consulter ou modifier la grille observable de cet élève'
        : 'Cliquez pour choisir le palier et la cote de cette évaluation') + noteText;
      button.setAttribute('aria-label', `${student.name}, ${assignment.title} : ${label || 'non évalué'}`);
      button.addEventListener('click', event => {
        if (assignment.isObservation) {
          startIlssObservationSession(subject, assignment.id, student.id);
          return;
        }
        openIlssPicker(event.clientX || button.getBoundingClientRect().left, event.clientY || button.getBoundingClientRect().bottom, {
          current: { palier: result.palier, cote: result.cote, competency },
          commentValue: result.meta ? (result.meta.comment || '') : '',
          onCommentSave: text => {
            const meta = getIlssAssignmentMeta(subject, termId, assignment.id, student, true);
            if (!meta) return;
            meta.comment = text;
            scheduleAppStateSave();
          },
          onPick: value => {
            const meta = getIlssAssignmentMeta(subject, termId, assignment.id, student, true);
            if (!meta) return;
            meta.ilssPalier = value ? value.palier : '';
            meta.ilssCote = value ? value.cote : '';
            scheduleAppStateSave();
            renderGradebookView();
          }
        });
      });
      cellTop.appendChild(button);
      cellWrap.appendChild(cellTop);
      td.appendChild(cellWrap);
      tr.appendChild(td);
    });

    const final = getIlssFinalJudgment(subject, termId, student);
    const tdFinal = document.createElement('td');
    tdFinal.className = 'p-2 text-center border-r border-slate-100';
    const finalButton = document.createElement('button');
    finalButton.type = 'button';
    finalButton.dataset.ilssFinal = student.id;
    const finalLabel = formatIlssResult(final);
    finalButton.className = `final-grade-btn px-2.5 py-1 rounded-lg border text-[11px] font-bold transition cursor-pointer inline-flex items-center justify-center gap-1 whitespace-nowrap ${final.palier || final.cote ? getIlssResultClasses(final) : 'ilss-badge-empty'}`;
    finalButton.innerHTML = `<span>${escapeHtml(finalLabel || 'À établir')}${final.overridden ? '<span class="adj-star" title="Jugement ajusté manuellement par l’enseignant">*</span>' : ''}</span>`;
    const suggestionLabel = formatIlssResult(final.suggestion);
    finalButton.title = final.overridden
      ? `Ajusté manuellement · proposition : ${suggestionLabel || 'aucune'}`
      : suggestionLabel
        ? 'Proposé à partir des évaluations (médiane) · cliquer pour ajuster'
        : (assignments.length ? 'Évaluations à compléter · cliquer pour établir' : 'Aucune évaluation consignée · cliquer pour établir');
    finalButton.addEventListener('click', event => {
      openIlssPicker(event.clientX || finalButton.getBoundingClientRect().left, event.clientY || finalButton.getBoundingClientRect().bottom, {
        current: { palier: final.palier, cote: final.cote, competency },
        suggestion: final.suggestion,
        allowAuto: true,
        onPick: value => {
          const judgment = getIlssJudgmentRecord(student, termId, competency);
          judgment.overridePalier = value ? value.palier : '';
          judgment.overrideCote = value ? value.cote : '';
          const next = getIlssFinalJudgment(subject, termId, student);
          judgment.palier = next.palier;
          judgment.cote = next.cote;
          notifyUpdate(value
            ? `Jugement d’étape de ${student.name} : ${formatIlssResult(next) || 'à établir'}`
            : `Jugement d’étape de ${student.name} : proposition automatique`);
          renderGradebookView();
        }
      });
    });
    tdFinal.appendChild(finalButton);
    tr.appendChild(tdFinal);

    const tdComment = document.createElement('td');
    tdComment.className = 'p-2';
    const commentWrap = document.createElement('div');
    commentWrap.className = 'comment-cell-wrap';
    const commentInput = document.createElement('input');
    commentInput.type = 'text';
    commentInput.autocomplete = 'off';
    commentInput.placeholder = 'Commentaire au bulletin…';
    commentInput.value = student.ilssByTerm?.[termId]?.judgments?.[competency]?.comment || '';
    commentInput.className = 'w-full px-2 py-1 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500';
    commentInput.addEventListener('input', () => {
      getIlssJudgmentRecord(student, termId, competency).comment = commentInput.value;
      scheduleAppStateSave();
    });
    const bankButton = document.createElement('button');
    bankButton.type = 'button';
    bankButton.className = 'btn-open-cb no-print';
    bankButton.title = 'Banque de commentaires ILSS';
    bankButton.setAttribute('aria-label', `Ouvrir la banque de commentaires pour ${student.name}`);
    bankButton.innerHTML = '<svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><path d="M8 9h8"/><path d="M8 13h5"/></svg>';
    bankButton.addEventListener('click', () => {
      if (typeof openCommentBankModal === 'function') {
        openCommentBankModal(student.id, subject.id, termId);
      } else {
        openIlssCommentBank(bankButton, competency, text => {
          const current = commentInput.value.trim();
          commentInput.value = current ? `${current} ${text}` : text;
          getIlssJudgmentRecord(student, termId, competency).comment = commentInput.value;
          notifyUpdate('Commentaire ajouté.');
        });
      }
    });
    commentWrap.append(commentInput, bankButton);
    tdComment.appendChild(commentWrap);
    tr.appendChild(tdComment);
    tbody.appendChild(tr);
  });

  if (scrollContainerEl && savedScrollLeft > 0) scrollContainerEl.scrollLeft = savedScrollLeft;
  updateGradebookTopScroll();
}

function commitIlssObservationSession(subject) {
  const termId = appState.activeTerm;
  const subData = appState.terms[termId].subjectData[subject.id];
  const session = subData.currentObsSession;
  if (!session || !session.isIlss) return;
  const title = String(session.title || '').trim();
  if (!title) {
    showToast('Ajoutez un nom à la trace avant de l’enregistrer.');
    document.getElementById('qoSessionTitleInput')?.focus();
    return;
  }
  const hasEvidence = Object.values(session.studentDrafts).some(draft =>
    Object.keys(draft.criteria || {}).length ||
    draft.ilssPalier || draft.ilssCote ||
    (draft.quickComments || []).length ||
    String(draft.comment || '').trim());
  if (!hasEvidence) {
    showToast('Consignez au moins un critère, une cote ou une observation.');
    return;
  }
  const id = session.editingAssignmentId ||
    `ilss_asg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const existing = subData.assignments.find(item => item.id === id);
  const assignment = {
    id,
    title,
    date: existing ? existing.date || '' : session.date || '',
    description: session.description || '',
    evidenceType: session.evidenceType || 'observation',
    isIlssAssessment: true,
    isObservation: true,
    targetLevels: []
  };
  if (existing) Object.assign(existing, assignment);
  else subData.assignments.push(assignment);
  appState.students.forEach(student => {
    const draft = session.studentDrafts[student.id] || {};
    const record = subData.studentRecords[student.id];
    if (!record) return;
    record.scoreMeta[id] = {
      ilssPalier: draft.ilssPalier || '',
      ilssCote: draft.ilssCote || '',
      criteria: { ...(draft.criteria || {}) },
      comment: draft.comment || '',
      quickComments: [...(draft.quickComments || [])]
    };
  });
  const blank = createBlankObsSession(appState.students);
  blank.savedDraftSnapshot = getCurrentObservationSessionSnapshot(blank);
  subData.currentObsSession = blank;
  observationDraftBaseline = blank.savedDraftSnapshot;
  notifyUpdate(existing ? `Trace « ${title} » mise à jour dans le carnet` : `Trace « ${title} » enregistrée au carnet`);
  navigateToView('viewGradebook');
}

function clearIlssObservationDraft(draft) {
  if (!draft) return;
  draft.criteria = {};
  draft.ilssPalier = '';
  draft.ilssCote = '';
  draft.quickComments = [];
  draft.comment = '';
}

const ILSS_HIDDEN_OBSERVATION_IDS = [
  'qoTargetLevelsBox', 'qoLinkedPartsBox', 'qoToolModeBar', 'qoWeightPresetBar',
  'prescoRubricNotice', 'firstCycleExplorationNotice', 'qoCategoryTabs', 'qoPreviousWritten', 'btnQoResetOverride'
];

function restoreRegularObservationChrome() {
  document.querySelectorAll('#viewQuickObs [data-ilss-hidden="true"]').forEach(element => {
    delete element.dataset.ilssHidden;
    element.classList.remove('hidden');
  });
  const table = document.querySelector('#qoMatrixScrollWrap .rubric-matrix-table');
  if (table) table.classList.remove('ilss-rubric');
  const clearButton = document.getElementById('btnClearCurrentStudentObs');
  if (clearButton && clearButton.dataset.regularLabel) {
    clearButton.textContent = clearButton.dataset.regularLabel;
    delete clearButton.dataset.regularLabel;
  }
  const titleInput = document.getElementById('qoSessionTitleInput');
  if (titleInput && titleInput.dataset.regularPlaceholder) {
    titleInput.placeholder = titleInput.dataset.regularPlaceholder;
    delete titleInput.dataset.regularPlaceholder;
  }
  const sideKicker = document.querySelector('#qoSidePanel .qo-side-kicker');
  if (sideKicker) sideKicker.textContent = 'Observations';
  document.getElementById('qoIlssResultBox')?.remove();
  const source = document.querySelector('#qoSidePanel .qo-observation-source');
  if (source && source.dataset.regularHtml) {
    source.innerHTML = source.dataset.regularHtml;
    delete source.dataset.regularHtml;
  }
}

function renderIlssObservationWorkspace(subject) {
  const termId = appState.activeTerm;
  const subData = appState.terms[termId].subjectData[subject.id];
  const session = subData.currentObsSession;
  if (!session || !session.isIlss) {
    navigateToView('viewGradebook');
    return;
  }
  const competency = subject.ilssCompetency;
  const presentLevels = getPresentStudentLevels();
  const isMulti = presentLevels.length > 1;
  ILSS_HIDDEN_OBSERVATION_IDS.forEach(id => {
    const element = document.getElementById(id);
    if (!element || element.classList.contains('hidden')) return;
    element.dataset.ilssHidden = 'true';
    element.classList.add('hidden');
  });

  appState.students.forEach(student => {
    const draft = session.studentDrafts[student.id] || (session.studentDrafts[student.id] = {});
    if (!Array.isArray(draft.quickComments)) draft.quickComments = [];
    if (!draft.criteria || typeof draft.criteria !== 'object' || Array.isArray(draft.criteria)) draft.criteria = {};
  });
  let student = appState.students.find(item => item.id === appState.selectedStudentId) || null;
  const draft = student ? session.studentDrafts[student.id] : null;
  const cycle = student ? getStudentCycle(student.gradeLevel) : null;

  document.getElementById('qoSubjectBadge').textContent = `${subject.fullName} • Étape ${termId}`;
  document.getElementById('sgCurrentStudentName').textContent = student
    ? `${student.name} — ${GRADE_LEVEL_LABELS[student.gradeLevel] || 'niveau à choisir'}${cycle ? ` (${CYCLE_LABELS[cycle]})` : ''}`
    : 'Sélectionner un nom';
  document.getElementById('qoBottomStudentName').textContent = student ? student.name : 'Sélectionner un nom';
  document.getElementById('btnCommitTopLabel').textContent = 'Enregistrer au carnet';
  const titleInput = document.getElementById('qoSessionTitleInput');
  if (titleInput) {
    if (!titleInput.dataset.regularPlaceholder) {
      titleInput.dataset.regularPlaceholder = titleInput.placeholder || '';
    }
    const placeholders = {
      oral: 'Ex. : Causerie du matin, jeu de rôle, échange guidé...',
      lecture: 'Ex. : Lecture guidée, album illustré, repérage d’indices...',
      ecriture: 'Ex. : Court récit, message illustré, phrases sur un thème...'
    };
    titleInput.placeholder = placeholders[competency] || 'Ex. : Activité ou trace ILSS observée...';
    if (document.activeElement !== titleInput) titleInput.value = session.title || '';
  }
  const clearButton = document.getElementById('btnClearCurrentStudentObs');
  if (clearButton && !clearButton.dataset.regularLabel) {
    clearButton.dataset.regularLabel = clearButton.textContent.trim();
    clearButton.textContent = 'Effacer la grille de cet élève';
  }

  const studentGrid = document.getElementById('qoStudentGrid');
  studentGrid.innerHTML = '';
  const totalGridCriteria = (ILSS_OBSERVABLE_GRIDS[competency] || []).length;
  appState.students.forEach(item => {
    const itemDraft = session.studentDrafts[item.id] || {};
    const result = getIlssDraftResult(itemDraft);
    const label = formatIlssResult(result);
    const critDone = Object.keys(itemDraft.criteria || {}).length;
    const hasObsOnly = !label && !critDone && ((itemDraft.quickComments || []).length > 0 || Boolean(String(itemDraft.comment || '').trim()));
    const isSelected = Boolean(student && student.id === item.id);
    const button = document.createElement('button');
    button.type = 'button';
    button.setAttribute('aria-pressed', String(isSelected));
    button.className = `qo-student-btn w-full flex items-center justify-between gap-1 truncate${isSelected ? ' is-selected' : ''}`;
    const shortLevel = isMulti && item.gradeLevel ? ` <span class="opacity-70 text-[10px]">(${escapeHtml(formatShortLevelTag(item.gradeLevel))})</span>` : '';
    const statusPill = label
      ? `<span class="qo-student-status px-1.5 py-0.2 rounded border text-[10px] font-extrabold ${getIlssResultClasses(result)}">${escapeHtml(label)}</span>`
      : critDone
        ? `<span class="qo-student-status px-1.5 py-0.2 rounded text-[10px] ilss-badge-palier font-bold">${critDone}/${totalGridCriteria}</span>`
        : hasObsOnly
          ? '<span class="qo-student-status px-1.5 py-0.2 rounded text-[10px] ilss-badge-palier font-bold">Obs.</span>'
          : '<span class="qo-student-status px-1.5 py-0.2 rounded text-[10px] ilss-badge-empty font-bold">—</span>';
    button.innerHTML = `<span class="qo-student-name truncate">${escapeHtml(item.name)}${shortLevel}</span>${statusPill}`;
    button.addEventListener('click', () => {
      appState.selectedStudentId = item.id;
      ilssEditorStudentId = item.id;
      renderQuickObsView();
    });
    studentGrid.appendChild(button);
  });

  const table = document.querySelector('#qoMatrixScrollWrap .rubric-matrix-table');
  table.classList.add('ilss-rubric');
  const paliers = ILSS_PALIERS[competency] || [];
  document.getElementById('sgMatrixHead').innerHTML = `
    <tr class="bg-slate-100 text-slate-800 text-[11px]">
      <th class="p-2 border border-slate-200 w-[15%] font-bold text-left">Critère observé<br>(1 choix / rangée)</th>
      ${[1, 2, 3, 4, 5].map(palier => `<th class="p-2 border border-slate-200 w-[17%] text-center rubric-col-${'ABCDE'[palier - 1]}" title="${escapeHtml(paliers[palier - 1] || '')}">
        <div class="font-extrabold">Palier ${palier}</div>
        <div class="mt-1 text-[10px] font-semibold">${['Début', 'Familier', 'Plus précis', 'Plus complexe', 'Diversifié'][palier - 1]}</div>
      </th>`).join('')}
    </tr>`;

  const explanation = document.getElementById('sgMajorityExplanation');
  const tbody = document.getElementById('sgMatrixBody');
  tbody.innerHTML = '';
  const liveBadge = document.getElementById('qoSideLiveBadge');
  const caption = document.getElementById('qoInspirationCaption');
  if (caption) {
    caption.innerHTML = `Grille locale inspirée des <a href="${ILSS_PALIERS_URL}" target="_blank" rel="noopener noreferrer">paliers d’évaluation ILSS du MEQ ↗</a>. Le palier proposé correspond à la médiane des critères observés; la cote (A à D) situe l’élève par rapport aux exigences des tâches de ce palier.`;
  }
  if (!student || !draft) {
    explanation.textContent = 'Sélectionner un nom ci-dessus pour remplir la grille d’évaluation.';
    tbody.innerHTML = '<tr><td colspan="6" class="p-6 text-center text-sm font-semibold text-slate-600 bg-slate-50">Sélectionner un nom ci-dessus pour afficher et remplir la grille d’évaluation de l’élève.</td></tr>';
    if (liveBadge) liveBadge.classList.add('hidden');
    renderIlssObservationSidePanel(subject, session, null);
    return;
  }

  const result = getIlssDraftResult(draft);
  const criteriaCount = Object.keys(draft.criteria).length;
  const gridCriteria = ILSS_OBSERVABLE_GRIDS[competency] || [];
  explanation.innerHTML = `${criteriaCount
    ? `<strong>${criteriaCount} / ${gridCriteria.length} critère(s) observé(s)</strong> → ${draft.ilssPalier ? 'Palier choisi :' : 'Palier proposé :'} `
    : ''}${result.palier || result.cote
    ? `<span class="px-2 py-0.5 rounded border ${getIlssResultClasses(result)} font-extrabold">${escapeHtml(formatIlssResult(result))}</span>`
    : ''} <span class="qo-ilss-guidance">${escapeHtml(ILSS_CYCLE_GUIDANCE[cycle] || 'Choisissez le niveau de cet élève dans sa fiche pour afficher les repères de son cycle.')}</span>`;
  if (liveBadge) {
    const label = formatIlssResult(result);
    liveBadge.classList.toggle('hidden', !label);
    liveBadge.className = `shrink-0 px-2 py-0.5 rounded-md border text-[11px] font-extrabold whitespace-nowrap ${getIlssResultClasses(result)}${label ? '' : ' hidden'}`;
    liveBadge.textContent = label;
  }

  gridCriteria.forEach(criterion => {
    const tr = document.createElement('tr');
    tr.className = 'border-b border-slate-200 align-top';
    const tdTitle = document.createElement('td');
    tdTitle.className = 'qo-crit-title p-2 font-bold text-slate-900 bg-slate-50 border border-slate-200 break-words';
    const titleText = document.createElement('div');
    titleText.textContent = criterion.label;
    const badgeWrap = document.createElement('div');
    badgeWrap.className = 'mt-1 flex flex-wrap items-center gap-1';
    badgeWrap.innerHTML = '<span class="qo-badge-scored inline-block max-w-full px-1.5 py-0.5 rounded text-[9px] leading-tight font-semibold bg-indigo-50 text-indigo-800 border border-indigo-200">Critère observé</span>';
    tdTitle.append(titleText, badgeWrap);
    tr.appendChild(tdTitle);
    criterion.manifestations.forEach((manifestation, index) => {
      const palier = String(index + 1);
      const isChecked = draft.criteria[criterion.id] === palier;
      const td = document.createElement('td');
      td.className = 'p-1.5 border border-slate-200 space-y-1';
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.rubricKey = `${criterion.id}_${palier}`;
      button.setAttribute('aria-pressed', String(isChecked));
      button.className = `rubric-stmt-btn p-1.5 rounded-lg border text-[11px] leading-snug transition cursor-pointer ${isChecked
        ? `stmt-checked-${'ABCDE'[index]}`
        : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'}`;
      button.innerHTML = `
        <span aria-hidden="true" class="rubric-stmt-check mt-0.5 w-3.5 h-3.5 rounded-full flex-shrink-0 flex items-center justify-center border ${isChecked ? 'bg-slate-900 text-white border-slate-900' : 'border-slate-300 bg-white'} text-[9px] font-bold">${isChecked ? '✓' : ''}</span>
        <span class="rubric-stmt-text flex-1">${escapeHtml(manifestation)}</span>`;
      button.addEventListener('click', () => {
        const hadFocus = document.activeElement === button;
        if (draft.criteria[criterion.id] === palier) delete draft.criteria[criterion.id];
        else draft.criteria[criterion.id] = palier;
        scheduleAppStateSave();
        renderQuickObsView();
        if (hadFocus) tbody.querySelector(`[data-rubric-key="${criterion.id}_${palier}"]`)?.focus({ preventScroll: true });
      });
      td.appendChild(button);
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });

  renderIlssObservationSidePanel(subject, session, student);
}

function renderIlssObservationSidePanel(subject, session, student) {
  const competency = subject.ilssCompetency;
  const draft = student ? session.studentDrafts[student.id] : null;
  const sideKicker = document.querySelector('#qoSidePanel .qo-side-kicker');
  if (sideKicker) sideKicker.textContent = 'Résultat et observations';
  const source = document.querySelector('#qoSidePanel .qo-observation-source');
  if (source && !source.dataset.regularHtml) {
    source.dataset.regularHtml = source.innerHTML;
    source.innerHTML = `Repères locaux inspirés du <a href="${ILSS_PROGRAM_URL}" target="_blank" rel="noopener noreferrer">programme ILSS du MEQ ↗</a>, et non une grille officielle. Les paliers décrivent l’intégration linguistique, pas un retard.`;
  }

  let resultBox = document.getElementById('qoIlssResultBox');
  if (!resultBox) {
    resultBox = document.createElement('div');
    resultBox.id = 'qoIlssResultBox';
    resultBox.className = 'qo-ilss-result space-y-2';
    document.querySelector('#qoSidePanel .qo-observations').before(resultBox);
  }
  resultBox.innerHTML = '';
  const computed = draft ? getIlssDraftResult({ criteria: draft.criteria }) : { palier: '', cote: '' };
  const addSegment = (heading, values, currentValue, onPick, titles, getExtraClass) => {
    const wrap = document.createElement('div');
    const label = document.createElement('div');
    label.className = 'qo-ilss-label';
    label.textContent = heading;
    const row = document.createElement('div');
    row.className = 'qo-category-tabs';
    row.setAttribute('role', 'group');
    row.setAttribute('aria-label', heading);
    values.forEach((value, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      const extra = typeof getExtraClass === 'function' ? getExtraClass(value, currentValue === value.id) : '';
      button.className = `qo-category${extra ? ` ${extra}` : ''}`;
      button.disabled = !draft;
      button.setAttribute('aria-pressed', String(currentValue === value.id));
      button.textContent = value.label;
      if (titles && titles[index]) button.title = titles[index];
      button.addEventListener('click', () => onPick(value.id));
      row.appendChild(button);
    });
    wrap.append(label, row);
    resultBox.appendChild(wrap);
  };
  addSegment('Nature de la trace (triangulation)',
    [
      { id: 'observation', label: 'Observation' },
      { id: 'conversation', label: 'Conversation' },
      { id: 'production', label: 'Production' }
    ],
    session.evidenceType || 'observation',
    value => {
      session.evidenceType = value;
      scheduleAppStateSave();
      renderQuickObsView();
    },
    ['Observation directe en classe', 'Échange ou entretien avec l’élève', 'Trace écrite ou réalisation concrète']);
  addSegment('Palier de la tâche',
    [{ id: '', label: computed.palier ? `Auto (P${computed.palier})` : 'Auto' }, ...['1', '2', '3', '4', '5'].map(palier => ({ id: palier, label: `P${palier}` }))],
    draft ? draft.ilssPalier || '' : '',
    value => {
      draft.ilssPalier = value;
      scheduleAppStateSave();
      renderQuickObsView();
    },
    ['Palier calculé à partir des critères observés', ...(ILSS_PALIERS[competency] || [])]);
  addSegment('Cote (exigences du palier)',
    ILSS_COTES.map(([cote]) => ({ id: cote, label: cote })),
    draft ? draft.ilssCote || '' : '',
    value => {
      draft.ilssCote = draft.ilssCote === value ? '' : value;
      scheduleAppStateSave();
      renderQuickObsView();
    },
    ILSS_COTES.map(([, description]) => description),
    (value, isCurrent) => `${getBadgeColorClasses(value.id)}${isCurrent ? ' is-current-cote' : ''}`);
  const activeCoteDesc = draft && draft.ilssCote
    ? (ILSS_COTES.find(([c]) => c === draft.ilssCote) || [])[1]
    : '';
  if (activeCoteDesc) {
    const descEl = document.createElement('p');
    descEl.className = 'qo-ilss-cote-desc';
    descEl.textContent = `${draft.ilssCote} — ${activeCoteDesc}`;
    resultBox.appendChild(descEl);
  }

  const selectedCount = document.getElementById('qoSelectedTagsCount');
  const tagsContainer = document.getElementById('qoQuickTags');
  const activeStrip = document.getElementById('qoActiveStudentTagsStrip');
  const pairs = ILSS_OBSERVATION_PAIRS[competency] || [];
  tagsContainer.innerHTML = '';
  activeStrip.innerHTML = '';
  if (!draft) {
    if (selectedCount) selectedCount.textContent = '0 sélectionné(s)';
    tagsContainer.innerHTML = '<div class="text-xs text-slate-500">Sélectionner un nom pour cocher des observations.</div>';
    const commentInput = document.getElementById('qoCommentInput');
    commentInput.value = '';
    commentInput.disabled = true;
    return;
  }
  const known = new Set(pairs.flat());
  const strengths = draft.quickComments.filter(text => pairs.some(pair => pair[0] === text));
  const supports = draft.quickComments.filter(text => pairs.some(pair => pair[1] === text));
  const previous = draft.quickComments.filter(text => !known.has(text));
  if (selectedCount) selectedCount.textContent = `${strengths.length} force(s) · ${supports.length} défi(s)`;
  ['Forces', 'Défis'].forEach((heading, side) => {
    const fieldset = document.createElement('fieldset');
    fieldset.className = 'qo-choice-column';
    const legend = document.createElement('legend');
    legend.textContent = heading;
    fieldset.appendChild(legend);
    pairs.forEach(pair => {
      const text = pair[side];
      const label = document.createElement('label');
      label.className = 'qo-choice';
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.dataset.tag = text;
      checkbox.checked = draft.quickComments.includes(text);
      checkbox.addEventListener('change', () => {
        draft.quickComments = draft.quickComments.filter(item => item !== text && item !== pair[1 - side]);
        if (checkbox.checked) draft.quickComments.push(text);
        scheduleAppStateSave();
        renderQuickObsView();
        [...document.querySelectorAll('#qoQuickTags input')].find(input => input.dataset.tag === text)?.focus({ preventScroll: true });
      });
      label.append(checkbox, document.createTextNode(text));
      fieldset.appendChild(label);
    });
    tagsContainer.appendChild(fieldset);
  });
  [['Forces', strengths], ['Défis', supports], ['Observations précédentes', previous]].forEach(([heading, tags]) => {
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
        draft.quickComments = draft.quickComments.filter(item => item !== tag);
        scheduleAppStateSave();
        renderQuickObsView();
      });
      chip.appendChild(remove);
      section.appendChild(chip);
    });
    activeStrip.appendChild(section);
  });
  const commentInput = document.getElementById('qoCommentInput');
  commentInput.disabled = false;
  if (document.activeElement !== commentInput) commentInput.value = draft.comment || '';
}

function renderIlssObservablePrintPage(subject, assignment, student, blank) {
  const termData = getActiveTermData();
  const subData = termData.subjectData[subject.id];
  const session = subData.currentObsSession;
  const meta = blank
    ? {}
    : assignment.isCurrentDraft || assignment.isActiveEdit
      ? (session.studentDrafts[student.id] || {})
      : (subData.studentRecords[student.id]?.scoreMeta?.[assignment.id] || {});
  const criteria = ILSS_OBSERVABLE_GRIDS[subject.ilssCompetency] || [];
  const result = blank
    ? { palier: '', cote: '' }
    : getIlssDraftResult(meta);
  const rows = criteria.map(criterion => {
    const cells = criterion.manifestations.map((manifestation, index) => {
      const selected = !blank && meta.criteria && meta.criteria[criterion.id] === String(index + 1);
      return `<td><div class="observable-print-statement${selected ? ' is-selected' : ''}"><span class="observable-print-check"></span><span>${escapeHtml(manifestation)}</span></div></td>`;
    }).join('');
    return `<tr><th scope="row">${escapeHtml(criterion.label)}</th>${cells}</tr>`;
  }).join('');
  const comments = [...(meta.quickComments || []), meta.comment || ''].filter(Boolean).join(' · ');
  const date = assignment.date
    ? new Date(`${assignment.date}T12:00:00`).toLocaleDateString('fr-CA', { day: 'numeric', month: 'long', year: 'numeric' })
    : '';
  const group = appState.groups.find(item => item.id === appState.activeGroupId);
  return `
    <article class="observable-print-page">
      <header class="observable-print-head">
        <div>
          <h1>${escapeHtml(student.name)}</h1>
          <p><strong>${escapeHtml(assignment.title || 'Grille d’observation ILSS')}</strong> · ${escapeHtml(subject.fullName)}</p>
          <p>${escapeHtml(group && !group.placeholder ? group.name : '')} · ${escapeHtml(GRADE_LEVEL_LABELS[student.gradeLevel] || '')} · Étape ${escapeHtml(appState.activeTerm)}${date ? ` · ${escapeHtml(date)}` : ''}</p>
        </div>
        <div class="observable-print-result"><strong>${blank ? 'Grille vierge' : escapeHtml(accueilLabel(result))}</strong></div>
      </header>
      <table class="observable-print-table">
        <thead><tr><th>Critère observé</th>${[1, 2, 3, 4, 5].map(palier => `<th>Palier ${palier}</th>`).join('')}</tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <div class="observable-print-notes">
        <div class="observable-print-note"><strong>Observations</strong>${escapeHtml(comments || ' ')}</div>
        <div class="observable-print-note"><strong>Repère du cycle</strong>${escapeHtml(ILSS_CYCLE_GUIDANCE[getStudentCycle(student.gradeLevel)] || '')}</div>
      </div>
      <div class="observable-print-foot">Paliers ILSS et cotes qualitatives · aucun pourcentage</div>
    </article>`;
}

function getAccueilSummaryHtml(student) {
  const canJump = typeof ALL_SUBJECTS_CONFIG !== 'undefined' && typeof SUBJECTS_CONFIG !== 'undefined';
  const badgeClassesFn = typeof getIlssResultClasses === 'function'
    ? getIlssResultClasses
    : () => '';
  return `<div class="ilss-summary-head">
      <div>
        <h4 class="font-bold">ILSS (Français) · suivi par compétence</h4>
        <p class="text-xs text-slate-600">Palier de progression (1 à 5) et cote A à D, sans conversion en pourcentage.</p>
      </div>
      <a class="text-xs text-indigo-700 underline no-print" href="${ACCUEIL_PALIERS_URL}" target="_blank" rel="noopener noreferrer">Paliers ministériels ↗</a>
    </div>
    <div class="ilss-summary-grid grid grid-cols-1 gap-2.5">${ACCUEIL_COMPETENCIES.map(comp => {
      const subject = typeof ALL_SUBJECTS_CONFIG !== 'undefined'
        ? ALL_SUBJECTS_CONFIG.find(candidate => candidate.isIlss && candidate.ilssCompetency === comp.id)
        : null;
      const evalTotal = subject && typeof getIlssAssignments === 'function' && typeof appState !== 'undefined' && appState.terms
        ? ['1', '2', '3'].reduce((sum, tk) => sum + getIlssAssignments(subject, tk).length, 0)
        : 0;
      const termJudgments = ['1', '2', '3'].map(term => {
        const data = student.ilssByTerm && student.ilssByTerm[term];
        const item = data && data.judgments && data.judgments[comp.id];
        const final = subject && typeof appState !== 'undefined' && appState.terms && typeof getIlssFinalJudgment === 'function'
          ? getIlssFinalJudgment(subject, term, student)
          : { palier: item && item.palier, cote: item && item.cote };
        return { term, item, final };
      });
      const paliersTrail = termJudgments.map(t => t.final.palier ? `P${t.final.palier}` : null).filter(Boolean);
      const progressionChip = paliersTrail.length >= 2
        ? `<span class="ilss-prog-chip">${paliersTrail.join(' → ')}</span>`
        : '';
      const titleHtml = canJump && subject
        ? `<button type="button" class="gr-subject-jump" data-jump-subject="${escapeHtml(subject.id)}" data-jump-student="${escapeHtml(student.id || '')}" title="Ouvrir ${escapeHtml(comp.label)} dans le Carnet"><span class="gr-subject-jump-label">${escapeHtml(comp.label)}</span><span class="gr-subject-jump-arrow" aria-hidden="true">→</span></button>`
        : `<strong>${escapeHtml(comp.label)}</strong>`;
      const ilssCommentsCount = termJudgments.filter(t => t.item && typeof t.item.comment === 'string' && t.item.comment.trim()).length;
      const commentBtnHtml = (subject && ilssCommentsCount > 0)
        ? `<button type="button" class="gr-comment-icon-btn no-print" data-gr-bulletin-comment="${escapeHtml(subject.id)}" aria-label="Lire le commentaire au bulletin pour ${escapeHtml(comp.label)}" title="Commentaire au bulletin (${ilssCommentsCount} étape${ilssCommentsCount > 1 ? 's' : ''}) — cliquer pour lire"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>${ilssCommentsCount > 1 ? `<span class="gr-comment-icon-count">${ilssCommentsCount}</span>` : ''}</button>`
        : '';
      return `<section class="ilss-comp-card rounded-lg border border-slate-200 p-2.5">
        <div class="ilss-comp-card-head">
          <div class="ilss-comp-card-title">${titleHtml}${commentBtnHtml}${evalTotal ? `<em class="gr-evaluation-count">${evalTotal} éval${evalTotal > 1 ? 's' : ''}</em>` : ''}</div>
          ${progressionChip}
        </div>
        <div class="mt-2 grid grid-cols-1 md:grid-cols-3 gap-2">${termJudgments.map(({ term, item, final }) => {
          const badgeClass = final && (final.palier || final.cote) ? badgeClassesFn(final) : 'ilss-badge-empty';
          return `<div class="ilss-summary-term rounded p-2 text-xs">
            <div class="ilss-summary-term-top">
              <strong>Étape ${term}</strong>
              <span class="ilss-summary-badge px-1.5 py-0.5 rounded border text-[11px] font-bold ${badgeClass}">${escapeHtml(accueilLabel(final))}${final.overridden ? ' · ajusté' : ''}</span>
            </div>
            ${item && item.comment ? `<p class="mt-1.5 ilss-summary-comment">${escapeHtml(item.comment)}</p>` : ''}
            ${item && item.culture ? `<p class="mt-1 ilss-summary-culture">Culture : ${escapeHtml(item.culture)}</p>` : ''}
          </div>`;
        }).join('')}</div>
      </section>`;
    }).join('')}</div>
    ${getAccueilDisciplineSummaryHtml(student)}`;
}

function getAccueilDisciplineSummaryHtml(student) {
  const disciplines = new Map();
  ['1', '2', '3'].forEach(term => {
    const data = student.ilssByTerm && student.ilssByTerm[term];
    Object.entries(data && data.disciplines || {}).forEach(([key, item]) => {
      if (item.cote || item.comment) {
        disciplines.set(key, { key, label: item.label || key });
      }
    });
  });
  if (!disciplines.size) return '';
  return `<h4 class="font-bold">Jugements qualitatifs historiques conservés</h4>
    <p class="text-xs">Ces anciennes données sont conservées pour compatibilité et ne participent pas aux résultats du carnet.</p>
    ${[...disciplines.values()].map(discipline => `<div><strong>${escapeHtml(discipline.label)}</strong><ul>${['1', '2', '3'].map(term => {
      const data = student.ilssByTerm && student.ilssByTerm[term];
      const item = data && data.disciplines && data.disciplines[discipline.key];
      return `<li>Étape ${term} : ${item && item.cote ? `cote ${escapeHtml(item.cote)}` : 'Non établie'}${item && item.comment ? ` — ${escapeHtml(item.comment)}` : ''}</li>`;
    }).join('')}</ul></div>`).join('')}`;
}

function renderAccueilSummary(container, student) {
  if (!isAccueilGroup()) return;
  const section = document.createElement('section');
  section.className = 'ilss-summary-section bg-white rounded-xl border border-slate-200 p-4 space-y-2';
  section.innerHTML = getAccueilSummaryHtml(student);
  const firstChild = container.firstElementChild;
  if (firstChild) firstChild.after(section);
  else container.appendChild(section);
}

function buildAccueilExcelRows(rows, sanitize) {
  // Excel limite chaque cellule à 32767 caractères; les parties gardent le texte complet.
  const split = value => {
    if (typeof value !== 'string') return [value];
    const chunks = [];
    for (let start = 0; start < value.length;) {
      let end = Math.min(start + 30000, value.length);
      if (end < value.length && /[\uD800-\uDBFF]/.test(value[end - 1])) end--;
      chunks.push(value.slice(start, end));
      start = end;
    }
    return chunks.length ? chunks : [''];
  };
  return [
    rows[0],
    [...rows[1], 'Partie du texte (concaténer les parties des champs longs)'],
    ...rows.slice(2).flatMap(row => {
      const cells = row.map(split);
      const count = Math.max(...cells.map(chunks => chunks.length));
      return Array.from({ length: count }, (_, index) => [
        ...cells.map(chunks => sanitize(chunks.length === 1 ? chunks[0] : (chunks[index] || ''))),
        `${index + 1}/${count}`
      ]);
    })
  ];
}

function appendAccueilExcelSheet(workbook, sanitize) {
  if (!isAccueilGroup() && !appState.students.some(st => st.ilssByTerm)) return;
  const rows = [['ILSS — paliers et cotes qualitatifs, sans conversion en pourcentage'],
    ['Élève', 'Niveau scolaire', 'Étape', 'Type', 'Compétence', 'Date', 'Activité', 'Palier', 'Cote', 'Observation ou commentaire', 'Observation culturelle']];
  const disciplineRows = [['ACCUEIL — anciennes cotes qualitatives importées, données conservées sans calcul'],
    ['Élève', 'Niveau scolaire', 'Étape', 'Discipline', 'Cote qualitative', 'Commentaire']];
  appState.students.forEach(st => ['1', '2', '3'].forEach(termId => {
    const term = st.ilssByTerm && st.ilssByTerm[termId];
    if (!term) return;
    ACCUEIL_COMPETENCIES.forEach(comp => {
      const item = term.judgments && term.judgments[comp.id];
      const subject = ALL_SUBJECTS_CONFIG.find(candidate => candidate.isIlss && candidate.ilssCompetency === comp.id);
      const final = subject ? getIlssFinalJudgment(subject, termId, st) : item || {};
      if (final.palier || final.cote || item && (item.comment || item.culture)) {
        const judgmentType = subject ? (final.overridden ? 'Jugement ajusté' : 'Jugement proposé') : 'Jugement';
        rows.push([st.name, GRADE_LEVEL_LABELS[st.gradeLevel] || '', termId, judgmentType, comp.label, '', '', final.palier || '', final.cote || '', item && item.comment || '', item && item.culture || '']);
      }
    });
    (term.assessments || []).forEach(item => {
      const comp = ACCUEIL_COMPETENCIES.find(c => c.id === item.competency);
      rows.push([st.name, GRADE_LEVEL_LABELS[st.gradeLevel] || '', termId, 'Trace', comp ? comp.label : '', item.date, item.activity, item.palier, item.cote, item.observation, item.culture]);
    });
    ALL_SUBJECTS_CONFIG.filter(subject => subject.isIlss).forEach(subject => {
      const subjectData = appState.terms && appState.terms[termId] &&
        appState.terms[termId].subjectData && appState.terms[termId].subjectData[subject.id];
      if (!subjectData) return;
      (subjectData.assignments || []).filter(item => item.isIlssAssessment).forEach(assignment => {
        const meta = subjectData.studentRecords[st.id] &&
          subjectData.studentRecords[st.id].scoreMeta &&
          subjectData.studentRecords[st.id].scoreMeta[assignment.id] || {};
        const result = getIlssAssignmentResult(subject, termId, assignment, st);
        if (!result.palier && !result.cote && !meta.comment && !(meta.quickComments || []).length) return;
        const comments = [...(meta.quickComments || []), meta.comment || ''].filter(Boolean).join(' ');
        rows.push([st.name, GRADE_LEVEL_LABELS[st.gradeLevel] || '', termId,
          assignment.isObservation ? 'Observation' : 'Évaluation', subject.partLabel,
          assignment.date || '', assignment.title || '', result.palier || '', result.cote || '',
          comments, assignment.description || '']);
      });
    });
    Object.entries(term.disciplines || {}).forEach(([key, item]) => {
      if (!item.cote && !item.comment) return;
      disciplineRows.push([st.name, GRADE_LEVEL_LABELS[st.gradeLevel] || '', termId, item.label || key, item.cote, item.comment]);
    });
  }));
  const sheet = XLSX.utils.aoa_to_sheet(buildAccueilExcelRows(rows, sanitize));
  sheet['!cols'] = [22, 18, 8, 12, 38, 14, 30, 10, 10, 45, 45, 20].map(wch => ({ wch }));
  XLSX.utils.book_append_sheet(workbook, sheet, 'ILSS');
  if (disciplineRows.length > 2) {
    const disciplineSheet = XLSX.utils.aoa_to_sheet(buildAccueilExcelRows(disciplineRows, sanitize));
    disciplineSheet['!cols'] = [22, 18, 8, 38, 18, 60, 20].map(wch => ({ wch }));
    XLSX.utils.book_append_sheet(workbook, disciplineSheet, 'Qualitatif_accueil');
  }
}
