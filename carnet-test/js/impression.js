    function triggerPrintAfterPaint() {
      window.requestAnimationFrame(() => window.setTimeout(() => window.print(), 0));
    }

    function removePrintArtifacts(ids = []) {
      ids.forEach(id => document.getElementById(id)?.remove());
      const printMeta = document.getElementById('printMeta');
      if (printMeta) printMeta.textContent = '';
    }

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
        removePrintArtifacts(['compPrintSheet']);
      };
      window.addEventListener('afterprint', cleanup);
      triggerPrintAfterPaint();
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
        removePrintArtifacts(['studentPrintSheet']);
      };
      window.addEventListener('afterprint', cleanup);
      triggerPrintAfterPaint();
    }

    function printStudentIndividualSheet(student, selectedOptions = null, printNow = true) {
      const st = student || appState.students.find(s => s.id === appState.selectedStudentId) || null;
      if (!st) {
        showToast('Sélectionnez d’abord un élève à imprimer.');
        return;
      }

      const group = appState.groups.find(g => g.id === appState.activeGroupId);
      const options = {
        overall: true,
        summary: true,
        supports: true,
        pending: true,
        details: true,
        ...(selectedOptions || {})
      };
      const groupName = group && !group.placeholder ? group.name : '';
      const studentCycle = getStudentCycle(st.gradeLevel);
      const levelLabel = GRADE_LEVEL_LABELS[st.gradeLevel] || '';
      const cycleLabel = studentCycle ? CYCLE_LABELS[studentCycle] : '';
      const weightMode = 'official';

      const subjectRows = [];
      const subjectDetails = [];
      const tagFrequency = {};
      const flagFrequency = {};
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
            }

            const hasTraceFeedback = Boolean(asg.isObservation && meta &&
              (hasObservationFeedback(meta) || (Array.isArray(meta.checked) && meta.checked.length)));
            const hasNotEval = Boolean((meta && meta.notEvaluated) || (upper === '-' && !hasTraceFeedback));
            if (!raw && !hasNotEval) return;

            const studentWeight = getAssignmentWeightForLevel(asg, st.gradeLevel, sub, appState.terms[tKey]);
            let resultDisplay = '';
            let statusClass = '';

            if (upper === 'NR') {
              resultDisplay = 'NR (Non remis)';
              statusClass = 'sis-badge-nr';
              pendingStatuses.push({ term: tKey, subject: sub.shortName, title: asg.title, status: 'NR — Non remis' });
            } else if (upper === 'JUST' || upper === 'JUS') {
              resultDisplay = 'JUST (Justifié)';
              statusClass = 'sis-badge-just';
              pendingStatuses.push({ term: tKey, subject: sub.shortName, title: asg.title, status: 'JUST — Justifié' });
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
              weight: studentWeight,
              resultDisplay,
              statusClass,
              flags
            });
          });

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

      const adaptationSummary = typeof getStudentAdaptationSummary === 'function'
        ? getStudentAdaptationSummary(st)
        : { adaptations: Array.isArray(st.adaptations) ? st.adaptations.filter(Boolean) : [], hasModifiedBulletin: false, modifiedItems: [] };
      const adaptationsList = adaptationSummary.adaptations.slice();
      const modifiedItems = typeof getStudentModifiedSummaryList === 'function'
        ? getStudentModifiedSummaryList(st)
        : (adaptationSummary.modifiedItems || []);
      if (adaptationSummary.hasModifiedBulletin || modifiedItems.length) {
        adaptationsList.push(modifiedItems.length
          ? `Bulletin modifié — ${modifiedItems.map(item => `${item.label} (${item.levelLabel})`).join(', ')}`
          : 'Bulletin modifié');
      }
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

      const preschoolPrintHtml = st.gradeLevel === 'P' ? (() => {
        const labels = {
          4: 'Se développe très bien',
          3: 'Se développe adéquatement',
          2: 'Se développe avec certaines difficultés',
          1: 'Se développe avec des difficultés importantes',
          0: 'À observer'
        };
        const rankForCode = pct => pct === null ? 0 : ({ A: 4, B: 4, C: 3, D: 2, E: 1 }[String(pctToClosestGradeCode(pct)).charAt(0)] || 0);
        const cards = subjectRows.filter(row => row.sub.group === 'presco').map(row => {
          const observations = [];
          const strengthTags = new Set();
          const challengeTags = new Set();
          ['1', '2', '3'].forEach(term => {
            const sd = appState.terms[term].subjectData[row.sub.id];
            if (!sd) return;
            const rec = sd.studentRecords[st.id];
            if (!rec) return;
            if (rec.comment && rec.comment.trim()) observations.push(`Ét. ${term} — ${rec.comment.trim()}`);
            sd.assignments.forEach(asg => {
              if (!isAssignmentForStudent(asg, st)) return;
              const meta = rec.scoreMeta && rec.scoreMeta[asg.id];
              if (!meta) return;
              if (Array.isArray(meta.tags) && typeof groupObservationTags === 'function') {
                const groups = groupObservationTags(meta.tags);
                groups.strengths.forEach(tag => strengthTags.add(tag));
                groups.challenges.forEach(tag => challengeTags.add(tag));
              }
              const text = [meta.comment, meta.strengths && `Forces : ${meta.strengths}`, meta.challenges && `Défis : ${meta.challenges}`]
                .filter(Boolean).join(' · ');
              if (text) observations.push(`Ét. ${term} — ${asg.title} : ${text}`);
            });
          });
          const steps = [row.t1, row.t2, row.t3].map((pct, index) => {
            const rank = rankForCode(pct);
            return `<span class="sis-ps-step sis-ps-${rank}">Ét. ${index + 1}<strong>${rank ? escapeHtml(labels[rank]) : '—'}</strong></span>`;
          }).join('');
          const descriptor = (row.sub.shortName || '').replace(`${row.sub.partLabel || ''} — `, '');
          return `
            <article class="sis-ps-domain">
              <div class="sis-ps-domain-head">
                <strong>${escapeHtml(row.sub.partLabel || row.sub.shortName)}</strong>
                ${descriptor && descriptor !== row.sub.partLabel ? `<span>${escapeHtml(descriptor)}</span>` : ''}
              </div>
              <div class="sis-ps-steps">${steps}</div>
              ${strengthTags.size ? `<p><strong>Forces observées :</strong> ${[...strengthTags].map(escapeHtml).join(', ')}</p>` : ''}
              ${challengeTags.size ? `<p><strong>Défis à soutenir :</strong> ${[...challengeTags].map(escapeHtml).join(', ')}</p>` : ''}
              ${observations.length ? `<p><strong>Observations consignées :</strong> ${observations.slice(-3).map(escapeHtml).join(' • ')}</p>` : ''}
            </article>`;
        });
        return `<div class="sis-ps-list">${cards.join('')}</div>`;
      })() : '';

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

      const todayStr = new Date().toLocaleDateString('fr-CA', { year: 'numeric', month: 'short', day: 'numeric' });
      const sheetHtml = `
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
          ${!options.overall || st.gradeLevel === 'P' ? '' : `<div class="sis-overall-box">
            <div class="sis-overall-label">Moyenne indicative${overallProvisional ? ' · provisoire' : ''}</div>
            <div class="sis-overall-val">${overallAnnualAvg !== null ? `${overallAnnualAvg} % (${escapeHtml(pctToClosestGradeCode(overallAnnualAvg))})` : '—'}</div>
          </div>`}
        </header>
        ${options.supports ? supportsHtml : ''}
        ${options.pending ? pendingHtml : ''}
        ${st.gradeLevel === 'P'
          ? (options.summary ? `<div class="sis-section-title">Portrait du développement par domaine</div><p>Portrait qualitatif à interpréter selon le jugement professionnel; il ne constitue pas un bulletin officiel.</p>${preschoolPrintHtml}${st.reportComment ? `<p><strong>Commentaire général :</strong> ${escapeHtml(st.reportComment)}</p>` : ''}` : '')
          : (options.summary ? `<div class="sis-section-title">Portrait des résultats par matière</div><p>Les résultats provisoires utilisent seulement les étapes disponibles, dont les poids sont réajustés proportionnellement.</p>${summaryTableHtml}` : '')}
        ${options.details ? detailsHtml : ''}
      `;

      if (!printNow) return sheetHtml;
      let sheet = document.getElementById('studentIndividualPrintSheet');
      if (!sheet) {
        sheet = document.createElement('div');
        sheet.id = 'studentIndividualPrintSheet';
        document.body.appendChild(sheet);
      }
      sheet.innerHTML = `<section class="sis-print-page">${sheetHtml}</section>`;
      document.body.classList.add('print-student-sheet');
      const cleanup = () => {
        document.body.classList.remove('print-student-sheet');
        window.removeEventListener('afterprint', cleanup);
        removePrintArtifacts(['studentIndividualPrintSheet']);
      };
      window.addEventListener('afterprint', cleanup);
      triggerPrintAfterPaint();
    }

    // =========================================================================
    // 6. FULLSCREEN & GOOGLE SITES POP-OUT HANDLERS
    // =========================================================================

    const PRINT_MENU_ICONS = {
      observable: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h2m2 0h4M8 16h2m2 0h4"/><path d="m9.5 11.5 1 1 2-2"/></svg>',
      rubric: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M8 4v16M3 9h18M3 14h18"/><path d="m11 11 2 2 3-4"/></svg>',
      gradebook: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M8 4v16M8 9h13M8 14h13"/></svg>',
      students: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="8" cy="7" r="3"/><path d="M2.5 20c0-4 2.2-6 5.5-6s5.5 2 5.5 6M16 8h6M19 5v6"/></svg>',
      summary: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="3" width="16" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="M6.5 16c.5-2 4.5-2 5 0M14 8h3M14 12h3M14 16h3"/></svg>'
    };

    function getActiveObservableAssignments() {
      const term = typeof getActiveTermData === 'function' ? getActiveTermData() : null;
      const subject = typeof getCurrentSubjectConfig === 'function' ? getCurrentSubjectConfig() : null;
      const subjectData = term && subject && term.subjectData ? term.subjectData[subject.id] : null;
      const saved = subjectData
        ? (subjectData.assignments || []).filter(assignment => assignment.isObservation)
        : [];
      if (appState.activeView !== 'viewQuickObs' || !subjectData || !subjectData.currentObsSession) return saved;
      const current = subjectData.currentObsSession;
      if (current.editingAssignmentId) return saved.map(assignment => assignment.id === current.editingAssignmentId
        ? {
            ...assignment,
            title: current.title || assignment.title,
            date: current.date || assignment.date,
            obsMode: current.obsMode || assignment.obsMode,
            criteriaWeights: current.criteriaWeights || assignment.criteriaWeights,
            customRubric: current.customRubric || assignment.customRubric,
            targetLevels: Array.isArray(current.targetLevels) ? current.targetLevels : assignment.targetLevels,
            isActiveEdit: true
          }
        : assignment);
      const hasDraftData = Object.values(current.studentDrafts || {}).some(draft => Boolean(
        (Array.isArray(draft.checked) && draft.checked.length) ||
        (typeof draft.comment === 'string' && draft.comment.trim()) ||
        (typeof draft.strengths === 'string' && draft.strengths.trim()) ||
        (typeof draft.challenges === 'string' && draft.challenges.trim())
      ));
      if (!hasDraftData && !current.title) return saved;
      return [{
        ...current,
        id: '__current_observable__',
        title: current.title || 'Trace observable en cours',
        date: new Date().toISOString().slice(0, 10),
        isObservation: true,
        isCurrentDraft: true
      }, ...saved];
    }

    function closePrintMenu() {
      const menu = document.getElementById('printMenu');
      const button = document.getElementById('btnPrintView');
      if (menu) menu.classList.add('hidden');
      if (button) button.setAttribute('aria-expanded', 'false');
    }

    function showPrintMenuWarning(message, detail) {
      const menu = document.getElementById('printMenu');
      if (!menu) return;
      menu.querySelector('.print-menu-warning')?.remove();
      const warning = document.createElement('div');
      warning.className = 'print-menu-warning';
      warning.setAttribute('role', 'alert');
      warning.innerHTML = `
        <span class="print-menu-warning-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 9v4m0 4h.01"/><path d="M10.3 3.9 1.9 18.5A1.7 1.7 0 0 0 3.4 21h17.2a1.7 1.7 0 0 0 1.5-2.5L13.7 3.9a1.95 1.95 0 0 0-3.4 0Z"/></svg>
        </span>
        <span><strong>${escapeHtml(message)}</strong><small>${escapeHtml(detail)}</small></span>`;
      const heading = menu.querySelector('.print-menu-heading');
      heading.after(warning);
      window.setTimeout(() => warning.classList.add('is-leaving'), 3800);
      window.setTimeout(() => warning.remove(), 4200);
    }

    function hasActiveMatter() {
      return ['viewGradebook', 'viewBareme', 'viewQuickObs'].includes(appState.activeView) &&
        hasActiveGroup() &&
        getCurrentSubjectConfig() &&
        Boolean(appState.terms[appState.activeTerm] &&
          appState.terms[appState.activeTerm].subjectData[appState.activeSubjectId]);
    }

    function printUsingClasses(classes, meta = '') {
      const printMeta = document.getElementById('printMeta');
      if (printMeta) printMeta.textContent = meta;
      document.body.classList.add(...classes);
      const cleanup = () => {
        document.body.classList.remove(...classes);
        window.removeEventListener('afterprint', cleanup);
        if (printMeta) printMeta.textContent = '';
      };
      window.addEventListener('afterprint', cleanup);
      triggerPrintAfterPaint();
    }

    function printCurrentGradebook() {
      const proceed = () => {
        const group = appState.groups.find(g => g.id === appState.activeGroupId);
        const sub = getCurrentSubjectConfig();
        const meta = [group && !group.placeholder ? group.name : '', `Étape ${appState.activeTerm}`, sub && sub.shortName]
          .filter(Boolean).join(' · ');
        if (typeof renderGradebookView === 'function') renderGradebookView();
        printUsingClasses(['print-gradebook'], meta);
      };
      if (appState.activeView === 'viewGradebook') proceed();
      else navigateToView('viewGradebook', () => window.setTimeout(proceed, 0));
    }

    function printCurrentBareme() {
      if (!appState.students.length) {
        showToast('Ajoutez d’abord un élève pour imprimer son barème d’évaluation.');
        return;
      }
      const selectedStudentId = appState.students.some(st => st.id === appState.selectedStudentId)
        ? appState.selectedStudentId
        : appState.students[0].id;
      const proceed = () => {
        appState.selectedStudentId = selectedStudentId;
        const group = appState.groups.find(g => g.id === appState.activeGroupId);
        const student = appState.students.find(st => st.id === appState.selectedStudentId);
        const sub = getCurrentSubjectConfig();
        const meta = [group && !group.placeholder ? group.name : '', `Étape ${appState.activeTerm}`, student ? student.name : '', sub && sub.shortName]
          .filter(Boolean).join(' · ');
        if (typeof renderBaremeView === 'function') renderBaremeView();
        printUsingClasses(['print-bareme'], meta);
      };
      if (appState.activeView === 'viewBareme') proceed();
      else navigateToView('viewBareme', () => {
        appState.selectedStudentId = selectedStudentId;
        window.setTimeout(proceed, 0);
      });
    }

    function buildPrintMenuButton(item) {
      const button = document.createElement('button');
      button.type = 'button';
      button.setAttribute('role', 'menuitem');
      if (item.contextual) button.classList.add('is-contextual');
      if (item.disabled) button.disabled = true;
      button.innerHTML = `
        <span class="print-menu-icon">${PRINT_MENU_ICONS[item.icon]}</span>
        <span class="print-menu-copy"><strong>${escapeHtml(item.label)}</strong><small>${escapeHtml(item.description)}</small></span>`;
      if (!item.disabled) button.addEventListener('click', event => {
        if (item.requiresActiveMatter && !hasActiveMatter()) {
          showPrintMenuWarning('Aucune matière active', 'Ouvrez une matière ou une compétence dans la navigation, puis réessayez.');
          return;
        }
        closePrintMenu();
        item.action(event);
      });
      return button;
    }

    function renderPrintMenu() {
      const menu = document.getElementById('printMenu');
      if (!menu) return;
      const observableAssignments = getActiveObservableAssignments();
      const hasStudents = appState.students.length > 0;
      const hasGroup = typeof hasActiveGroup === 'function' && hasActiveGroup();
      const activeView = appState.activeView;
      menu.innerHTML = '<div class="print-menu-heading">Que souhaitez-vous imprimer ?</div>';
      [
        {
          icon: 'observable',
          label: 'Évaluations observables',
          description: observableAssignments.length
            ? 'Une grille par élève, remplie ou vierge.'
            : hasStudents
              ? 'Aucune évaluation avec grille enregistrée ici.'
              : 'Ajoutez d’abord un élève et une évaluation.',
          contextual: activeView === 'viewQuickObs' || observableAssignments.length > 0 && activeView === 'viewGradebook',
          disabled: !hasStudents || !observableAssignments.length,
          requiresActiveMatter: true,
          action: event => {
            if (!observableAssignments.length) {
              closePrintMenu();
              showToast('Aucune évaluation observable dans cette matière.');
              return;
            }
            openObservablePrintDialog();
          }
        },
        {
          icon: 'gradebook',
          label: 'Carnet de matière',
          description: hasGroup ? 'La vue complète de la matière active.' : 'Créez d’abord un groupe.',
          contextual: activeView === 'viewGradebook',
          disabled: !hasGroup,
          requiresActiveMatter: true,
          action: printCurrentGradebook
        },
        {
          icon: 'rubric',
          label: 'Barèmes d’évaluation',
          description: hasStudents
            ? 'Choisir une matière, une compétence et les élèves.'
            : 'Ajoutez d’abord un élève.',
          contextual: activeView === 'viewBareme',
          disabled: !hasStudents,
          requiresActiveMatter: false,
          action: openBaremePrintDialog
        },
        {
          icon: 'summary',
          label: 'Synthèse individuelle',
          description: hasStudents
            ? 'Portrait annuel d’élève(s) au choix'
            : 'Ajoutez d’abord un élève.',
          contextual: activeView === 'viewGlobalReport',
          disabled: !hasStudents,
          action: openSummaryPrintDialog
        },
        {
          icon: 'students',
          label: 'Liste des élèves',
          description: 'Une feuille de suivi à lignes ajustées.',
          contextual: activeView === 'viewStudents',
          disabled: !hasStudents,
          action: printStudentList
        }
      ].forEach(item => menu.appendChild(buildPrintMenuButton(item)));
    }

    function updateObservablePrintSummary() {
      const select = document.getElementById('observablePrintAssignment');
      const students = [...document.querySelectorAll('#observablePrintStudents input:checked')];
      const summary = document.getElementById('observablePrintSummary');
      if (!select || !summary) return;
      const count = students.length;
      summary.textContent = count
        ? `${count} grille${count > 1 ? 's' : ''} · ${count} page${count > 1 ? 's' : ''}`
        : 'Sélectionnez au moins un élève';
    }

    function updateSummaryPrintSummary() {
      const students = document.querySelectorAll('#summaryPrintStudents input:checked').length;
      const options = document.querySelectorAll('#summaryPrintOptions input:checked').length;
      const summary = document.getElementById('summaryPrintSummary');
      if (!summary) return;
      summary.textContent = students
        ? `${students} synthèse${students > 1 ? 's' : ''} · ${options} section${options > 1 ? 's' : ''}`
        : 'Sélectionnez au moins un élève';
    }

    function updateBaremePrintSummary() {
      const count = document.querySelectorAll('#baremePrintStudents input:checked').length;
      const summary = document.getElementById('baremePrintSummary');
      if (summary) summary.textContent = count
        ? `${count} barème${count > 1 ? 's' : ''} · ${count} page${count > 1 ? 's' : ''}`
        : 'Sélectionnez au moins un élève';
    }

    function openBaremePrintDialog() {
      const dialog = document.getElementById('baremePrintDialog');
      const select = document.getElementById('baremePrintSubject');
      if (!dialog || !select || !SUBJECTS_CONFIG.length || !appState.students.length) {
        showToast('Ajoutez d’abord un élève pour imprimer un barème.');
        return;
      }
      select.innerHTML = '';
      SUBJECTS_CONFIG.forEach(subject => {
        const option = document.createElement('option');
        option.value = subject.id;
        option.textContent = subject.partLabel
          ? `${subject.groupLabel || subject.shortName} — ${subject.partLabel}`
          : (subject.fullName || subject.shortName);
        select.appendChild(option);
      });
      select.value = SUBJECTS_CONFIG.some(subject => subject.id === appState.activeSubjectId)
        ? appState.activeSubjectId
        : SUBJECTS_CONFIG[0].id;
      renderBaremePrintStudents();
      dialog.showModal();
      revealBaremePrintFormat();
    }

    function revealBaremePrintFormat() {
      const box = document.getElementById('baremePrintFormatBox');
      if (!box) return;
      box.classList.remove('is-visible');
      void box.offsetWidth;
      window.setTimeout(() => box.classList.add('is-visible'), 20);
    }

    function renderBaremePrintStudents() {
      const container = document.getElementById('baremePrintStudents');
      const hint = document.getElementById('baremePrintSubjectHint');
      if (!container || !hint) return;
      const subject = SUBJECTS_CONFIG.find(item => item.id === document.getElementById('baremePrintSubject').value);
      if (!subject) return;
      hint.textContent = `${subject.fullName || subject.shortName} · Étape ${appState.activeTerm} · ${appState.students.length} élève${appState.students.length > 1 ? 's' : ''}`;
      container.innerHTML = '';
      appState.students.forEach(student => {
        const label = document.createElement('label');
        label.className = 'print-student-choice';
        label.innerHTML = `<input type="checkbox" value="${escapeHtml(student.id)}" checked><span>${escapeHtml(student.name)}</span>`;
        label.querySelector('input').addEventListener('change', updateBaremePrintSummary);
        container.appendChild(label);
      });
      document.getElementById('btnToggleBaremeStudents').textContent = 'Tout désélectionner';
      updateBaremePrintSummary();
    }

    function renderBaremePrintPage(subject, student, blank = false) {
      const subjectData = appState.terms[appState.activeTerm].subjectData[subject.id];
      const rec = subjectData && subjectData.studentRecords[student.id];
      if (!rec) return '';
      const checked = blank ? [] : (Array.isArray(rec.baremeChecked) ? rec.baremeChecked : []);
      const result = computeMajorityFromChecked(checked, rec.baremeOverrideCode, BAREME_ECOLE_ROWS.length);
      const group = appState.groups.find(item => item.id === appState.activeGroupId);
      const rows = BAREME_ECOLE_ROWS.map(row => {
        const cells = ['A', 'B', 'C', 'D', 'E'].map(family => {
          const statements = (row.cells[family] || []).map((text, index) => {
            const selected = checked.includes(`${row.id}_${family}_${index}`);
            return `<div class="observable-print-statement${selected ? ' is-selected' : ''}"><span class="observable-print-check"></span><span>${escapeHtml(text)}</span></div>`;
          }).join('');
          return `<td>${statements}</td>`;
        }).join('');
        return `<tr><th scope="row">${escapeHtml(row.title.replace(/ & /g, ' et '))}</th>${cells}</tr>`;
      }).join('');
      const resultText = blank
        ? 'Vierge avec nom'
        : result.hasData
          ? `${result.code} · ${result.pct} %${result.hasFinalGrade ? '' : ' (provisoire)'}`
          : 'À compléter';
      return `
        <article class="observable-print-page">
          <header class="observable-print-head">
            <div>
              <h1>${escapeHtml(student.name)}</h1>
              <p><strong>Barème d’évaluation</strong> · ${escapeHtml(subject.fullName || subject.shortName)}</p>
              <p>${escapeHtml(group && !group.placeholder ? group.name : '')} · Étape ${escapeHtml(appState.activeTerm)} · ${escapeHtml(new Date().toLocaleDateString('fr-CA'))}</p>
            </div>
            <div class="observable-print-result"><strong>${escapeHtml(resultText)}</strong>${!blank && rec.baremeOverrideCode ? '<p>Note ajustée manuellement</p>' : ''}</div>
          </header>
          <table class="observable-print-table">
            <thead><tr><th>Critère</th><th>Niveau A</th><th>Niveau B</th><th>Niveau C</th><th>Niveau D</th><th>Niveau E</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
          <div class="observable-print-foot">Barème d’évaluation — jugement professionnel selon les critères de l’école</div>
        </article>`;
    }

    function printBaremeBatch(event) {
      event.preventDefault();
      const subject = SUBJECTS_CONFIG.find(item => item.id === document.getElementById('baremePrintSubject').value);
      const studentIds = [...document.querySelectorAll('#baremePrintStudents input:checked')].map(input => input.value);
      const students = appState.students.filter(student => studentIds.includes(student.id));
      if (!subject || !students.length) {
        showToast('Sélectionnez au moins un élève à imprimer.');
        return;
      }
      let sheet = document.getElementById('baremeBatchPrintSheet');
      if (!sheet) {
        sheet = document.createElement('div');
        sheet.id = 'baremeBatchPrintSheet';
        document.body.appendChild(sheet);
      }
      const blank = document.querySelector('input[name="baremePrintFormat"]:checked').value === 'blank';
      sheet.innerHTML = students.map(student => renderBaremePrintPage(subject, student, blank)).join('');
      if (!sheet.innerHTML) {
        showToast('Aucun barème n’est disponible pour cette sélection.');
        return;
      }
      document.getElementById('baremePrintDialog').close();
      document.body.classList.add('print-bareme-batch');
      const cleanup = () => {
        document.body.classList.remove('print-bareme-batch');
        window.removeEventListener('afterprint', cleanup);
        removePrintArtifacts(['baremeBatchPrintSheet']);
      };
      window.addEventListener('afterprint', cleanup);
      triggerPrintAfterPaint();
    }

    function openSummaryPrintDialog() {
      const dialog = document.getElementById('summaryPrintDialog');
      const container = document.getElementById('summaryPrintStudents');
      if (!dialog || !container || !appState.students.length) {
        showToast('Ajoutez d’abord un élève à la synthèse.');
        return;
      }
      container.innerHTML = '';
      appState.students.forEach(student => {
        const label = document.createElement('label');
        label.className = 'print-student-choice';
        label.innerHTML = `<input type="checkbox" value="${escapeHtml(student.id)}" checked><span>${escapeHtml(student.name)}</span>`;
        label.querySelector('input').addEventListener('change', updateSummaryPrintSummary);
        container.appendChild(label);
      });
      const currentOnlyButton = document.getElementById('btnSummaryCurrentStudent');
      if (currentOnlyButton) {
        currentOnlyButton.disabled = !appState.students.some(student => student.id === appState.selectedStudentId);
        currentOnlyButton.title = currentOnlyButton.disabled ? 'Aucun élève affiché dans la synthèse' : 'Ne garder que l’élève affiché dans la synthèse';
      }
      document.getElementById('btnToggleSummaryStudents').textContent = 'Tout désélectionner';
      updateSummaryPrintSummary();
      dialog.showModal();
    }

    function printSummaryBatch(event) {
      event.preventDefault();
      const studentIds = [...document.querySelectorAll('#summaryPrintStudents input:checked')].map(input => input.value);
      const students = appState.students.filter(student => studentIds.includes(student.id));
      if (!students.length) {
        showToast('Sélectionnez au moins un élève à imprimer.');
        return;
      }
      const options = {};
      document.querySelectorAll('#summaryPrintOptions input[type="checkbox"]').forEach(input => {
        options[input.value] = input.checked;
      });
      if (!Object.values(options).some(Boolean)) {
        showToast('Cochez au moins une section à imprimer.');
        return;
      }
      let sheet = document.getElementById('studentIndividualPrintSheet');
      if (!sheet) {
        sheet = document.createElement('div');
        sheet.id = 'studentIndividualPrintSheet';
        document.body.appendChild(sheet);
      }
      sheet.innerHTML = students.map(student =>
        `<section class="sis-print-page">${printStudentIndividualSheet(student, options, false)}</section>`
      ).join('');
      document.getElementById('summaryPrintDialog').close();
      document.body.classList.add('print-student-sheet');
      const cleanup = () => {
        document.body.classList.remove('print-student-sheet');
        window.removeEventListener('afterprint', cleanup);
        removePrintArtifacts(['studentIndividualPrintSheet']);
      };
      window.addEventListener('afterprint', cleanup);
      triggerPrintAfterPaint();
    }

    function renderObservablePrintStudents() {
      const assignmentId = document.getElementById('observablePrintAssignment').value;
      const assignment = getActiveObservableAssignments().find(item => item.id === assignmentId);
      const container = document.getElementById('observablePrintStudents');
      const hint = document.getElementById('observablePrintAssignmentHint');
      if (!assignment || !container || !hint) return;
      const subject = getCurrentSubjectConfig();
      const targetedStudents = appState.students.filter(student => isAssignmentForStudent(assignment, student));
      let targetLabel = assignment.isCurrentDraft
        ? (assignment.targetLevels && assignment.targetLevels.length ? formatAssignmentTargetBadge(assignment) : 'Tous les niveaux')
        : (formatAssignmentTargetBadge(assignment) || 'Tous les niveaux');
      if (targetLabel === 'Tous') targetLabel = 'Tous les niveaux';
      hint.textContent = `${subject.shortName} · ${targetLabel} · ${targetedStudents.length} élève${targetedStudents.length > 1 ? 's' : ''} concerné${targetedStudents.length > 1 ? 's' : ''}`;
      container.innerHTML = '';
      targetedStudents.forEach(student => {
        const label = document.createElement('label');
        label.className = 'print-student-choice';
        label.innerHTML = `<input type="checkbox" value="${escapeHtml(student.id)}" checked><span>${escapeHtml(student.name)}</span>`;
        label.querySelector('input').addEventListener('change', updateObservablePrintSummary);
        container.appendChild(label);
      });
      const toggle = document.getElementById('btnToggleObservableStudents');
      if (toggle) toggle.textContent = 'Tout désélectionner';
      updateObservablePrintSummary();
    }

    function openObservablePrintDialog() {
      const dialog = document.getElementById('observablePrintDialog');
      const select = document.getElementById('observablePrintAssignment');
      const assignments = getActiveObservableAssignments();
      if (!dialog || !select || !assignments.length) {
        showToast('Aucune évaluation avec grille n’est enregistrée dans cette matière.');
        return;
      }
      select.innerHTML = '';
      assignments.slice().sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')))
        .forEach(assignment => {
          const option = document.createElement('option');
          option.value = assignment.id;
          const date = assignment.date
            ? new Date(`${assignment.date}T12:00:00`).toLocaleDateString('fr-CA', { day: 'numeric', month: 'short', year: 'numeric' })
            : '';
          option.textContent = [assignment.title || 'Évaluation sans titre', date].filter(Boolean).join(' · ');
          select.appendChild(option);
        });
      const activeTerm = getActiveTermData();
      const activeSession = activeTerm && activeTerm.subjectData[getCurrentSubjectConfig().id].currentObsSession;
      if (activeSession && !activeSession.editingAssignmentId && assignments.some(item => item.isCurrentDraft)) {
        select.value = '__current_observable__';
      } else if (activeSession && activeSession.editingAssignmentId) {
        select.value = activeSession.editingAssignmentId;
      }
      renderObservablePrintStudents();
      dialog.showModal();
    }

    function getObservablePrintNotes(meta, blank) {
      if (blank || !meta) return { feedback: '', observations: '' };
      const groups = groupObservationTags(Array.isArray(meta.tags) ? meta.tags : []);
      const observations = [
        groups.strengths.length ? `Forces : ${groups.strengths.join(', ')}` : '',
        groups.challenges.length ? `Défis : ${groups.challenges.join(', ')}` : '',
        groups.previous.length ? `Observations précédentes : ${groups.previous.join(', ')}` : ''
      ].filter(Boolean).join(' · ');
      return {
        feedback: [meta.comment, meta.strengths && `Forces : ${meta.strengths}`, meta.challenges && `Défis : ${meta.challenges}`]
          .filter(Boolean).join(' · '),
        observations
      };
    }

    function renderObservablePrintPage(subject, assignment, student, blank) {
      const termData = getActiveTermData();
      const rec = termData.subjectData[subject.id].studentRecords[student.id] || { scores: {}, scoreMeta: {} };
      const session = termData.subjectData[subject.id].currentObsSession;
      const meta = assignment.isCurrentDraft
        ? (session && session.studentDrafts[student.id]) || {}
        : assignment.isActiveEdit
          ? (session && session.studentDrafts[student.id]) || (rec.scoreMeta && rec.scoreMeta[assignment.id]) || {}
          : (rec.scoreMeta && rec.scoreMeta[assignment.id] ? rec.scoreMeta[assignment.id] : {});
      const gradeLevel = meta.gradeLevel && GRADE_LEVEL_LABELS[meta.gradeLevel]
        ? meta.gradeLevel
        : getEffectiveGradeLevel(student, subject);
      const criteria = getObservationCriteria(subject, gradeLevel, assignment);
      const scoredCriteria = getScoredObservableCriteria(criteria);
      const customRubric = assignment.obsMode === 'custom'
        ? normalizeCustomRubric(assignment.customRubric || meta.customRubric)
        : null;
      const obsOptions = {
        obsMode: assignment.obsMode === 'weighted' || assignment.obsMode === 'custom' ? assignment.obsMode : 'portrait',
        criteriaWeights: assignment.criteriaWeights || (meta && meta.criteriaWeights) || null,
        customRubric,
        subjectId: subject.id,
        cycle: getStudentCycle(gradeLevel) || 2
      };
      const weights = obsOptions.obsMode === 'custom' && customRubric
        ? Object.fromEntries(customRubric.criteria.map(criterion => [criterion.id, criterion.weight]))
        : obsOptions.obsMode === 'weighted'
          ? getEffectiveCriteriaWeights(subject.id, obsOptions.cycle, scoredCriteria, obsOptions.criteriaWeights)
          : {};
      const checked = blank ? [] : (Array.isArray(meta.checked) ? meta.checked : []);
      const result = blank
        ? null
        : computeObservableResult(checked, meta.overrideCode || null, criteria, meta.notEvaluated === true, obsOptions);
      const notes = getObservablePrintNotes(meta, blank);
      const group = appState.groups.find(item => item.id === appState.activeGroupId);
      const resultText = blank
        ? 'Grille vierge'
        : result && result.isNotEvaluated
          ? 'N/A'
          : result && result.hasData
            ? `${result.code} · ${result.pct} %${result.isComplete ? '' : ' (provisoire)'}`
            : 'À compléter';
      const rows = criteria.map(criterion => {
        const title = criterion.title.replace(/^\d+\.\s*/, '');
        const weight = weights[criterion.id] ? ` · Pond. ${weights[criterion.id]} %` : '';
        const printLevels = customRubric ? customRubric.levels : [
          { key: 'A', name: 'Niveau A' }, { key: 'B', name: 'Niveau B' }, { key: 'C', name: 'Niveau C' },
          { key: 'D', name: 'Niveau D' }, { key: 'E', name: 'Niveau E' }
        ];
        const cells = printLevels.map(({ key: family }) => {
          const statements = (criterion.cells[family] || []).map((text, index) => {
            const key = `${criterion.id}_${family}_${index}`;
            const selected = !blank && checked.includes(key);
            return `<div class="observable-print-statement${selected ? ' is-selected' : ''}"><span class="observable-print-check"></span><span>${escapeHtml(text)}</span></div>`;
          }).join('');
          return `<td>${statements}</td>`;
        }).join('');
        return `<tr><th scope="row">${escapeHtml(title)}${weight ? `<span class="observable-print-weight">${escapeHtml(weight)}</span>` : ''}</th>${cells}</tr>`;
      }).join('');
      const date = assignment.date
        ? new Date(`${assignment.date}T12:00:00`).toLocaleDateString('fr-CA', { day: 'numeric', month: 'long', year: 'numeric' })
        : new Date().toLocaleDateString('fr-CA');
      return `
        <article class="observable-print-page">
          <header class="observable-print-head">
            <div>
              <h1>${escapeHtml(student.name)}</h1>
              <p><strong>${escapeHtml(assignment.title || 'Évaluation observable')}</strong> · ${escapeHtml(subject.fullName || subject.shortName)}</p>
              <p>${escapeHtml(group && !group.placeholder ? group.name : '')} · ${escapeHtml(GRADE_LEVEL_LABELS[gradeLevel] || '')} · Étape ${escapeHtml(appState.activeTerm)} · ${escapeHtml(date)}</p>
            </div>
            <div class="observable-print-result"><strong>${escapeHtml(resultText)}</strong></div>
          </header>
          <table class="observable-print-table">
            <thead><tr><th>Critère observé</th>${(customRubric ? customRubric.levels : [
              { name: 'Niveau A' }, { name: 'Niveau B' }, { name: 'Niveau C' }, { name: 'Niveau D' }, { name: 'Niveau E' }
            ]).map(level => `<th>${escapeHtml(level.name)}${customRubric ? ` · ${formatScoreNumber(level.percent)} %` : ''}</th>`).join('')}</tr></thead>
            <tbody>${rows}</tbody>
          </table>
          <div class="observable-print-notes">
            <div class="observable-print-note"><strong>Observations</strong>${escapeHtml(notes.observations || ' ')}</div>
            <div class="observable-print-note"><strong>Commentaires / rétroaction</strong>${escapeHtml(notes.feedback || ' ')}</div>
          </div>
          <div class="observable-print-foot">${escapeHtml(customRubric ? `${customRubric.title} · Grille personnelle` : obsOptions.obsMode === 'weighted' ? 'Pondérations personnalisées conservées' : 'Grille adaptée au cycle de l’élève · Grille d’appréciation')}</div>
        </article>`;
    }

    function printObservableAssignmentBatch(event) {
      event.preventDefault();
      const assignmentId = document.getElementById('observablePrintAssignment').value;
      const assignment = getActiveObservableAssignments().find(item => item.id === assignmentId);
      const studentIds = [...document.querySelectorAll('#observablePrintStudents input:checked')].map(input => input.value);
      const students = appState.students.filter(student => studentIds.includes(student.id));
      if (!assignment || !students.length) {
        showToast('Sélectionnez au moins un élève à imprimer.');
        return;
      }
      const blank = document.querySelector('input[name="observablePrintFormat"]:checked').value === 'blank';
      const subject = getCurrentSubjectConfig();
      let sheet = document.getElementById('observablePrintSheet');
      if (!sheet) {
        sheet = document.createElement('div');
        sheet.id = 'observablePrintSheet';
        document.body.appendChild(sheet);
      }
      sheet.innerHTML = students.map(student => renderObservablePrintPage(subject, assignment, student, blank)).join('');
      document.getElementById('observablePrintDialog').close();
      document.body.classList.add('print-observable-batch');
      const cleanup = () => {
        document.body.classList.remove('print-observable-batch');
        window.removeEventListener('afterprint', cleanup);
        removePrintArtifacts(['observablePrintSheet']);
      };
      window.addEventListener('afterprint', cleanup);
      triggerPrintAfterPaint();
    }

    function setupPrintCenter() {
      const button = document.getElementById('btnPrintView');
      const menu = document.getElementById('printMenu');
      const dialog = document.getElementById('observablePrintDialog');
      if (!button || !menu || !dialog) return;
      button.addEventListener('click', event => {
        event.stopPropagation();
        const opening = menu.classList.contains('hidden');
        renderPrintMenu();
        menu.classList.toggle('hidden', !opening);
        button.setAttribute('aria-expanded', String(opening));
        if (opening) {
          const first = menu.querySelector('button:not(:disabled)');
          if (first) first.focus();
        }
      });
      menu.addEventListener('keydown', event => {
        if (event.key !== 'Escape') return;
        closePrintMenu();
        button.focus();
      });
      document.addEventListener('click', event => {
        if (!menu.contains(event.target) && !button.contains(event.target)) closePrintMenu();
      });
      document.getElementById('observablePrintAssignment').addEventListener('change', renderObservablePrintStudents);
      document.getElementById('btnToggleObservableStudents').addEventListener('click', () => {
        const inputs = [...document.querySelectorAll('#observablePrintStudents input')];
        const shouldCheck = inputs.some(input => !input.checked);
        inputs.forEach(input => { input.checked = shouldCheck; });
        document.getElementById('btnToggleObservableStudents').textContent = shouldCheck
          ? 'Tout désélectionner'
          : 'Tout sélectionner';
        updateObservablePrintSummary();
      });
      ['btnCloseObservablePrint', 'btnCancelObservablePrint'].forEach(id => {
        document.getElementById(id).addEventListener('click', () => dialog.close());
      });
      document.getElementById('observablePrintForm').addEventListener('submit', printObservableAssignmentBatch);
      const summaryDialog = document.getElementById('summaryPrintDialog');
      ['btnCloseSummaryPrint', 'btnCancelSummaryPrint'].forEach(id => {
        document.getElementById(id).addEventListener('click', () => summaryDialog.close());
      });
      document.getElementById('btnToggleSummaryStudents').addEventListener('click', () => {
        const inputs = [...document.querySelectorAll('#summaryPrintStudents input')];
        const shouldCheck = inputs.some(input => !input.checked);
        inputs.forEach(input => { input.checked = shouldCheck; });
        document.getElementById('btnToggleSummaryStudents').textContent = shouldCheck
          ? 'Tout désélectionner'
          : 'Tout sélectionner';
        updateSummaryPrintSummary();
      });
      document.getElementById('btnSummaryCurrentStudent').addEventListener('click', () => {
        const inputs = [...document.querySelectorAll('#summaryPrintStudents input')];
        const selectedId = appState.selectedStudentId;
        inputs.forEach(input => { input.checked = input.value === selectedId; });
        document.getElementById('btnToggleSummaryStudents').textContent = inputs.some(input => !input.checked)
          ? 'Tout sélectionner'
          : 'Tout désélectionner';
        updateSummaryPrintSummary();
      });
      document.getElementById('summaryPrintOptions').addEventListener('change', updateSummaryPrintSummary);
      document.getElementById('summaryPrintForm').addEventListener('submit', printSummaryBatch);
      const baremeDialog = document.getElementById('baremePrintDialog');
      ['btnCloseBaremePrint', 'btnCancelBaremePrint'].forEach(id => {
        document.getElementById(id).addEventListener('click', () => baremeDialog.close());
      });
      document.getElementById('baremePrintSubject').addEventListener('change', () => {
        renderBaremePrintStudents();
        revealBaremePrintFormat();
      });
      document.getElementById('btnToggleBaremeStudents').addEventListener('click', () => {
        const inputs = [...document.querySelectorAll('#baremePrintStudents input')];
        const shouldCheck = inputs.some(input => !input.checked);
        inputs.forEach(input => { input.checked = shouldCheck; });
        document.getElementById('btnToggleBaremeStudents').textContent = shouldCheck
          ? 'Tout désélectionner'
          : 'Tout sélectionner';
        updateBaremePrintSummary();
      });
      document.getElementById('baremePrintForm').addEventListener('submit', printBaremeBatch);
    }
