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

      document.getElementById('baremeSubjectLabel').textContent = `${sub.shortName} (Étape ${appState.activeTerm})`;
      document.getElementById('baremeCurrentStudentName').textContent = st ? st.name : 'Sélectionner un nom';
      const baremeAtm = document.getElementById('baremeSubjectAtmosphere');
      const baremeImg = STUDIO_ATMOSPHERE_IMAGES[sub.id] || sub.imageUrl;
      if (baremeAtm && baremeImg) baremeAtm.src = baremeImg;

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
          ? 'Sélectionner un nom ci-dessus pour remplir le barème.'
          : 'Ajoutez d’abord un élève dans la liste d’élèves.';
        document.getElementById('baremeFineGradeButtons').innerHTML = '';
        document.getElementById('baremeMatrixBody').innerHTML =
          '<tr><td colspan="6" class="p-6 text-center text-sm font-semibold text-slate-600 bg-slate-50">Sélectionner un nom ci-dessus pour afficher le barème de l’élève.</td></tr>';
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
          notifyUpdate(`Barème de ${st.name} : ${g.code} (${g.pct}%)`);
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
              <span class="rubric-stmt-text">${stmtText}</span>
            `;
            itemBtn.addEventListener('click', () => {
              const hadFocus = document.activeElement === itemBtn;
              rec.baremeChecked = toggleSingleChoiceInRow(rec.baremeChecked, row.id, key);
              rec.baremeOverrideCode = null;
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
    function isWeightedRubricAvailableForSubject(sub) {
      return Boolean(
        sub &&
        !sub.prescoOnly &&
        typeof WEIGHTED_RUBRIC_SUBJECT_IDS !== 'undefined' &&
        WEIGHTED_RUBRIC_SUBJECT_IDS.has(sub.id)
      );
    }

    function getEffectiveSessionObsMode(session, sub) {
      const raw = session && session.obsMode ? session.obsMode : 'portrait';
      if (raw === 'weighted' && isWeightedRubricAvailableForSubject(sub)) {
        return 'weighted';
      }
      return 'portrait';
    }

    function buildStudentObsOptions(session, sub, gradeLevel) {
      const effectiveMode = getEffectiveSessionObsMode(session, sub);
      return {
        obsMode: effectiveMode,
        criteriaWeights: (session && session.criteriaWeights && typeof session.criteriaWeights === 'object')
          ? session.criteriaWeights
          : null,
        subjectId: sub ? sub.id : '',
        cycle: getStudentCycle(gradeLevel) || 2
      };
    }

    function renderQuickObsView() {
      const sub = getCurrentSubjectConfig();
      const termData = getActiveTermData();
      const subData = termData.subjectData[sub.id];
      const session = subData.currentObsSession;
      const presentLevels = getPresentStudentLevels();
      const isMulti = presentLevels.length > 1;
      if (Array.isArray(session.targetLevels)) {
        session.targetLevels = session.targetLevels.filter(l => presentLevels.includes(l));
      } else {
        session.targetLevels = [];
      }

      const qoTargetBox = document.getElementById('qoTargetLevelsBox');
      if (qoTargetBox) {
        qoTargetBox.classList.toggle('hidden', !isMulti);
        qoTargetBox.innerHTML = '';
        if (isMulti) {
          const wrap = document.createElement('div');
          wrap.className = 'qo-target-wrap inline-flex items-center gap-1 px-2.5 py-1 rounded-xl border border-slate-200 bg-white shadow-2xs flex-wrap';
          const lbl = document.createElement('span');
          lbl.className = 'text-[11px] font-bold text-slate-700 mr-1';
          lbl.textContent = 'Niveaux visés :';
          wrap.appendChild(lbl);

          const isAll = !Array.isArray(session.targetLevels) || session.targetLevels.length === 0;
          const applyTargetLevels = (nextLevels) => {
            session.targetLevels = nextLevels;
            if (appState.selectedStudentId) {
              const curSt = appState.students.find(s => s.id === appState.selectedStudentId);
              if (curSt && !isAssignmentForStudent(session, curSt)) {
                appState.selectedStudentId = null;
              }
            }
            renderQuickObsView();
          };

          const allBtn = document.createElement('button');
          allBtn.type = 'button';
          allBtn.setAttribute('aria-pressed', String(isAll));
          allBtn.className = `qo-target-btn inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-bold transition cursor-pointer ${
            isAll
              ? 'is-active bg-indigo-600 border-indigo-600 text-white shadow-2xs'
              : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
          }`;
          allBtn.textContent = 'Tous';
          allBtn.addEventListener('click', () => applyTargetLevels([]));
          wrap.appendChild(allBtn);

          presentLevels.forEach(lvl => {
            const isSelected = !isAll && session.targetLevels.includes(lvl);
            const lvlBtn = document.createElement('button');
            lvlBtn.type = 'button';
            lvlBtn.setAttribute('aria-pressed', String(isSelected));
            lvlBtn.className = `qo-target-btn inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-bold transition cursor-pointer ${
              isSelected
                ? 'is-active bg-indigo-600 border-indigo-600 text-white shadow-2xs'
                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
            }`;
            lvlBtn.textContent = GRADE_LEVEL_LABELS[lvl] || lvl;
            lvlBtn.addEventListener('click', () => {
              // Switcher directement au niveau cliqué (ex. 5e -> 6e passe bien à 6e, jamais à « Tous »)
              if (isSelected && session.targetLevels.length === 1) {
                applyTargetLevels([]);
              } else {
                applyTargetLevels([lvl]);
              }
            });
            wrap.appendChild(lvlBtn);
          });
          qoTargetBox.appendChild(wrap);
        }
      }

      const targetedStudents = appState.students.filter(student => isAssignmentForStudent(session, student));
      let st = appState.students.find(s => s.id === appState.selectedStudentId) || null;
      if (st && !isAssignmentForStudent(session, st)) {
        appState.selectedStudentId = null;
        st = null;
      }
      const draft = st ? session.studentDrafts[st.id] : null;
      if (st && draft) {
        draft.gradeLevel = getObservationDraftGradeLevel(draft, st, session);
      }
      const cycle = st && draft ? getStudentCycle(draft.gradeLevel) : null;
      const criteria = st && draft ? getObservationCriteria(sub, draft.gradeLevel, session) : [];
      document.getElementById('prescoRubricNotice').classList.toggle('hidden', !sub.prescoOnly);
      document.getElementById('firstCycleExplorationNotice').classList.toggle('hidden',
        cycle !== 1 || !['sciences_global', 'univers_social'].includes(sub.id));

      // Sélecteur de format d'outil (Modes 1, 2 et 3)
      const canUseWeighted = isWeightedRubricAvailableForSubject(sub);
      const effectiveObsMode = getEffectiveSessionObsMode(session, sub);
      session.obsMode = effectiveObsMode;

      const repStudent = st || targetedStudents.find(s => getStudentCycle(getEffectiveGradeLevel(s, sub))) || targetedStudents[0] || null;
      const repGradeLevel = st && draft && draft.gradeLevel
        ? draft.gradeLevel
        : repStudent
          ? getEffectiveGradeLevel(repStudent, sub)
          : '4';
      const repCycle = getStudentCycle(repGradeLevel) || 2;
      const repCriteria = criteria.length ? criteria : getObservationCriteria(sub, repGradeLevel, session);
      const repScoredCriteria = getScoredObservableCriteria(repCriteria);
      const activeWeightsMap = canUseWeighted
        ? getEffectiveCriteriaWeights(sub.id, repCycle, repScoredCriteria, session.criteriaWeights)
        : {};
      if (effectiveObsMode === 'weighted' && !session.criteriaWeights) {
        session.criteriaWeights = { ...activeWeightsMap };
      }

      const toolModeBar = document.getElementById('qoToolModeBar');
      const modeSegment = document.getElementById('qoModeSegment');
      const modeSubtitle = document.getElementById('qoModeSubtitle');
      const inspirationCaption = document.getElementById('qoInspirationCaption');
      if (toolModeBar) toolModeBar.classList.toggle('hidden', !canUseWeighted);
      if (modeSegment) {
        modeSegment.innerHTML = '';
        const modeOptions = [
          {
            id: 'portrait',
            label: 'Grille d’appréciation',
            hint: 'Portrait global par tendance centrale (A à E) sur les critères du cycle'
          },
          ...(canUseWeighted ? [{
            id: 'weighted',
            label: 'Grille pondérée (MEQ)',
            hint: 'Pondération analytique officielle par critère (/100) selon les cadres et épreuves MEQ'
          }] : [])
        ];
        modeOptions.forEach(opt => {
          const isAct = effectiveObsMode === opt.id;
          const mBtn = document.createElement('button');
          mBtn.type = 'button';
          mBtn.setAttribute('aria-pressed', String(isAct));
          mBtn.title = opt.hint;
          mBtn.className = isAct
            ? 'px-2.5 py-1 rounded-md text-xs font-bold bg-indigo-600 text-white shadow-2xs transition cursor-pointer'
            : 'px-2.5 py-1 rounded-md text-xs font-semibold text-slate-700 hover:bg-slate-100 transition cursor-pointer';
          mBtn.textContent = opt.label;
          mBtn.addEventListener('click', () => {
            if (session.obsMode === opt.id) return;
            session.obsMode = opt.id;
            if (opt.id === 'weighted' && !session.criteriaWeights) {
              session.criteriaWeights = getEffectiveCriteriaWeights(sub.id, repCycle, repScoredCriteria, null);
              session.usingPersoPreset = false;
            }
            renderQuickObsView();
          });
          modeSegment.appendChild(mBtn);
        });
      }
      if (modeSubtitle) {
        modeSubtitle.textContent = effectiveObsMode === 'weighted'
          ? 'Calcul analytique pondéré (/100) inspiré des grilles ministérielles MEQ.'
          : 'Portrait descriptif par critère (1 choix par rangée).';
      }
      if (inspirationCaption) {
        inspirationCaption.textContent = effectiveObsMode === 'weighted'
          ? 'Grille analytique pondérée inspirée des barèmes officiels du MEQ pour cette compétence.'
          : 'Grille locale inspirée des cadres MEQ conçue pour évaluer les apprentissages selon les attentes et le contexte.';
      }

      // Bandeau de configuration des pondérations MEQ & Variante personnelle (Mode 2 uniquement)
      const weightPresetBar = document.getElementById('qoWeightPresetBar');
      if (weightPresetBar) {
        const showWeightBar = effectiveObsMode === 'weighted' && canUseWeighted && repScoredCriteria.length > 0;
        weightPresetBar.classList.toggle('hidden', !showWeightBar);
        weightPresetBar.innerHTML = '';
        if (showWeightBar) {
          const presets = getOfficialWeightPresets(sub.id, repCycle, repScoredCriteria);
          const savedPerso = typeof getCustomWeightedPreset === 'function'
            ? getCustomWeightedPreset(sub.id, repCycle, repScoredCriteria)
            : null;
          const matchingOfficial = presets.find(preset => repScoredCriteria.every(c =>
            Math.abs(Number(activeWeightsMap[c.id] || 0) - Number(preset.weights[c.id] || 0)) < 0.05
          ));
          const isPersoActive = Boolean(session.usingPersoPreset) || !matchingOfficial;

          const topRow = document.createElement('div');
          topRow.className = 'flex flex-wrap items-center justify-between gap-2';

          const presetLeft = document.createElement('div');
          presetLeft.className = 'flex flex-wrap items-center gap-1.5';
          const presetTitle = document.createElement('span');
          presetTitle.className = 'text-[11px] font-bold uppercase tracking-wider text-slate-700 mr-1';
          presetTitle.textContent = 'Barèmes :';
          presetLeft.appendChild(presetTitle);

          presets.forEach(preset => {
            const isMatchingPreset = !isPersoActive && matchingOfficial && matchingOfficial.id === preset.id;
            const pBtn = document.createElement('button');
            pBtn.type = 'button';
            pBtn.setAttribute('aria-pressed', String(isMatchingPreset));
            pBtn.title = preset.hint || preset.label;
            pBtn.className = isMatchingPreset
              ? 'px-2.5 py-1 rounded-lg text-[11px] font-bold bg-indigo-600 text-white shadow-2xs cursor-pointer transition'
              : 'px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 cursor-pointer transition';
            pBtn.textContent = preset.label;
            pBtn.addEventListener('click', () => {
              session.usingPersoPreset = false;
              session.criteriaWeights = { ...preset.weights };
              renderQuickObsView();
            });
            presetLeft.appendChild(pBtn);
          });

          const persoBtn = document.createElement('button');
          persoBtn.type = 'button';
          persoBtn.id = 'btnQoPersoPreset';
          persoBtn.setAttribute('aria-pressed', String(isPersoActive));
          const persoNumbers = savedPerso
            ? ` (${repScoredCriteria.map(c => savedPerso[c.id]).join(' / ')})`
            : '';
          persoBtn.textContent = `Variante personnelle${persoNumbers}`;
          persoBtn.title = savedPerso
            ? 'Appliquer votre variante personnelle sauvegardée ou ajuster vos pourcentages'
            : 'Entrer vos propres pourcentages pour cette compétence';
          persoBtn.className = isPersoActive
            ? 'px-2.5 py-1 rounded-lg text-[11px] font-bold bg-indigo-600 text-white shadow-2xs cursor-pointer transition'
            : 'px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 cursor-pointer transition';
          persoBtn.addEventListener('click', () => {
            session.usingPersoPreset = true;
            if (savedPerso) {
              session.criteriaWeights = { ...savedPerso };
            } else {
              session.criteriaWeights = { ...activeWeightsMap };
            }
            renderQuickObsView();
            if (!savedPerso) {
              const firstInp = weightPresetBar.querySelector('input[data-qo-crit-weight]');
              if (firstInp) {
                firstInp.focus();
                firstInp.select();
              }
            }
          });
          presetLeft.appendChild(persoBtn);
          topRow.appendChild(presetLeft);

          const totalWeightVal = Math.round(repScoredCriteria.reduce((acc, c) => acc + Number(activeWeightsMap[c.id] || 0), 0));
          const isTotal100 = totalWeightVal === 100;
          const totalWrap = document.createElement('div');
          totalWrap.className = 'flex items-center gap-2';
          const totalBadge = document.createElement('span');
          totalBadge.id = 'qoWeightTotalBadge';
          totalBadge.className = isTotal100
            ? 'qo-weight-total is-ok is-valid px-2 py-0.5 rounded-md text-[11px] font-extrabold border'
            : 'qo-weight-total is-warn is-invalid px-2 py-0.5 rounded-md text-[11px] font-extrabold border';
          totalBadge.textContent = `Total : ${totalWeightVal} %`;
          totalWrap.appendChild(totalBadge);
          if (!isTotal100 && presets.length > 0) {
            const resetBtn = document.createElement('button');
            resetBtn.type = 'button';
            resetBtn.className = 'text-[11px] font-bold text-indigo-700 hover:underline cursor-pointer';
            resetBtn.textContent = 'Rétablir 100 % (MEQ)';
            resetBtn.addEventListener('click', () => {
              session.usingPersoPreset = false;
              session.criteriaWeights = { ...presets[0].weights };
              renderQuickObsView();
            });
            totalWrap.appendChild(resetBtn);
          }
          topRow.appendChild(totalWrap);
          weightPresetBar.appendChild(topRow);

          // Deuxième ligne : saisie personnelle des pourcentages + icône de sauvegarde
          const critRow = document.createElement('div');
          critRow.className = 'flex flex-wrap items-center gap-2 pt-1.5 border-t border-slate-200/80';
          const inputRefs = [];
          const readLiveWeights = () => {
            const nextMap = {};
            let sum = 0;
            inputRefs.forEach(({ crit, inp }) => {
              const rawNum = Number(String(inp.value || '').replace(',', '.'));
              const val = Number.isFinite(rawNum) && rawNum >= 0 && rawNum <= 100
                ? Math.round(rawNum)
                : Math.round(Number(activeWeightsMap[crit.id] || 0));
              nextMap[crit.id] = val;
              sum += val;
            });
            return { nextMap, sum: Math.round(sum) };
          };

          repScoredCriteria.forEach(crit => {
            const shortCritTitle = crit.title.replace(/^\d+\.\s*/, '').split('(')[0].trim();
            const itemWrap = document.createElement('label');
            itemWrap.className = 'qo-crit-weight-item inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white border border-slate-200 text-[11px] font-semibold text-slate-700';
            const spanLbl = document.createElement('span');
            spanLbl.className = 'truncate max-w-[165px]';
            spanLbl.textContent = shortCritTitle;
            spanLbl.title = crit.title;
            const inp = document.createElement('input');
            inp.type = 'number';
            inp.min = '0';
            inp.max = '100';
            inp.step = '1';
            inp.setAttribute('data-qo-crit-weight', crit.id);
            inp.value = String(Math.round(Number(activeWeightsMap[crit.id] ?? 0)));
            inp.className = 'w-12 px-1 py-0.5 text-center rounded border border-slate-300 text-[11px] font-extrabold text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500';
            inp.addEventListener('input', () => {
              const { sum } = readLiveWeights();
              const okNow = sum === 100;
              totalBadge.textContent = `Total : ${sum} %`;
              totalBadge.className = okNow
                ? 'qo-weight-total is-ok is-valid px-2 py-0.5 rounded-md text-[11px] font-extrabold border'
                : 'qo-weight-total is-warn is-invalid px-2 py-0.5 rounded-md text-[11px] font-extrabold border';
            });
            inp.addEventListener('change', () => {
              const num = Number(String(inp.value || '').replace(',', '.'));
              if (!Number.isFinite(num) || num < 0 || num > 100) {
                inp.value = String(Math.round(Number(activeWeightsMap[crit.id] ?? 0)));
                return;
              }
              session.usingPersoPreset = true;
              session.criteriaWeights = { ...activeWeightsMap, [crit.id]: Math.round(num) };
              renderQuickObsView();
            });
            const pctSign = document.createElement('span');
            pctSign.className = 'text-[10px] font-bold text-slate-500';
            pctSign.textContent = '%';
            itemWrap.append(spanLbl, inp, pctSign);
            critRow.appendChild(itemWrap);
            inputRefs.push({ crit, inp });
          });

          const savePersoBtn = document.createElement('button');
          savePersoBtn.type = 'button';
          savePersoBtn.id = 'btnQoSavePersoPreset';
          savePersoBtn.title = 'Sauvegarder ces pourcentages dans « Variante personnelle »';
          savePersoBtn.setAttribute('aria-label', 'Sauvegarder ma variante personnelle');
          savePersoBtn.className = 'qo-save-perso-btn inline-flex items-center justify-center w-8 h-8 rounded-lg border border-slate-300 bg-white hover:bg-indigo-50 text-slate-700 cursor-pointer transition';
          savePersoBtn.innerHTML = '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>';
          savePersoBtn.addEventListener('click', () => {
            const { nextMap, sum } = readLiveWeights();
            if (sum !== 100) {
              showToast(`Le total actuel est de ${sum} %. Ajustez vos pourcentages pour atteindre 100 % avant de sauvegarder.`);
              return;
            }
            session.usingPersoPreset = true;
            session.criteriaWeights = { ...nextMap };
            if (typeof saveCustomWeightedPreset === 'function') {
              saveCustomWeightedPreset(sub.id, repCycle, nextMap, repScoredCriteria);
            }
            showToast('Variante personnelle sauvegardée !');
            renderQuickObsView();
          });
          critRow.appendChild(savePersoBtn);

          weightPresetBar.appendChild(critRow);
        }
      }

      document.getElementById('qoSubjectBadge').textContent = `${sub.fullName} • Étape ${appState.activeTerm}`;
      const isModSub = st ? isSubjectModifiedForStudent(st, sub) : false;
      document.getElementById('sgCurrentStudentName').textContent = st
        ? `${st.name} — ${GRADE_LEVEL_LABELS[draft.gradeLevel] || 'niveau à choisir'}${cycle ? ` (${CYCLE_LABELS[cycle]})` : ''}${isModSub ? ` [Bulletin modifié · inscrit en ${GRADE_LEVEL_LABELS[st.gradeLevel] || '—'}]` : ''}`
        : 'Sélectionner un nom';
      document.getElementById('qoBottomStudentName').textContent = st ? st.name : 'Sélectionner un nom';
      const qoAtm = document.getElementById('qoSubjectAtmosphere');
      const qoImg = STUDIO_ATMOSPHERE_IMAGES[sub.id] || sub.imageUrl;
      if (qoAtm && qoImg) qoAtm.src = qoImg;
      const modeBadge = document.getElementById('qoEditModeBadge');
      const topCommitLbl = document.getElementById('btnCommitTopLabel');

      if (session.editingAssignmentId) {
        if (modeBadge) {
          modeBadge.classList.remove('hidden');
          modeBadge.className = 'px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300';
          modeBadge.textContent = `Mode modification : ${session.title || 'Trace observable'}`;
        }
        if (topCommitLbl) topCommitLbl.textContent = 'Enregistrer au carnet';
      } else {
        if (modeBadge) {
          modeBadge.classList.add('hidden');
          modeBadge.textContent = '';
        }
        if (topCommitLbl) topCommitLbl.textContent = 'Enregistrer au carnet';
      }

      const titleInput = document.getElementById('qoSessionTitleInput');
      if (titleInput && document.activeElement !== titleInput) {
        titleInput.value = session.title || '';
      }

      const linkBox = document.getElementById('qoLinkedPartsBox');
      const linkList = document.getElementById('qoLinkedParts');
      const editingAsg = session.editingAssignmentId ? subData.assignments.find(a => a.id === session.editingAssignmentId) : null;
      const siblings = sub.group && !(editingAsg && editingAsg.linkId)
        ? SUBJECTS_CONFIG.filter(s => s.group === sub.group && s.id !== sub.id) : [];
      linkBox.classList.toggle('hidden', !siblings.length);
      linkList.innerHTML = '';
      session.linkTargets = (session.linkTargets || []).filter(id => siblings.some(s => s.id === id));
      siblings.forEach(s => {
        const label = document.createElement('label');
        label.className = 'inline-flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer';
        const cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.checked = session.linkTargets.includes(s.id);
        cb.addEventListener('change', () => {
          session.linkTargets = cb.checked ? [...session.linkTargets, s.id] : session.linkTargets.filter(id => id !== s.id);
        });
        label.append(cb, document.createTextNode(s.partLabel));
        linkList.appendChild(label);
      });
      document.getElementById('qoLinkedHint').textContent = sub.singleResult
        ? 'Résultat unique au bulletin : cette évaluation compte une seule fois (pondération fixée ici).'
        : 'La cote est copiée dans l’autre compétence (pondération indépendante).';

      let evaluatedCount = 0;
      let partialCount = 0;
      let feedbackCount = 0;
      targetedStudents.forEach(student => {
        const d = session.studentDrafts[student.id];
        const stuLvl = getObservationDraftGradeLevel(d, student, session);
        const studentCriteria = getObservationCriteria(sub, stuLvl, session);
        const r = computeObservableResult(d.checked, d.overrideCode, studentCriteria, d.notEvaluated, buildStudentObsOptions(session, sub, stuLvl));
        if (r.hasFinalGrade || r.isNotEvaluated) evaluatedCount++;
        else if (r.hasData) partialCount++;
        else if (r.hasEvidence) feedbackCount++;
      });
      const counterEl = document.getElementById('qoEvaluatedCounter');
      if (counterEl) {
        counterEl.textContent = `${evaluatedCount}/${targetedStudents.length} coté(s)${partialCount ? ` · ${partialCount} en cours` : ''}`;
      }

      // 1. Top Student Selector Pills
      const stuGrid = document.getElementById('qoStudentGrid');
      stuGrid.innerHTML = '';
      targetedStudents.forEach(student => {
        const d = session.studentDrafts[student.id];
        const stuLvl = getObservationDraftGradeLevel(d, student, session);
        const studentCriteria = getObservationCriteria(sub, stuLvl, session);
        const stuRes = computeObservableResult(d.checked, d.overrideCode, studentCriteria, d.notEvaluated, buildStudentObsOptions(session, sub, stuLvl));
        const isSel = Boolean(st && student.id === st.id);
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = isSel
          ? 'w-full px-2.5 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 text-white shadow-xs transition cursor-pointer flex items-center justify-between gap-1 truncate'
          : 'w-full px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 transition cursor-pointer flex items-center justify-between gap-1 truncate';
        const shortLvl = isMulti && student.gradeLevel ? ` <span class="opacity-70 text-[10px]">(${escapeHtml(formatShortLevelTag(student.gradeLevel))})</span>` : '';
        btn.innerHTML = `
          <span class="truncate">${escapeHtml(student.name)}${shortLvl}</span>
          ${stuRes.isNotEvaluated
            ? `<span class="px-1.5 py-0.2 rounded text-[10px] bg-slate-200 text-slate-600 font-bold">N/A</span>`
            : stuRes.hasFinalGrade
            ? `<span class="px-1.5 py-0.2 rounded border text-[10px] font-extrabold ${getBadgeColorClasses(stuRes.code)}">${stuRes.code} (${stuRes.pct}%)${d.overrideCode ? '<span class="adj-star" title="Note ajustée manuellement">*</span>' : ''}</span>`
            : stuRes.hasData
              ? `<span class="px-1.5 py-0.2 rounded text-[10px] bg-amber-100 text-amber-900 font-bold">${stuRes.total}/${getScoredObservableCriteria(studentCriteria).length}</span>`
            : stuRes.hasEvidence
              ? `<span class="px-1.5 py-0.2 rounded text-[10px] bg-indigo-100 text-indigo-800 font-bold">Obs.</span>`
              : `<span class="px-1.5 py-0.2 rounded text-[10px] bg-slate-200 text-slate-500 font-bold">-</span>`
          }
        `;
        btn.addEventListener('click', () => {
          appState.selectedStudentId = student.id;
          renderQuickObsView();
        });
        stuGrid.appendChild(btn);
      });

      const liveBadgeEmpty = document.getElementById('qoSideLiveBadge');
      const resetOverrideBtnEmpty = document.getElementById('btnQoResetOverride');
      if (liveBadgeEmpty) {
        liveBadgeEmpty.classList.add('hidden');
        liveBadgeEmpty.textContent = '';
      }
      if (resetOverrideBtnEmpty) resetOverrideBtnEmpty.classList.add('hidden');

      if (!st) {
        document.getElementById('sgMajorityExplanation').textContent = 'Sélectionner un nom ci-dessus pour remplir la grille d’évaluation.';
        document.getElementById('sgMatrixBody').innerHTML =
          '<tr><td colspan="6" class="p-6 text-center text-sm font-semibold text-slate-600 bg-slate-50">Sélectionner un nom ci-dessus pour afficher et remplir la grille d’évaluation de l’élève.</td></tr>';
        document.getElementById('qoGradePills').innerHTML =
          '<div class="col-span-full text-xs text-slate-500 py-1">Sélectionner un nom pour ajuster la note.</div>';
        const selCountElEmpty = document.getElementById('qoSelectedTagsCount');
        if (selCountElEmpty) selCountElEmpty.textContent = '0 sélectionné(s)';
        const catTabsEmpty = document.getElementById('qoCategoryTabs');
        if (catTabsEmpty) catTabsEmpty.innerHTML = '';
        document.getElementById('qoQuickTags').innerHTML =
          '<div class="text-xs text-slate-500">Sélectionner un nom pour cocher des observations.</div>';
        const activeStripEmpty = document.getElementById('qoActiveStudentTagsStrip');
        if (activeStripEmpty) {
          activeStripEmpty.innerHTML = '';
          activeStripEmpty.classList.add('hidden');
          activeStripEmpty.classList.remove('flex');
        }
        const commInputEmpty = document.getElementById('qoCommentInput');
        if (commInputEmpty) {
          commInputEmpty.value = '';
          commInputEmpty.disabled = true;
          commInputEmpty.placeholder = 'Sélectionner un nom pour noter vos observations...';
        }
        return;
      }

      // 2. Compute the current student's live mark from the selected rubric statements
      const studentObsOptions = buildStudentObsOptions(session, sub, draft.gradeLevel);
      const res = computeObservableResult(draft.checked, draft.overrideCode, criteria, draft.notEvaluated, studentObsOptions);
      const scoredCriteria = getScoredObservableCriteria(criteria);
      const scoredCriteriaCount = scoredCriteria.length;
      const studentWeightsMap = effectiveObsMode === 'weighted'
        ? getEffectiveCriteriaWeights(sub.id, cycle || 2, scoredCriteria, session.criteriaWeights)
        : {};
      const expEl = document.getElementById('sgMajorityExplanation');

      if (liveBadgeEmpty) {
        if (res.isNotEvaluated) {
          liveBadgeEmpty.className = 'shrink-0 px-2 py-0.5 rounded-md border text-[11px] font-extrabold whitespace-nowrap bg-slate-100 text-slate-600 border-slate-200';
          liveBadgeEmpty.textContent = 'N/A';
        } else if (res.hasFinalGrade) {
          liveBadgeEmpty.className = `shrink-0 px-2 py-0.5 rounded-md border text-[11px] font-extrabold whitespace-nowrap ${getBadgeColorClasses(res.code)}`;
          liveBadgeEmpty.textContent = `${res.code} (${res.pct}%)${draft.overrideCode ? '*' : ''}`;
        } else if (res.hasData) {
          liveBadgeEmpty.className = `shrink-0 px-2 py-0.5 rounded-md border text-[11px] font-extrabold whitespace-nowrap ${getBadgeColorClasses(res.code)}`;
          liveBadgeEmpty.textContent = `${res.total}/${scoredCriteriaCount} · ${res.code}`;
        } else {
          liveBadgeEmpty.classList.add('hidden');
          liveBadgeEmpty.textContent = '';
        }
      }
      if (resetOverrideBtnEmpty) {
        resetOverrideBtnEmpty.classList.toggle('hidden', !res.isOverride);
        resetOverrideBtnEmpty.onclick = () => {
          draft.overrideCode = null;
          renderQuickObsView();
        };
      }

      if (res.isNotEvaluated) {
        expEl.textContent = 'N/A — élève non évalué pour cette trace. Vous pouvez encore sélectionner des critères ou une cote.';
      } else if (res.hasData) {
        const weightedSummaryHtml = (effectiveObsMode === 'weighted' && res.isWeighted)
          ? `<span class="mr-1.5 text-indigo-300">Score analytique : <strong>${res.earnedPointsTotal} / ${res.totalWeightSum} pts</strong> (${res.rawWeightedPct} %) ·</span>`
          : '';
        expEl.innerHTML = `
          ${weightedSummaryHtml}<strong>${res.total} / ${scoredCriteriaCount} critère(s) coté(s)</strong>
          → ${res.hasFinalGrade ? 'Cote finale :' : 'Cote provisoire :'}
          <span class="px-2 py-0.5 rounded border ${getBadgeColorClasses(res.code)} font-extrabold">${res.code} (${res.pct}%)${draft.overrideCode ? '*' : ''}</span>
          ${draft.overrideCode ? '<span class="adj-star">* note ajustée manuellement</span>' : ''}
        `;
      } else {
        expEl.textContent = res.hasEvidence
          ? 'Observation consignée pour rétroaction; elle ne contribue pas à la cote.'
          : cycle && !criteria.length
            ? CYCLE_RUBRIC_UNAVAILABLE_MESSAGES[sub.id] || 'Aucun critère n’est disponible pour ce niveau.'
            : cycle
              ? ''
              : 'Choisissez le niveau de cet élève dans sa fiche avant de remplir sa grille.';
      }

      // 3A. Render cycle-adapted rubric table (Modes 1 & 2)
      const tbody = document.getElementById('sgMatrixBody');
      tbody.innerHTML = '';
      if (!criteria.length) {
        const tr = document.createElement('tr');
        const td = document.createElement('td');
        td.colSpan = 6;
        td.className = 'qo-unavailable-cell p-6 text-center text-sm text-amber-900 bg-amber-50';
        td.textContent = cycle
          ? CYCLE_RUBRIC_UNAVAILABLE_MESSAGES[sub.id] || 'Aucun critère n’est disponible pour ce niveau.'
          : 'Choisissez le niveau de cet élève dans la liste d’élèves pour afficher ses repères de cycle.';
        tr.appendChild(td);
        tbody.appendChild(tr);
      }

      const familyPointRatios = { A: 1.0, B: 0.8, C: 0.6, D: 0.4, E: 0.2 };

      criteria.forEach(crit => {
        const tr = document.createElement('tr');
        tr.className = crit.formativeOnly
          ? 'qo-formative-row border-b border-amber-200 bg-amber-50/40 align-top'
          : 'border-b border-slate-200 align-top';

        const tdTitle = document.createElement('td');
        tdTitle.className = crit.formativeOnly
          ? 'qo-formative-title p-2 font-bold text-amber-950 bg-amber-50/90 border border-amber-200 break-words'
          : 'qo-crit-title p-2 font-bold text-slate-900 bg-slate-50 border border-slate-200 break-words';
        const titleText = document.createElement('div');
        const isLocalFormative = LOCAL_FORMATIVE_CRITERIA.has(crit.id);
        titleText.textContent = crit.title.replace(/^\d+\.\s*/, '');
        if (isLocalFormative) titleText.textContent = titleText.textContent.replace(/\s*\(\*\)/, '');
        tdTitle.appendChild(titleText);

        const badgeWrap = document.createElement('div');
        badgeWrap.className = 'mt-1 flex flex-wrap items-center gap-1';
        const roleBadge = document.createElement('span');
        roleBadge.className = crit.formativeOnly
          ? 'qo-badge-formative inline-block max-w-full px-1.5 py-0.5 rounded text-[9px] leading-tight font-bold bg-amber-100 text-amber-900 border border-amber-300'
          : 'qo-badge-scored inline-block max-w-full px-1.5 py-0.5 rounded text-[9px] leading-tight font-semibold bg-indigo-50 text-indigo-800 border border-indigo-200';
        roleBadge.textContent = crit.formativeOnly
          ? (isLocalFormative ? 'Repère local • Non coté' : 'Formatif • Non coté')
          : 'Critère coté';
        badgeWrap.appendChild(roleBadge);

        const critWeight = (!crit.formativeOnly && effectiveObsMode === 'weighted')
          ? Number(studentWeightsMap[crit.id] ?? 0)
          : null;
        if (critWeight !== null && critWeight > 0) {
          const wBadge = document.createElement('span');
          wBadge.className = 'inline-block px-1.5 py-0.5 rounded text-[9px] leading-tight font-extrabold bg-indigo-600 text-white';
          const earnedPts = (res.earnedPointsMap && res.earnedPointsMap[crit.id] !== undefined)
            ? `${res.earnedPointsMap[crit.id]} / ${critWeight} pts`
            : `Pond. ${critWeight} %`;
          wBadge.textContent = earnedPts;
          badgeWrap.appendChild(wBadge);
        }
        tdTitle.appendChild(badgeWrap);
        tr.appendChild(tdTitle);

        ['A', 'B', 'C', 'D', 'E'].forEach(fam => {
          const td = document.createElement('td');
          td.className = 'p-1.5 border border-slate-200 space-y-1';
          const statements = crit.cells[fam] || [];
          const cellPts = (critWeight !== null && critWeight > 0)
            ? Math.round(critWeight * familyPointRatios[fam] * 10) / 10
            : null;
          statements.forEach((stmtText, idx) => {
            const key = `${crit.id}_${fam}_${idx}`;
            const isChecked = draft.checked.includes(key);
            const itemBtn = document.createElement('button');
            itemBtn.type = 'button';
            itemBtn.dataset.rubricKey = key;
            itemBtn.setAttribute('aria-pressed', String(isChecked));
            itemBtn.className = `rubric-stmt-btn${cellPts !== null ? ' is-weighted' : ''} p-1.5 rounded-lg border text-[11px] leading-snug transition cursor-pointer ${
              isChecked
                ? `stmt-checked-${fam}`
                : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
            }`;
            if (cellPts !== null) {
              itemBtn.innerHTML = `
                <span class="flex items-center justify-between gap-1.5 w-full">
                  <span aria-hidden="true" class="rubric-stmt-check w-3.5 h-3.5 rounded-full flex-shrink-0 flex items-center justify-center border ${
                    isChecked ? 'bg-slate-900 text-white border-slate-900' : 'border-slate-300 bg-white'
                  } text-[9px] font-bold">${isChecked ? '✓' : ''}</span>
                  <span class="text-[9.5px] font-extrabold ${isChecked ? 'opacity-95' : 'text-slate-500'} shrink-0 tabular-nums leading-none">${cellPts} pts</span>
                </span>
                <span class="rubric-stmt-text w-full">${stmtText}</span>
              `;
            } else {
              itemBtn.innerHTML = `
                <span aria-hidden="true" class="rubric-stmt-check mt-0.5 w-3.5 h-3.5 rounded-full flex-shrink-0 flex items-center justify-center border ${
                  isChecked ? 'bg-slate-900 text-white border-slate-900' : 'border-slate-300 bg-white'
                } text-[9px] font-bold">${isChecked ? '✓' : ''}</span>
                <span class="rubric-stmt-text flex-1">${stmtText}</span>
              `;
            }
            itemBtn.addEventListener('click', () => {
              const hadFocus = document.activeElement === itemBtn;
              draft.notEvaluated = false;
              draft.checked = toggleSingleChoiceInRow(draft.checked, crit.id, key);
              draft.overrideCode = null;
              renderQuickObsView();
              if (hadFocus) restoreRubricFocus(tbody, key);
            });
            td.appendChild(itemBtn);
          });
          tr.appendChild(td);
        });

        tbody.appendChild(tr);
      });

      // 4. Cote de la trace observable (Matrice hiérarchique 3×4 A+..D- et rangée E)
      const gradePills = document.getElementById('qoGradePills');
      gradePills.innerHTML = '';
      GRADE_SCALE.forEach(g => {
        const isSel = res.isOverride && res.code === g.code;
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.disabled = !scoredCriteriaCount;
        btn.className = isSel
          ? 'qo-grade-btn grade-pill-compact grade-pill-selected cursor-pointer'
          : `qo-grade-btn grade-pill-compact font-bold border cursor-pointer ${getBadgeColorClasses(g.code)} ${scoredCriteriaCount ? '' : 'opacity-50 cursor-not-allowed'}`;
        if (g.code === 'E') {
          btn.classList.add('qo-grade-e');
          btn.innerHTML = `<span>E · ${g.pct} %</span><span class="text-[9px] font-medium opacity-85">Sous le seuil</span>`;
        } else {
          btn.innerHTML = `<span class="text-[11px] font-extrabold leading-none">${g.code}</span><span class="text-[9px] font-semibold opacity-80 leading-none mt-0.5">${g.pct}%</span>`;
        }
        if (res.isOverride && !isSel) btn.classList.add('grade-pill-dim');
        btn.title = scoredCriteriaCount
          ? `${g.code} (${g.pct}%) — ajuster la note`
          : CYCLE_RUBRIC_UNAVAILABLE_MESSAGES[sub.id] || 'Aucun critère coté n’est disponible pour ce niveau.';
        btn.addEventListener('click', () => {
          if (!scoredCriteriaCount) return;
          draft.notEvaluated = false;
          if (draft.overrideCode === g.code) {
            draft.overrideCode = null;
          } else {
            draft.overrideCode = g.code;
          }
          renderQuickObsView();
        });
        gradePills.appendChild(btn);
      });

      // 5. Categorized PIA Quick Tags for current student
      const categories = appState.tagCategories || PIA_TAG_CATEGORIES;
      if (!appState.activeTagCategoryId) appState.activeTagCategoryId = categories[0].id;
      const activeCat = categories.find(c => c.id === appState.activeTagCategoryId) || categories[0];

      const catTabsEl = document.getElementById('qoCategoryTabs');
      if (catTabsEl) {
        catTabsEl.innerHTML = '';
        categories.forEach(cat => {
          const countInCat = cat.tags.filter(t => draft.tags.includes(t)).length;
          const isAct = cat.id === activeCat.id;
          const cBtn = document.createElement('button');
          cBtn.type = 'button';
          cBtn.title = cat.label;
          cBtn.className = isAct
            ? 'px-2 py-1.5 rounded-lg text-[10.5px] leading-tight text-left font-bold bg-slate-900 text-white shadow-2xs flex items-center justify-between gap-1 cursor-pointer'
            : 'px-2 py-1.5 rounded-lg text-[10.5px] leading-tight text-left font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-between gap-1 cursor-pointer';
          cBtn.innerHTML = `
            <span class="line-clamp-2">${escapeHtml(cat.label.replace(/ & /g, ' et '))}</span>
            ${countInCat > 0 ? `<span class="shrink-0 px-1.5 py-0.2 rounded-full text-[9.5px] bg-indigo-500 text-white font-extrabold">${countInCat}</span>` : ''}
          `;
          cBtn.addEventListener('click', () => {
            appState.activeTagCategoryId = cat.id;
            renderQuickObsView();
          });
          catTabsEl.appendChild(cBtn);
        });
      }

      const selCountEl = document.getElementById('qoSelectedTagsCount');
      if (selCountEl) {
        selCountEl.textContent = `${draft.tags.length} sélectionné(s)`;
      }

      const tagsContainer = document.getElementById('qoQuickTags');
      tagsContainer.innerHTML = '';
      activeCat.tags.forEach(tag => {
        const isSel = draft.tags.includes(tag);
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = isSel
          ? 'px-2 py-1 rounded-lg text-[11px] leading-snug text-left font-bold bg-indigo-600 text-white shadow-2xs cursor-pointer transition'
          : 'px-2 py-1 rounded-lg text-[11px] leading-snug text-left font-medium bg-white hover:bg-indigo-50 text-slate-700 border border-slate-200 cursor-pointer transition';
        btn.textContent = `${isSel ? '✓ ' : ''}${tag}`;
        btn.addEventListener('click', () => {
          const idx = draft.tags.indexOf(tag);
          if (idx >= 0) draft.tags.splice(idx, 1);
          else draft.tags.push(tag);
          draft.notEvaluated = false;
          renderQuickObsView();
        });
        tagsContainer.appendChild(btn);
      });

      const activeStrip = document.getElementById('qoActiveStudentTagsStrip');
      if (activeStrip) {
        activeStrip.innerHTML = '';
        activeStrip.classList.toggle('hidden', draft.tags.length === 0);
        activeStrip.classList.toggle('flex', draft.tags.length > 0);
        if (draft.tags.length > 0) {
          draft.tags.forEach(t => {
            const chip = document.createElement('span');
            chip.className = 'inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 border border-indigo-200 text-[10px] font-semibold text-indigo-800';
            chip.innerHTML = `<span>${escapeHtml(t)}</span><button type="button" class="hover:text-red-600 font-bold cursor-pointer" aria-label="Retirer ${escapeHtml(t)}">✕</button>`;
            chip.querySelector('button').addEventListener('click', () => {
              draft.tags = draft.tags.filter(x => x !== t);
              renderQuickObsView();
            });
            activeStrip.appendChild(chip);
          });
        }
      }

      // 6. Comment textarea for current student
      const commInput = document.getElementById('qoCommentInput');
      if (commInput) {
        commInput.disabled = false;
        commInput.placeholder = 'Notez vos observations pour cet élève...';
        if (document.activeElement !== commInput) {
          commInput.value = draft.comment || '';
        }
      }

    }

    function commitObservationSessionToGradebook() {
      const sub = getCurrentSubjectConfig();
      const termData = getActiveTermData();
      const subData = termData.subjectData[sub.id];
      const session = subData.currentObsSession;
      const titleInput = document.getElementById('qoSessionTitleInput');
      const enteredTitle = (session.title || (titleInput ? titleInput.value : '')).trim();

      if (!enteredTitle) {
        showToast('Veuillez donner un nom à cette trace observable avant de l’enregistrer');
        if (titleInput) titleInput.focus();
        return;
      }

      const targetedStudents = appState.students.filter(st => isAssignmentForStudent(session, st));
      const effectiveObsMode = getEffectiveSessionObsMode(session, sub);
      const savedCriteriaWeights = (effectiveObsMode === 'weighted' && session.criteriaWeights && typeof session.criteriaWeights === 'object')
        ? { ...session.criteriaWeights }
        : null;
      let draftsWithData = 0;
      targetedStudents.forEach(st => {
        const d = session.studentDrafts[st.id];
        const stuLvl = getObservationDraftGradeLevel(d, st, session);
        const criteria = getObservationCriteria(sub, stuLvl, session);
        const r = computeObservableResult(d.checked, d.overrideCode, criteria, d.notEvaluated, buildStudentObsOptions(session, sub, stuLvl));
        if (r.hasEvidence || d.comment.trim() || d.tags.length) draftsWithData++;
      });

      if (draftsWithData === 0) {
        showToast('Ajoutez au moins un critère, une cote, une note ou un indicateur.');
        return;
      }

      const todayStr = new Date().toISOString().slice(0, 10);
      const isEditing = Boolean(session.editingAssignmentId);
      let targetAsgId = session.editingAssignmentId;
      const actTitle = enteredTitle;
      const targetLevels = getAssignmentTargetLevels(session);

      if (isEditing) {
        const existingAsg = subData.assignments.find(a => a.id === targetAsgId);
        if (existingAsg) {
          existingAsg.title = actTitle;
          existingAsg.obsMode = effectiveObsMode;
          if (savedCriteriaWeights) existingAsg.criteriaWeights = { ...savedCriteriaWeights };
          else delete existingAsg.criteriaWeights;
          if (targetLevels.length) existingAsg.targetLevels = targetLevels.slice();
          else delete existingAsg.targetLevels;
          if (subData.equalWeights) recalculateEqualWeights(subData);
        } else {
          targetAsgId = 'obs_asg_' + Date.now();
          const newEntry = {
            id: targetAsgId,
            title: actTitle,
            date: todayStr,
            weight: 100,
            isObservation: true,
            rubricVersion: session.rubricVersion,
            obsMode: effectiveObsMode
          };
          if (savedCriteriaWeights) newEntry.criteriaWeights = { ...savedCriteriaWeights };
          if (targetLevels.length) newEntry.targetLevels = targetLevels.slice();
          subData.assignments.push(newEntry);
          if (subData.equalWeights) recalculateEqualWeights(subData);
        }
      } else {
        targetAsgId = 'obs_asg_' + Date.now();
        const newEntry = {
          id: targetAsgId,
          title: actTitle,
          date: todayStr,
          weight: 100,
          isObservation: true,
          rubricVersion: session.rubricVersion,
          obsMode: effectiveObsMode
        };
        if (savedCriteriaWeights) newEntry.criteriaWeights = { ...savedCriteriaWeights };
        if (targetLevels.length) newEntry.targetLevels = targetLevels.slice();
        subData.assignments.push(newEntry);
        if (subData.equalWeights) {
          recalculateEqualWeights(subData);
        }
      }

      const origAsg = subData.assignments.find(a => a.id === targetAsgId);
      appState.students.forEach(st => {
        const rec = subData.studentRecords[st.id];
        rec.scoreMeta = rec.scoreMeta || {};
        const prevFlags = getCellFlags(rec, targetAsgId);
        if (origAsg && !isAssignmentForStudent(origAsg, st)) {
          rec.scores[targetAsgId] = '-';
          if (prevFlags.length) rec.scoreMeta[targetAsgId] = { flags: prevFlags };
          else delete rec.scoreMeta[targetAsgId];
          termData.observations = termData.observations.filter(o => !(o.asgId === targetAsgId && o.studentId === st.id));
          return;
        }
        const d = session.studentDrafts[st.id];
        const gradeLevel = getObservationDraftGradeLevel(d, st, session);
        d.gradeLevel = gradeLevel;
        const criteria = getObservationCriteria(sub, gradeLevel, session);
        const r = computeObservableResult(d.checked, d.overrideCode, criteria, d.notEvaluated, buildStudentObsOptions(session, sub, gradeLevel));

        if (rec.scoreMeta[targetAsgId] && rec.scoreMeta[targetAsgId].linkedCopy &&
            !r.hasEvidence && !d.comment.trim() && !d.tags.length && !d.notEvaluated) return;

        if (r.hasEvidence || d.comment.trim() || d.tags.length) {
          rec.scores[targetAsgId] = r.hasFinalGrade ? r.pct : '-';
          rec.scoreMeta[targetAsgId] = {
            checked: d.checked.slice(),
            overrideCode: d.overrideCode,
            code: r.hasFinalGrade ? r.code : null,
            pct: r.hasFinalGrade ? r.pct : null,
            tags: d.tags.slice(),
            comment: d.comment,
            gradeLevel,
            isComplete: r.isComplete,
            notEvaluated: r.isNotEvaluated,
            obsMode: effectiveObsMode
          };
          if (savedCriteriaWeights) rec.scoreMeta[targetAsgId].criteriaWeights = { ...savedCriteriaWeights };
          if (prevFlags.length) rec.scoreMeta[targetAsgId].flags = prevFlags;
          termData.observations = termData.observations.filter(o => !(o.asgId === targetAsgId && o.studentId === st.id));
          termData.observations.push({
            id: 'obs_' + Date.now() + '_' + st.id,
            asgId: targetAsgId,
            studentId: st.id,
            subjectId: sub.id,
            date: todayStr,
            traceType: 'Trace observable',
            activity: actTitle,
            gradeCode: r.isNotEvaluated ? 'N/A' : r.hasFinalGrade ? r.code : r.hasData ? 'En cours' : 'Rétroaction',
            tags: d.tags.slice(),
            comment: d.comment
          });
        } else {
          rec.scores[targetAsgId] = '-'; // Dash for non-evaluated students (never 0!)
          if (prevFlags.length) rec.scoreMeta[targetAsgId] = { flags: prevFlags };
          else delete rec.scoreMeta[targetAsgId];
          termData.observations = termData.observations.filter(o => !(o.asgId === targetAsgId && o.studentId === st.id));
        }
      });

      let traceLinkId = origAsg && origAsg.linkId;
      const newLinkTargets = isEditing ? [] : (session.linkTargets || []);
      if (origAsg && !traceLinkId && newLinkTargets.length) {
        traceLinkId = 'lnk_' + Date.now();
        origAsg.linkId = traceLinkId;
        origAsg.linkOrigin = true;
      }
      if (origAsg && traceLinkId) {
        newLinkTargets.forEach(subId => {
          const sd = termData.subjectData[subId];
          if (!sd) return;
          const linkedSubObj = SUBJECTS_CONFIG.find(s => s.id === subId);
          const linkedMode = (effectiveObsMode === 'weighted' && !isWeightedRubricAvailableForSubject(linkedSubObj))
            ? 'portrait'
            : effectiveObsMode;
          const linkedAsg = { id: `obs_asg_${Date.now()}_${subId}`, title: actTitle, date: todayStr, weight: 100, isObservation: true, rubricVersion: session.rubricVersion, obsMode: linkedMode, linkId: traceLinkId, linkOrigin: false };
          if (targetLevels.length) linkedAsg.targetLevels = targetLevels.slice();
          sd.assignments.push(linkedAsg);
          if (sd.equalWeights) recalculateEqualWeights(sd);
        });
        getLinkedAssignments(origAsg).forEach(({ subId: otherSubId, subData: otherData, asg: other }) => {
          other.title = actTitle;
          const otherSubObj = SUBJECTS_CONFIG.find(s => s.id === otherSubId);
          other.obsMode = (effectiveObsMode === 'weighted' && !isWeightedRubricAvailableForSubject(otherSubObj))
            ? 'portrait'
            : effectiveObsMode;
          if (other.obsMode === 'weighted' && session.criteriaWeights && typeof session.criteriaWeights === 'object') {
            other.criteriaWeights = { ...session.criteriaWeights };
          } else {
            delete other.criteriaWeights;
          }
          if (targetLevels.length) other.targetLevels = targetLevels.slice();
          else delete other.targetLevels;
          if (otherData.equalWeights) recalculateEqualWeights(otherData);
          appState.students.forEach(st => {
            const src = subData.studentRecords[st.id];
            const dst = otherData.studentRecords[st.id];
            if (!src || !dst) return;
            dst.scoreMeta = dst.scoreMeta || {};
            const srcMeta = src.scoreMeta && src.scoreMeta[targetAsgId];
            const dstMeta = dst.scoreMeta[other.id];
            const dstScore = dst.scores[other.id];
            if (srcMeta && srcMeta.linkedCopy) return;
            if (dstMeta && !dstMeta.linkedCopy &&
                ((Array.isArray(dstMeta.checked) && dstMeta.checked.length) || dstMeta.overrideCode ||
                 dstMeta.comment || (Array.isArray(dstMeta.tags) && dstMeta.tags.length) || dstMeta.notEvaluated)) return;
            if ((!dstMeta || !dstMeta.linkedCopy) && dstScore !== undefined && dstScore !== '' && dstScore !== '-') return;
            const dstFlags = getCellFlags(dst, other.id);
            dst.scores[other.id] = src.scores[targetAsgId];
            if (srcMeta) {
              dst.scoreMeta[other.id] = { ...srcMeta, linkedCopy: true };
              if (dstFlags.length) dst.scoreMeta[other.id].flags = dstFlags;
              else delete dst.scoreMeta[other.id].flags;
            } else if (dstFlags.length) dst.scoreMeta[other.id] = { flags: dstFlags };
            else delete dst.scoreMeta[other.id];
          });
        });
      }

      subData.currentObsSession = createBlankObsSession(appState.students);
      subData.currentObsSession.savedDraftSnapshot = getCurrentObservationSessionSnapshot(subData.currentObsSession);
      observationDraftBaseline = subData.currentObsSession.savedDraftSnapshot;
      notifyUpdate(isEditing ? `Trace observable "${actTitle}" mise à jour!` : `Trace observable "${actTitle}" ajoutée au carnet!`);
      appState.activeView = 'viewGradebook';
      renderAll();
    }

    // -------------------------------------------------------------------------
    // VIEW 4: LISTE D'ÉLÈVES & ADAPTATIONS À LA PIÈCE
    // -------------------------------------------------------------------------
