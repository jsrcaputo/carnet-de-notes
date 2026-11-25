const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function loadMusic() {
  const context = vm.createContext({});
  const load = file => vm.runInContext(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), context, { filename: file });
  vm.runInContext(`
    const CYCLE_SCALE_URLS = { 1: 'cycle1', 2: 'cycle2', 3: 'cycle3' };
    const CYCLE_OBSERVABLE_RUBRICS = { 1: {}, 2: {} };
    const OBSERVABLE_PERFORMANCE_LEVELS = {};
    function getStudentCycle(level) {
      if (String(level) === 'P') return 'P';
      const n = Number(level);
      return n >= 1 && n <= 6 ? Math.ceil(n / 2) : null;
    }
  `, context);
  load('carnet-test/js/grilles-matieres.js');
  load('carnet-test/js/pedagogie/matieres-musique.js');
  load('carnet-test/js/pedagogie/matieres-anglais.js');
  load('carnet-test/js/pedagogie/cycles-musique.js');
  load('carnet-test/js/criteres.js');
  load('carnet-test/js/calculs.js');
  return expression => JSON.parse(JSON.stringify(vm.runInContext(expression, context)));
}

test('musique : grilles par cycle et pondérations du bulletin', () => {
  const evaluate = loadMusic();
  const result = evaluate(`ALL_SUBJECTS_CONFIG.filter(s => s.group === 'musique').map(s => ({
    id: s.id,
    cycles: ['1', '3', '5'].map(level => ({
      weight: getSubjectDisplayConfig(s, level).officialWeight,
      criteria: getCriteriaForGradeLevel(s, level).map(c => ({
        id: c.id, formative: c.formativeOnly, levels: Object.keys(c.cells)
      }))
    })),
    preschool: getCriteriaForGradeLevel(s, 'P').length
  }))`);
  assert.deepEqual(result.map(subject => subject.id), ['musique_c1c2', 'musique_c3']);
  for (const [index, subject] of result.entries()) {
    assert.equal(subject.preschool, 0);
    for (const cycle of subject.cycles) {
      assert.equal(cycle.weight, index === 0 ? 70 : 30);
      assert.ok(cycle.criteria.some(criterion => criterion.formative));
      assert.ok(cycle.criteria.some(criterion => !criterion.formative));
      for (const criterion of cycle.criteria) assert.deepEqual(criterion.levels, ['A', 'B', 'C', 'D', 'E']);
    }
  }
});

test('moyenne indicative : musique pondérée une fois et résultat incomplet exclu', () => {
  const evaluate = loadMusic();
  const result = evaluate(`(() => {
    const music = [
      { sub: { group: 'musique', officialWeight: 70 }, annualAvg: 80 },
      { sub: { group: 'musique', officialWeight: 30 }, annualAvg: 60 }
    ];
    const math = { sub: { group: 'maths', officialWeight: null }, annualAvg: 90 };
    const english = [
      { sub: { group: 'anglais', officialWeight: 60 }, annualAvg: 80 },
      { sub: { group: 'anglais', officialWeight: 40 }, annualAvg: 70 }
    ];
    return {
      music: computeDisciplineAverageForSummary(music),
      combined: computeDisciplineAverageForSummary([...music, math]),
      incomplete: computeDisciplineAverageForSummary([music[0], { ...music[1], annualAvg: null }, math]),
      english: computeDisciplineAverageForSummary(english)
    };
  })()`);
  assert.deepEqual(result, { music: 74, combined: 82, incomplete: 90, english: 76 });
});
