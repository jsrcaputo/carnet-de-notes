const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

function setup() {
  const context = vm.createContext({
    appState: {
      activeGroupId: 'g1',
      groups: [{ id: 'g1', level: 'accueil' }],
      students: []
    },
    GRADE_LEVEL_LABELS: { '3': '3e année' },
    ALL_SUBJECTS_CONFIG: [
      { id: 'math_resoudre', group: 'maths', groupLabel: 'Mathématiques' },
      { id: 'math_raisonner', group: 'maths', groupLabel: 'Mathématiques' },
      { id: 'eps_agir', group: 'education_physique', groupLabel: 'Éducation physique' }
    ],
    escapeHtml: value => String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'),
    XLSX: { utils: {
      aoa_to_sheet: rows => ({ rows }),
      book_append_sheet: (workbook, sheet, name) => { workbook[name] = sheet; }
    } }
  });

  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'carnet-test', 'js', 'accueil.js'), 'utf8'), context);
  return context;
}

test('conserve les textes longs et les cotes des disciplines après sauvegarde JSON', () => {
    const context = setup();
    const long = 'Un commentaire détaillé. '.repeat(300);
    const source = {
      2: {
        judgments: { oral: { palier: '2', cote: 'B', comment: long, culture: long } },
        assessments: [{ competency: 'lecture', activity: long, observation: long, culture: long }],
        disciplines: {
          maths: { label: 'Mathématiques', cote: 'C', comment: long },
          education_physique: { label: 'Éducation physique', cote: 'A', comment: 'Avec soutien' },
          constructor: { label: 'Invalide', cote: 'A' },
          invalid: { label: 'Ancienne matière', cote: 'E', comment: long }
        }
      }
    };
    const saved = JSON.stringify(context.normalizeAccueilData(source));
    const restored = context.normalizeAccueilData(JSON.parse(saved));
    assert.equal(restored['2'].judgments.oral.comment, long);
    assert.equal(restored['2'].judgments.oral.culture, long);
    assert.equal(restored['2'].assessments[0].observation, long);
    assert.equal(restored['2'].assessments[0].activity, long);
    assert.equal(restored['2'].disciplines.maths.comment, long);
    assert.equal(restored['2'].disciplines.maths.cote, 'C');
    assert.equal(restored['2'].disciplines.invalid.cote, '');
    assert.equal(restored['2'].disciplines.invalid.comment, long);
    assert.equal(Object.hasOwn(restored['2'].disciplines, 'constructor'), false);
  });

  test('regroupe les compétences par discipline et garde le numérique distinct du qualitatif', () => {
    const context = setup();
    context.appState.groups[0].subjectIds = ['math_resoudre', 'math_raisonner', 'eps_agir'];
    assert.equal(context.getAccueilDisciplines().length, 2);
    const student = {
      name: 'Maya', gradeLevel: '3',
      ilssByTerm: context.normalizeAccueilData({
        1: { disciplines: { maths: { label: 'Mathématiques', cote: 'B', comment: 'Explique sa démarche' } } },
        3: { disciplines: { maths: { label: 'Mathématiques', cote: 'A', comment: 'Progrès' } } }
      })
    };
    context.appState.students = [student];
    context.appState.terms = { 1: { subjectData: { math_resoudre: { studentRecords: { s1: { scores: { a1: '76' } } } } } } };
    const before = JSON.stringify(context.appState.terms);
    const summary = context.getAccueilSummaryHtml(student);
    const workbook = {};
    context.appendAccueilExcelSheet(workbook, value => value);
    assert.match(summary, /Étape 1 : cote B/);
    assert.match(summary, /Étape 3 : cote A/);
    assert.match(summary, /données.*compatibilité/i);
    assert.equal(workbook.Qualitatif_accueil.rows.length, 4);
    assert.equal(workbook.Qualitatif_accueil.rows[2][4], 'B');
    assert.equal(workbook.Qualitatif_accueil.rows[3][4], 'A');
    assert.equal(JSON.stringify(context.appState.terms), before);
    context.appState.groups[0].subjectIds = [];
    assert.match(context.getAccueilSummaryHtml(student), /données.*compatibilité/i);
  });
test('normalise les paliers, cotes et traces sans transformer le niveau scolaire', () => {
  const context = setup();
  const value = context.normalizeAccueilData({
    1: {
      judgments: {
        oral: { palier: 2, cote: 'B', comment: 'Échanges', culture: 'Vie de classe' },
        lecture: { palier: 8, cote: 'E' }
      },
      assessments: [
        { competency: 'ecriture', palier: '3', cote: 'D', activity: 'Récit', observation: 'Avec soutien' },
        { competency: 'culture', palier: '1', cote: 'A' }
      ]
    }
  });

  assert.equal(value['1'].judgments.oral.palier, '2');
  assert.equal(value['1'].judgments.oral.cote, 'B');
  assert.equal(value['1'].judgments.lecture.palier, '');
  assert.equal(value['1'].judgments.lecture.cote, '');
  assert.equal(value['1'].assessments.length, 1);
  assert.equal(value['1'].assessments[0].observation, 'Avec soutien');
  assert.equal(context.accueilLabel(value['1'].judgments.oral), 'Palier 2 · cote B');
});

test('reconnaît Accueil dans le niveau du groupe et migre l’ancien indicateur en lecture', () => {
  const context = setup();
  assert.equal(context.isAccueilGroup(), true);
  context.appState.groups[0].level = '';
  assert.equal(context.isAccueilGroup(), false);
  context.appState.groups[0].classType = 'accueil';
  assert.equal(context.isAccueilGroup(), true);
});

test('propose un jugement ILSS médian et permet un ajustement manuel', () => {
  const context = setup();
  const subject = { id: 'ilss_oral', isIlss: true, ilssCompetency: 'oral' };
  const student = {
    id: 's1',
    gradeLevel: '3',
    ilssByTerm: { 1: { judgments: { oral: { overridePalier: '', overrideCote: '', palier: '', cote: '', comment: '', culture: '' } }, assessments: [] } }
  };
  context.appState.students = [student];
  context.appState.terms = {
    1: {
      subjectData: {
        ilss_oral: {
          assignments: [
            { id: 'a1', isIlssAssessment: true },
            { id: 'a2', isIlssAssessment: true },
            { id: 'a3', isIlssAssessment: true },
            { id: 'a4', isIlssAssessment: true }
          ],
          studentRecords: {
            s1: {
              scoreMeta: {
                a1: { ilssPalier: '2', ilssCote: 'C', criteria: {}, quickComments: [] },
                a2: { ilssPalier: '2', ilssCote: 'B', criteria: {}, quickComments: [] },
                a3: { ilssPalier: '3', ilssCote: 'B', criteria: {}, quickComments: [] },
                a4: { ilssPalier: '', ilssCote: '', criteria: {}, quickComments: [] }
              }
            }
          }
        }
      }
    }
  };
  assert.deepEqual(
    JSON.parse(JSON.stringify(context.suggestIlssJudgment(subject, '1', student))),
    { palier: '2', cote: 'C' }
  );
  context.appState.terms[1].subjectData.ilss_oral.studentRecords.s1.scoreMeta.a1.ilssPalier = '';
  context.appState.terms[1].subjectData.ilss_oral.studentRecords.s1.scoreMeta.a1.criteria = {
    comprehension: '3', interaction: '3', formulation: '2'
  };
  assert.equal(
    context.getIlssAssignmentResult(
      subject,
      '1',
      context.appState.terms[1].subjectData.ilss_oral.assignments[0],
      student
    ).palier,
    '3'
  );
  assert.equal(context.getIlssDraftResult({ criteria: { a: '2', b: '', c: '3' } }).palier, '2');
  student.ilssByTerm[1].judgments.oral.overridePalier = '3';
  student.ilssByTerm[1].judgments.oral.overrideCote = 'A';
  assert.equal(context.getIlssFinalJudgment(subject, '1', student).palier, '3');
  assert.equal(context.getIlssFinalJudgment(subject, '1', student).cote, 'A');
  assert.equal(context.getIlssFinalJudgment(subject, '1', student).overridden, true);
});

test('exporte les jugements et traces séparément, sans note numérique ni formule active', () => {
  const context = setup();
  context.appState.students = [{
    name: '=Maya', gradeLevel: '3',
    ilssByTerm: context.normalizeAccueilData({
      1: {
        judgments: { oral: { palier: '2', cote: 'B', comment: 'Progrès', culture: 'Échange' } },
        assessments: [{ competency: 'lecture', palier: '1', cote: 'C', activity: 'Album', observation: 'Associe' }]
      }
    })
  }];
  const workbook = {};
  context.appendAccueilExcelSheet(workbook, value =>
    typeof value === 'string' && /^[\t\r\n]*[=+\-@]/.test(value) ? `'${value}` : value);
  const rows = workbook.ILSS.rows;
  assert.equal(rows.length, 4);
  assert.equal(rows[2][0], "'=Maya");
  assert.equal(rows[2][3], 'Jugement');
  assert.equal(rows[2][7], '2');
  assert.equal(rows[2][8], 'B');
  assert.equal(rows[3][3], 'Trace');
  assert.equal(rows[3][7], '1');
  assert.equal(rows[3][8], 'C');
});

test('exporte les évaluations ILSS qualitatives sans créer de note numérique', () => {
  const context = setup();
  context.ALL_SUBJECTS_CONFIG.push({
    id: 'ilss_oral',
    isIlss: true,
    partLabel: 'Communiquer oralement (C1)'
  });
  const student = {
    id: 's1', name: 'Maya', gradeLevel: '3',
    ilssByTerm: context.normalizeAccueilData({ 1: {} })
  };
  context.appState.students = [student];
  context.appState.terms = {
    1: {
      subjectData: {
        ilss_oral: {
          assignments: [{
            id: 'a1', title: 'Entretien', date: '2026-11-18',
            isIlssAssessment: true, isObservation: false, description: 'Conversation guidée'
          }],
          studentRecords: {
            s1: { scoreMeta: { a1: { ilssPalier: '3', ilssCote: 'B', comment: 'Prend part à l’échange.', quickComments: [] } } }
          }
        }
      }
    }
  };
  const workbook = {};
  context.appendAccueilExcelSheet(workbook, value => value);
  const evaluation = workbook.ILSS.rows.find(row => row[3] === 'Évaluation');
  assert.equal(evaluation[6], 'Entretien');
  assert.equal(evaluation[7], '3');
  assert.equal(evaluation[8], 'B');
  assert.equal(evaluation[9], 'Prend part à l’échange.');
});

test('fractionne les longs textes Excel sans les tronquer ni séparer les caractères Unicode', () => {
  const context = setup();
  const long = 'x'.repeat(29999) + '😀' + 'y'.repeat(10000);
  context.appState.students = [{
    name: 'Maya', gradeLevel: '3',
    ilssByTerm: context.normalizeAccueilData({
      1: {
        judgments: { oral: { comment: long } },
        disciplines: { maths: { label: 'Mathématiques', cote: 'B', comment: long } }
      }
    })
  }];
  const workbook = {};
  context.appendAccueilExcelSheet(workbook, value => value);
  const disciplineRows = workbook.Qualitatif_accueil.rows.slice(2);
  assert.equal(disciplineRows.length, 2);
  assert.equal(disciplineRows.map(row => row[5]).join(''), long);
  assert.equal(disciplineRows[0][6], '1/2');
  assert.equal(disciplineRows[1][6], '2/2');
  assert.equal(workbook.ILSS.rows.slice(2).map(row => row[9]).join(''), long);
  assert.equal(disciplineRows[0][5].endsWith('😀'), false);
  assert.equal(disciplineRows[1][5].startsWith('😀'), true);
});

test('affiche le niveau sous chaque élève en accueil dans les carnets ILSS et mathématique', () => {
  class Element {
    constructor() {
      this.children = [];
      this.dataset = {};
      this.style = {};
      this.classList = { add() {}, remove() {}, toggle() {} };
      this.textContent = '';
      this.className = '';
    }
    set textContent(value) { this.children = []; this.text = value; }
    get textContent() { return this.text + this.children.map(child => child.textContent).join(''); }
    set innerHTML(value) { this.children = []; this.text = ''; this.html = value; }
    appendChild(child) { this.children.push(child); return child; }
    append(...children) { this.children.push(...children); }
    setAttribute() {}
    addEventListener() {}
    querySelector(selector) { return selector === 'table' ? new Element() : null; }
    querySelectorAll() { return []; }
  }

  const context = setup();
  const elements = new Map();
  const students = [
    { id: 's3', name: 'Maya', gradeLevel: '3' },
    { id: 's1', name: 'Léa', gradeLevel: '1' },
    { id: 's2', name: 'Noé', gradeLevel: '1' },
    { id: 's4', name: 'Alex', gradeLevel: '' }
  ];
  const ilss = { id: 'ilss_oral', isIlss: true, ilssCompetency: 'oral', fullName: 'ILSS' };
  const maths = { id: 'math_resoudre', group: 'maths', fullName: 'Mathématique' };
  const records = Object.fromEntries(students.map(student => [
    student.id, { scores: {}, scoreMeta: {}, finalJudgmentOverride: '', comment: '' }
  ]));
  context.appState.students = students;
  context.appState.activeTerm = '1';
  context.appState.terms = { 1: { subjectData: {
    ilss_oral: { assignments: [], studentRecords: records },
    math_resoudre: { assignments: [], studentRecords: records }
  } } };
  let filter = 'ALL';
  Object.assign(context, {
    document: {
      createElement: () => new Element(),
      getElementById: id => {
        if (!elements.has(id)) elements.set(id, new Element());
        return elements.get(id);
      }
    },
    CYCLE_LABELS: { 1: '1er cycle', 2: '2e cycle' },
    SUBJECTS_CONFIG: [ilss, maths],
    subjectIcons: {},
    gbFilter: '',
    gbSort: { key: '' },
    weightMode: false,
    weightScope: '',
    weightLevel: '',
    unlockedWeights: new Set(),
    pendingWeightFocusSelector: null,
    getCurrentSubjectConfig: () => context.SUBJECTS_CONFIG.find(subject => subject.id === context.appState.activeSubjectId),
    getActiveTermData: () => context.appState.terms[1],
    getSubjectContextDisplay: subject => subject,
    getPresentStudentLevels: () => ['1', '3'],
    ensureValidGbLevelFilter: () => filter,
    getGradebookStudents: () => students,
    formatShortLevelTag: level => level,
    getStudentCycle: level => level === '1' ? 1 : level === '3' ? 2 : null,
    getEffectiveGradeLevel: student => student.gradeLevel,
    isSubjectModifiedForStudent: () => false,
    isWeightSumValid100: () => true,
    updateWeightIndicatorsUI() {},
    hasActiveGroup: () => true,
    openGradebookSortBar() {},
    computeStudentSubjectSummary: () => ({
      finalPct: null, autoCombinedPct: null, baremeRes: { hasFinalGrade: false, hasData: false }
    }),
    renderAssignmentAverage: () => '',
    getBadgeColorClasses: () => '',
    updateGradebookRowSummaryOnly() {},
    updateGradebookTopScroll() {},
    setIlssGradebookChrome() {}
  });
  context.GRADE_LEVEL_LABELS['1'] = '1re année';
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'carnet-test', 'js', 'ui-carnet-evaluations.js'), 'utf8'), context);

  for (const subject of [ilss, maths]) {
    context.appState.activeSubjectId = subject.id;
    filter = 'ALL';
    context.renderGradebookView();
    const rows = elements.get('gradebookBody').children;
    assert.deepEqual(rows.map(row => row.children[0].children.map(child => child.textContent)), [
      ['Léa', '1re année • 1er cycle'],
      ['Noé', '1re année • 1er cycle'],
      ['Maya', '3e année • 2e cycle'],
      ['Alex', 'Niveau à choisir']
    ], subject.id);
    rows.forEach(row => assert.match(row.children[0].children[1].className, /\bgb-student-meta\b/));

    filter = '3';
    context.renderGradebookView();
    assert.deepEqual(elements.get('gradebookBody').children.map(row =>
      row.children[0].children.map(child => child.textContent)), [['Maya', '3e année • 2e cycle']], subject.id);
  }

  context.appState.groups[0].level = '';
  filter = 'ALL';
  context.renderGradebookView();
  assert.match(elements.get('gradebookBody').children[0].children[0].children[0].textContent, /^1re année \(2\)$/);
});

test('harmonisation ILSS : banque structurée et animations toujours actives', () => {
  const classes = new Set(['theme-dark', 'reduce-motion']);
  const attrs = {};
  const rootEl = {
    dataset: {},
    setAttribute: (k, v) => { attrs[k] = v; },
    classList: {
      add: (...tokens) => tokens.forEach((t) => classes.add(t)),
      remove: (...tokens) => tokens.forEach((t) => classes.delete(t)),
      contains: (t) => classes.has(t),
    },
  };
  const win = {};
  const ctx = vm.createContext({
    console,
    ALL_SUBJECTS_CONFIG: [],
    document: { documentElement: rootEl },
    window: win,
    localStorage: { getItem: () => JSON.stringify({ animations: false, textSize: 'lg' }) },
    globalThis: null,
  });
  ctx.globalThis = ctx;

  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'carnet-test', 'js', 'init-theme.js'), 'utf8'), ctx);
  assert.equal(ctx.window.isReducedMotionEnabled(), false);
  assert.equal(classes.has('reduce-motion'), false);
  assert.equal(classes.has('theme-dark'), false);
  assert.equal(classes.has('ts-lg'), true);
  assert.equal(attrs['data-palette'], 'ocean');

  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'carnet-test', 'js', 'pedagogie', 'matieres-ilss.js'), 'utf8'), ctx);
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'carnet-test', 'js', 'pedagogie', 'commentaires-ilss.js'), 'utf8'), ctx);
  const structured = vm.runInContext('ILSS_COMMENT_BANK_STRUCTURED', ctx);
  assert.ok(Array.isArray(structured.oral));
  assert.ok(Array.isArray(structured.lecture));
  assert.ok(Array.isArray(structured.ecriture));
  assert.ok(structured.oral.length >= 2);
});

test('synthèse affiche la fiche élève au clic et le bouton Déjà réalisée n’a pas de référence invalide', () => {
  const makeNode = (id = '') => {
    const classes = new Set();
    const attrs = {};
    const listeners = {};
    const node = {
      id,
      innerHTML: '',
      textContent: '',
      value: '',
      className: '',
      disabled: false,
      style: { props: {}, setProperty(k, v) { this.props[k] = v; }, removeProperty(k) { delete this.props[k]; } },
      children: [],
      get childElementCount() { return this.children.length; },
      classList: {
        add: (...t) => t.forEach(x => classes.add(x)),
        remove: (...t) => t.forEach(x => classes.delete(x)),
        toggle: (t, force) => {
          const on = force === undefined ? !classes.has(t) : Boolean(force);
          if (on) classes.add(t); else classes.delete(t);
          return on;
        },
        contains: (t) => classes.has(t),
      },
      setAttribute: (k, v) => { attrs[k] = String(v); },
      getAttribute: (k) => attrs[k] || null,
      addEventListener: (ev, fn) => { (listeners[ev] ||= []).push(fn); },
      appendChild(child) { this.children.push(child); return child; },
      querySelector: () => null,
      querySelectorAll: () => [],
      _listeners: listeners,
    };
    return node;
  };

  const els = new Map([
    ['grStudentBand', makeNode('grStudentBand')],
    ['grReportContent', makeNode('grReportContent')],
    ['grGroupNamePill', makeNode('grGroupNamePill')],
    ['grStudentCounter', makeNode('grStudentCounter')],
    ['grStudentSearchWrap', makeNode('grStudentSearchWrap')],
    ['grStudentSearch', makeNode('grStudentSearch')],
    ['btnGrPrevStudent', makeNode('btnGrPrevStudent')],
    ['btnGrNextStudent', makeNode('btnGrNextStudent')],
    ['grTeacherComment', makeNode('grTeacherComment')],
    ['grTeacherCommentCount', makeNode('grTeacherCommentCount')],
    ['grTeacherCommentPrint', makeNode('grTeacherCommentPrint')],
  ]);

  const student = { id: 's1', name: 'Camille Tremblay', firstName: 'Camille', lastName: 'Tremblay', gradeLevel: '4', adaptations: [], reportComment: '' };
  const maths = { id: 'math_c1', shortName: 'Math C1', fullName: 'Mathématique C1', group: 'maths', officialWeight: 30, bulletinName: 'Résoudre' };
  const termData = {
    subjectData: {
      math_c1: {
        assignments: [{ id: 'a1', title: 'Problème 1', weight: 100, outOf: 20 }],
        studentRecords: {
          s1: { scores: { a1: '17' }, scoreMeta: {}, finalJudgmentOverride: '', comment: 'Beau travail.' },
        },
      },
    },
  };
  const ctx = vm.createContext({
    console,
    CSS: { escape: s => s },
    OWN: Object.prototype.hasOwnProperty,
    document: {
      getElementById: (id) => els.get(id) || null,
      createElement: () => makeNode(),
      querySelector: () => null,
    },
    window: { scrollY: 0, scrollTo() {} },
    prefs: { summaryStudentListMode: 'grid', summaryStudentSort: 'lastName' },
    SUBJECTS_CONFIG: [maths],
    GRADE_LEVEL_LABELS: { '4': '4e année' },
    CYCLE_LABELS: { 2: '2e cycle' },
    CYCLE_SCALE_URLS: {},
    CELL_FLAGS: [],
    VALID_CELL_FLAG_CODES: new Set(),
    appState: {
      activeGroupId: 'g1',
      activeTerm: '1',
      selectedStudentId: null,
      annualWeightMode: 'official',
      groups: [{ id: 'g1', name: '401', level: '4' }],
      students: [student],
      terms: { '1': termData, '2': termData, '3': termData },
    },
    competencyPanelOpen: false,
    competencySubjectSelected: null,
    competencyScaleSelected: {},
    escapeHtml: s => String(s ?? ''),
    isAccueilGroup: () => false,
    isSubjectApplicableForStudent: () => true,
    getSubjectDisplayConfig: sub => sub,
    getEffectiveGradeLevel: st => st.gradeLevel,
    getStudentCycle: () => 2,
    getPresentStudentLevels: () => ['4'],
    computeStudentSubjectSummary: () => ({ finalPct: 85, assignmentsAvg: 85 }),
    computeWeightedAnnualAverage: (a) => a,
    computeDisciplineAverageForSummary: () => 85,
    getAnnualResultInfo: () => ({ provisional: false, weight: 100 }),
    pctToClosestGradeCode: () => 'B+',
    getBadgeColorClasses: () => 'badge-b',
    isSubjectModifiedForStudent: () => false,
    isAssignmentForStudent: () => true,
    getAssignmentWeightForLevel: () => 100,
    getAssignmentOutOf: () => 20,
    formatScoreNumber: n => String(n),
    getCellFlags: () => [],
    getCellFlagBadge: c => c,
    groupObservationTags: () => ({ strengths: [], challenges: [], previous: [] }),
    hasObservationFeedback: () => false,
    getStudentAdaptationSummary: () => ({ adaptations: [], hasModifiedBulletin: false, modifiedItems: [] }),
    getCompetencyTabs: () => [],
    getAnnualCompetencyPicks: () => ({}),
    computeCompetencyResult: () => null,
    scheduleAppStateSave() {},
  });
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'carnet-test', 'js', 'ui-bulletin.js'), 'utf8'), ctx);

  // Clic sur la pastille élève dans la bande Synthèse
  student.adaptations = ['Plan d’intervention'];
  ctx.getStudentAdaptationSummary = () => ({ hasPia: true, adaptations: ['Plan d’intervention'], hasModifiedBulletin: false, modifiedItems: [] });
  ctx.renderGlobalReportView();
  const studentBtn = els.get('grStudentBand').children[0];
  assert.ok(studentBtn, 'un bouton élève doit être créé');
  studentBtn._listeners.click[0]();

  assert.equal(ctx.appState.selectedStudentId, 's1');
  const html = els.get('grReportContent').innerHTML;
  assert.match(html, /Camille Tremblay/);
  assert.match(html, /Math C1/);
  assert.match(html, /85\s*%/);
  assert.doesNotMatch(html, /Moyenne indicative/);
  assert.match(html, /Plan d’intervention/);
  assert.match(html, /data-gr-bulletin-comment="math_c1"/);

  // Vérification que btnOpenAddAssignment n'appelle plus assignment.evidenceType (ReferenceError)
  const eventsSrc = fs.readFileSync(path.join(__dirname, '..', 'carnet-test', 'js', 'demarrage-evenements.js'), 'utf8');
  const openAddBlock = eventsSrc.slice(eventsSrc.indexOf("getElementById('btnOpenAddAssignment')"), eventsSrc.indexOf('window.openAssignmentForEditing'));
  assert.ok(openAddBlock.includes("applyIlssAssignmentModalMode('production')"));
  assert.ok(!openAddBlock.includes('assignment.evidenceType'));

  // Vérification qu'un clic sur la note déjà modifiée dans openGradePicker remet à Auto (null)
  const outilsSrc = fs.readFileSync(path.join(__dirname, '..', 'carnet-test', 'js', 'ui-carnet-outils.js'), 'utf8');
  assert.match(outilsSrc, /onPick\(isCurrent \? null : g\)/);
});

test('rééquilibrage automatique intelligent des pondérations à 100 %', () => {
  const ctx = vm.createContext({
    console, Math, Number, String, Array, Object, Set, Map,
    SUBJECTS_CONFIG: [{ id: 'math_resoudre', singleResult: false }],
    GRADE_LEVEL_LABELS: { '4': '4e année', '5': '5e année', '6': '6e année' },
    appState: {
      activeSubjectId: 'math_resoudre',
      students: [{ id: 's1', gradeLevel: '4' }],
      terms: { '1': { subjectData: {} } }
    },
    getLinkedAssignments: () => [],
    getCurrentSubjectConfig: () => ({ id: 'math_resoudre', singleResult: false }),
    showToast() {},
    notifyUpdate() {},
    updateWeightIndicatorsUI() {},
    renderGradebookView() {},
    openMouseBar() {}
  });
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'carnet-test', 'js', 'etat-ponderations.js'), 'utf8'), ctx);

  // 1) Ajout sans poids personnalisé sur un carnet 60 / 40 -> 40 / 27 / 33 = 100 %
  const a1 = { id: 'a1', weight: 60 }, a2 = { id: 'a2', weight: 40 }, a3 = { id: 'a3', weight: 100 };
  const sub1 = { assignments: [a1, a2, a3], equalWeights: false };
  ctx.rebalanceWeightsTo100(sub1, { preferredAssignment: a3 });
  assert.deepEqual(sub1.assignments.map(a => a.weight), [40, 27, 33]);
  assert.equal(ctx.isWeightSumValid100(sub1), true);

  // 2) Ajout avec poids précis (20 %) sur 60 / 40 -> 48 / 32 / 20 = 100 %
  const b1 = { id: 'b1', weight: 60 }, b2 = { id: 'b2', weight: 40 }, b3 = { id: 'b3', weight: 100 };
  const sub2 = { assignments: [b1, b2, b3], equalWeights: false };
  ctx.rebalanceWeightsTo100(sub2, { preferredAssignment: b3, desiredWeight: 20 });
  assert.deepEqual(sub2.assignments.map(a => a.weight), [48, 32, 20]);
  assert.equal(ctx.isWeightSumValid100(sub2), true);

  // 3) Suppression d'une colonne de 20 % sur 50 / 30 / 20 -> 63 / 37 = 100 %
  const c1 = { id: 'c1', weight: 50 }, c2 = { id: 'c2', weight: 30 };
  const sub3 = { assignments: [c1, c2], equalWeights: false };
  ctx.rebalanceWeightsTo100(sub3);
  assert.deepEqual(sub3.assignments.map(a => a.weight), [63, 37]);
  assert.equal(ctx.isWeightSumValid100(sub3), true);

  // 4) Respect d'une colonne figée (cadenas) lors d'un ajout
  const d1 = { id: 'd1', weight: 50 }, d2 = { id: 'd2', weight: 50 }, d3 = { id: 'd3', weight: 100 };
  const sub4 = { assignments: [d1, d2, d3], equalWeights: false };
  ctx.toggleWeightPin('d1');
  ctx.rebalanceWeightsTo100(sub4, { preferredAssignment: d3 });
  assert.deepEqual(sub4.assignments.map(a => a.weight), [50, 25, 25]);
  assert.equal(ctx.isWeightSumValid100(sub4), true);
  ctx.toggleWeightPin('d1');
});
