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

    // =========================================================================
    // 6. FULLSCREEN & GOOGLE SITES POP-OUT HANDLERS
    // =========================================================================
