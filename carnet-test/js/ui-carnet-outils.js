    function hideNewEvalChoicesPopover() {
      const choices = document.getElementById('newEvaluationChoices');
      const btn = document.getElementById('btnNewEvaluation');
      if (!choices || choices.classList.contains('hidden') || choices.classList.contains('is-closing')) return;
      if (btn) btn.setAttribute('aria-expanded', 'false');
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !choices.offsetWidth) {
        choices.classList.add('hidden');
        return;
      }
      // Animation inverse : les choix se replient vers le bouton avant d’être masqués.
      choices.classList.add('is-closing');
      const finish = () => {
        choices.removeEventListener('animationend', finish);
        if (!choices.classList.contains('is-closing')) return;
        choices.classList.remove('is-closing');
        choices.classList.add('hidden');
      };
      choices.addEventListener('animationend', finish);
      setTimeout(finish, 400);
    }

    let mouseBarEl = null;
    function closeMouseBar() {
      if (mouseBarEl) { mouseBarEl.remove(); mouseBarEl = null; }
      document.removeEventListener('mousedown', onMouseBarOutside, true);
      document.removeEventListener('keydown', onMouseBarKey, true);
      window.removeEventListener('scroll', closeMouseBar, true);
    }
    function onMouseBarOutside(e) { if (mouseBarEl && !mouseBarEl.contains(e.target)) closeMouseBar(); }
    function onMouseBarKey(e) { if (e.key === 'Escape') closeMouseBar(); }

    // Petite barre d'options près du curseur; se ferme après un choix, un clic à l'extérieur ou Échap.
    function openMouseBar(x, y, options, current) {
      closeMouseBar();
      closeGradePicker();
      closeCellFlagPicker();
      hideNewEvalChoicesPopover();
      const el = document.createElement('div');
      el.className = 'mouse-bar';
      el.setAttribute('role', 'menu');
      options.forEach(option => {
        const b = document.createElement('button');
        b.type = 'button';
        b.setAttribute('role', 'menuitem');
        b.className = option.id && option.id === current ? 'is-current' : '';
        b.textContent = option.label;
        b.addEventListener('click', () => { closeMouseBar(); option.onPick(); });
        el.appendChild(b);
      });
      el.style.visibility = 'hidden';
      document.body.appendChild(el);
      const w = el.offsetWidth, h = el.offsetHeight, m = 8;
      let left = x + 10, top = y + 12;
      if (left + w + m > window.innerWidth) left = Math.max(m, x - w - 10);
      if (top + h + m > window.innerHeight) top = Math.max(m, y - h - 12);
      el.style.left = Math.min(Math.max(m, left), Math.max(m, window.innerWidth - w - m)) + 'px';
      el.style.top = Math.min(Math.max(m, top), Math.max(m, window.innerHeight - h - m)) + 'px';
      el.style.visibility = '';
      mouseBarEl = el;
      document.addEventListener('mousedown', onMouseBarOutside, true);
      document.addEventListener('keydown', onMouseBarKey, true);
      window.addEventListener('scroll', closeMouseBar, true);
      const first = el.querySelector('button');
      if (first) first.focus({ preventScroll: true });
    }

    let gradePickerEl = null;
    function closeGradePicker() {
      if (gradePickerEl) { gradePickerEl.remove(); gradePickerEl = null; }
      document.removeEventListener('mousedown', onGradePickerOutside, true);
      document.removeEventListener('keydown', onGradePickerKey, true);
      window.removeEventListener('scroll', closeGradePicker, true);
    }
    function onGradePickerOutside(e) {
      if (gradePickerEl && !gradePickerEl.contains(e.target)) closeGradePicker();
    }
    function onGradePickerKey(e) { if (e.key === 'Escape') closeGradePicker(); }

    // Bandeau de cotes cliquables près du curseur; se ferme par un clic dedans ou à l'extérieur.
    function openGradePicker(x, y, { current, onPick }) {
      closeGradePicker();
      closeMouseBar();
      closeCellFlagPicker();
      hideNewEvalChoicesPopover();
      const el = document.createElement('div');
      el.className = 'grade-picker';
      el.setAttribute('role', 'dialog');
      el.setAttribute('aria-label', 'Choisir une cote');
      GRADE_SCALE.forEach(g => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = `grade-picker-btn border ${getBadgeColorClasses(g.code)}${current === g.code ? ' is-current' : ''}`;
        b.textContent = `${g.code} ${g.pct}`;
        b.title = `${g.code} (${g.pct}%)`;
        b.addEventListener('click', () => { closeGradePicker(); onPick(g); });
        el.appendChild(b);
      });
      const auto = document.createElement('button');
      auto.type = 'button';
      auto.className = 'grade-picker-auto';
      auto.textContent = 'Auto';
      auto.title = 'Revenir au calcul automatique';
      auto.addEventListener('click', () => { closeGradePicker(); onPick(null); });
      el.appendChild(auto);
      el.style.visibility = 'hidden';
      document.body.appendChild(el);
      const w = el.offsetWidth, h = el.offsetHeight, m = 8;
      let left = x + 10, top = y + 12;
      if (left + w + m > window.innerWidth) left = Math.max(m, x - w - 10);
      if (top + h + m > window.innerHeight) top = Math.max(m, y - h - 12);
      left = Math.min(Math.max(m, left), Math.max(m, window.innerWidth - w - m));
      el.style.left = left + 'px';
      el.style.top = top + 'px';
      el.style.visibility = '';
      gradePickerEl = el;
      document.addEventListener('mousedown', onGradePickerOutside, true);
      document.addEventListener('keydown', onGradePickerKey, true);
      window.addEventListener('scroll', closeGradePicker, true);
    }

    // Sélecteur sobre et monochrome de marqueurs rapides sur cellule (AIDE, T+, REP, ABS, SUIVI)
    let cellFlagPickerEl = null;
    function closeCellFlagPicker() {
      if (cellFlagPickerEl) { cellFlagPickerEl.remove(); cellFlagPickerEl = null; }
      document.removeEventListener('mousedown', onCellFlagPickerOutside, true);
      document.removeEventListener('keydown', onCellFlagPickerKey, true);
      window.removeEventListener('scroll', closeCellFlagPicker, true);
    }
    function onCellFlagPickerOutside(e) {
      if (cellFlagPickerEl && !cellFlagPickerEl.contains(e.target)) closeCellFlagPicker();
    }
    function onCellFlagPickerKey(e) { if (e.key === 'Escape') closeCellFlagPicker(); }

    function openCellFlagPicker(x, y, { studentName, assignmentTitle, getStatus, onStatusChange, getFlags, onToggle, onClear }) {
      closeCellFlagPicker();
      closeGradePicker();
      closeMouseBar();
      hideNewEvalChoicesPopover();
      const el = document.createElement('div');
      el.className = 'flag-picker no-print';
      el.setAttribute('role', 'dialog');
      el.setAttribute('aria-label', 'Marqueurs d’adaptation / soutien');

      const makeItem = (label, badge, hint, isOn, onClick) => {
        const item = document.createElement('button');
        item.type = 'button';
        item.className = `flag-picker-item${isOn ? ' is-active' : ''}`;
        item.title = hint;
        item.setAttribute('aria-pressed', String(isOn));
        item.innerHTML = `
            <span class="truncate">${escapeHtml(label)}</span>
            <span class="flag-picker-code">${escapeHtml(badge)}</span>
          `;
        item.addEventListener('click', onClick);
        return item;
      };
      const makeHeading = text => {
        const heading = document.createElement('div');
        heading.className = 'flag-picker-group-title';
        heading.textContent = text;
        return heading;
      };

      const renderContent = () => {
        const activeFlags = getFlags();
        el.innerHTML = '';

        const head = document.createElement('div');
        head.className = 'flag-picker-title';
        const titleSpan = document.createElement('span');
        titleSpan.textContent = 'Marqueurs d’adaptation / soutien';
        head.appendChild(titleSpan);
        if (activeFlags.length > 0) {
          const clearBtn = document.createElement('button');
          clearBtn.type = 'button';
          clearBtn.className = 'text-[10px] font-semibold text-slate-500 hover:text-slate-800 underline cursor-pointer normal-case tracking-normal';
          clearBtn.textContent = 'Effacer';
          clearBtn.addEventListener('click', () => {
            onClear();
            renderContent();
          });
          head.appendChild(clearBtn);
        }
        el.appendChild(head);

        const list = document.createElement('div');
        list.className = 'flag-picker-list';
        const activeAdaptations = activeFlags.filter(code => {
          const def = CELL_FLAGS.find(f => f.code === code);
          return def && def.group === 'adaptation';
        }).length;
        const leftColumn = document.createElement('div');
        const rightColumn = document.createElement('div');
        list.append(leftColumn, rightColumn);
        const isVisibleFlag = flag => !flag.retired || activeFlags.includes(flag.code);
        const flagItem = flag => makeItem(flag.label, flag.badge, flag.hint, activeFlags.includes(flag.code), () => {
          onToggle(flag.code);
          renderContent();
        });

        leftColumn.appendChild(makeHeading(activeAdaptations > 1 ? 'Adaptations' : 'Adaptation'));
        CELL_FLAGS.filter(f => f.group === 'adaptation' && isVisibleFlag(f)).forEach(f => leftColumn.appendChild(flagItem(f)));

        rightColumn.appendChild(makeHeading('Modification'));
        CELL_FLAGS.filter(f => f.group === 'modification' && isVisibleFlag(f)).forEach(f => rightColumn.appendChild(flagItem(f)));

        // Statut : NR, JUST et Exempté excluent le travail de la moyenne; « À reprendre » est un marqueur de suivi.
        rightColumn.appendChild(makeHeading('Statut'));
        const activeStatus = typeof getStatus === 'function' ? getStatus() : '';
        const statusItem = (code, label, badge, hint) => {
          const isSel = activeStatus === code;
          return makeItem(label, badge, hint + (isSel ? ' — cliquer pour retirer ce statut' : ''), isSel, () => {
            onStatusChange(code);
            closeCellFlagPicker();
          });
        };
        const hasStatus = typeof onStatusChange === 'function';
        if (hasStatus) {
          rightColumn.appendChild(statusItem('NR', 'Non remis', 'NR', 'Travail non remis temporairement (exclu de la moyenne)'));
          rightColumn.appendChild(statusItem('JUST', 'Justifié', 'JUST', 'Absence motivée ou justifiée (exclue de la moyenne)'));
        }
        CELL_FLAGS.filter(f => f.group === 'autre' && isVisibleFlag(f)).forEach(f => rightColumn.appendChild(flagItem(f)));
        if (hasStatus) {
          if (activeStatus === 'REP') rightColumn.appendChild(statusItem('REP', 'Reprise', 'REP', 'En attente de reprise (exclu de la moyenne)'));
          rightColumn.appendChild(statusItem('-', 'Exempté', '—', 'Non évalué ou exempté (exclu de la moyenne)'));
        }
        el.appendChild(list);
      };

      renderContent();
      el.style.visibility = 'hidden';
      document.body.appendChild(el);
      const w = el.offsetWidth, h = el.offsetHeight, m = 8;
      let left = x, top = y + 6;
      if (left + w + m > window.innerWidth) left = Math.max(m, window.innerWidth - w - m);
      if (top + h + m > window.innerHeight) top = Math.max(m, y - h - 8);
      left = Math.max(m, left);
      el.style.left = left + 'px';
      el.style.top = top + 'px';
      el.style.visibility = '';
      cellFlagPickerEl = el;
      document.addEventListener('mousedown', onCellFlagPickerOutside, true);
      document.addEventListener('keydown', onCellFlagPickerKey, true);
      window.addEventListener('scroll', closeCellFlagPicker, true);
    }

    // Modale Banque & Assistant de commentaires
    let activeCommentBankContext = null;

    function updateCommentBankCharCount() {
      const area = document.getElementById('cbTextarea');
      const countEl = document.getElementById('cbCharCount');
      if (area && countEl) {
        countEl.textContent = `${area.value.length} caract.`;
      }
    }

    function renderCommentBankPhrases() {
      if (!activeCommentBankContext) return;
      const st = appState.students.find(s => s.id === activeCommentBankContext.studentId);
      if (!st) return;
      const modeSelect = document.getElementById('cbPronounSelect');
      const mode = (modeSelect && modeSelect.value) || st.pronoun || 'prenom';
      const listEl = document.getElementById('cbPhraseList');
      const area = document.getElementById('cbTextarea');
      if (!listEl || !area) return;
      listEl.innerHTML = '';
      const firstName = extractStudentFirstName(st);
      const isFem = mode === 'elle' || mode === 'prenom_elle';
      const pron = isFem ? 'elle' : 'il';
      const currentTextNow = area.value.trim();
      const categories = getCommentBankCategories(st, activeCommentBankContext.subjectId);

      const getPhraseVariants = (raw) => [
        personalizeSingleSentence(raw, firstName, 'il', true),
        personalizeSingleSentence(raw, firstName, 'il', false),
        personalizeSingleSentence(raw, firstName, 'elle', true),
        personalizeSingleSentence(raw, firstName, 'elle', false)
      ];

      const findMatchedVariant = (text, raw) => {
        if (!text) return null;
        const variants = getPhraseVariants(raw);
        return variants.find(v => v && text.includes(v)) || null;
      };

      categories.forEach(category => {
        const column = document.createElement('fieldset');
        column.className = 'qo-choice-column';
        const legend = document.createElement('legend');
        legend.textContent = category.label.replace(/ & /g, ' et ');
        column.appendChild(legend);
        category.phrases.forEach((rawPhrase, index) => {
          const previewWithPronoun = personalizeSingleSentence(rawPhrase, firstName, pron, false);
          const previewWithName = personalizeSingleSentence(rawPhrase, firstName, pron, mode === 'prenom' || mode === 'prenom_elle');
          const matchedNow = findMatchedVariant(currentTextNow, rawPhrase);
          const isAlreadyInText = Boolean(matchedNow);

          const choice = document.createElement('label');
          choice.className = 'qo-choice';
          const checkbox = document.createElement('input');
          checkbox.type = 'checkbox';
          checkbox.id = `cb-${category.id}-${index}`;
          checkbox.checked = isAlreadyInText;
          choice.appendChild(checkbox);
          choice.insertAdjacentHTML('beforeend', `
            <span>${escapeHtml(previewWithName)}</span>
          `);
          checkbox.addEventListener('change', () => {
            const scrollTop = listEl.scrollTop;
            const checkboxId = checkbox.id;
            const textNow = area.value.trim();
            const existingMatch = findMatchedVariant(textNow, rawPhrase);
            if (existingMatch) {
              // Bascule : retire l'énoncé sans jamais le dupliquer
              let nextText = textNow.replace(existingMatch, '').replace(/\s{2,}/g, ' ').trim();
              // Rétablir le prénom si l'énoncé retiré était le seul à le porter.
              if (nextText && (mode === 'prenom' || mode === 'prenom_elle') && !nextText.toLowerCase().includes(firstName.toLowerCase())) {
                const allRaw = categories.flatMap(c => c.phrases);
                for (const candidateRaw of allRaw) {
                  const pronVar = personalizeSingleSentence(candidateRaw, firstName, pron, false);
                  if (pronVar && nextText.startsWith(pronVar)) {
                    const nameVar = personalizeSingleSentence(candidateRaw, firstName, pron, true);
                    nextText = nameVar + nextText.slice(pronVar.length);
                    break;
                  }
                }
              }
              area.value = nextText;
            } else {
              const alreadyHasFirstName = textNow.length > 0 && textNow.toLowerCase().includes(firstName.toLowerCase());
              const useNameNow = (mode === 'prenom' || mode === 'prenom_elle') && !alreadyHasFirstName && textNow.length === 0;
              const sentenceToInsert = useNameNow ? previewWithName : previewWithPronoun;
              area.value = textNow ? `${textNow} ${sentenceToInsert}` : sentenceToInsert;
            }
            updateCommentBankCharCount();
            renderCommentBankPhrases();
            listEl.scrollTop = scrollTop;
            document.getElementById(checkboxId).focus({ preventScroll: true });
          });
          column.appendChild(choice);
        });
        listEl.appendChild(column);
      });
    }

    function openCommentBankModal(studentId, subjectId, termId) {
      const st = appState.students.find(s => s.id === studentId);
      const sub = SUBJECTS_CONFIG.find(s => s.id === subjectId) || getCurrentSubjectConfig();
      if (!st || !sub) return;
      const tId = String(termId || appState.activeTerm);
      const subData = appState.terms[tId].subjectData[sub.id];
      const rec = subData.studentRecords[st.id];
      const sum = computeStudentSubjectSummary(tId, sub.id, st.id);

      activeCommentBankContext = { studentId: st.id, subjectId: sub.id, termId: tId };
      const modal = document.getElementById('modalCommentBank');
      const subtitle = document.getElementById('cbModalSubtitle');
      const modeSelect = document.getElementById('cbPronounSelect');
      const area = document.getElementById('cbTextarea');
      if (!modal || !area) return;

      if (subtitle) {
        const preschool = getStudentCycle(st.gradeLevel) === 'P';
        const feedbackOnly = getStudentCycle(st.gradeLevel) === 1 && ['sciences', 'social'].includes(getPrimaryCommentSubjectKey(sub));
        const gradeInfo = preschool ? 'Constat de développement à porter par l’enseignante ou l’enseignant'
          : feedbackOnly ? 'Aucun résultat disciplinaire au 1er cycle'
          : sum.finalPct !== null ? `${sum.finalLetter} (${sum.finalPct} %)` : 'Aucune note finale';
        subtitle.textContent = `${st.name} · ${sub.shortName} · Étape ${tId} · Résultat : ${gradeInfo}`;
      }
      const guidance = document.getElementById('cbBankGuidance');
      if (guidance) {
        guidance.textContent = getStudentCycle(st.gradeLevel) === 'P'
          ? 'Choisissez les constats selon vos observations, sans conversion de pourcentage. La synthèse reprend les éléments observés, sans porter de constat global; elle reste vide en l’absence de traces qualitatives. Pour les enfants de 4 ans, vérifiez les défis dans la source CSSDD (surlignage non repris).'
          : getStudentCycle(st.gradeLevel) === 1 && ['sciences', 'social'].includes(getPrimaryCommentSubjectKey(sub))
            ? 'Aucun résultat disciplinaire en science et technologie ni en univers social au 1er cycle. Seules les observations transversales sont proposées ici; aucune synthèse disciplinaire n’est produite.'
            : 'Formulations locales à adapter aux apprentissages travaillés. Les observations transversales et les éléments de rétroaction (stratégies, validation, retour réflexif) ne constituent pas des résultats distincts et ne modifient pas les notes.';
      }
      if (modeSelect) {
        modeSelect.value = st.pronoun || 'prenom';
      }
      area.value = rec.comment || '';
      updateCommentBankCharCount();
      renderCommentBankPhrases();

      modal.classList.remove('hidden');
      modal.classList.add('flex');
      document.getElementById('cbPhraseList').scrollTop = 0;
      setTimeout(() => area.focus(), 40);
    }

    function closeCommentBankModal() {
      const modal = document.getElementById('modalCommentBank');
      if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
      }
      activeCommentBankContext = null;
    }

    function updateWeightIndicatorsUI(totalW, valid100, hasWorks, subDataOverride) {
      const warnBanner = document.getElementById('weightWarningBanner');
      const btnWeight = document.getElementById('btnWeightMode');
      const subData = subDataOverride || (getActiveTermData().subjectData[appState.activeSubjectId]);
      const presentLevels = getPresentStudentLevels();
      const isMulti = presentLevels.length > 1;

      if (!hasWorks) {
        if (warnBanner) warnBanner.classList.add('hidden');
        if (btnWeight) btnWeight.classList.remove('is-weight-error');
        return;
      }

      if (btnWeight) btnWeight.classList.toggle('is-weight-error', !valid100);

      if (isMulti && subData) {
        const levelBreakdown = presentLevels.map(lvl => {
          const count = subData.assignments.filter(a => isAssignmentForLevel(a, lvl)).length;
          const tot = getTotalAssignmentWeightsForLevel(subData, lvl);
          const ok = count === 0 || Math.abs(tot - 100) <= 0.15;
          return { lvl, label: GRADE_LEVEL_LABELS[lvl], short: formatShortLevelTag(lvl), count, tot, ok };
        });

        if (warnBanner) {
          if (!valid100) {
            warnBanner.classList.remove('hidden');
            warnBanner.innerHTML = `Erreur pondération : ${levelBreakdown.map(b => `${escapeHtml(b.short)} : <strong>${b.tot} %</strong>${b.ok ? ' ✓' : (b.tot > 100 ? ' (dépasse 100 %)' : ' (≠ 100 %)')}`).join(' · ')}`;
          } else {
            warnBanner.classList.add('hidden');
          }
        }

      } else {
        if (warnBanner) {
          const dispTotal = Math.round(Number(totalW) || 0);
          warnBanner.innerHTML = `Total : <span id="weightTotalVal">${escapeHtml(String(dispTotal))}</span> % ${dispTotal > 100 ? '(dépasse 100 %)' : '(doit donner 100 %)'}`;
          if (!valid100) warnBanner.classList.remove('hidden');
          else warnBanner.classList.add('hidden');
        }
      }
    }

    function updateGradebookRowSummaryOnly() {
      const sub = getCurrentSubjectConfig();
      const allFinalPcts = [];
      const pctsByLevel = {};
      const presentLevels = getPresentStudentLevels();
      const isMulti = presentLevels.length > 1;
      const activeLvlFilter = isMulti ? ensureValidGbLevelFilter() : 'ALL';

      appState.students.forEach(st => {
        const summary = computeStudentSubjectSummary(appState.activeTerm, sub.id, st.id);
        if (summary.finalPct !== null) {
          allFinalPcts.push(summary.finalPct);
          const lvl = String(st.gradeLevel || '');
          if (lvl) {
            if (!pctsByLevel[lvl]) pctsByLevel[lvl] = [];
            pctsByLevel[lvl].push(summary.finalPct);
          }
        }
        const avgCell = document.getElementById(`cell_avg_${st.id}`);
        if (avgCell) {
          avgCell.innerHTML = renderAssignmentAverage(summary);
        }
        const finalBadge = document.getElementById(`cell_final_badge_${st.id}`);
        if (finalBadge) {
          const recNow = appState.terms[appState.activeTerm].subjectData[sub.id].studentRecords[st.id];
          finalBadge.className = `px-1.5 py-0.5 rounded border text-[11px] font-extrabold whitespace-nowrap ${getBadgeColorClasses(summary.finalLetter)}`;
          finalBadge.textContent = summary.finalPct !== null ? `${summary.finalLetter} (${summary.finalPct}%)${recNow.finalJudgmentOverride !== '' ? '*' : ''}` : '—';
        }
      });
      const kpiAvg = document.getElementById('kpiClassAverage');
      if (kpiAvg) {
        const targetList = (isMulti && activeLvlFilter !== 'ALL')
          ? (pctsByLevel[activeLvlFilter] || [])
          : allFinalPcts;
        if (targetList.length > 0) {
          const avg = Math.round(targetList.reduce((a, b) => a + b, 0) / targetList.length);
          kpiAvg.textContent = `${avg}% (${pctToClosestGradeCode(avg)})${isMulti && activeLvlFilter !== 'ALL' ? ` · ${formatShortLevelTag(activeLvlFilter)}` : ''}`;
        } else {
          kpiAvg.textContent = '—';
        }
      }
    }

    // -------------------------------------------------------------------------
    // VIEW 2: BARÈME ÉCOLE (1 SEULE CASE PAR RANGÉE !)
    // -------------------------------------------------------------------------
