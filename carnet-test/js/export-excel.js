    function exportFormattedExcelWorkbook() {
      if (typeof XLSX === 'undefined') {
        showToast('Bibliothèque Excel non chargée');
        return;
      }

      const wb = XLSX.utils.book_new();
      const termId = appState.activeTerm;
      const termData = getActiveTermData();

      const headerStyle = {
        fill: { fgColor: { rgb: '19383B' } },
        font: { name: 'Calibri', sz: 11, bold: true, color: { rgb: 'FFFFFF' } },
        alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
        border: {
          top: { style: 'thin', color: { rgb: 'CBD5E1' } },
          bottom: { style: 'thin', color: { rgb: 'CBD5E1' } },
          left: { style: 'thin', color: { rgb: 'CBD5E1' } },
          right: { style: 'thin', color: { rgb: 'CBD5E1' } }
        }
      };

      const titleStyle = {
        fill: { fgColor: { rgb: '176B63' } },
        font: { name: 'Calibri', sz: 14, bold: true, color: { rgb: 'FFFFFF' } },
        alignment: { horizontal: 'left', vertical: 'center' }
      };

      const cellBorder = {
        top: { style: 'thin', color: { rgb: 'E2E8F0' } },
        bottom: { style: 'thin', color: { rgb: 'E2E8F0' } },
        left: { style: 'thin', color: { rgb: 'E2E8F0' } },
        right: { style: 'thin', color: { rgb: 'E2E8F0' } }
      };

      // 1. SHEET 1: SYNTHÈSE GLOBALE DE L'ÉTAPE ACTIVE
      const synthRows = [];
      synthRows.push([`CARNET DE NOTES 2026/2027 — SYNTHÈSE ÉTAPE ${termId}`]);
      synthRows.push([`Exporté le ${new Date().toLocaleDateString('fr-CA')}`]);
      synthRows.push([]);

      const synthHeader = ['Élève', 'Adaptations'];
      SUBJECTS_CONFIG.forEach(sub => {
        synthHeader.push(`${sub.shortName} (%)`);
        synthHeader.push(`${sub.shortName} (Cote)`);
      });
      synthRows.push(synthHeader);

      appState.students.forEach(st => {
        const row = [st.name, formatStudentAdaptations(st)];
        SUBJECTS_CONFIG.forEach(sub => {
          const sum = computeStudentSubjectSummary(termId, sub.id, st.id);
          row.push(sum.finalPct !== null ? sum.finalPct : '');
          row.push(sum.finalLetter !== '—' ? sum.finalLetter : '');
        });
        synthRows.push(row);
      });

      const wsSynth = XLSX.utils.aoa_to_sheet(synthRows);
      wsSynth['!cols'] = [{ wch: 16 }, { wch: 34 }];
      for (let i = 0; i < SUBJECTS_CONFIG.length * 2; i++) {
        wsSynth['!cols'].push({ wch: 15 });
      }
      styleSheetHelper(wsSynth, synthRows.length, synthHeader.length, titleStyle, headerStyle, cellBorder, 3);
      XLSX.utils.book_append_sheet(wb, wsSynth, `Synthese_Etape_${termId}`);

      // 2. ONE SHEET PER SUBJECT (10 SHEETS)
      SUBJECTS_CONFIG.forEach((sub, idx) => {
        const subData = termData.subjectData[sub.id];
        const rows = [];
        rows.push([`${sub.fullName} — ÉTAPE ${termId}`]);
        rows.push([`Cadre de référence : ${sub.refUrl}`]);
        rows.push([]);

        const headers = ['Élève', 'Adaptations'];
        subData.assignments.forEach(a => headers.push(`${a.title}${getAssignmentOutOf(a) !== 100 ? ` [/${getAssignmentOutOf(a)}]` : ''} (${a.weight || 0}%)`));
        headers.push(
          'Moy. Travaux (/100)',
          'Barème (Cote)',
          'Barème (%)',
          'Jugement Final (%)',
          'Cote Finale',
          'Commentaires'
        );
        rows.push(headers);

        appState.students.forEach(st => {
          const rec = subData.studentRecords[st.id];
          const sum = computeStudentSubjectSummary(termId, sub.id, st.id);
          const r = [st.name, formatStudentAdaptations(st)];
          subData.assignments.forEach(a => {
            const v = rec.scores[a.id];
            if (v === '-' || v === 'N/A') r.push('-');
            else r.push(v !== undefined && v !== '' ? Number(v) : '');
          });
          r.push(
            sum.assignmentsAvg !== null ? sum.assignmentsAvg : '',
            sum.baremeRes.hasData ? sum.baremeRes.code : '',
            sum.baremeRes.hasData ? sum.baremeRes.pct : '',
            sum.finalPct !== null ? sum.finalPct : '',
            sum.finalLetter !== '—' ? sum.finalLetter : '',
            rec.comment || ''
          );
          rows.push(r);
        });

        rows.push([]);
        rows.push([]);
        rows.push(['GRILLES DE CORRECTION PAR CYCLE — REPÈRES PÉDAGOGIQUES NON OFFICIELS']);
        [1, 2, 3].forEach(cycle => {
          rows.push([]);
          rows.push([`Grille adaptée au ${CYCLE_LABELS[cycle]} (non officielle)`]);
          rows.push(['Critère observé', 'Niveau A', 'Niveau B', 'Niveau C', 'Niveau D', 'Niveau E']);
          getCriteriaForGradeLevel(sub, String(cycle * 2 - 1)).forEach(criterion => {
            rows.push([
              criterion.title,
              (criterion.cells.A || []).join(' • '),
              (criterion.cells.B || []).join(' • '),
              (criterion.cells.C || []).join(' • '),
              (criterion.cells.D || []).join(' • '),
              (criterion.cells.E || []).join(' • ')
            ]);
          });
        });

        const ws = XLSX.utils.aoa_to_sheet(rows);
        ws['!cols'] = headers.map((h, i) => ({ wch: i === 0 ? 15 : i === 1 ? 30 : i === headers.length - 1 ? 36 : 15 }));
        styleSheetHelper(ws, 4 + appState.students.length, headers.length, titleStyle, headerStyle, cellBorder, 3);
        const safeSheetName = `${idx + 1}_${sub.shortName.replace(/[^a-zA-Z0-9À-ÿ]/g, '_').slice(0, 24)}`;
        XLSX.utils.book_append_sheet(wb, ws, safeSheetName);
      });

      // 3. Journal des traces observables
      const obsRows = [
        [`JOURNAL DES TRACES OBSERVABLES — ÉTAPE ${termId}`],
        ['Traces observables enregistrées au carnet'],
        [],
        ['Date', 'Élève', 'Matière / Compétence', 'Trace observable', 'Cote', 'Pourcentage', 'Indicateurs rapides', 'Commentaire / Verbatim']
      ];
      termData.observations.forEach(o => {
        const stu = appState.students.find(s => s.id === o.studentId);
        const sub = SUBJECTS_CONFIG.find(s => s.id === o.subjectId);
        const gObj = GRADE_MAP[o.gradeCode];
        obsRows.push([
          o.date,
          stu ? stu.name : '',
          sub ? sub.fullName : '',
          o.activity || '',
          o.gradeCode,
          gObj ? gObj.pct : '',
          (o.tags || []).join(', '),
          o.comment || ''
        ]);
      });
      const wsObs = XLSX.utils.aoa_to_sheet(obsRows);
      wsObs['!cols'] = [
        { wch: 14 }, { wch: 16 }, { wch: 32 }, { wch: 24 }, { wch: 10 }, { wch: 12 }, { wch: 28 }, { wch: 45 }
      ];
      styleSheetHelper(wsObs, obsRows.length, 8, titleStyle, headerStyle, cellBorder, 3);
      XLSX.utils.book_append_sheet(wb, wsObs, 'Traces_Visuelles');

      const competencyTabs = getCompetencyTabs();
      const competencyRows = [
        ['NIVEAU DE COMPÉTENCE — ÉCHELONS (ÉCHELLES DU PRIMAIRE)'],
        ['L’échelon est calculé à partir des phrases choisies par l’enseignant dans les échelles des niveaux de compétence du primaire. Il ne constitue pas une cote ministérielle.'],
        [],
        ['Élève', 'Niveau scolaire', 'Cycle', 'Matière', 'Compétence', 'Échelon', 'Phrases retenues (échelon : phrase)', 'Commentaire de bulletin', 'Repère échelle MEQ (5 niveaux)']
      ];
      appState.students.forEach(student => {
        const cycle = getStudentCycle(student.gradeLevel);
        const sentencesByScale = getAnnualCompetencyPicks(student);
        competencyTabs.forEach(tab => {
          tab.scales.forEach(scale => {
            const picked = sentencesByScale[scale.id] || {};
            const model = getCompetencyScaleModel(scale);
            const chosenSentences = [];
            model.levels.forEach(level => level.sentences.forEach(sentence => {
              if (picked[sentence.row] !== undefined && Number(picked[sentence.row]) === level.n) {
                chosenSentences.push(`${level.n} : ${sentence.text}`);
              }
            }));
            const result = computeCompetencyResult(scale, picked);
            competencyRows.push([
              student.name,
              GRADE_LEVEL_LABELS[student.gradeLevel] || '',
              cycle ? CYCLE_LABELS[cycle] : '',
              tab.label,
              scale.label,
              result ? `${result.level} / ${scale.max}` : '',
              chosenSentences.join('\n'),
              picked && Object.keys(picked).length ? getCompetencyComment(student, 'annual', scale, picked).text : '',
              (() => {
                const meqX = Object.keys(picked).length ? getMeqFinal(student, 'annual', scale, tab.id, picked) : null;
                return meqX && meqX.level ? `${meqX.level}/5 — ${MEQ5_LEVELS[meqX.level].label}${meqX.override ? ' (ajusté)' : ''}` : '';
              })()
            ]);
          });
        });
      });
      const wsCompetencies = XLSX.utils.aoa_to_sheet(competencyRows);
      wsCompetencies['!cols'] = [
        { wch: 22 }, { wch: 18 }, { wch: 14 }, { wch: 24 }, { wch: 50 }, { wch: 10 }, { wch: 100 }, { wch: 100 }, { wch: 34 }
      ];
      styleSheetHelper(wsCompetencies, competencyRows.length, competencyRows[3].length, titleStyle, headerStyle, cellBorder, 3);
      XLSX.utils.book_append_sheet(wb, wsCompetencies, 'Niveaux_competence');

      // 4. Données à plat (une ligne par élève × évaluation, toutes les étapes) — idéal pour tableaux croisés ou analyse par IA
      const activeGroupObj = (appState.groups || []).find(g => g.id === appState.activeGroupId);
      const groupName = activeGroupObj ? activeGroupObj.name : '';
      const dataRows = [
        ['DONNÉES À PLAT — UNE LIGNE PAR ÉLÈVE ET PAR ÉVALUATION'],
        ['Filtrez ou croisez librement. Les champs vides signifient « non saisi ». « - » = non évalué.'],
        [],
        ['Groupe', 'Élève', 'Niveau scolaire', 'Adaptations', 'Étape', 'Matière', 'Compétence', 'Évaluation', 'Type', 'Note brute', 'Sur', 'Pourcentage', 'Cote', 'Pondération (%)', 'Note ajustée (*)', 'Évaluation partagée', 'Note finale de la matière (%)', 'Cote finale de la matière', 'Commentaire']
      ];
      [1, 2, 3].forEach(t => {
        const td = appState.terms[t];
        if (!td) return;
        SUBJECTS_CONFIG.forEach(sub => {
          const sd = td.subjectData[sub.id];
          if (!sd) return;
          appState.students.forEach(st => {
            const rec = sd.studentRecords[st.id];
            if (!rec) return;
            const sum = computeStudentSubjectSummary(t, sub.id, st.id);
            const subjectLabel = sub.groupLabel || sub.shortName;
            const compLabel = sub.partLabel || '';
            const base = [groupName, st.name, GRADE_LEVEL_LABELS[st.gradeLevel] || '', formatStudentAdaptations(st), t, subjectLabel, compLabel];
            const tail = [sum.finalPct !== null ? sum.finalPct : '', sum.finalLetter !== '—' ? sum.finalLetter : '', rec.comment || ''];
            if (!sd.assignments.length) {
              dataRows.push([...base, '(aucune évaluation)', '', '', '', '', '', '', '', '', ...tail]);
              return;
            }
            sd.assignments.forEach(a => {
              const v = rec.scores[a.id];
              const meta = rec.scoreMeta && rec.scoreMeta[a.id];
              const outOf = getAssignmentOutOf(a);
              const notEval = v === '-' || v === 'N/A';
              const num = (v !== undefined && v !== '' && !notEval) ? Number(v) : null;
              const hasNum = num !== null && Number.isFinite(num);
              const pct = hasNum ? Math.round(num / outOf * 1000) / 10 : '';
              dataRows.push([
                ...base, a.title, a.isObservation ? 'Trace observable' : 'Évaluation',
                notEval ? '-' : (hasNum ? num : ''), a.isObservation ? 100 : outOf, pct,
                (meta && meta.code) ? meta.code : (hasNum ? pctToClosestGradeCode(pct) : ''),
                a.weight || 0, meta && meta.overrideCode ? 'Oui' : '', a.linkId ? 'Oui' : '', ...tail
              ]);
            });
          });
        });
      });
      const wsData = XLSX.utils.aoa_to_sheet(dataRows);
      wsData['!cols'] = [12, 20, 14, 24, 7, 22, 22, 28, 16, 10, 7, 12, 8, 13, 12, 12, 14, 12, 40].map(w => ({ wch: w }));
      styleSheetHelper(wsData, dataRows.length, dataRows[3].length, titleStyle, headerStyle, cellBorder, 3);
      wsData['!autofilter'] = { ref: XLSX.utils.encode_range({ s: { r: 3, c: 0 }, e: { r: Math.max(3, dataRows.length - 1), c: dataRows[3].length - 1 } }) };
      wsData['!freeze'] = { xSplit: 2, ySplit: 4 };
      XLSX.utils.book_append_sheet(wb, wsData, 'Donnees_a_plat');

      // 5. Lisez-moi : contexte complet pour un humain ou une IA
      const isP = appState.students.some(s => s.gradeLevel === 'P');
      const readme = [
        ['LISEZ-MOI — CONTEXTE DU FICHIER'],
        [],
        ['Contenu', 'Description'],
        ['Document', `Carnet de notes 2026-2027 — groupe « ${groupName || 'unique'} » — exporté le ${new Date().toLocaleDateString('fr-CA')} (étape active : ${termId}).`],
        ['Contexte', 'École primaire du Québec (Programme de formation de l’école québécoise, PFEQ). Une année = 3 étapes. Niveaux scolaires : préscolaire et 1re à 6e année (cycles 1 à 3).'],
        ['Matières du groupe', SUBJECTS_CONFIG.map(s => s.shortName).join(' ; ')],
        ['Feuille Synthese_Etape_X', 'Une ligne par élève : pourcentage et cote finale de chaque matière pour l’étape active.'],
        ['Feuilles numérotées', 'Détail par matière : chaque évaluation (note et pondération), moyenne, barème, jugement final, commentaire.'],
        ['Traces_Visuelles', 'Journal des traces observables (observations qualitatives cotées A+ à E).'],
        ['Niveaux_competence', 'Portrait global, sans étapes : échelons des échelles du primaire et phrases retenues par l’enseignant.'],
        ['Donnees_a_plat', 'Toutes les étapes, une ligne par élève et par évaluation : la feuille à privilégier pour tout calcul, filtre ou analyse automatisée.'],
        [],
        ['Lexique', ''],
        ['Cotes', 'A+ (97-100 %), A, A−, B+, B, B−, C+, C, C−, D+, D, E : la cote est dérivée du pourcentage; la cote finale est le jugement de l’enseignant.'],
        ['Note brute / Sur', 'La note saisie et son maximum (ex. 32 sur 40). Le pourcentage est ramené sur 100. Les traces observables sont toujours sur 100.'],
        ['Pondération (%)', 'Poids de l’évaluation dans la moyenne de la matière ou de la compétence. Le total visé est 100 %.'],
        ['Barème', 'Cote obtenue en surlignant des descripteurs dans la grille du barème école; repère de jugement, exclu du calcul automatique de la note finale.'],
        ['Note ajustée (*)', '« Oui » : l’enseignant a modifié manuellement la cote proposée par la grille.'],
        ['Évaluation partagée', '« Oui » : une même évaluation est liée à plusieurs compétences ou matières; elle ne compte qu’une fois dans le résultat unique des matières à résultat unique.'],
        ['Matières à résultat unique', 'Sciences, Géographie-Histoire-Éducation à la citoyenneté et Culture et citoyenneté québécoise : plusieurs compétences, mais un seul résultat au bulletin.'],
        ['Matières à compétences distinctes', 'Français, Mathématiques, Art dramatique : un résultat par compétence au bulletin.'],
        ['Niveaux de compétence', 'Échelons sur 10 à titre d’outil d’analyse; ils ne remplacent pas la cote officielle.'],
        ['Valeurs vides', 'Aucune donnée saisie. « - » : élève non évalué pour cet item.'],
        ['Pistes d’analyse', 'Comparer les étapes, repérer les élèves en difficulté (cote C- ou moins), les écarts entre compétences d’une même matière, les évaluations à faible moyenne de groupe, et croiser avec les adaptations.']
      ];
      if (isP) {
        readme.push(['Préscolaire', 'Il n’y a pas de pourcentage officiel : 5 compétences (physique et moteur, affectif, social, langagier, cognitif), constats « se développe très bien / adéquatement / avec certaines difficultés / avec des difficultés importantes ». Ici : A-B = très bien, C = adéquatement, D = certaines difficultés, E = difficultés importantes.']);
      }
      const wsReadme = XLSX.utils.aoa_to_sheet(readme);
      wsReadme['!cols'] = [{ wch: 30 }, { wch: 120 }];
      wsReadme['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 1 } }];
      if (wsReadme['A1']) wsReadme['A1'].s = titleStyle;
      ['A3', 'B3'].forEach(ref => { if (wsReadme[ref]) wsReadme[ref].s = headerStyle; });
      for (let r = 3; r < readme.length; r++) {
        ['A', 'B'].forEach((col, ci) => {
          const cell = wsReadme[`${col}${r + 1}`];
          if (cell) cell.s = { font: { name: 'Calibri', sz: 10, bold: ci === 0 }, alignment: { vertical: 'top', wrapText: true }, border: cellBorder };
        });
      }
      XLSX.utils.book_append_sheet(wb, wsReadme, 'Lisez-moi');
      wb.SheetNames.unshift(wb.SheetNames.pop());

      // Figer les en-têtes sur les feuilles tabulaires
      Object.entries(wb.Sheets).forEach(([name, ws]) => {
        if (name === 'Lisez-moi' || ws['!freeze']) return;
        ws['!freeze'] = { xSplit: 1, ySplit: 4 };
      });

      XLSX.writeFile(wb, `Carnet_de_notes_2026_2027_Etape_${termId}.xlsx`);
      showToast(`Export Excel (Étape ${termId}) téléchargé!`);
    }

    function styleSheetHelper(ws, maxRow, maxCol, titleStyle, headerStyle, cellBorder, headerRowIndexZeroBased) {
      if (ws['A1']) ws['A1'].s = titleStyle;
      for (let c = 0; c < maxCol; c++) {
        const cellRef = XLSX.utils.encode_cell({ r: headerRowIndexZeroBased, c });
        if (ws[cellRef]) ws[cellRef].s = headerStyle;
      }
      for (let r = headerRowIndexZeroBased + 1; r < maxRow; r++) {
        const isEven = (r % 2 === 0);
        for (let c = 0; c < maxCol; c++) {
          const cellRef = XLSX.utils.encode_cell({ r, c });
          if (ws[cellRef]) {
            ws[cellRef].s = {
              font: { name: 'Calibri', sz: 10, bold: c === 0 },
              alignment: { horizontal: c <= 1 || c === maxCol - 1 ? 'left' : 'center', vertical: 'center', wrapText: true },
              fill: { fgColor: { rgb: isEven ? 'F8FAFC' : 'FFFFFF' } },
              border: cellBorder
            };
          }
        }
      }
    }

