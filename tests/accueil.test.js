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
