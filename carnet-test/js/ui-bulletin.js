    function renderGlobalReportView() {
      const band = document.getElementById('grStudentBand');
      const container = document.getElementById('grReportContent');
      if (!band || !container) return;

      // Annual weight indicator (20-20-60 MEQ)
      appState.annualWeightMode = 'official';
      const weightMode = 'official';

      const st = appState.students.find(s => s.id === appState.selectedStudentId) || null;
      ['btnGrPrevStudent', 'btnGrNextStudent', 'btnPrintGlobalReport'].forEach(id => {
        document.getElementById(id).disabled = !st;
      });

      if (!appState.students.length) {
        band.innerHTML = '';
        container.innerHTML = '<div class="bg-white rounded-xl border border-slate-200 p-6 text-center text-sm text-slate-600">Ajoutez un élève pour consulter sa synthèse.</div>';
        return;
      }

      // 1. Render Student Band (2 rows of 5 students)
      band.innerHTML = '';
      appState.students.forEach(student => {
        const isSel = Boolean(st && student.id === st.id);
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.setAttribute('aria-pressed', String(isSel));
        btn.className = isSel
          ? 'w-full px-3 py-2 rounded-lg text-xs font-bold bg-indigo-600 text-white shadow-xs transition cursor-pointer flex items-center justify-between gap-1 truncate'
          : 'w-full px-3 py-2 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 transition cursor-pointer flex items-center justify-between gap-1 truncate';
        btn.innerHTML = `<span class="truncate">${escapeHtml(student.name)}</span><span>→</span>`;
        btn.addEventListener('click', () => {
          appState.selectedStudentId = student.id;
          renderGlobalReportView();
        });
        band.appendChild(btn);
      });

      if (!st) {
        container.innerHTML = '<div class="bg-white rounded-xl border border-slate-200 p-6 text-center text-sm font-semibold text-slate-600">Sélectionner un nom ci-dessus pour afficher la synthèse de l’élève.</div>';
        return;
      }

      // 2. Gather grade data across the three terms and all subjects
      const subjectRows = [];
      const termGlobals = { '1': [], '2': [], '3': [] };
      let totalEvaluatedWorksCount = 0;
      const seenLinkedWorks = new Set();
      let totalVisualTracesCount = 0;
      const tagFrequency = {};
      const flagFrequency = {};
      const recordedComments = [];

      SUBJECTS_CONFIG.forEach(sub => {
        const t1 = computeStudentSubjectSummary('1', sub.id, st.id).finalPct;
        const t2 = computeStudentSubjectSummary('2', sub.id, st.id).finalPct;
        const t3 = computeStudentSubjectSummary('3', sub.id, st.id).finalPct;

        if (t1 !== null) termGlobals['1'].push(t1);
        if (t2 !== null) termGlobals['2'].push(t2);
        if (t3 !== null) termGlobals['3'].push(t3);

        const validTerms = [t1, t2, t3].filter(v => v !== null);
        const annualAvg = computeWeightedAnnualAverage(t1, t2, t3, weightMode);

        // Evolution delta between earliest and latest available term
        let delta = null;
        if (validTerms.length >= 2) {
          delta = validTerms[validTerms.length - 1] - validTerms[0];
        }

        // Count works, visual traces, tags, flags, and comments for this student across all 3 terms
        ['1', '2', '3'].forEach(tKey => {
          const sd = appState.terms[tKey].subjectData[sub.id];
          const rec = sd.studentRecords[st.id];
          sd.assignments.forEach(asg => {
            const sc = rec.scores[asg.id];
            const meta = rec.scoreMeta && rec.scoreMeta[asg.id];
            if (asg.isObservation && meta && meta.linkedCopy) return;
            if (asg.isObservation && meta && meta.notEvaluated) {
              totalVisualTracesCount++;
            } else if (sc !== undefined && sc !== '' && sc !== '-' && !isNaN(Number(sc))) {
              if (asg.isObservation) totalVisualTracesCount++;
              else if (asg.linkId) {
                const key = tKey + asg.linkId;
                if (!seenLinkedWorks.has(key)) { seenLinkedWorks.add(key); totalEvaluatedWorksCount++; }
              } else totalEvaluatedWorksCount++;
            }
            if (meta && Array.isArray(meta.tags)) {
              meta.tags.forEach(tg => {
                tagFrequency[tg] = (tagFrequency[tg] || 0) + 1;
              });
            }
            if (meta && Array.isArray(meta.flags)) {
              meta.flags.forEach(fl => {
                if (VALID_CELL_FLAG_CODES.has(fl)) {
                  flagFrequency[fl] = (flagFrequency[fl] || 0) + 1;
                }
              });
            }
            if (meta && meta.comment && meta.comment.trim()) {
              recordedComments.push({
                term: tKey,
                subject: sub.shortName,
                context: asg.title,
                text: meta.comment.trim()
              });
            }
          });
          if (rec.comment && rec.comment.trim()) {
            recordedComments.push({
              term: tKey,
              subject: sub.shortName,
              context: 'Commentaire général',
              text: rec.comment.trim()
            });
          }
        });

        subjectRows.push({
          sub,
          t1,
          t2,
          t3,
          annualAvg,
          annualCode: pctToClosestGradeCode(annualAvg),
          delta,
          isModified: isSubjectModifiedForStudent(st, sub),
          effectiveLevel: getEffectiveGradeLevel(st, sub)
        });
      });

      // Sciences et GHEC : un seul résultat au bulletin (les 3 compétences sont évaluées ensemble)
      ['social', 'sciences'].forEach(groupKey => {
        const parts = subjectRows.filter(r => r.sub.group === groupKey);
        if (!parts.length) return;
        const mean = vals => {
          const ok = vals.filter(v => v !== null);
          return ok.length ? Math.round(ok.reduce((a, b) => a + b, 0) / ok.length) : null;
        };
        const pooled = tk => computePooledGroupPct(tk, parts.map(r => r.sub), st.id, mean(parts.map(r => r['t' + tk])));
        const t1 = pooled('1');
        const t2 = pooled('2');
        const t3 = pooled('3');
        const terms = [t1, t2, t3].filter(v => v !== null);
        const annualAvg = computeWeightedAnnualAverage(t1, t2, t3, weightMode);
        const mergedSub = { ...parts[0].sub, id: groupKey, shortName: parts[0].sub.bulletinLabel };
        const merged = {
          sub: mergedSub,
          t1, t2, t3, annualAvg,
          annualCode: pctToClosestGradeCode(annualAvg),
          delta: terms.length >= 2 ? terms[terms.length - 1] - terms[0] : null,
          isModified: isSubjectModifiedForStudent(st, mergedSub),
          effectiveLevel: getEffectiveGradeLevel(st, mergedSub)
        };
        const firstIdx = subjectRows.indexOf(parts[0]);
        subjectRows.splice(firstIdx, 0, merged);
        parts.forEach(r => subjectRows.splice(subjectRows.indexOf(r), 1));
      });
      ['1', '2', '3'].forEach(k => {
        termGlobals[k] = subjectRows.map(r => r['t' + k]).filter(v => v !== null);
      });

      const avgT1 = termGlobals['1'].length > 0 ? Math.round(termGlobals['1'].reduce((a, b) => a + b, 0) / termGlobals['1'].length) : null;
      const avgT2 = termGlobals['2'].length > 0 ? Math.round(termGlobals['2'].reduce((a, b) => a + b, 0) / termGlobals['2'].length) : null;
      const avgT3 = termGlobals['3'].length > 0 ? Math.round(termGlobals['3'].reduce((a, b) => a + b, 0) / termGlobals['3'].length) : null;

      const populatedSubjects = subjectRows.filter(r => r.annualAvg !== null);
      const disciplineKey = row => row.sub.group || row.sub.id;
      const populatedDisciplines = [...new Set(populatedSubjects.map(disciplineKey))];
      const totalDisciplines = new Set(SUBJECTS_CONFIG.map(sub => sub.group || sub.id)).size;
      const overallAnnualAvg = populatedSubjects.length > 0
        ? Math.round(populatedSubjects.reduce((total, row) => total + row.annualAvg, 0) / populatedSubjects.length)
        : null;

      // Sort tags by frequency
      const sortedTags = Object.entries(tagFrequency).sort((a, b) => b[1] - a[1]);

      const studentCycle = getStudentCycle(st.gradeLevel);
      const compTerm = 'annual';
      const compPicks = getAnnualCompetencyPicks(st);
      const hasHistoricalCompetencies = ['1', '2', '3'].some(term => st.competencyTerms[term] && Object.keys(st.competencyTerms[term]).length);
      const competencyTabs = getCompetencyTabs();
      const selectedTab = competencyTabs.find(tab => tab.id === competencySubjectSelected && !tab.disabled)
        || competencyTabs.find(tab => !tab.disabled)
        || { id: '', label: '', scales: [] };
      competencySubjectSelected = selectedTab.id;
      const selectedScale = selectedTab.scales.find(scale => scale.id === competencyScaleSelected[selectedTab.id]) || selectedTab.scales[0] || null;
      if (selectedScale) competencyScaleSelected[selectedTab.id] = selectedScale.id;
      const getCompetencyResult = scale => computeCompetencyResult(scale, compPicks[scale.id]);
      const levelSummaryHtml = `
        <div class="comp-recap" id="grCompetencyLevelSummary" aria-label="Niveaux de compétence par matière">
          <span class="comp-recap-title">Niveaux de compétence</span>
          <button type="button" class="comp-recap-print no-print" data-comp-print="1" aria-label="Imprimer les niveaux de compétence" title="Imprimer les niveaux de compétence">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
          </button>
          ${competencyTabs.flatMap(tab => tab.scales.map(scale => ({ scale, tabId: tab.id }))).map(({ scale, tabId }) => {
            const result = getCompetencyResult(scale);
            const meqChip = result ? getMeqFinal(st, compTerm, scale, tabId, compPicks[scale.id]) : null;
            const meqChipHtml = meqChip && meqChip.level ? ` <span class="comp-chip-meq" title="Repère indicatif sur l’échelle du MEQ : ${escapeHtml(MEQ5_LEVELS[meqChip.level].label)}">· MEQ ${meqChip.level}/5</span>` : '';
            return `<span class="comp-chip${result ? ' is-set' : ''}">${escapeHtml(scale.chip)} <b>${result ? `${result.level}/${scale.max}` : '—'}</b>${meqChipHtml}</span>`;
          }).join('')}
        </div>
      `;
      const renderScaleSection = scale => {
        const model = getCompetencyScaleModel(scale);
        if (!model.levels.length) {
          return '<p class="text-sm text-slate-600">Les échelles sont introuvables : le fichier echelles-niveaux.js doit rester dans le même dossier que le carnet.</p>';
        }
        const picked = compPicks[scale.id] || {};
        const result = computeCompetencyResult(scale, picked);
        const meq = result ? getMeqFinal(st, compTerm, scale, selectedTab.id, picked) : null;
        const meqHtml = meq && meq.level ? `
              <div class="comp-meq" role="group" aria-label="Repère indicatif sur l’échelle du MEQ à 5 niveaux">
                <span class="comp-meq-label" title="Repère suggéré par les phrases surlignées, selon les attentes du ${escapeHtml(CYCLE_LABELS[meq.cycle] || '')} de l’élève. Cliquez un niveau pour l’ajuster.">Échelle MEQ · ${escapeHtml(CYCLE_LABELS[meq.cycle] || '')}</span>
                <span class="comp-meq-steps">${[1, 2, 3, 4, 5].map(v => `<button type="button" class="comp-meq-btn${v === meq.level ? ' is-level' : ''}${v === meq.suggested ? ' is-suggested' : ''}" data-comp-meq="${scale.id}" data-meq-val="${v}" aria-pressed="${v === meq.level}" title="Niveau ${v} — ${escapeHtml(MEQ5_LEVELS[v].label)}${v === meq.suggested ? ' (suggéré par vos phrases)' : ''}">${v}</button>`).join('')}</span>
                <span class="comp-meq-name">${escapeHtml(MEQ5_LEVELS[meq.level].label)}${meq.override ? ' <em>· ajusté</em>' : ''}</span>
                ${meq.override ? `<button type="button" class="comp-meq-auto" data-comp-meq-auto="${scale.id}" title="Revenir au niveau suggéré par les phrases (${meq.suggested}/5)">↺ auto</button>` : ''}
              </div>` : '';
        const meqDetailHtml = meq && meq.level ? `
            <details class="comp-meq-detail">
              <summary>Comment le repère MEQ ${meq.level}/5 est-il déterminé ?</summary>
              <div class="comp-meq-body">
                <p>Chaque phrase surlignée est située par rapport aux <strong>attentes du ${escapeHtml(CYCLE_LABELS[meq.cycle] || '')}</strong> de l’élève (cycle modifié inclus) : fin de cycle → niveau 4, étapes en progression → niveau 2 ou 3, repères du cycle suivant → niveau 5. Le niveau suggéré est celui atteint par la majorité de vos phrases; aucun calcul à partir du /${scale.max}. Le niveau 5 peut aussi être choisi manuellement selon votre jugement. ${meq.override ? `<strong>Vous avez ajusté manuellement le niveau (suggestion : ${meq.suggested}/5).</strong>` : 'Un clic sur un autre niveau permet de l’ajuster.'}</p>
                <ul class="comp-meq-items">
                  ${meq.items.map(item => `<li><b>Éch. ${item.n}</b> → niv. ${item.q} <span class="comp-meq-why">(${escapeHtml(item.why)})</span><span class="comp-meq-quote">« ${escapeHtml(item.text.length > 120 ? item.text.slice(0, 117) + '…' : item.text)} »</span></li>`).join('')}
                </ul>
                <ol class="comp-meq-legend" reversed>
                  ${[5, 4, 3, 2, 1].map(v => `<li class="${v === meq.level ? 'is-level' : ''}"><b>${v} · ${escapeHtml(MEQ5_LEVELS[v].label)}</b> — ${escapeHtml(MEQ5_LEVELS[v].text)}</li>`).join('')}
                </ol>
                <p class="comp-meq-note">Ce calcul est propre au carnet : il ne constitue ni une méthode ministérielle ni un résultat officiel. Le jugement professionnel de l’enseignant demeure essentiel.
                  <a href="${getMeqScaleUrl(meq.cycle, selectedTab.id)}" target="_blank" rel="noopener noreferrer">Ouvrir l’échelle officielle ↗</a></p>
              </div>
            </details>` : (meq && meq.unavailable
          ? '<p class="comp-meq-note">Aucune échelle MEQ à 5 niveaux n’est disponible dans le carnet pour cette discipline à ce cycle.</p>' : '');
        const cycles = [...new Set(model.levels.map(level => level.cycle))];
        const sentenceHtml = (sentence, level) => {
          const pickedLevel = picked[sentence.row];
          const isPicked = pickedLevel !== undefined && Number(pickedLevel) === level.n;
          const isLocked = pickedLevel !== undefined && !isPicked;
          const rowLevels = (model.rows[sentence.row] || { levels: [] }).levels;
          const rowTitle = rowLevels.length > 1 ? `Rapprochement suggéré aux échelons ${rowLevels.join(', ')}${isLocked ? ' — cliquer pour remplacer la phrase choisie' : ''}` : 'Précision propre à cet échelon';
          return `<span class="comp-sentence${isPicked ? ' is-picked' : ''}${isLocked ? ' is-locked' : ''}" title="${rowTitle}" role="button" tabindex="0" aria-pressed="${isPicked}" data-comp-scale="${scale.id}" data-comp-row="${sentence.row}" data-comp-level="${level.n}">${escapeHtml(sentence.text)}</span> `;
        };
        const meterHtml = model.levels.map(level => {
          const inRange = result && level.n >= result.min && level.n <= result.max;
          return `<span class="comp-meter-cell${inRange ? ' in-range' : ''}${result && level.n === result.level ? ' is-level' : ''}">${level.n}</span>`;
        }).join('');
        return `
          <section class="comp-scale${result ? ' has-picks' : ''}" aria-label="${escapeHtml(scale.label)}">
            <div>
              <h4 class="text-sm font-bold text-slate-900">${escapeHtml(scale.label)}</h4>
              <p class="mt-0.5 text-[11px] text-slate-500">Cliquez les phrases qui décrivent l’élève. Les rapprochements entre échelons sont automatiques et peuvent être imparfaits : survolez une phrase pour les vérifier. Un clic sur une phrase rapprochée remplace le choix précédent. Le regroupement revu conserve les phrases déjà choisies, mais peut changer le niveau estimé. Ces repères de 2002 et l’estimation ne remplacent pas les échelles officielles de fin de cycle ni votre jugement professionnel.</p>
            </div>
            ${cycles.map(cycle => {
              const levels = model.levels.filter(level => level.cycle === cycle);
              const lastN = levels[levels.length - 1].n;
              return `
                <div class="space-y-1.5">
                  ${cycle ? `<div class="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                    <span>${escapeHtml(CYCLE_LABELS[cycle] || `Cycle ${cycle}`)}</span>
                    ${cycle === studentCycle ? '<span class="rounded-full bg-slate-100 px-2 py-0.5 normal-case text-[10px] text-slate-700">Cycle de l’élève</span>' : ''}
                  </div>` : ''}
                  <div class="comp-grid">
                    ${levels.map(level => `
                      <div class="comp-card${result && result.level === level.n ? ' is-level' : ''}">
                        <div class="comp-card-head">
                          <span>Échelon ${level.n} / ${scale.max}</span>
                          ${result && result.level === level.n ? '<span class="comp-badge">Niveau estimé</span>' : (cycle && level.n === lastN ? '<span class="comp-end">Attente de fin de cycle</span>' : '')}
                        </div>
                        <p class="comp-card-text">${level.sentences.map(sentence => sentenceHtml(sentence, level)).join('')}</p>
                      </div>
                    `).join('')}
                  </div>
                </div>
              `;
            }).join('')}
            <div class="comp-result">
              <div class="comp-result-text">
                ${result ? `
                  <span class="comp-result-label">Niveau estimé</span>
                  <strong class="comp-result-level">${result.level}<small> / ${scale.max}</small></strong>
                  <span class="comp-result-note">atteint par la majorité : ${result.atOrAbove} phrase${result.atOrAbove > 1 ? 's' : ''} sur ${result.count} à l’échelon ${result.level} ou plus${result.min !== result.max ? ` (échelons ${result.min} à ${result.max})` : ''}</span>
                ` : `
                  <span class="comp-result-label">Aucune phrase choisie</span>
                  <span class="comp-result-note">Le niveau apparaîtra ici au fil de vos clics.</span>
                `}
              </div>
              <div class="comp-meter" aria-hidden="true">${meterHtml}</div>
              ${meqHtml}
              <button type="button" class="comp-reset" data-comp-reset="${scale.id}" ${result ? '' : 'disabled'}>Réinitialiser</button>
            </div>
            ${meqDetailHtml}
            ${result ? (() => {
              const comment = getCompetencyComment(st, compTerm, scale, picked);
              const pron = st.pronoun || 'prenom';
              return `
            <div class="comp-comment">
              <div class="comp-comment-head">
                <span>Commentaire de bulletin <span class="cc-tag">${comment.custom ? '· modifié manuellement' : '· généré à partir des phrases choisies'}</span></span>
                <span>
                  <select class="cc-btn" data-comp-pron aria-label="Formulation du commentaire">
                    <option value="prenom"${pron === 'prenom' ? ' selected' : ''}>Prénom + « il »</option>
                    <option value="prenom_elle"${pron === 'prenom_elle' ? ' selected' : ''}>Prénom + « elle »</option>
                    <option value="il"${pron === 'il' ? ' selected' : ''}>Avec « il » seulement</option>
                    <option value="elle"${pron === 'elle' ? ' selected' : ''}>Avec « elle » seulement</option>
                  </select>
                  <button type="button" class="cc-btn" data-comp-regen="${scale.id}" ${comment.custom ? '' : 'disabled'} title="Remplacer mes modifications par le texte généré">Régénérer</button>
                  <button type="button" class="cc-btn" data-comp-copy="${scale.id}">Copier</button>
                </span>
              </div>
              <textarea data-comp-comment="${scale.id}" aria-label="Commentaire de bulletin">${escapeHtml(comment.text)}</textarea>
            </div>`;
            })() : ''}
          </section>
        `;
      };

      const refSubject = SUBJECTS_CONFIG.find(s => (s.group || s.id) === ({ sciences_global: 'sciences', univers_social: 'social' }[selectedTab.id] || selectedTab.id));
      const refCycle = getCompetencyEffectiveCycle(st, selectedTab.id) || studentCycle;
      const refAnchor = (href, label, strong) => href
        ? `<a href="${href}" target="_blank" rel="noopener noreferrer" class="${strong ? 'is-main' : ''}">${label} ↗</a>` : '';
      const referentielsHtml = `
        <div class="comp-refs no-print" aria-label="Référentiels officiels">
          <span class="comp-refs-title">Référentiels</span>
          ${refCycle && CYCLE_SCALE_URLS[refCycle] ? refAnchor(getMeqScaleUrl(refCycle, selectedTab.id), `Échelle MEQ · ${escapeHtml(selectedTab.label)} · ${escapeHtml(CYCLE_LABELS[refCycle])}`, true) : ''}
          ${[1, 2, 3].filter(c => c !== refCycle).map(c => refAnchor(getMeqScaleUrl(c, selectedTab.id), escapeHtml(CYCLE_LABELS[c]))).join('')}
          ${refSubject && refSubject.refUrl ? refAnchor(refSubject.refUrl, 'Cadre d’évaluation (PFEQ)') : ''}
          ${refAnchor((refSubject && refSubject.cssmbUrl) || 'https://sre.servicescsmb.com/disciplines/', 'Ressources CSSMB')}
        </div>`;

      const competencyModuleHtml = `
        <details id="competencyPositioning" class="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden" ${competencyPanelOpen ? 'open' : ''}>
          <summary class="px-4 py-3 bg-slate-50 cursor-pointer flex flex-wrap items-center justify-between gap-2">
            <span>
              <span class="block text-sm font-bold text-slate-900">Niveau de compétence</span>
              <span class="mt-0.5 block text-xs text-slate-600">Échelles des niveaux de compétence — enseignement primaire</span>
            </span>
            <span class="inline-flex items-center gap-2 text-xs font-semibold text-slate-600">
              ${studentCycle ? escapeHtml(CYCLE_LABELS[studentCycle]) : 'Cycle à préciser'}
              <svg class="competency-chevron h-4 w-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="m5 7.5 5 5 5-5"/></svg>
            </span>
          </summary>
          <div class="p-4 border-t border-slate-200 space-y-3">
            <div class="flex flex-wrap items-start justify-between gap-2 text-xs text-slate-600">
              <p class="max-w-3xl">Les échelles décrivent un portrait global : ce repère ne remplace pas votre jugement professionnel.${hasHistoricalCompetencies ? ' Pour chaque échelle, le dernier choix par étape a été repris; les anciens choix restent dans la sauvegarde.' : ''}</p>
              ${referentielsHtml}
            </div>
            <div class="comp-tabs" role="group" aria-label="Choisir une matière">
              ${competencyTabs.map(tab => tab.disabled ? `
                <button type="button" class="competency-subject-button comp-tab is-disabled" disabled aria-disabled="true">
                  ${escapeHtml(tab.label)} <span class="comp-tab-note">Aucune échelle</span>
                </button>
              ` : `
                <button type="button" class="competency-subject-button comp-tab${tab.id === selectedTab.id ? ' is-active' : ''}" data-competency-subject="${tab.id}" aria-pressed="${tab.id === selectedTab.id}">
                  ${escapeHtml(tab.label)}
                </button>
              `).join('')}
            </div>
            ${selectedTab.scales.length > 1 ? `
              <div class="comp-subtabs" role="group" aria-label="Compétence de ${escapeHtml(selectedTab.label)}">
                ${selectedTab.scales.map(scale => {
                  const result = getCompetencyResult(scale);
                  const meqTab = result ? getMeqFinal(st, compTerm, scale, selectedTab.id, compPicks[scale.id]) : null;
                  return `<button type="button" class="comp-subtab${scale.id === selectedScale.id ? ' is-active' : ''}" data-comp-scale-tab="${scale.id}" aria-pressed="${scale.id === selectedScale.id}">${escapeHtml(scale.tab)} <b>${result ? `${result.level}/${scale.max}${meqTab && meqTab.level ? ` · MEQ ${meqTab.level}/5` : ''}` : '—'}</b></button>`;
                }).join('')}
              </div>
            ` : ''}
            ${selectedScale ? renderScaleSection(selectedScale) : '<p class="text-sm text-slate-600">Aucune échelle de niveaux de compétence pour les matières de ce groupe.</p>'}
          </div>
        </details>
      `;

      // Build Horizontal Bar Chart with 60% threshold line & modified badges
      const sortedFlags = Object.entries(flagFrequency).sort((a, b) => b[1] - a[1]);
      const renderTrendBadge = (deltaVal, t1Val, t2Val, t3Val) => {
        const trailParts = [
          t1Val !== null ? `É1: ${t1Val}%` : null,
          t2Val !== null ? `É2: ${t2Val}%` : null,
          t3Val !== null ? `É3: ${t3Val}%` : null
        ].filter(Boolean);
        const titleAttr = trailParts.length ? ` title="Trajectoire : ${trailParts.join(' → ')}"` : '';
        if (deltaVal === null) return '<span class="text-slate-400">—</span>';
        if (deltaVal >= 3) {
          return `<span class="trend-badge trend-up" data-num="1"${titleAttr}><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3.5 11.5 12.5 4.5M12.5 4.5H6.5M12.5 4.5v6"/></svg>+${deltaVal} %</span>`;
        }
        if (deltaVal <= -3) {
          return `<span class="trend-badge trend-down" data-num="1"${titleAttr}><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3.5 4.5 12.5 11.5M12.5 11.5H6.5M12.5 11.5v-6"/></svg>${deltaVal} %</span>`;
        }
        const sign = deltaVal > 0 ? `+${deltaVal}` : `${deltaVal}`;
        return `<span class="trend-badge trend-flat" data-num="1"${titleAttr}><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 8h10M9.5 4.5 13 8l-3.5 3.5"/></svg>${sign} %</span>`;
      };

      const chartBarsHtml = subjectRows.map(r => {
        const pct = r.annualAvg !== null ? r.annualAvg : 0;
        const modTag = r.isModified
          ? `<span class="ml-1.5 px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-extrabold" title="Bulletin modifié : attentes de ${GRADE_LEVEL_LABELS[r.effectiveLevel]}">MOD. · ${GRADE_LEVEL_LABELS[r.effectiveLevel]}</span>`
          : '';
        return `
          <div class="space-y-1">
            <div class="flex items-center justify-between text-xs gap-2">
              <span class="font-semibold text-slate-700 truncate flex items-center">${r.sub.shortName}${modTag}</span>
              <span class="font-extrabold text-slate-900 shrink-0" data-num="1">${r.annualAvg !== null ? `${r.annualAvg}% (${r.annualCode})` : '—'}</span>
            </div>
            <div class="bar-track-wrap">
              <div class="bar-fill-inner" style="width: ${pct}%;"></div>
              <div class="bar-threshold-60" title="Seuil de réussite ministériel : 60 %"></div>
            </div>
          </div>
        `;
      }).join('');

      const weightModeLabel = weightMode === 'official'
        ? 'Pondéré MEQ (20 % / 20 % / 60 %)'
        : 'Moyenne simple des étapes';

      container.innerHTML = `
        <!-- Header Identity Card -->
        <div class="bg-white text-slate-900 rounded-xl p-4 sm:p-5 shadow-xs border border-slate-200 flex flex-wrap items-center justify-between gap-4">
          <div class="space-y-1">
            <div class="text-xs uppercase tracking-wider text-indigo-700 font-bold">Portrait de l’élève · 2026-2027</div>
            <h3 class="text-xl sm:text-2xl font-extrabold">${escapeHtml(st.name)}</h3>
            <div class="text-xs text-slate-600">Niveau : <strong class="text-slate-900">${GRADE_LEVEL_LABELS[st.gradeLevel] || 'à choisir'}</strong> · Adaptations : <strong class="text-slate-900">${escapeHtml(formatStudentAdaptations(st))}</strong></div>
          </div>

          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div class="bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-center">
              <div class="text-[10px] uppercase text-slate-500 font-semibold">${st.gradeLevel === 'P' ? 'Compétences évaluées' : 'Matières évaluées'}</div>
              <div class="text-lg font-extrabold text-slate-900" data-num="1">${populatedDisciplines.length} / ${totalDisciplines}</div>
            </div>
            <div class="bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-center">
              <div class="text-[10px] uppercase text-slate-500 font-semibold">Travaux notés</div>
              <div class="text-lg font-extrabold text-slate-900" data-num="1">${totalEvaluatedWorksCount}</div>
            </div>
            <div class="bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-center">
              <div class="text-[10px] uppercase text-slate-500 font-semibold">Traces observables</div>
              <div class="text-lg font-extrabold text-slate-900" data-num="1">${totalVisualTracesCount}</div>
            </div>
          </div>
        </div>

        <!-- Résultats annuels -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <!-- Résultats par matière -->
          <div class="lg:col-span-6 bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
            <div class="flex items-center justify-between border-b border-slate-100 pb-2 gap-2">
              <h4 class="text-sm font-bold text-slate-900">Résultats annuels par ${st.gradeLevel === 'P' ? 'compétence' : 'matière'}</h4>
              <span class="text-[10px] font-semibold text-slate-500">Repère vertical : seuil 60 %</span>
            </div>
            <div class="space-y-2.5">
              ${chartBarsHtml}
            </div>
          </div>

          <!-- Synthèse -->
          <div class="lg:col-span-6 bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
            <div class="flex items-center justify-between border-b border-slate-100 pb-2">
              <h4 class="text-sm font-bold text-slate-900">Commentaires de l’enseignant(e)</h4>
            </div>

            <div class="space-y-2.5 text-xs text-slate-700">
              <textarea id="grTeacherComment" class="gr-teacher-comment no-print" aria-label="Commentaires de l’enseignant(e)" placeholder="Ajoutez vos commentaires sur le parcours de cet élève.">${escapeHtml(st.reportComment || '')}</textarea>
              <div id="grTeacherCommentPrint" class="gr-teacher-comment-print">${escapeHtml(st.reportComment || '')}</div>

              <div class="p-2.5 rounded-lg bg-indigo-50/60 border border-indigo-200">
                <span class="font-bold text-indigo-950">Indicateurs observables (PIA) & marqueurs rapides consignés :</span>
                <div class="mt-1 flex flex-wrap gap-1">
                  ${sortedFlags.map(([fl, count]) => {
                    const def = CELL_FLAGS.find(f => f.code === fl);
                    return `<span class="px-2 py-0.5 rounded bg-slate-200/80 border border-slate-300 text-[11px] font-bold text-slate-800" title="${escapeHtml(def ? def.label : fl)}">${escapeHtml(fl)} (${count}×)</span>`;
                  }).join('')}
                  ${sortedTags.length > 0
                    ? sortedTags.map(([tg, count]) => `<span class="px-2 py-0.5 rounded-full bg-white border border-indigo-200 text-[11px] font-semibold text-indigo-900">${tg} (${count}×)</span>`).join('')
                    : (!sortedFlags.length ? '<span class="text-slate-500">Aucun indicateur ou marqueur rapide consigné pour cet élève pour le moment.</span>' : '')}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Tableau récapitulatif des étapes -->
        <div class="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div class="px-4 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
            <h4 class="text-sm font-bold text-slate-900">Résultats des trois étapes par ${st.gradeLevel === 'P' ? 'compétence' : 'matière'}</h4>
            <span class="gr-weight-label">${weightModeLabel}</span>
          </div>
          <div class="gr-results-scroll">
          <table class="w-full table-fixed text-left border-collapse text-xs">
            <thead>
              <tr class="bg-slate-900 text-white text-[11px] uppercase">
                <th class="p-2.5 w-[28%]">${st.gradeLevel === 'P' ? 'Compétence' : 'Matière / Compétence'}</th>
                <th class="p-2.5 text-center border-l border-slate-800">Étape 1${weightMode === 'official' ? ' (20 %)' : ''}</th>
                <th class="p-2.5 text-center border-l border-slate-800">Étape 2${weightMode === 'official' ? ' (20 %)' : ''}</th>
                <th class="p-2.5 text-center border-l border-slate-800">Étape 3${weightMode === 'official' ? ' (60 %)' : ''}</th>
                <th class="p-2.5 text-center border-l border-slate-800">${weightMode === 'official' ? 'Résultat annuel (20/20/60)' : 'Moyenne des étapes'}</th>
                <th class="p-2.5 text-center border-l border-slate-800">Tendance (Écart)</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-200">
              ${subjectRows.map((r, i) => `
                <tr class="${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}">
                  <td class="p-2.5 font-bold text-slate-900">
                    <span>${r.sub.shortName}</span>
                    ${r.isModified ? `<span class="ml-1 px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 border border-amber-300 text-[9px] font-extrabold">MOD. · ${GRADE_LEVEL_LABELS[r.effectiveLevel]}</span>` : ''}
                  </td>
                  <td class="p-2.5 text-center border-l border-slate-100 font-semibold" data-num="1">${r.t1 !== null ? `${r.t1}% (${pctToClosestGradeCode(r.t1)})` : '—'}</td>
                  <td class="p-2.5 text-center border-l border-slate-100 font-semibold" data-num="1">${r.t2 !== null ? `${r.t2}% (${pctToClosestGradeCode(r.t2)})` : '—'}</td>
                  <td class="p-2.5 text-center border-l border-slate-100 font-semibold" data-num="1">${r.t3 !== null ? `${r.t3}% (${pctToClosestGradeCode(r.t3)})` : '—'}</td>
                  <td class="p-2.5 text-center border-l border-slate-100" data-num="1">
                    ${r.annualAvg !== null
                      ? `<span class="px-2 py-0.5 rounded border font-extrabold ${getBadgeColorClasses(r.annualCode)}">${r.annualCode} (${r.annualAvg}%)</span>`
                      : '—'}
                  </td>
                  <td class="p-2.5 text-center border-l border-slate-100">
                    ${renderTrendBadge(r.delta, r.t1, r.t2, r.t3)}
                  </td>
                </tr>
              `).join('')}
            </tbody>
            <tfoot>
              <tr class="gr-average-row">
                <th scope="row">Moyenne indicative</th>
                ${[avgT1, avgT2, avgT3, overallAnnualAvg].map(value => `<td>${value !== null ? `${value}%` : '—'}</td>`).join('')}
                <td>—</td>
              </tr>
            </tfoot>
          </table>
          </div>
        </div>

        ${levelSummaryHtml}

        ${competencyModuleHtml}
      `;

      document.getElementById('grTeacherComment').addEventListener('input', event => {
        st.reportComment = event.target.value;
        document.getElementById('grTeacherCommentPrint').textContent = event.target.value;
        scheduleAppStateSave();
      });
      document.querySelector('#grCompetencyLevelSummary [data-comp-print]').addEventListener('click', () => printCompetencySheet(st, compTerm));

      const competencyDetails = document.getElementById('competencyPositioning');
      if (competencyDetails) {
        competencyDetails.addEventListener('toggle', () => {
          if (competencyDetails.isConnected) competencyPanelOpen = competencyDetails.open;
        });

        const commitCompetencyChange = () => {
          const scrollY = window.scrollY;
          competencyPanelOpen = competencyDetails.open;
          scheduleAppStateSave();
          renderGlobalReportView();
          window.scrollTo(0, scrollY);
        };

        const togglePickedSentence = el => {
          const scaleId = el.getAttribute('data-comp-scale');
          const rowKey = el.getAttribute('data-comp-row');
          const level = Number(el.getAttribute('data-comp-level'));
          const picked = compPicks[scaleId] || (compPicks[scaleId] = {});
          if (picked[rowKey] === level) {
            delete picked[rowKey];
          } else {
            picked[rowKey] = level;
          }
          if (!Object.keys(picked).length) { delete compPicks[scaleId]; setMeqOverride(st, compTerm, scaleId, null); }
          commitCompetencyChange();
        };

        const highlightSiblings = el => {
          competencyDetails.querySelectorAll('.comp-sentence.is-sibling').forEach(node => node.classList.remove('is-sibling'));
          if (!el) return;
          competencyDetails.querySelectorAll('.comp-sentence').forEach(node => {
            if (node !== el
              && node.getAttribute('data-comp-scale') === el.getAttribute('data-comp-scale')
              && node.getAttribute('data-comp-row') === el.getAttribute('data-comp-row')) {
              node.classList.add('is-sibling');
            }
          });
        };

        competencyDetails.addEventListener('click', event => {
          competencyPanelOpen = competencyDetails.open;
          const sentence = event.target.closest('.comp-sentence');
          if (sentence) {
            togglePickedSentence(sentence);
            return;
          }
          const subjectButton = event.target.closest('.competency-subject-button');
          if (subjectButton && !subjectButton.disabled) {
            competencySubjectSelected = subjectButton.getAttribute('data-competency-subject');
            renderGlobalReportView();
            return;
          }
          const scaleTab = event.target.closest('[data-comp-scale-tab]');
          if (scaleTab) {
            competencyScaleSelected[competencySubjectSelected] = scaleTab.getAttribute('data-comp-scale-tab');
            renderGlobalReportView();
            return;
          }
          const resetButton = event.target.closest('[data-comp-reset]');
          if (resetButton && !resetButton.disabled) {
            const scaleId = resetButton.getAttribute('data-comp-reset');
            const picked = compPicks[scaleId] || {};
            if (Object.keys(picked).length > 2 && !window.confirm('Effacer toutes les phrases choisies pour cette échelle ?')) return;
            delete compPicks[scaleId];
            setMeqOverride(st, compTerm, scaleId, null);
            setCompetencyComment(st, compTerm, scaleId, '');
            commitCompetencyChange();
          }
        });

        competencyDetails.addEventListener('input', event => {
          const area = event.target.closest && event.target.closest('[data-comp-comment]');
          if (!area) return;
          setCompetencyComment(st, compTerm, area.getAttribute('data-comp-comment'), area.value);
          const regen = competencyDetails.querySelector('[data-comp-regen]');
          if (regen) regen.disabled = !area.value.trim();
        });

        competencyDetails.addEventListener('change', event => {
          const select = event.target.closest && event.target.closest('[data-comp-pron]');
          if (!select) return;
          st.pronoun = select.value;
          scheduleAppStateSave();
          renderGlobalReportView();
        });

        competencyDetails.addEventListener('click', event => {
          const meqBtn = event.target.closest('[data-comp-meq]');
          if (meqBtn) {
            const scaleId = meqBtn.getAttribute('data-comp-meq');
            const value = Number(meqBtn.getAttribute('data-meq-val'));
            const tabScale = competencyTabs.flatMap(tab => tab.scales.map(s => ({ s, tabId: tab.id }))).find(x => x.s.id === scaleId);
            const current = tabScale ? getMeqFinal(st, compTerm, tabScale.s, tabScale.tabId, compPicks[scaleId]) : null;
            // Un clic sur le niveau suggéré (ou sur le niveau déjà ajusté) revient au mode automatique.
            const backToAuto = current && (current.suggested === value || current.override === value);
            setMeqOverride(st, compTerm, scaleId, backToAuto ? null : value);
            commitCompetencyChange();
            return;
          }
          const meqAuto = event.target.closest('[data-comp-meq-auto]');
          if (meqAuto) {
            setMeqOverride(st, compTerm, meqAuto.getAttribute('data-comp-meq-auto'), null);
            commitCompetencyChange();
            return;
          }
          const regen = event.target.closest('[data-comp-regen]');
          if (regen && !regen.disabled) {
            setCompetencyComment(st, compTerm, regen.getAttribute('data-comp-regen'), '');
            commitCompetencyChange();
            return;
          }
          const copy = event.target.closest('[data-comp-copy]');
          if (copy) {
            const area = competencyDetails.querySelector('[data-comp-comment]');
            if (!area) return;
            const done = () => showToast('Commentaire copié');
            if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(area.value).then(done, () => { area.select(); document.execCommand('copy'); done(); });
            else { area.select(); document.execCommand('copy'); done(); }
          }
        });

        competencyDetails.addEventListener('keydown', event => {
          const sentence = event.target.closest && event.target.closest('.comp-sentence');
          if (sentence && (event.key === 'Enter' || event.key === ' ')) {
            event.preventDefault();
            togglePickedSentence(sentence);
          }
        });

        competencyDetails.addEventListener('mouseover', event => {
          const sentence = event.target.closest('.comp-sentence');
          highlightSiblings(sentence);
        });
        competencyDetails.addEventListener('mouseleave', () => highlightSiblings(null));
      }
    }

    // =========================================================================
    // 5. EXCEL (.XLSX) FORMATTED EXPORT (USING XLSX-JS-STYLE)
    // =========================================================================
