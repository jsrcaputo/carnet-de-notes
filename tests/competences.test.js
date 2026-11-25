const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

const root = path.join(__dirname, '..');

function setup() {
  const context = vm.createContext({ window: {} });
  vm.runInContext(fs.readFileSync(path.join(root, 'echelles-niveaux.js'), 'utf8'), context);
  vm.runInContext(fs.readFileSync(path.join(root, 'carnet-test', 'js', 'competences.js'), 'utf8'), context);
  vm.runInContext(fs.readFileSync(path.join(root, 'carnet-test', 'js', 'commentaires.js'), 'utf8'), context);
  vm.runInContext(`window.testHooks = {
    getCompetencyScaleModel,
    getLegacyCompetencyScaleModel,
    getCompetencyPicks,
    computeCompetencyResult,
    generateCompetencyComment,
    splitCompetencySentences
  };`, context);
  return context;
}

function getScale(context, id) {
  const source = context.window.ECHELLES_PRIMAIRE[id];
  return { ...source, id, max: source.echelons[source.echelons.length - 1].n };
}

test('sépare les phrases sans casser les abréviations et les parenthèses', () => {
  const context = setup();
  const sentences = context.window.testHooks.splitCompetencySentences(
    'L\u2019élève observe, p. ex.: un détail, etc.) Il le décrit. Mme. Tremblay explique.'
  );
  assert.equal(sentences.length, 3);
  assert.match(sentences[0], /p\. ex\.:/);
  assert.match(sentences[0], /etc\.\)/);
  assert.match(sentences[1], /^Il le décrit/);
  assert.match(sentences[2], /^Mme\. Tremblay/);
});

test('relie une progression de français oral sans confondre les phrases « la plupart du temps »', () => {
  const context = setup();
  const scale = getScale(context, 'fra_oral');
  const model = context.window.testHooks.getCompetencyScaleModel(scale);
  const level3 = model.levels.find(level => level.n === 3);
  const level4 = model.levels.find(level => level.n === 4);
  const sharedProgression = level => level.sentences.find(sentence =>
    sentence.text.includes('partage ses propos')
  );
  const mostOfTheTime = level4.sentences.find(sentence =>
    sentence.text.startsWith('La plupart du temps')
  );

  assert.equal(sharedProgression(level3).row, sharedProgression(level4).row);
  assert.notEqual(sharedProgression(level3).row, mostOfTheTime.row);
});

test('conserve les clés de ligne après l’ajout d’une phrase sans lien', () => {
  const context = setup();
  const hooks = context.window.testHooks;
  const base = {
    id: 'stable-anchor',
    max: 2,
    echelons: [
      { n: 1, cycle: 1, texte: 'L\u2019élève compare des figures planes.' },
      { n: 2, cycle: 1, texte: 'L\u2019élève compare des figures planes.' }
    ]
  };
  const before = hooks.getCompetencyScaleModel(base).levels[1].sentences[0].row;
  const changed = {
    ...base,
    id: 'stable-anchor-updated',
    echelons: [
      { n: 1, cycle: 1, texte: 'L\u2019élève dessine une étoile. L\u2019élève compare des figures planes.' },
      base.echelons[1]
    ]
  };
  const after = hooks.getCompetencyScaleModel(changed).levels[1].sentences[0].row;
  assert.equal(after, before);
});

test('migre sans perte les anciennes sélections fondées sur la position de phrase', () => {
  const context = setup();
  const scale = getScale(context, 'fra_oral');
  context.appState = { activeTerm: '1' };
  context.OWN = Object.prototype.hasOwnProperty;
  context.getCompetencyTabs = () => [{ scales: [scale] }];
  context.scheduleAppStateSave = () => {};
  context.showToast = () => {};

  [false, true].forEach(legacyKey => {
    const legacyModel = context.window.testHooks.getLegacyCompetencyScaleModel(scale, legacyKey);
    const oldSentence = legacyModel.levels.find(level => level.n === 3).sentences[2];
    const student = {
      competencyTerms: { '1': { [scale.id]: { [oldSentence.row]: 3 } } }
    };
    const migrated = context.window.testHooks.getCompetencyPicks(student, '1', true)[scale.id];
    const expected = context.window.testHooks.getCompetencyScaleModel(scale)
      .levels.find(level => level.n === 3).sentences.find(sentence => sentence.text === oldSentence.text);

    assert.equal(migrated[expected.row], 3);
    assert.equal(Object.keys(migrated).some(row => row === oldSentence.row), false);
  });
});

test('signale et conserve une sélection historique dont le texte source a changé', () => {
  const context = setup();
  const scale = {
    id: 'changed-source',
    max: 2,
    echelons: [
      { n: 1, cycle: 1, texte: 'L\u2019élève compare des figures planes.' },
      { n: 2, cycle: 1, texte: 'L\u2019élève compare des formes planes.' }
    ]
  };
  const oldModel = context.window.testHooks.getLegacyCompetencyScaleModel(scale);
  const oldRow = oldModel.levels[0].sentences[0].row;
  scale.echelons[0].texte = 'L\u2019élève dessine une étoile.';
  const student = {
    id: 'student-1',
    competencyTerms: { '1': { [scale.id]: { [oldRow]: 1 } } }
  };
  const messages = [];
  context.appState = { activeTerm: '1' };
  context.OWN = Object.prototype.hasOwnProperty;
  context.getCompetencyTabs = () => [{ scales: [scale] }];
  context.scheduleAppStateSave = () => {};
  context.showToast = message => messages.push(message);

  const picks = context.window.testHooks.getCompetencyPicks(student, '1')[scale.id];

  assert.equal(picks[oldRow], 1);
  assert.match(messages[0], /vérifiez votre sauvegarde/);
});

test('inclut le contexte précédent d’une phrase dépendante dans le commentaire généré', () => {
  const context = setup();
  const scale = getScale(context, 'art_dram_apprecier');
  const model = context.window.testHooks.getCompetencyScaleModel(scale);
  const level = model.levels.find(item => item.n === 4);
  const dependent = level.sentences.find(sentence => sentence.text.startsWith('Ces considérations'));
  const comment = context.window.testHooks.generateCompetencyComment(
    { firstName: 'Alex', pronoun: 'prenom' },
    scale,
    { [dependent.row]: 4 }
  );

  assert.match(comment, /Son propos contient/);
  assert.match(comment, /Ces considérations sont liées/);
});

test('arrondit une médiane exacte de deux échelons vers le niveau inférieur', () => {
  const context = setup();
  const scale = {
    id: 'half-level',
    max: 5,
    echelons: [
      { n: 1, cycle: 1, texte: 'L\u2019élève nomme une plante.' },
      { n: 2, cycle: 1, texte: 'L\u2019élève observe un nuage.' },
      { n: 3, cycle: 1, texte: 'L\u2019élève construit un bateau.' },
      { n: 4, cycle: 1, texte: 'L\u2019élève explique le soleil.' },
      { n: 5, cycle: 1, texte: 'L\u2019élève décrit une montagne.' }
    ]
  };
  const model = context.window.testHooks.getCompetencyScaleModel(scale);
  const result = context.window.testHooks.computeCompetencyResult(scale, {
    [model.levels.find(level => level.n === 4).sentences[0].row]: 4,
    [model.levels.find(level => level.n === 5).sentences[0].row]: 5
  });

  assert.equal(result.avg, 4.5);
  assert.equal(result.level, 4);
});
