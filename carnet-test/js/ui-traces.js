    function restoreRubricFocus(tbody, key) {
      const button = Array.from(tbody.querySelectorAll('.rubric-stmt-btn'))
        .find(item => item.dataset.rubricKey === key);
      if (button) button.focus({ preventScroll: true });
    }

    function renderBaremeView() {
      const sub = getCurrentSubjectConfig();
      const termData = getActiveTermData();
      const subData = termData.subjectData[sub.id];
      const st = appState.students.find(s => s.id === appState.selectedStudentId) || null;

      const displaySub = getSubjectContextDisplay(sub);
      document.getElementById('baremeSubjectLabel').textContent =
        `${displaySub.shortName}${displaySub.officialWeightLabel ? ` — ${displaySub.officialWeightLabel}` : ''} (Étape ${appState.activeTerm})`;
      document.getElementById('baremeCurrentStudentName').textContent = st ? st.name : 'Sélectionner un nom';
      const pillsContainer = document.getElementById('baremeStudentPills');
      pillsContainer.innerHTML = '';
      appState.students.forEach(student => {
        const stuRec = subData.studentRecords[student.id];
        const stuRes = computeMajorityFromChecked(
          stuRec.baremeChecked,
          stuRec.baremeOverrideCode,
          BAREME_ECOLE_ROWS.length
        );
        const isSel = Boolean(st && student.id === st.id);
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.setAttribute('aria-pressed', String(isSel));
        btn.className = isSel
          ? 'px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-900 text-white shadow-xs flex items-center gap-1 cursor-pointer'
          : 'px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-1 cursor-pointer';
        btn.innerHTML = `
          <span>${escapeHtml(student.name)}</span>
          ${stuRes.hasFinalGrade
            ? `<span class="bareme-student-grade px-1.5 py-0.2 rounded border text-[10px] ${getBadgeColorClasses(stuRes.code)}">${stuRes.code}${stuRec.baremeOverrideCode ? '*' : ''}</span>`
            : stuRes.hasData
              ? `<span class="px-1.5 py-0.2 rounded text-[10px] bg-amber-100 text-amber-900">${stuRes.total}/${BAREME_ECOLE_ROWS.length}</span>`
              : ''}
        `;
        btn.addEventListener('click', () => {
          appState.selectedStudentId = student.id;
          renderBaremeView();
        });
        pillsContainer.appendChild(btn);
      });

      if (!st) {
        ['A', 'B', 'C', 'D', 'E'].forEach(fam => {
          const el = document.getElementById(`colCountBareme_${fam}`);
          if (el) el.textContent = '0';
        });
        document.getElementById('baremeMajorityExplanation').textContent = appState.students.length
          ? 'Sélectionner un nom ci-dessus pour remplir les repères.'
          : 'Ajoutez d’abord un élève dans la liste d’élèves.';
        document.getElementById('baremeFineGradeButtons').innerHTML = '';
        document.getElementById('baremeMatrixBody').innerHTML =
          '<tr><td colspan="6" class="p-6 text-center text-sm font-semibold text-slate-600 bg-slate-50">Sélectionner un nom ci-dessus pour afficher la grille de repères de l’élève.</td></tr>';
        return;
      }
      const rec = subData.studentRecords[st.id];
      const res = computeMajorityFromChecked(
        rec.baremeChecked,
        rec.baremeOverrideCode,
        BAREME_ECOLE_ROWS.length
      );
      ['A', 'B', 'C', 'D', 'E'].forEach(fam => {
        const el = document.getElementById(`colCountBareme_${fam}`);
        if (el) el.textContent = `${res.counts[fam]}`;
      });

      const expEl = document.getElementById('baremeMajorityExplanation');
      if (!res.hasData) {
        expEl.textContent = 'Aucun critère sélectionné.';
      } else if (!res.hasFinalGrade) {
        expEl.textContent = `Cote provisoire : ${res.code} (${res.pct}%)`;
      } else {
        expEl.textContent = rec.baremeOverrideCode ? '* Note ajustée manuellement.' : '';
      }

      const fineBtns = document.getElementById('baremeFineGradeButtons');
      fineBtns.innerHTML = '';
      GRADE_SCALE.forEach(g => {
        const isSelected = res.hasFinalGrade && res.code === g.code;
        const b = document.createElement('button');
        b.type = 'button';
        b.className = `px-1.5 py-1 rounded text-[11px] font-semibold border cursor-pointer ${getBadgeColorClasses(g.code)}${isSelected ? ' is-selected' : ''}`;
        b.textContent = `${g.code}`;
        b.title = `${g.code} (${g.pct}%)`;
        b.addEventListener('click', () => {
          if (rec.baremeOverrideCode === g.code) rec.baremeOverrideCode = null;
          else rec.baremeOverrideCode = g.code;
          notifyUpdate(`Jugement professionnel de ${st.name} : ${g.code} (${g.pct}%)`);
          renderBaremeView();
          renderGradebookView();
        });
        fineBtns.appendChild(b);
      });

      const tbody = document.getElementById('baremeMatrixBody');
      tbody.innerHTML = '';

      BAREME_ECOLE_ROWS.forEach(row => {
        const tr = document.createElement('tr');
        tr.className = 'border-b border-slate-200 align-top';

        const tdTitle = document.createElement('td');
        tdTitle.className = 'p-2 font-bold text-slate-900 bg-slate-50 border border-slate-200 break-words';
        tdTitle.textContent = row.title.replace(/ & /g, ' et ');
        tr.appendChild(tdTitle);

        ['A', 'B', 'C', 'D', 'E'].forEach(fam => {
          const td = document.createElement('td');
          td.className = 'p-1.5 border border-slate-200 space-y-1';
          const statements = row.cells[fam] || [];
          statements.forEach((stmtText, idx) => {
            const key = `${row.id}_${fam}_${idx}`;
            const isChecked = rec.baremeChecked.includes(key);
            const itemBtn = document.createElement('button');
            itemBtn.type = 'button';
            itemBtn.dataset.rubricKey = key;
            itemBtn.setAttribute('aria-pressed', String(isChecked));
            itemBtn.className = `rubric-stmt-btn p-1.5 rounded-lg border text-[11px] leading-snug transition cursor-pointer ${
              isChecked
                ? `stmt-checked-${fam}`
                : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
            }`;
            itemBtn.innerHTML = `
              <span aria-hidden="true" class="rubric-stmt-check mt-0.5 w-3.5 h-3.5 rounded-full flex-shrink-0 flex items-center justify-center border ${
                isChecked ? 'bg-slate-900 text-white border-slate-900' : 'border-slate-300 bg-white'
              } text-[9px] font-bold">${isChecked ? '✓' : ''}</span>
              <span class="rubric-stmt-text">${escapeHtml(stmtText)}</span>
            `;
            itemBtn.addEventListener('click', () => {
              const hadFocus = document.activeElement === itemBtn;
              rec.baremeChecked = toggleSingleChoiceInRow(rec.baremeChecked, row.id, key);
              rec.baremeOverrideCode = null;
              scheduleAppStateSave();
              renderBaremeView();
              renderGradebookView();
              if (hadFocus) restoreRubricFocus(tbody, key);
            });
            td.appendChild(itemBtn);
          });
          tr.appendChild(td);
        });

        tbody.appendChild(tr);
      });
    }

    // -------------------------------------------------------------------------
    // Éditeur de trace observable (Modes 1: Grille d’appréciation, 2: Grille pondérée MEQ)
    // -------------------------------------------------------------------------
