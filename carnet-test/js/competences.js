    const COMPETENCY_STOPWORDS = new Set([
      'eleve', 'avec', 'dans', 'leur', 'leurs', 'elle', 'elles', 'ainsi', 'aussi',
      'parfois', 'souvent', 'pour', 'plus', 'tres', 'tout', 'tous', 'toute', 'toutes',
      'sont', 'etre', 'cette', 'ces', 'ses', 'son', 'lui', 'lorsqu', 'lorsque', 'comme',
      'selon', 'dont', 'tant', 'mais', 'peut', 'peuvent', 'fait', 'font', 'ayant', 'avoir',
      'quelques', 'certains', 'certaines', 'divers', 'diverses', 'plupart', 'occasion',
      'besoin', 'aide', 'generalement', 'maniere', 'moyen', 'moyenne', 'mesure', 'mesurer',
      'estime', 'estimer'
    ]);
    const LEGACY_COMPETENCY_STOPWORDS = new Set(
      'eleve avec dans leur leurs elle elles ainsi aussi parfois souvent pour plus tres tout tous toute toutes sont etre cette ces ses son lui lorsqu lorsque comme selon dont tant mais peut peuvent fait font ayant avoir quelques certains certaines divers diverses'.split(' ')
    );
    const competencyModelCache = {};
    const legacyCompetencyModelCache = {};
    const competencyMigrationWarnings = new Set();

    function splitLegacyCompetencySentences(text) {
      return String(text || '')
        .replace(/([.!?…])\s+(?=(?!Par exemple|Dans chaque cas|Mis à part)[A-ZÉÈÀÂÊÎÔÛÇ«“"])/g, '$1\u0001')
        .split('\u0001')
        .map(sentence => sentence.trim())
        .filter(Boolean);
    }

    function splitCompetencySentences(text) {
      let prepared = String(text || '')
        .replace(/\bp\.\s*ex\./giu, match => match.replace(/\./g, '\u0002'))
        .replace(/\betc\.(\s*[)\]»”]*)(?=\s*\p{Lu})/giu, 'etc.$1\u0001')
        .replace(/\betc\./giu, match => match.replace(/\./g, '\u0002'))
        .replace(/\b(?:M|Mme|Dr)\./giu, match => match.replace(/\./g, '\u0002'));
      prepared = prepared.replace(
        /([.!?…])([»”")\]]*)\s*(?=(?!Par exemple\b|Dans chaque cas\b|Mis à part\b)\p{Lu})/gu,
        '$1$2\u0001'
      );
      return prepared
        .split('\u0001')
        .map(sentence => sentence.replace(/\u0002/g, '.').trim())
        .filter(Boolean);
    }

    function normalizeCompetencyText(text) {
      return String(text || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/œ/g, 'oe').replace(/[^a-z0-9]+/g, ' ').trim();
    }

    function hashCompetencyAnchor(text) {
      const value = normalizeCompetencyText(text);
      let hash = 2166136261;
      for (let i = 0; i < value.length; i++) {
        hash ^= value.charCodeAt(i);
        hash = Math.imul(hash, 16777619);
      }
      return (hash >>> 0).toString(36);
    }

    function tokenizeCompetencyText(text) {
      return normalizeCompetencyText(text).split(/\s+/).map(word => {
        if (word === 'temps') return word;
        if (word.length > 7 && word.endsWith('ent')) return word.slice(0, -3);
        if (word.length > 6 && word.endsWith('es')) return word.slice(0, -2);
        if (word.length > 5 && word.endsWith('s')) return word.slice(0, -1);
        if (word.length > 6 && word.endsWith('e')) return word.slice(0, -1);
        return word;
      }).filter(word => word.length >= 4 && !COMPETENCY_STOPWORDS.has(word));
    }

    function getLegacyCompetencyScaleModel(scale, legacy = false) {
      const cacheKey = `${scale.id}:${legacy ? 'legacy' : 'v2'}`;
      if (legacyCompetencyModelCache[cacheKey]) return legacyCompetencyModelCache[cacheKey];
      const tokenize = text => String(text || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .split(/[^a-z]+/).filter(word => word.length >= 4 && !LEGACY_COMPETENCY_STOPWORDS.has(word)).map(word => word.slice(0, 6));
      const levels = scale.echelons.map((echelon, ei) => {
        const sentences = splitLegacyCompetencySentences(echelon.texte).map((text, j, all) => ({
          text, e: ei, j, p: all.length > 1 ? j / (all.length - 1) : 0, w: tokenize(text)
        }));
        return { n: echelon.n, cycle: echelon.cycle, sentences };
      });
      const all = [];
      const df = {};
      levels.forEach(level => level.sentences.forEach(sentence => {
        all.push(sentence);
        new Set(sentence.w).forEach(word => { df[word] = (df[word] || 0) + 1; });
      }));
      all.forEach(sentence => {
        const vector = {};
        sentence.w.forEach(word => { vector[word] = (vector[word] || 0) + 1; });
        let norm = 0;
        Object.keys(vector).forEach(word => {
          vector[word] *= Math.log(1 + all.length / df[word]);
          norm += vector[word] * vector[word];
        });
        sentence.v = vector;
        sentence.norm = Math.sqrt(norm) || 1;
        sentence.cluster = [sentence];
      });
      const pairs = [];
      for (let x = 0; x < all.length; x++) {
        for (let y = x + 1; y < all.length; y++) {
          const a = all[x], b = all[y];
          const gap = b.e - a.e;
          if (gap < 1 || gap > 3) continue;
          let dot = 0;
          Object.keys(a.v).forEach(word => { if (b.v[word]) dot += a.v[word] * b.v[word]; });
          let score = dot / (a.norm * b.norm) + 0.12 * (1 - Math.abs(a.p - b.p)) - 0.04 * (gap - 1);
          if (a.j === 0 && b.j === 0) score += 0.25;
          if (score >= 0.15) pairs.push([score, a, b]);
        }
      }
      pairs.sort((a, b) => b[0] - a[0]);
      pairs.forEach(([, a, b]) => {
        if (a.cluster === b.cluster) return;
        const occupied = new Set(a.cluster.map(sentence => sentence.e));
        if (b.cluster.some(sentence => occupied.has(sentence.e))) return;
        const merged = a.cluster.concat(b.cluster);
        merged.forEach(sentence => { sentence.cluster = merged; });
      });
      if (!legacy) {
        const clusters = new Set(all.map(sentence => sentence.cluster));
        clusters.forEach(cluster => {
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
      all.forEach(sentence => {
        const members = sentence.cluster.slice().sort((a, b) => a.e - b.e);
        sentence.row = `${legacy ? '' : 'v2:'}${members[0].e}:${members[0].j}`;
        if (!rows[sentence.row]) {
          rows[sentence.row] = { key: sentence.row, count: members.length, levels: members.map(member => levels[member.e].n) };
        }
      });
      const model = { levels, rows, max: scale.max };
      legacyCompetencyModelCache[cacheKey] = model;
      return model;
    }

    function getCompetencyScaleModel(scale) {
      if (competencyModelCache[scale.id]) return competencyModelCache[scale.id];
      const levels = scale.echelons.map((echelon, ei) => {
        const sentences = splitCompetencySentences(echelon.texte).map((text, j, all) => ({
          text, e: ei, j, p: all.length > 1 ? j / (all.length - 1) : 0,
          w: tokenizeCompetencyText(text), cluster: null
        }));
        return { n: echelon.n, cycle: echelon.cycle, sentences };
      });
      const all = levels.flatMap(level => level.sentences);
      const df = {};
      all.forEach(sentence => new Set(sentence.w).forEach(word => {
        df[word] = (df[word] || 0) + 1;
      }));
      all.forEach(sentence => {
        const vector = {};
        sentence.w.forEach(word => { vector[word] = (vector[word] || 0) + 1; });
        let norm = 0;
        Object.keys(vector).forEach(word => {
          vector[word] *= Math.log(1 + all.length / df[word]);
          norm += vector[word] * vector[word];
        });
        sentence.v = vector;
        sentence.norm = Math.sqrt(norm) || 1;
        sentence.cluster = [sentence];
      });

      const pairs = [];
      for (let x = 0; x < all.length; x++) {
        for (let y = x + 1; y < all.length; y++) {
          const a = all[x], b = all[y];
          const gap = b.e - a.e;
          if (gap < 1 || gap > 3) continue;
          const shared = Object.keys(a.v).filter(word => b.v[word]);
          // Deux mots porteurs au minimum évitent les rapprochements fondés sur des mots génériques isolés.
          if (shared.length < 2) continue;
          const dot = shared.reduce((sum, word) => sum + a.v[word] * b.v[word], 0);
          const cosine = dot / (a.norm * b.norm);
          const coverage = shared.length / Math.min(Object.keys(a.v).length, Object.keys(b.v).length);
          const similarity = Math.max(cosine, coverage);
          const score = similarity + 0.04 * (1 - Math.abs(a.p - b.p)) - 0.025 * (gap - 1);
          if (score >= 0.22) pairs.push({ score, a, b });
        }
      }
      pairs.sort((a, b) => b.score - a.score);
      pairs.forEach(({ a, b }) => {
        if (a.cluster === b.cluster) return;
        const occupied = new Set(a.cluster.map(sentence => sentence.e));
        if (b.cluster.some(sentence => occupied.has(sentence.e))) return;
        const merged = a.cluster.concat(b.cluster);
        merged.forEach(sentence => { sentence.cluster = merged; });
      });

      const rows = {};
      all.forEach(sentence => {
        const members = sentence.cluster.slice().sort((a, b) => a.e - b.e);
        sentence.row = `v3:${members[0].e}:${hashCompetencyAnchor(members[0].text)}`;
        if (!rows[sentence.row]) {
          rows[sentence.row] = {
            key: sentence.row,
            count: members.length,
            levels: members.map(member => levels[member.e].n)
          };
        }
      });
      const model = { levels, rows, max: scale.max };
      competencyModelCache[scale.id] = model;
      return model;
    }

    // Barème : le niveau est l'échelon atteint par la majorité des phrases retenues (médiane pondérée), et non une moyenne.
    // Une phrase choisie à l'échelon n signifie « l'élève est au moins à n pour cet aspect »; quelques aspects plus faibles
    // ne tirent donc pas le niveau vers le bas. Une ligne de progression présente sur plusieurs échelons pèse davantage
    // qu'un détail propre à un seul échelon. À égalité parfaite, le niveau suggéré reste le plus prudent.
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
      const roundedDown = Math.floor(median);
      const rounded = median - roundedDown === 0.5 ? roundedDown : Math.round(median);
      const atOrAbove = items.filter(item => item.n >= rounded).length;
      return {
        level: Math.min(model.max, Math.max(1, rounded)),
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
      for (let i = 0; i < items.length; i++) {
        acc += items[i].w;
        if (acc >= total / 2) {
          level = items[i].q;
          break;
        }
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

    // Les clés de lignes sont ancrées au texte pour résister aux changements de regroupement.
    function getCompetencyPicks(student, term, persistMigration = false) {
      const key = String(term);
      const terms = student.competencyTerms && typeof student.competencyTerms === 'object' && !Array.isArray(student.competencyTerms)
        ? student.competencyTerms
        : {};
      const legacy = student.competencySentences && typeof student.competencySentences === 'object'
        ? student.competencySentences
        : null;
      const stored = OWN.call(terms, key) ? terms[key] : (key === String(appState.activeTerm) ? legacy : null);
      const sourcePicks = stored && typeof stored === 'object' && !Array.isArray(stored) ? stored : {};
      const picks = persistMigration ? sourcePicks : JSON.parse(JSON.stringify(sourcePicks));
      let migrated = false;
      let migrationFailed = false;
      let migrationMerged = false;
      getCompetencyTabs().flatMap(tab => tab.scales).forEach(scale => {
        const selected = picks[scale.id];
        if (!selected) return;
        const oldRows = Object.keys(selected).filter(row =>
          row.startsWith('v2:') || /^\d+:\d+$/.test(row)
        );
        if (!oldRows.length) return;
        const current = getCompetencyScaleModel(scale);
        oldRows.forEach(row => {
          const legacyRow = row.replace(/^v2:/, '');
          const [oldEchelon] = legacyRow.split(':').map(Number);
          const previous = getLegacyCompetencyScaleModel(scale, !row.startsWith('v2:'));
          const selectedLevelIndex = previous.levels.findIndex(level => level.n === Number(selected[row]));
          const oldSentence = selectedLevelIndex < 0 ? null :
            previous.levels[selectedLevelIndex].sentences.find(sentence =>
              sentence.row === row || sentence.row === legacyRow
            );
          const sourceEchelon = oldSentence ? oldSentence.e : oldEchelon;
          const targetLevel = current.levels.find(level => level.n === Number(selected[row]));
          const newSentence = oldSentence && targetLevel && targetLevel.sentences.find(sentence =>
            sentence.e === sourceEchelon &&
            normalizeCompetencyText(sentence.text) === normalizeCompetencyText(oldSentence.text)
          );
          if (!newSentence) {
            console.warn('Impossible de migrer une sélection de niveau de compétence.', scale.id, row);
            migrationFailed = true;
            return;
          }
          if (Object.prototype.hasOwnProperty.call(selected, newSentence.row)) {
            migrationMerged = true;
            if (Number(selected[newSentence.row]) !== Number(selected[row])) {
              selected[newSentence.row] = Math.max(Number(selected[newSentence.row]), Number(selected[row]));
            }
          } else {
            selected[newSentence.row] = selected[row];
          }
          delete selected[row];
          migrated = true;
        });
      });
      if (persistMigration) {
        if (!student.competencyTerms || typeof student.competencyTerms !== 'object' || Array.isArray(student.competencyTerms)) {
          student.competencyTerms = {};
        }
        student.competencyTerms[key] = picks;
        if (legacy) delete student.competencySentences;
        if (migrated) scheduleAppStateSave();
      }
      const warningKey = `${student.id}:${key}`;
      if (migrationFailed && !competencyMigrationWarnings.has(warningKey)) {
        competencyMigrationWarnings.add(warningKey);
        showToast('Certaines phrases choisies n’ont pas pu être mises à jour; vérifiez votre sauvegarde.');
      } else if (migrationMerged && !competencyMigrationWarnings.has(warningKey)) {
        competencyMigrationWarnings.add(warningKey);
        showToast('Des sélections historiques regroupées dans la même phrase ont été fusionnées; vérifiez le résultat.');
      }
      return picks;
    }

    function getAnnualCompetencyPicks(student, persist = false) {
      if (student.competencyTerms && OWN.call(student.competencyTerms, 'annual')) {
        return getCompetencyPicks(student, 'annual', persist);
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
          if (!isSafeImportedId(scaleId) || !isRecord(selected) || !Object.keys(selected).length) return;
          const cleanSelected = {};
          Object.entries(selected).forEach(([rowKey, val]) => {
            if (!RESERVED_IMPORTED_IDS.has(rowKey)) cleanSelected[rowKey] = val;
          });
          if (!Object.keys(cleanSelected).length) return;
          annual[scaleId] = cleanSelected;
          const termComments = student.competencyComments && student.competencyComments[term];
          const termOverrides = student.competencyMeq && student.competencyMeq[term];
          if (termComments && Object.prototype.hasOwnProperty.call(termComments, scaleId)) comments[scaleId] = termComments[scaleId];
          else delete comments[scaleId];
          if (termOverrides && Object.prototype.hasOwnProperty.call(termOverrides, scaleId)) overrides[scaleId] = termOverrides[scaleId];
          else delete overrides[scaleId];
        });
      });
      if (persist) {
        if (!student.competencyTerms || typeof student.competencyTerms !== 'object' || Array.isArray(student.competencyTerms)) {
          student.competencyTerms = {};
        }
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
      }
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
