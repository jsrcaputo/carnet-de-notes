    function printCompetencySheet(student, term) {
      const picks = getCompetencyPicks(student, term);
      const blocks = getCompetencyTabs().flatMap(tab => tab.scales.map(scale => ({ scale, tabId: tab.id }))).map(({ scale, tabId }) => {
        const result = computeCompetencyResult(scale, picks[scale.id]);
        if (!result) return '';
        const meqPrint = getMeqFinal(student, term, scale, tabId, picks[scale.id]);
        const meqPrintHtml = meqPrint && meqPrint.level ? ` <span style="font-weight:600;font-size:.85em">· Échelle MEQ ${meqPrint.level}/5 — ${escapeHtml(MEQ5_LEVELS[meqPrint.level].label)}</span>` : '';
        const model = getCompetencyScaleModel(scale);
        const chosen = [];
        model.levels.forEach(level => level.sentences.forEach(sentence => {
          if (Number(picks[scale.id][sentence.row]) === level.n) chosen.push({ n: level.n, text: sentence.text });
        }));
        return `
          <section class="cps-block">
            <div class="cps-head"><h3>${escapeHtml(scale.chip)}</h3><strong>${result.level} / ${scale.max}${meqPrintHtml}</strong></div>
            <p>${chosen.map(c => `<mark title="Échelon ${c.n}">${escapeHtml(c.text)} <sup>${c.n}</sup></mark>`).join(' ')}</p>
            <p style="margin-top:6px;font-style:italic"><strong>Commentaire :</strong> ${escapeHtml(getCompetencyComment(student, term, scale, picks[scale.id]).text)}</p>
          </section>`;
      }).filter(Boolean);
      if (!blocks.length) {
        showToast('Aucun niveau de compétence à imprimer.');
        return;
      }
      let sheet = document.getElementById('compPrintSheet');
      if (!sheet) {
        sheet = document.createElement('div');
        sheet.id = 'compPrintSheet';
        document.body.appendChild(sheet);
      }
      const cycle = getStudentCycle(student.gradeLevel);
      sheet.innerHTML = `
        <h1>Niveaux de compétence</h1>
        <div class="cps-meta"><strong>${escapeHtml(student.name)}</strong>${cycle ? ` · ${escapeHtml(GRADE_LEVEL_LABELS[student.gradeLevel])} (${escapeHtml(CYCLE_LABELS[cycle])})` : ''} · 2026-2027</div>
        ${blocks.join('')}
        <p class="cps-note">Les phrases surlignées sont tirées des échelles des niveaux de compétence (primaire); l’exposant indique l’échelon. Ces repères ne remplacent pas le jugement professionnel.</p>`;
      document.body.classList.add('print-comp');
      const cleanup = () => {
        document.body.classList.remove('print-comp');
        window.removeEventListener('afterprint', cleanup);
      };
      window.addEventListener('afterprint', cleanup);
      window.print();
    }

    function printStudentList() {
      let sheet = document.getElementById('studentPrintSheet');
      if (!sheet) {
        sheet = document.createElement('div');
        sheet.id = 'studentPrintSheet';
        document.body.appendChild(sheet);
      }
      const group = appState.groups.find(g => g.id === appState.activeGroupId);
      const students = appState.students;
      const extraCols = 14;
      // Hauteur des rangées ajustée pour tenir sur une page portrait (≈ 297 − 24 mm de marges − titre et en-tête)
      const rowMm = Math.max(5, Math.min(9, Math.floor(215 / Math.max(students.length, 1) * 10) / 10));
      const rows = students.map(st => {
        const level = GRADE_LEVEL_LABELS[st.gradeLevel] || '';
        return `<tr style="height:${rowMm}mm"><td class="sps-name">${escapeHtml(st.name)}${level ? `<small>${escapeHtml(level)}</small>` : ''}</td>${'<td></td>'.repeat(extraCols)}</tr>`;
      }).join('');
      sheet.innerHTML = `
        <h1>${escapeHtml(group && !group.placeholder ? group.name : '')}</h1>
        <table>
          <thead><tr><th class="sps-name"></th>${'<th></th>'.repeat(extraCols)}</tr></thead>
          <tbody>${rows}</tbody>
        </table>`;
      document.body.classList.add('print-students');
      const cleanup = () => {
        document.body.classList.remove('print-students');
        window.removeEventListener('afterprint', cleanup);
      };
      window.addEventListener('afterprint', cleanup);
      window.print();
    }

    function printStudentIndividualSheet(student) {
      const st = student || appState.students.find(s => s.id === appState.selectedStudentId) || null;
      if (!st) {
        showToast('Sélectionnez d’abord un élève à imprimer.');
        return;
      }

      const group = appState.groups.find(g => g.id === appState.activeGroupId);
      const groupName = group && !group.placeholder ? group.name : '';
      const studentCycle = getStudentCycle(st.gradeLevel);
      const levelLabel = GRADE_LEVEL_LABELS[st.gradeLevel] || '';
      const cycleLabel = studentCycle ? CYCLE_LABELS[studentCycle] : '';
      const weightMode = 'official';

      const subjectRows = [];
      const subjectDetails = [];
      const tagFrequency = {};
      const flagFrequency = {};
      const recordedComments = [];
      const pendingStatuses = [];

      SUBJECTS_CONFIG.forEach(sub => {
        const t1 = computeStudentSubjectSummary('1', sub.id, st.id).finalPct;
        const t2 = computeStudentSubjectSummary('2', sub.id, st.id).finalPct;
        const t3 = computeStudentSubjectSummary('3', sub.id, st.id).finalPct;
        const annualAvg = computeWeightedAnnualAverage(t1, t2, t3, weightMode);
        const validTerms = [t1, t2, t3].filter(v => v !== null);
        const delta = validTerms.length >= 2 ? validTerms[validTerms.length - 1] - validTerms[0] : null;
        const isMod = isSubjectModifiedForStudent(st, sub);
        const effLevel = getEffectiveGradeLevel(st, sub);

        subjectRows.push({
          sub,
          t1, t2, t3,
          annualAvg,
          annualCode: pctToClosestGradeCode(annualAvg),
          delta,
          isModified: isMod,
          effectiveLevel: effLevel
        });

        const evalItems = [];
        ['1', '2', '3'].forEach(tKey => {
          const sd = appState.terms[tKey].subjectData[sub.id];
          if (!sd) return;
          const rec = sd.studentRecords[st.id];
          if (!rec) return;

          sd.assignments.forEach(asg => {
            if (!isAssignmentForStudent(asg, st)) return;
            const raw = rec.scores[asg.id] !== undefined ? String(rec.scores[asg.id]).trim() : '';
            const upper = raw.toUpperCase();
            const meta = rec.scoreMeta && rec.scoreMeta[asg.id] ? rec.scoreMeta[asg.id] : null;
            if (asg.isObservation && meta && meta.linkedCopy) return;

            const flags = getCellFlags(rec, asg.id);
            flags.forEach(fl => {
              if (VALID_CELL_FLAG_CODES.has(fl)) flagFrequency[fl] = (flagFrequency[fl] || 0) + 1;
            });
            if (meta && Array.isArray(meta.tags)) {
              meta.tags.forEach(tg => { tagFrequency[tg] = (tagFrequency[tg] || 0) + 1; });
              const observations = groupObservationTags(meta.tags);
              [['Forces', observations.strengths], ['Défis', observations.challenges], ['Observations précédentes', observations.previous]].forEach(([label, values]) => {
                if (values.length) recordedComments.push({ term: tKey, subject: sub.shortName, context: asg.title, text: `${label} : ${values.join(' · ')}` });
              });
            }
            if (meta && typeof meta.strengths === 'string' && meta.strengths.trim()) {
              recordedComments.push({ term: tKey, subject: sub.shortName, context: asg.title, text: `Forces : ${meta.strengths.trim()}` });
            }
            if (meta && typeof meta.challenges === 'string' && meta.challenges.trim()) {
              recordedComments.push({ term: tKey, subject: sub.shortName, context: asg.title, text: `Défis : ${meta.challenges.trim()}` });
            }
            if (meta && meta.comment && meta.comment.trim()) {
              recordedComments.push({
                term: tKey,
                subject: sub.shortName,
                context: asg.title,
                text: meta.comment.trim()
              });
            }

            const hasTraceFeedback = Boolean(asg.isObservation && meta &&
              (hasObservationFeedback(meta) || (Array.isArray(meta.checked) && meta.checked.length)));
            const hasNotEval = Boolean((meta && meta.notEvaluated) || (upper === '-' && !hasTraceFeedback));
            if (!raw && !hasNotEval) return;

            const w = getAssignmentWeightForLevel(asg, effLevel);
            let resultDisplay = '';
            let statusClass = '';

            if (upper === 'NR') {
              resultDisplay = 'NR (Non remis)';
              statusClass = 'sis-badge-nr';
              pendingStatuses.push({ term: tKey, subject: sub.shortName, title: asg.title, status: 'NR — Non remis' });
            } else if (upper === 'JUST' || upper === 'JUS') {
              resultDisplay = 'JUST (Justifié)';
              statusClass = 'sis-badge-just';
            } else if (upper === 'REP') {
              resultDisplay = 'REP (En reprise)';
              statusClass = 'sis-badge-rep';
              pendingStatuses.push({ term: tKey, subject: sub.shortName, title: asg.title, status: 'REP — En reprise' });
            } else if (hasNotEval) {
              resultDisplay = 'Exempté (-)';
              statusClass = 'sis-badge-na';
            } else if (asg.isObservation) {
              if (upper === '-' && hasTraceFeedback) {
                resultDisplay = 'En cours / rétroaction';
              } else {
                const num = Number(raw);
                const code = (meta && meta.code) ? meta.code : (Number.isFinite(num) ? pctToClosestGradeCode(num) : '');
                resultDisplay = Number.isFinite(num) ? `${code} (${Math.round(num)} %)` : raw;
              }
            } else {
              const outOf = getAssignmentOutOf(asg);
              const num = Number(raw.replace(',', '.'));
              if (Number.isFinite(num)) {
                const pct = outOf > 0 ? Math.round((num / outOf) * 100) : Math.round(num);
                resultDisplay = outOf !== 100 ? `${formatScoreNumber(num)}/${formatScoreNumber(outOf)} (${pct} %)` : `${pct} %`;
              } else {
                resultDisplay = raw;
              }
            }

            evalItems.push({
              term: tKey,
              title: asg.title,
              isObs: Boolean(asg.isObservation),
              weight: w,
              resultDisplay,
              statusClass,
              flags
            });
          });

          if (rec.comment && rec.comment.trim()) {
            recordedComments.push({
              term: tKey,
              subject: sub.shortName,
              context: 'Note générale',
              text: rec.comment.trim()
            });
          }
        });

        if (evalItems.length > 0) {
          subjectDetails.push({
            sub,
            isModified: isMod,
            effectiveLevel: effLevel,
            items: evalItems
          });
        }
      });

      // Merge social & sciences for bulletin summary rows
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

      const activeSummaryRows = subjectRows.filter(r => r.t1 !== null || r.t2 !== null || r.t3 !== null || r.annualAvg !== null);
      const rowsToRender = activeSummaryRows.length > 0 ? activeSummaryRows : subjectRows;
      const populatedSubjects = subjectRows.filter(r => r.annualAvg !== null);
      const overallAnnualAvg = populatedSubjects.length > 0
        ? Math.round(populatedSubjects.reduce((total, row) => total + row.annualAvg, 0) / populatedSubjects.length)
        : null;
      const overallProvisional = populatedSubjects.length < subjectRows.length ||
        populatedSubjects.some(r => getAnnualResultInfo(r.t1, r.t2, r.t3).provisional);

      const adaptationsList = Array.isArray(st.adaptations) ? st.adaptations.filter(Boolean) : [];
      const flagsEntries = Object.entries(flagFrequency).sort((a, b) => b[1] - a[1]);
      const tagsEntries = Object.entries(tagFrequency).sort((a, b) => b[1] - a[1]);

      const fmtCell = val => val !== null ? `<strong>${val} %</strong> <span class="sis-subcode">(${escapeHtml(pctToClosestGradeCode(val))})</span>` : '<span class="sis-empty">—</span>';

      const summaryTableHtml = `
        <table class="sis-summary-table">
          <thead>
            <tr>
              <th>Matière / Compétence</th>
              <th class="sis-num">Étape 1 (20 %)</th>
              <th class="sis-num">Étape 2 (20 %)</th>
              <th class="sis-num">Étape 3 (60 %)</th>
              <th class="sis-num">Sommaire annuel</th>
              <th class="sis-num">Progression</th>
            </tr>
          </thead>
          <tbody>
            ${rowsToRender.map(r => {
              const modBadge = r.isModified
                ? ` <span class="sis-mod-pill">MOD. · ${escapeHtml(GRADE_LEVEL_LABELS[r.effectiveLevel] || '')}</span>`
                : '';
              const deltaStr = r.delta === null
                ? '—'
                : (r.delta > 0 ? `+${r.delta} %` : `${r.delta} %`);
              return `
                <tr>
                  <td>${escapeHtml(r.sub.shortName)}${modBadge}</td>
                  <td class="sis-num">${fmtCell(r.t1)}</td>
                  <td class="sis-num">${fmtCell(r.t2)}</td>
                  <td class="sis-num">${fmtCell(r.t3)}</td>
                  <td class="sis-num sis-annual">${fmtCell(r.annualAvg)}${getAnnualResultInfo(r.t1, r.t2, r.t3).provisional ? `<br><small>Provisoire · ${getAnnualResultInfo(r.t1, r.t2, r.t3).weight} % des poids prévus</small>` : ''}</td>
                  <td class="sis-num">${escapeHtml(deltaStr)}</td>
                </tr>`;
            }).join('')}
          </tbody>
        </table>
      `;

      const detailsHtml = subjectDetails.length > 0 ? `
        <div class="sis-section-title">Détail des évaluations et traces consignées</div>
        <div class="sis-details-grid">
          ${subjectDetails.map(block => {
            const modTag = block.isModified ? ` <span class="sis-mod-pill">MOD. ${escapeHtml(GRADE_LEVEL_LABELS[block.effectiveLevel] || '')}</span>` : '';
            return `
              <div class="sis-subject-card">
                <div class="sis-subject-card-head">${escapeHtml(block.sub.shortName)}${modTag}</div>
                <table class="sis-eval-table">
                  <tbody>
                    ${block.items.map(it => {
                      const flagsHtml = it.flags.length
                        ? ` <span class="sis-flags">[${it.flags.map(escapeHtml).join(', ')}]</span>`
                        : '';
                      return `
                        <tr>
                          <td class="sis-eval-term">Ét. ${escapeHtml(it.term)}</td>
                          <td class="sis-eval-title">${escapeHtml(it.title)}${it.isObs ? ' <span class="sis-obs-tag">Trace</span>' : ''}${flagsHtml}</td>
                          <td class="sis-eval-weight">Pond. ${escapeHtml(String(Math.round(it.weight * 10) / 10))}%</td>
                          <td class="sis-eval-res ${it.statusClass}">${escapeHtml(it.resultDisplay)}</td>
                        </tr>`;
                    }).join('')}
                  </tbody>
                </table>
              </div>`;
          }).join('')}
        </div>
      ` : '';

      const pendingHtml = pendingStatuses.length > 0 ? `
        <div class="sis-alert-box">
          <strong>Travaux en suivi (exclus temporairement de la moyenne) :</strong>
          ${pendingStatuses.map(p => `<span class="sis-pending-item">Ét. ${escapeHtml(p.term)} · ${escapeHtml(p.subject)} — ${escapeHtml(p.title)} (${escapeHtml(p.status)})</span>`).join(' • ')}
        </div>
      ` : '';

      const supportsHtml = (adaptationsList.length > 0 || flagsEntries.length > 0 || tagsEntries.length > 0) ? `
        <div class="sis-supports-row">
          ${adaptationsList.length > 0 ? `<div><strong>Profil & adaptations :</strong> ${adaptationsList.map(escapeHtml).join(', ')}</div>` : ''}
          ${flagsEntries.length > 0 ? `<div><strong>Mesures d’appui utilisées :</strong> ${flagsEntries.map(([code, count]) => {
            const def = CELL_FLAGS.find(f => f.code === code);
            return `${escapeHtml(def ? def.label : code)} (${count}×)`;
          }).join(' · ')}</div>` : ''}
          ${tagsEntries.length > 0 ? `<div><strong>Observations fréquentes :</strong> ${tagsEntries.slice(0, 6).map(([t, c]) => `${escapeHtml(t)} (${c}×)`).join(' · ')}</div>` : ''}
        </div>
      ` : '';

      const commentsHtml = recordedComments.length > 0 ? `
        <div class="sis-section-title">Commentaires et rétroactions consignés</div>
        <div class="sis-comments-list">
          ${recordedComments.map(c => `
            <div class="sis-comment-item">
              <span class="sis-comment-meta">Ét. ${escapeHtml(c.term)} · ${escapeHtml(c.subject)} (${escapeHtml(c.context)}) :</span>
              <span>${escapeHtml(c.text)}</span>
            </div>
          `).join('')}
        </div>
      ` : '';

      let sheet = document.getElementById('studentIndividualPrintSheet');
      if (!sheet) {
        sheet = document.createElement('div');
        sheet.id = 'studentIndividualPrintSheet';
        document.body.appendChild(sheet);
      }

      const todayStr = new Date().toLocaleDateString('fr-CA', { year: 'numeric', month: 'short', day: 'numeric' });
      sheet.innerHTML = `
        <header class="sis-header">
          <div>
            <div class="sis-eyebrow">Fiche synthèse individuelle de l’élève · Année scolaire 2026-2027</div>
            <h1 class="sis-student-name">${escapeHtml(st.name)}</h1>
            <div class="sis-meta-line">
              ${groupName ? `<span><strong>Groupe :</strong> ${escapeHtml(groupName)}</span> · ` : ''}
              ${levelLabel ? `<span><strong>Niveau :</strong> ${escapeHtml(levelLabel)}${cycleLabel ? ` (${escapeHtml(cycleLabel)})` : ''}</span> · ` : ''}
              <span><strong>Date :</strong> ${escapeHtml(todayStr)}</span>
            </div>
          </div>
          ${st.gradeLevel === 'P' ? '' : `<div class="sis-overall-box">
            <div class="sis-overall-label">Moyenne indicative${overallProvisional ? ' · provisoire' : ''}</div>
            <div class="sis-overall-val">${overallAnnualAvg !== null ? `${overallAnnualAvg} % (${escapeHtml(pctToClosestGradeCode(overallAnnualAvg))})` : '—'}</div>
          </div>`}
        </header>
        ${supportsHtml}
        ${pendingHtml}
        ${st.gradeLevel === 'P'
          ? `<div class="sis-section-title">Portrait qualitatif</div><p>Observations consignées à interpréter selon le jugement professionnel; ce portrait ne constitue pas un bulletin officiel.</p>${st.reportComment ? `<p>${escapeHtml(st.reportComment)}</p>` : ''}${commentsHtml}`
          : `<div class="sis-section-title">Portrait des résultats par matière</div><p>Les résultats provisoires utilisent seulement les étapes disponibles, dont les poids sont réajustés proportionnellement.</p>${summaryTableHtml}`}
        ${detailsHtml}
        ${st.gradeLevel === 'P' ? '' : commentsHtml}
      `;

      document.body.classList.add('print-student-sheet');
      const cleanup = () => {
        document.body.classList.remove('print-student-sheet');
        window.removeEventListener('afterprint', cleanup);
      };
      window.addEventListener('afterprint', cleanup);
      window.print();
    }

    // =========================================================================
    // 6. FULLSCREEN & GOOGLE SITES POP-OUT HANDLERS
    // =========================================================================
