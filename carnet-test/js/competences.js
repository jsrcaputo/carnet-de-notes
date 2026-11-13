    const COMPETENCY_STOPWORDS = new Set('eleve avec dans leur leurs elle elles ainsi aussi parfois souvent pour plus tres tout tous toute toutes sont etre cette ces ses son lui lorsqu lorsque comme selon dont tant mais peut peuvent fait font ayant avoir quelques certains certaines divers diverses'.split(' '));
    const competencyModelCache = {};

    function splitCompetencySentences(text) {
      return String(text || '')
        .replace(/([.!?…])\s+(?=(?!Par exemple|Dans chaque cas|Mis à part)[A-ZÉÈÀÂÊÎÔÛÇ«“"])/g, '$1\u0001')
        .split('\u0001')
        .map(s => s.trim())
        .filter(Boolean);
    }

    function getCompetencyScaleModel(scale, legacy = false) {
      const cacheKey = `${scale.id}:${legacy ? 'legacy' : 'v2'}`;
      if (competencyModelCache[cacheKey]) return competencyModelCache[cacheKey];
      const tokenize = s => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .split(/[^a-z]+/).filter(w => w.length >= 4 && !COMPETENCY_STOPWORDS.has(w)).map(w => w.slice(0, 6));
      const levels = scale.echelons.map((e, ei) => {
        const sentences = splitCompetencySentences(e.texte).map((text, j, all) => ({
          text, e: ei, j, p: all.length > 1 ? j / (all.length - 1) : 0, w: tokenize(text)
        }));
        return { n: e.n, cycle: e.cycle, sentences };
      });
      const all = [];
      const df = {};
      levels.forEach(level => level.sentences.forEach(s => {
        all.push(s);
        new Set(s.w).forEach(w => { df[w] = (df[w] || 0) + 1; });
      }));
      all.forEach(s => {
        const v = {};
        s.w.forEach(w => { v[w] = (v[w] || 0) + 1; });
        let norm = 0;
        Object.keys(v).forEach(w => { v[w] *= Math.log(1 + all.length / df[w]); norm += v[w] * v[w]; });
        s.v = v;
        s.norm = Math.sqrt(norm) || 1;
        s.cluster = [s];
      });
      const pairs = [];
      for (let x = 0; x < all.length; x++) {
        for (let y = x + 1; y < all.length; y++) {
          const a = all[x], b = all[y];
          const gap = b.e - a.e;
          if (gap < 1 || gap > 3) continue;
          let dot = 0;
          Object.keys(a.v).forEach(w => { if (b.v[w]) dot += a.v[w] * b.v[w]; });
          let score = dot / (a.norm * b.norm) + 0.12 * (1 - Math.abs(a.p - b.p)) - 0.04 * (gap - 1);
          if (a.j === 0 && b.j === 0) score += 0.25;
          if (score >= 0.15) pairs.push([score, a, b]);
        }
      }
      pairs.sort((p, q) => q[0] - p[0]);
      pairs.forEach(([, a, b]) => {
        if (a.cluster === b.cluster) return;
        const taken = new Set(a.cluster.map(s => s.e));
        if (b.cluster.some(s => taken.has(s.e))) return;
        const merged = a.cluster.concat(b.cluster);
        merged.forEach(s => { s.cluster = merged; });
      });
      if (!legacy) {
        const oldClusters = new Set(all.map(s => s.cluster));
        oldClusters.forEach(cluster => {
          const groups = [];
          cluster.slice().sort((a, b) => a.e - b.e || a.j - b.j).forEach(sentence => {
            const group = groups.find(members => members.every(other => {
              const shared = [...new Set(sentence.w)].filter(word => other.w.includes(word));
              if (shared.length < 2) return false;
              const dot = shared.reduce((sum, word) => sum + sentence.v[word] * other.v[word], 0);
              return dot / (sentence.norm * other.norm) >= 0.25;
            }));
            if (group) group.push(sentence);
            else groups.push([sentence]);
          });
          groups.forEach(group => group.forEach(sentence => { sentence.cluster = group; }));
        });
      }
      const rows = {};
      all.forEach(s => {
        const members = s.cluster.slice().sort((p, q) => p.e - q.e);
        s.row = `${legacy ? '' : 'v2:'}${members[0].e}:${members[0].j}`;
        if (!rows[s.row]) rows[s.row] = { key: s.row, count: members.length, levels: members.map(m => levels[m.e].n) };
      });
      const model = { levels, rows, max: scale.max };
      competencyModelCache[cacheKey] = model;
      return model;
    }

    // Barème : le niveau est l'échelon atteint par la majorité des phrases retenues (médiane pondérée), et non une moyenne.
    // Une phrase choisie à l'échelon n signifie « l'élève est au moins à n pour cet aspect »; quelques aspects plus faibles
    // ne tirent donc pas le niveau vers le bas. Une ligne de progression présente sur plusieurs échelons pèse davantage
    // qu'un détail propre à un seul échelon. À égalité parfaite, on prend le milieu des deux échelons centraux.
    function computeCompetencyResult(scale, picked) {
      const model = getCompetencyScaleModel(scale);
      const items = [];
      let min = Infinity, max = -Infinity;
      Object.keys(picked || {}).forEach(rowKey => {
        const row = model.rows[rowKey];
        const n = Number(picked[rowKey]);
        if (!row || !row.levels.includes(n)) return;
        items.push({ n, w: row.count });
        min = Math.min(min, n);
        max = Math.max(max, n);
      });
      if (!items.length) return null;
      items.sort((a, b) => a.n - b.n);
      const total = items.reduce((sum, item) => sum + item.w, 0);
      let acc = 0, lower = items[0].n, upper = items[0].n;
      for (let i = 0; i < items.length; i++) {
        acc += items[i].w;
        if (acc >= total / 2) {
          lower = items[i].n;
          upper = acc === total / 2 && items[i + 1] ? items[i + 1].n : items[i].n;
          break;
        }
      }
      const median = (lower + upper) / 2;
      const atOrAbove = items.filter(item => item.n >= Math.round(median)).length;
      return {
        level: Math.min(model.max, Math.max(1, Math.round(median))),
        avg: median, min, max, count: items.length, atOrAbove
      };
    }

    // -------------------------------------------------------------------------
    // Pont vers les échelles officielles du MEQ à 5 niveaux (bilan de fin de cycle, depuis 2008-2009).
    // Aucun calcul à partir du /10 : chaque phrase surlignée est située par rapport aux attentes du cycle
    // réel de l'élève (cycle modifié inclus).
    // Le repère suggéré peut toujours être ajusté d'un clic par l'enseignant.
    // -------------------------------------------------------------------------
    const MEQ5_LEVELS = {
      5: { label: 'Compétence marquée', text: 'Mobilise avec efficacité l’ensemble des ressources : réalise les tâches de manière remarquable.' },
      4: { label: 'Compétence assurée', text: 'Mobilise l’ensemble des ressources : réalise correctement les tâches.' },
      3: { label: 'Compétence acceptable', text: 'Mobilise les principales ressources : réalise l’essentiel des tâches.' },
      2: { label: 'Compétence peu développée', text: 'Mobilise certaines ressources lorsqu’il est guidé : réalise les tâches avec difficulté.' },
      1: { label: 'Compétence très peu développée', text: 'Mobilise peu de ressources : réalise partiellement les tâches ou les réalise avec une aide soutenue.' }
    };
    function getMeqScaleUrl(cycle, tabId) {
      const base = CYCLE_SCALE_URLS[cycle];
      if (!base) return '';
      return `${base}#page=1`;
    }

    function getCompetencyEffectiveCycle(student, tabId) {
      if (!student) return null;
      const key = { sciences_global: 'sciences', univers_social: 'social' }[tabId] || tabId;
      const sub = SUBJECTS_CONFIG.find(s => (s.group || s.id) === key);
      const level = getEffectiveGradeLevel(student, sub ? sub.id : null) || student.gradeLevel;
      const cycle = getStudentCycle(level);
      return cycle === 1 || cycle === 2 || cycle === 3 ? cycle : null;
    }

    function computeMeqSuggestion(student, scale, tabId, picked) {
      const cycle = getCompetencyEffectiveCycle(student, tabId);
      if (!cycle) return { cycle: null, level: null, items: [] };
      const model = getCompetencyScaleModel(scale);
      const band = model.levels.filter(l => l.cycle === cycle);
      if (!band.length) return { cycle, level: null, items: [], unavailable: true };
      const items = [];
      Object.keys(picked || {}).forEach(rowKey => {
        const row = model.rows[rowKey];
        const n = Number(picked[rowKey]);
        if (!row || !row.levels.includes(n)) return;
        const lvl = model.levels.find(l => l.n === n);
        if (!lvl) return;
        const sentence = lvl.sentences.find(s => s.row === rowKey);
        let q, why;
        if (lvl.cycle > cycle) {
          q = 5; why = 'repère du cycle suivant : dépasse les attentes du cycle';
        } else if (lvl.cycle < cycle) {
          const prev = model.levels.filter(l => l.cycle === lvl.cycle);
          q = prev[prev.length - 1].n === n ? 2 : 1;
          why = 'repère d’un cycle précédent';
        } else {
          const idx = band.findIndex(l => l.n === n);
          const isEnd = idx === band.length - 1;
          q = Math.max(1, 4 - (band.length - 1 - idx));
          why = isEnd ? 'attente de fin de cycle' : (q === 3 ? 'en progression vers la fin de cycle' : 'début de développement dans le cycle');
        }
        items.push({ n, q, w: row.count, why, text: sentence ? sentence.text : '' });
      });
      if (!items.length) return { cycle, level: null, items };
      items.sort((a, b) => a.q - b.q || a.n - b.n);
      const total = items.reduce((sum, item) => sum + item.w, 0);
      let acc = 0, level = items[0].q;
      for (const item of items) {
        acc += item.w;
        if (acc >= total / 2) { level = item.q; break; }
      }
      return { cycle, level, items };
    }

    function getMeqOverride(student, term, scaleId) {
      const v = Number(student.competencyMeq && student.competencyMeq[term] && student.competencyMeq[term][scaleId]);
      return v >= 1 && v <= 5 ? v : null;
    }

    function setMeqOverride(student, term, scaleId, level) {
      if (!student.competencyMeq || typeof student.competencyMeq !== 'object') student.competencyMeq = {};
      if (!student.competencyMeq[term]) student.competencyMeq[term] = {};
      if (level) student.competencyMeq[term][scaleId] = level;
      else delete student.competencyMeq[term][scaleId];
    }

    // Repère MEQ final = suggestion issue des phrases surlignées, sauf ajustement manuel de l'enseignant.
    function getMeqFinal(student, term, scale, tabId, picked) {
      const suggestion = computeMeqSuggestion(student, scale, tabId, picked);
      if (!suggestion.level) return suggestion;
      const override = getMeqOverride(student, term, scale.id);
      return { ...suggestion, suggested: suggestion.level, level: override || suggestion.level, override };
    }

    // Les anciennes sélections par étape restent disponibles dans les sauvegardes.
    function getCompetencyPicks(student, term) {
      if (!student.competencyTerms || typeof student.competencyTerms !== 'object') student.competencyTerms = {};
      const legacy = student.competencySentences;
      if (legacy && typeof legacy === 'object') {
        if (Object.keys(legacy).length && !student.competencyTerms[appState.activeTerm]) {
          student.competencyTerms[appState.activeTerm] = legacy;
        }
        delete student.competencySentences;
      }
      const key = String(term);
      if (!student.competencyTerms[key]) student.competencyTerms[key] = {};
      const picks = student.competencyTerms[key];
      let migrated = false;
      let migrationFailed = false;
      getCompetencyTabs().flatMap(tab => tab.scales).forEach(scale => {
        const selected = picks[scale.id];
        if (!selected || !Object.keys(selected).some(row => !row.startsWith('v2:'))) return;
        const previous = getCompetencyScaleModel(scale, true);
        const current = getCompetencyScaleModel(scale);
        Object.keys(selected).filter(row => !row.startsWith('v2:')).forEach(row => {
          const levelIndex = previous.levels.findIndex(level => level.n === Number(selected[row]));
          const oldSentence = levelIndex < 0 ? null : previous.levels[levelIndex].sentences.find(sentence => sentence.row === row);
          const newSentence = oldSentence && current.levels[levelIndex].sentences[oldSentence.j];
          if (!newSentence || Object.prototype.hasOwnProperty.call(selected, newSentence.row)) {
            console.warn('Impossible de migrer une sélection de niveau de compétence.', scale.id, row);
            migrationFailed = true;
            return;
          }
          selected[newSentence.row] = selected[row];
          delete selected[row];
          migrated = true;
        });
      });
      if (migrated) scheduleAppStateSave();
      if (migrationFailed) showToast('Certaines phrases choisies n’ont pas pu être mises à jour; vérifiez votre sauvegarde.');
      return picks;
    }

    function getAnnualCompetencyPicks(student) {
      if (student.competencyTerms && Object.prototype.hasOwnProperty.call(student.competencyTerms, 'annual')) {
        return getCompetencyPicks(student, 'annual');
      }
      const annual = {};
      const comments = {};
      const overrides = {};
      const source = {
        ...student,
        competencyTerms: JSON.parse(JSON.stringify(student.competencyTerms || {})),
        competencySentences: student.competencySentences ? JSON.parse(JSON.stringify(student.competencySentences)) : undefined
      };
      ['1', '2', '3'].forEach(term => {
        const picks = getCompetencyPicks(source, term);
        Object.entries(picks).forEach(([scaleId, selected]) => {
          if (!selected || !Object.keys(selected).length) return;
          annual[scaleId] = { ...selected };
          const termComments = student.competencyComments && student.competencyComments[term];
          const termOverrides = student.competencyMeq && student.competencyMeq[term];
          if (termComments && Object.prototype.hasOwnProperty.call(termComments, scaleId)) comments[scaleId] = termComments[scaleId];
          else delete comments[scaleId];
          if (termOverrides && Object.prototype.hasOwnProperty.call(termOverrides, scaleId)) overrides[scaleId] = termOverrides[scaleId];
          else delete overrides[scaleId];
        });
      });
      if (!student.competencyTerms || typeof student.competencyTerms !== 'object') student.competencyTerms = {};
      student.competencyTerms.annual = annual;
      if (Object.keys(comments).length) {
        if (!student.competencyComments) student.competencyComments = {};
        student.competencyComments.annual = comments;
      }
      if (Object.keys(overrides).length) {
        if (!student.competencyMeq) student.competencyMeq = {};
        student.competencyMeq.annual = overrides;
      }
      scheduleAppStateSave();
      return annual;
    }

    function getCompetencyProgress(student, scale) {
      return ['1', '2', '3'].map(term => {
        const result = computeCompetencyResult(scale, getCompetencyPicks(student, term)[scale.id]);
        return result ? result.level : null;
      });
    }

    // Commentaire de bulletin : assemble les phrases retenues (dans l'ordre de l'échelle) avec une syntaxe fluide,
    // sans répéter le prénom de l'élève à chaque phrase ou proposition, et en accordant au féminin si nécessaire.
