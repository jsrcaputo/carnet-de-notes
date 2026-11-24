    function toggleFullscreenOrPopout() {
      const docEl = document.documentElement;
      const isFs = document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement;
      if (!isFs) {
        const req = docEl.requestFullscreen || docEl.webkitRequestFullscreen || docEl.msRequestFullscreen;
        if (req) {
          req.call(docEl).catch(() => {
            showToast("Le mode plein écran n’est pas autorisé dans ce cadre.");
          });
        }
      } else {
        const exit = document.exitFullscreen || document.webkitExitFullscreen || document.msExitFullscreen;
        if (exit) exit.call(document);
      }
    }

    // =========================================================================
    // 7. EVENT LISTENERS & INITIALIZATION
    // =========================================================================
    let tourIndex = 0;
    let tourPreviousView = null;
    const tourSteps = [
      { target: '#btnNavStudentsTop', title: 'Groupes et élèves', description: 'Créez un groupe, choisissez son niveau et ses matières, puis ajoutez vos élèves. Par exemple : « 5e A », niveau 5e année.' },
      { target: '#subjectTabsContainer', title: 'Choisir une matière', description: 'Choisissez une matière, puis sa compétence dans la section Compétences de la barre latérale.' },
      { target: '#btnNewEvaluation', title: 'Nouvelle évaluation', description: 'Choisissez une évaluation déjà réalisée ou une évaluation observable.' },
      { target: '#gradebookScrollContainer', title: 'Carnet et jugement', description: 'Entrez les notes et ajustez les pondérations. Le barème aide à porter un jugement; cliquez sur la note finale pour la modifier ou revenir au calcul automatique.' },
      { target: '#btnNavGlobalReport', title: 'Bulletin et niveaux de compétence', description: 'Consultez le portrait de l’élève et les résultats des étapes. En bas du bulletin, les échelles disponibles permettent de sélectionner des phrases et de préparer un commentaire.' },
      { target: '#btnExportJSON', title: 'Sauvegarder et charger', description: 'La sauvegarde JSON permet de retrouver le carnet et ses groupes. Téléchargez régulièrement une copie; Charger remplace les données du carnet actuel.' },
      { target: '#btnExportExcel', title: 'Exporter pour analyser', description: 'L’export Excel rassemble les résultats du groupe actif et des données détaillées pour les analyser. La sauvegarde JSON reste nécessaire pour recharger le carnet.' }
    ];

    function setDemoPanelOpen(toggleId, panelId, open) {
      const toggle = document.getElementById(toggleId);
      const panel = document.getElementById(panelId);
      if (!toggle || !panel) return;
      toggle.setAttribute('aria-expanded', String(!!open));
      panel.classList.toggle('is-open', !!open);
      panel.setAttribute('aria-hidden', String(!open));
      if ('inert' in panel) panel.inert = !open;
    }

    function resetHomeDemoPanels() {
      setDemoPanelOpen('homeDemoToggle', 'homeDemoPanel', false);
    }

    let landingPortalRequested = false;

    function openHomeDashboard() {
      landingPortalRequested = false;
      if (!hasActiveGroup()) {
        renderHomeView();
        return;
      }
      navigateToView('viewHome');
    }

    function updateCloseCarnetButton() {
      const button = document.getElementById('btnCloseCarnet');
      if (!button) return;
      let hasChanges = false;
      try {
        hasChanges = typeof getBackupSnapshot === 'function'
          && typeof lastSavedFileSnapshot !== 'undefined'
          && getBackupSnapshot() !== lastSavedFileSnapshot;
      } catch (error) {
        hasChanges = false;
      }
      button.disabled = !hasChanges;
      button.classList.toggle('is-disabled-by-save', !hasChanges);
      button.title = hasChanges
        ? 'Fermer le carnet après confirmation'
        : 'Toutes les modifications sont enregistrées';
    }

    function returnToLandingPortal() {
      requestObservationDraftExit(() => {
        if (!window.confirm('Retourner à la page principale ?\n\nLe tableau de bord et les groupes ouverts resteront disponibles pendant cette session.')) return;
        landingPortalRequested = true;
        appState.selectedStudentId = null;
        appState.activeView = 'viewHome';
        renderAll();
        window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
      });
    }

    function launchDemoOption(optionId) {
      if (!optionId) {
        showToast('Choisissez une classe de démonstration.');
        return;
      }
      const selectedOptionIds = [optionId];
      requestObservationDraftExit(() => {
        const wasPristine = isPristineInitialGroup();
        if (wasPristine) initializeExampleGroups(selectedOptionIds);
        else ensureExampleGroups(selectedOptionIds);
        const firstOption = DEMO_OPTIONS.find(option => selectedOptionIds.includes(option.id));
        const firstGroupId = firstOption && firstOption.groups[0] ? firstOption.groups[0].id : null;
        if (firstGroupId) switchGroup(firstGroupId);
        landingPortalRequested = false;
        appState.activeView = 'viewHome';
        expandedSubjectGroup = null;
        resetHomeDemoPanels();
        applyPrefs();
        renderAll();
        if (wasPristine) {
          history.undo = [];
          history.redo = [];
          history.last = getEditableStateSnapshot();
          updateHistoryButtons();
        }
      });
    }

    /** Met à jour le bandeau d'avertissement de sauvegarde du tableau de bord. */
    function renderHomeSaveCard() {
      const notice = document.getElementById('dashSaveNotice');
      const textEl = document.getElementById('dashSaveNoticeText');
      if (!notice || !textEl) return;

      const indicator = document.getElementById('fileSyncStatus');
      const indicatorStatus = indicator ? indicator.dataset.status : 'unlinked';
      const hasUnsaved = typeof getBackupSnapshot === 'function' && lastSavedFileSnapshot !== null
        ? getBackupSnapshot() !== lastSavedFileSnapshot
        : false;

      if (indicatorStatus === 'saving') {
        notice.classList.add('hidden');
        return;
      }
      if (fileWriteBlocked || indicatorStatus === 'error') {
        notice.dataset.status = 'error';
        textEl.textContent = 'Sauvegarde interrompue — téléchargez une copie depuis « Sauvegarder » dans la barre du haut.';
        notice.classList.remove('hidden');
        return;
      }
      if (activeFileHandle && !activeFileWritable) {
        notice.dataset.status = 'pending';
        textEl.textContent = `Fichier « ${activeFileHandle.name} » en lecture seule — cliquez sur « Sauvegarder » dans la barre du haut pour autoriser l’écriture.`;
        notice.classList.remove('hidden');
        return;
      }
      if (hasUnsaved || indicatorStatus === 'pending') {
        notice.dataset.status = 'pending';
        textEl.textContent = 'Modifications non sauvegardées — pensez à utiliser « Sauvegarder » dans la barre du haut avant de fermer cet onglet.';
        notice.classList.remove('hidden');
        return;
      }
      notice.classList.add('hidden');
    }

    /** Agrège l'avancement du groupe actif pour l'étape en cours. */
    function collectActiveGroupDashboardData() {
      const activeGroup = appState.groups.find(g => g.id === appState.activeGroupId) || null;
      const students = Array.isArray(appState.students) ? appState.students : [];
      const termData = (appState.terms && appState.terms[appState.activeTerm]) || { subjectData: {} };
      const visibleSubjects = typeof getVisibleSubjectsForContext === 'function'
        ? getVisibleSubjectsForContext(SUBJECTS_CONFIG)
        : SUBJECTS_CONFIG.slice();

      const disciplineMap = new Map();
      visibleSubjects.forEach(sub => {
        const key = (sub.group && sub.group !== 'presco') ? sub.group : sub.id;
        if (!disciplineMap.has(key)) {
          const label = sub.id === 'ccq_global'
            ? 'Culture et citoyenneté'
            : sub.prescoOnly
              ? sub.partLabel
              : (sub.tabLabel || (sub.group ? sub.groupLabel : sub.shortName));
          disciplineMap.set(key, {
            key,
            label,
            iconKey: sub.group || (sub.id === 'ccq_global' ? 'ccq' : 'maths'),
            isPresco: Boolean(sub.prescoOnly),
            firstPart: sub,
            parts: []
          });
        }
        disciplineMap.get(key).parts.push(sub);
      });

      const evalIds = new Set();
      let filledSlots = 0;
      let expectedSlots = 0;
      let commentsDone = 0;
      let commentsExpected = 0;
      const followups = [];
      const seenFollowups = new Set();
      const seenGlobalSlots = new Set();

      const disciplines = [...disciplineMap.values()].map(disc => {
        const discEvalIds = new Set();
        const seenDiscSlots = new Set();
        const applicableStudents = new Set();
        const studentsWithComment = new Set();
        let discFilled = 0;
        let discExpected = 0;
        let preferredPartId = disc.firstPart.id;
        let foundPopulatedPart = false;

        disc.parts.forEach(part => {
          const subData = termData.subjectData && termData.subjectData[part.id];
          const assignments = (subData && Array.isArray(subData.assignments)) ? subData.assignments : [];
          const records = (subData && subData.studentRecords) ? subData.studentRecords : {};
          if (!foundPopulatedPart && assignments.length > 0) {
            preferredPartId = part.id;
            foundPopulatedPart = true;
          }
          assignments.forEach(asg => {
            if (!asg) return;
            const key = asg.linkId ? `lnk:${asg.linkId}` : `id:${asg.id}`;
            discEvalIds.add(key);
            evalIds.add(key);
          });

          students.forEach(st => {
            if (!isSubjectApplicableForStudent(part, st)) return;
            applicableStudents.add(st.id);
            const rec = records[st.id];
            if (rec && typeof rec.comment === 'string' && rec.comment.trim()) {
              studentsWithComment.add(st.id);
            }
            assignments.forEach(asg => {
              if (!asg || !isAssignmentForStudent(asg, st)) return;
              const evalKey = asg.linkId ? `lnk:${asg.linkId}` : `id:${asg.id}`;
              const discSlotKey = `${st.id}::${evalKey}`;
              const rawVal = rec && rec.scores ? rec.scores[asg.id] : undefined;
              const valStr = String(rawVal ?? '').trim();
              const valUpper = valStr.toUpperCase();
              const meta = rec && rec.scoreMeta ? rec.scoreMeta[asg.id] : null;
              const flags = rec ? getCellFlags(rec, asg.id) : [];
              const isFilled = valStr !== '' || Boolean(asg.isObservation && meta && meta.notEvaluated === true);

              if (!seenDiscSlots.has(discSlotKey)) {
                seenDiscSlots.add(discSlotKey);
                discExpected += 1;
                if (isFilled) discFilled += 1;
              }
              if (!seenGlobalSlots.has(discSlotKey)) {
                seenGlobalSlots.add(discSlotKey);
                expectedSlots += 1;
                if (isFilled) filledSlots += 1;
              }

              const followupReason = valUpper === 'NR'
                ? 'Non remis'
                : valUpper === 'REP'
                  ? 'En reprise'
                  : (valUpper === 'JUST' || valUpper === 'JUS')
                    ? 'Justifié'
                    : flags.includes('ABS')
                      ? 'À reprendre'
                      : '';
              if (followupReason && !seenFollowups.has(discSlotKey)) {
                seenFollowups.add(discSlotKey);
                followups.push({
                  studentId: st.id,
                  studentName: st.name || 'Élève',
                  subjectId: part.id,
                  subjectLabel: disc.label,
                  asgTitle: asg.title || 'Évaluation',
                  reason: followupReason
                });
              }
            });
          });
        });

        commentsDone += studentsWithComment.size;
        commentsExpected += applicableStudents.size;

        let averagePct = null;
        if (!disc.isPresco && students.length > 0 && discEvalIds.size > 0) {
          const avgValues = [];
          if (disc.firstPart.singleResult) {
            students.forEach(st => {
              const partSummaries = disc.parts
                .filter(part => isSubjectApplicableForStudent(part, st))
                .map(part => computeStudentSubjectSummary(appState.activeTerm, part.id, st.id).finalPct)
                .filter(v => v !== null && Number.isFinite(v));
              const fallback = partSummaries.length
                ? Math.round(partSummaries.reduce((a, b) => a + b, 0) / partSummaries.length)
                : null;
              const pooled = computePooledGroupPct(appState.activeTerm, disc.parts, st.id, fallback);
              if (pooled !== null && Number.isFinite(pooled)) avgValues.push(pooled);
            });
          } else {
            disc.parts.forEach(part => {
              students.forEach(st => {
                if (!isSubjectApplicableForStudent(part, st)) return;
                const val = computeStudentSubjectSummary(appState.activeTerm, part.id, st.id).finalPct;
                if (val !== null && Number.isFinite(val)) avgValues.push(val);
              });
            });
          }
          if (avgValues.length) {
            averagePct = Math.round(avgValues.reduce((a, b) => a + b, 0) / avgValues.length);
          }
        }

        return {
          ...disc,
          preferredPartId,
          evalCount: discEvalIds.size,
          filledSlots: discFilled,
          expectedSlots: discExpected,
          missingCount: Math.max(0, discExpected - discFilled),
          averagePct
        };
      });

      return {
        activeGroup,
        students,
        disciplines,
        evalTotal: evalIds.size,
        filledSlots,
        expectedSlots,
        commentsDone,
        commentsExpected,
        followups
      };
    }

    function createKpiTile(label, value, detail, tone = '') {
      const tile = document.createElement('div');
      tile.className = `dash-kpi-card${tone ? ` is-${tone}` : ''}`;
      const lblEl = document.createElement('span');
      lblEl.className = 'dash-kpi-label';
      lblEl.textContent = label;
      const valEl = document.createElement('strong');
      valEl.className = 'dash-kpi-value';
      valEl.textContent = value;
      const detEl = document.createElement('span');
      detEl.className = 'dash-kpi-detail';
      detEl.textContent = detail;
      tile.append(lblEl, valEl, detEl);
      return tile;
    }

    /** Affiche le portrait complet de la classe active pour l'étape courante. */
    function renderActiveGroupOverview(activeStats) {
      const heading = document.getElementById('dashOverviewHeading');
      const meta = document.getElementById('dashOverviewMeta');
      const chips = document.getElementById('dashProfileChips');
      const kpiStrip = document.getElementById('dashKpiStrip');
      const subjectsGrid = document.getElementById('dashSubjectsGrid');
      const followupsWrap = document.getElementById('dashFollowupsWrap');
      const followupsList = document.getElementById('dashFollowupsList');
      if (!heading || !meta || !chips || !kpiStrip || !subjectsGrid || !followupsWrap || !followupsList) return;

      const data = collectActiveGroupDashboardData();
      const groupName = data.activeGroup ? data.activeGroup.name : 'Mon groupe';
      const studentCount = data.students.length;
      const levelLabel = activeStats ? activeStats.levelLabel : '';

      heading.textContent = `Portrait de la classe — ${groupName}`;
      meta.textContent = `${levelLabel ? `${levelLabel} · ` : ''}${studentCount} élève${studentCount > 1 ? 's' : ''} · Étape ${appState.activeTerm}`;

      chips.replaceChildren();
      if (studentCount === 0) {
        const addStudentsBtn = document.createElement('button');
        addStudentsBtn.type = 'button';
        addStudentsBtn.className = 'home-btn home-btn-primary home-btn-sm';
        addStudentsBtn.innerHTML = '<span>Ajouter des élèves</span><span class="home-arrow" aria-hidden="true">→</span>';
        addStudentsBtn.addEventListener('click', () => navigateToView('viewStudents'));
        chips.appendChild(addStudentsBtn);
      }

      kpiStrip.replaceChildren();
      const fillPct = data.expectedSlots > 0 ? Math.round((data.filledSlots / data.expectedSlots) * 100) : null;
      kpiStrip.append(
        createKpiTile(
          `Évaluations (Étape ${appState.activeTerm})`,
          String(data.evalTotal),
          data.evalTotal === 0 ? 'Aucune évaluation' : `Réparties sur ${data.disciplines.length} matière${data.disciplines.length > 1 ? 's' : ''}`
        ),
        createKpiTile(
          'Notes saisies',
          fillPct !== null ? `${fillPct} %` : '—',
          data.expectedSlots > 0 ? `${data.filledSlots} / ${data.expectedSlots} attendues` : 'Aucune évaluation'
        ),
        createKpiTile(
          'Commentaires',
          data.commentsExpected > 0 ? `${data.commentsDone} / ${data.commentsExpected}` : '—',
          data.commentsExpected > 0 ? 'Au bulletin par matière' : 'Ajoutez des élèves'
        ),
        createKpiTile(
          'Travaux en suivi',
          String(data.followups.length),
          data.followups.length > 0 ? 'NR, reprise ou justifié' : 'Aucun travail en attente',
          data.followups.length > 0 ? 'warn' : ''
        )
      );

      subjectsGrid.replaceChildren();
      if (studentCount === 0) {
        const empty = document.createElement('p');
        empty.className = 'dash-empty-note';
        empty.textContent = 'Ajoutez vos élèves dans Listes et groupes pour suivre l’avancement de l’étape ici.';
        subjectsGrid.appendChild(empty);
      } else {
        data.disciplines.forEach(disc => {
          const tile = document.createElement('button');
          tile.type = 'button';
          tile.className = 'dash-subject-card';
          tile.addEventListener('click', () => {
            navigateToView('viewGradebook', () => {
              appState.activeSubjectId = disc.preferredPartId;
              expandedSubjectGroup = (disc.firstPart.group && disc.firstPart.group !== 'presco') ? disc.firstPart.group : null;
            });
          });

          const top = document.createElement('div');
          top.className = 'dash-subject-top';
          const titleWrap = document.createElement('span');
          titleWrap.className = 'dash-subject-title-wrap';
          const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
          svg.setAttribute('class', 'dash-subject-icon');
          svg.setAttribute('viewBox', '0 0 24 24');
          svg.setAttribute('fill', 'none');
          svg.setAttribute('stroke', 'currentColor');
          svg.setAttribute('stroke-width', '1.8');
          svg.setAttribute('stroke-linecap', 'round');
          svg.setAttribute('stroke-linejoin', 'round');
          svg.setAttribute('aria-hidden', 'true');
          svg.innerHTML = (typeof subjectIcons !== 'undefined' && subjectIcons[disc.iconKey]) ? subjectIcons[disc.iconKey] : '';
          const nameSpan = document.createElement('strong');
          nameSpan.className = 'dash-subject-name';
          nameSpan.textContent = disc.label;
          titleWrap.append(svg, nameSpan);
          top.appendChild(titleWrap);

          if (!disc.isPresco && disc.averagePct !== null) {
            const avgSpan = document.createElement('span');
            avgSpan.className = 'dash-subject-avg';
            avgSpan.textContent = `${disc.averagePct} %`;
            top.appendChild(avgSpan);
          }

          const metaLine = document.createElement('div');
          metaLine.className = 'dash-subject-meta';
          const evalText = document.createElement('span');
          evalText.textContent = `${disc.evalCount} éval.`;
          metaLine.appendChild(evalText);

          const statusTag = document.createElement('span');
          if (disc.evalCount === 0 || disc.expectedSlots === 0) {
            statusTag.className = 'dash-subject-state is-muted';
            statusTag.textContent = 'Aucune éval.';
          } else if (disc.missingCount > 0) {
            statusTag.className = 'dash-subject-state is-warn';
            statusTag.textContent = `${disc.missingCount} manquante${disc.missingCount > 1 ? 's' : ''}`;
          } else {
            statusTag.className = 'dash-subject-state is-ok';
            statusTag.textContent = 'Saisie complète';
          }
          metaLine.appendChild(statusTag);

          tile.append(top, metaLine);

          if (disc.expectedSlots > 0) {
            const pct = Math.round((disc.filledSlots / disc.expectedSlots) * 100);
            const track = document.createElement('div');
            track.className = 'dash-progress-track';
            track.setAttribute('aria-hidden', 'true');
            const fill = document.createElement('span');
            fill.className = `dash-progress-fill${disc.missingCount === 0 ? ' is-complete' : ''}`;
            fill.style.width = `${pct}%`;
            track.appendChild(fill);
            tile.appendChild(track);
          }

          subjectsGrid.appendChild(tile);
        });
      }

      followupsList.replaceChildren();
      if (data.followups.length === 0) {
        followupsWrap.classList.add('hidden');
      } else {
        followupsWrap.classList.remove('hidden');
        const visibleItems = data.followups.slice(0, 8);
        visibleItems.forEach(item => {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'dash-followup-item';
          btn.addEventListener('click', () => jumpFromReportToSubject(item.subjectId, item.studentId));

          const left = document.createElement('span');
          left.className = 'dash-followup-main';
          const stuStrong = document.createElement('strong');
          stuStrong.textContent = item.studentName;
          const contextSpan = document.createElement('span');
          contextSpan.className = 'dash-followup-context';
          contextSpan.textContent = `${item.subjectLabel} · ${item.asgTitle}`;
          left.append(stuStrong, contextSpan);

          const right = document.createElement('span');
          right.className = 'dash-followup-right';
          const reasonPill = document.createElement('span');
          reasonPill.className = 'dash-followup-badge';
          reasonPill.textContent = item.reason;
          const arrow = document.createElement('span');
          arrow.className = 'home-arrow';
          arrow.setAttribute('aria-hidden', 'true');
          arrow.textContent = '→';
          right.append(reasonPill, arrow);

          btn.append(left, right);
          followupsList.appendChild(btn);
        });
        if (data.followups.length > visibleItems.length) {
          const more = document.createElement('p');
          more.className = 'dash-followup-more';
          const remaining = data.followups.length - visibleItems.length;
          more.textContent = `+ ${remaining} autre${remaining > 1 ? 's' : ''} travail${remaining > 1 ? 'x' : ''} en suivi dans l’étape.`;
          followupsList.appendChild(more);
        }
      }
    }

    function getGroupDashboardStats(group) {
      const isActive = group.id === appState.activeGroupId;
      const data = isActive ? appState : (appState.groupStore[group.id] || {});
      const students = Array.isArray(data.students) ? data.students : [];
      const studentCount = students.length;

      let levelLabel = '';
      if (group.level && GRADE_LEVEL_LABELS[group.level]) {
        levelLabel = GRADE_LEVEL_LABELS[group.level];
      } else {
        const levels = [...new Set(students.map(s => String(s.gradeLevel || '')).filter(lvl => GRADE_LEVEL_LABELS[lvl]))]
          .sort((a, b) => (a === 'P' ? -1 : b === 'P' ? 1 : Number(a) - Number(b)));
        if (levels.length === 1) {
          levelLabel = GRADE_LEVEL_LABELS[levels[0]];
        } else if (levels.length > 1) {
          const shortLabels = levels.map(l => (l === 'P' ? 'Présco' : `${l}${l === '1' ? 're' : 'e'}`));
          levelLabel = `${shortLabels.join(' / ')} année`;
        } else {
          levelLabel = 'Multiniveau';
        }
      }

      const subjectIds = Array.isArray(group.subjectIds) ? group.subjectIds : [];
      const subjectIdSet = new Set(subjectIds);
      const disciplineKeys = new Set();
      let hasPresco = false;
      ALL_SUBJECTS_CONFIG.forEach(sub => {
        if (!subjectIdSet.has(sub.id)) return;
        if (sub.prescoOnly) hasPresco = true;
        disciplineKeys.add(sub.group || sub.id);
      });
      const disciplineLabel = hasPresco && disciplineKeys.size === 1
        ? 'Préscolaire (5 comp.)'
        : `${disciplineKeys.size} matière${disciplineKeys.size > 1 ? 's' : ''}`;

      const term = data.terms && data.terms[appState.activeTerm];
      const seenEvalKeys = new Set();
      if (term && term.subjectData) {
        subjectIds.forEach(subId => {
          const subData = term.subjectData[subId];
          if (!subData || !Array.isArray(subData.assignments)) return;
          subData.assignments.forEach(asg => {
            if (!asg) return;
            seenEvalKeys.add(asg.linkId ? `lnk:${asg.linkId}` : `id:${asg.id}`);
          });
        });
      }

      return { studentCount, levelLabel, disciplineLabel, evalCount: seenEvalKeys.size };
    }

    function renderHomeDashboard() {
      const grid = document.getElementById('dashGroupsGrid');
      const countEl = document.getElementById('dashGroupsCount');
      const summaryMeta = document.getElementById('dashSummaryMeta');
      if (!grid || !countEl || !summaryMeta) return;
      document.querySelectorAll('[data-dash-term]').forEach(button =>
        button.setAttribute('aria-pressed', String(button.dataset.dashTerm === String(appState.activeTerm))));

      const groups = appState.groups.filter(g => g && !g.placeholder);
      const groupsSection = document.getElementById('dashGroupsSection');
      if (groupsSection) groupsSection.hidden = groups.length <= 1;
      let totalStudents = 0;
      const statsByGroupId = new Map();
      groups.forEach(g => {
        const stats = getGroupDashboardStats(g);
        statsByGroupId.set(g.id, stats);
        totalStudents += stats.studentCount;
      });

      summaryMeta.textContent = groups.length === 1
        ? `${groups[0].name} · ${totalStudents} élève${totalStudents > 1 ? 's' : ''} · Étape ${appState.activeTerm}`
        : `${groups.length} groupes · ${totalStudents} élève${totalStudents > 1 ? 's' : ''} · Étape ${appState.activeTerm}`;
      countEl.textContent = String(groups.length);
      renderHomeSaveCard();
      renderActiveGroupOverview(statsByGroupId.get(appState.activeGroupId));

      grid.replaceChildren();
      groups.forEach(group => {
        const isActive = group.id === appState.activeGroupId;
        const stats = statsByGroupId.get(group.id);

        const card = document.createElement('article');
        card.className = `dash-group-card${isActive ? ' is-active' : ''}`;

        const openBtn = document.createElement('button');
        openBtn.type = 'button';
        openBtn.className = 'dash-group-open';
        openBtn.addEventListener('click', () => {
          const targetView = stats.studentCount > 0 ? 'viewGradebook' : 'viewStudents';
          if (group.id !== appState.activeGroupId) {
            requestObservationDraftExit(() => {
              appState.activeView = targetView;
              expandedSubjectGroup = null;
              switchGroup(group.id);
              const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
              window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' });
            });
          } else {
            navigateToView(targetView);
          }
        });

        const topRow = document.createElement('div');
        topRow.className = 'dash-group-top';
        const nameEl = document.createElement('strong');
        nameEl.className = 'dash-group-name';
        nameEl.textContent = group.name || 'Groupe';
        topRow.appendChild(nameEl);

        const badges = document.createElement('div');
        badges.className = 'dash-group-badges';
        if (isActive) {
          const activeChip = document.createElement('span');
          activeChip.className = 'dash-chip is-active';
          activeChip.textContent = 'Actif';
          badges.appendChild(activeChip);
        }
        if (isExampleGroup(group)) {
          const demoChip = document.createElement('span');
          demoChip.className = 'dash-chip is-demo';
          demoChip.textContent = 'Démo';
          badges.appendChild(demoChip);
        }
        if (badges.childElementCount > 0) topRow.appendChild(badges);

        const metaRow = document.createElement('div');
        metaRow.className = 'dash-group-meta';
        metaRow.textContent = `${stats.levelLabel} · ${stats.studentCount} élève${stats.studentCount > 1 ? 's' : ''}`;

        const statsRow = document.createElement('div');
        statsRow.className = 'dash-group-stats';
        statsRow.textContent = `${stats.disciplineLabel} · ${stats.evalCount} éval. (Étape ${appState.activeTerm})`;

        const footRow = document.createElement('div');
        footRow.className = 'dash-group-foot';
        const openLabel = document.createElement('span');
        openLabel.className = 'dash-group-open-label';
        openLabel.textContent = 'Ouvrir ';
        const arrow = document.createElement('span');
        arrow.className = 'home-arrow';
        arrow.setAttribute('aria-hidden', 'true');
        arrow.textContent = '→';
        openLabel.appendChild(arrow);
        footRow.appendChild(openLabel);

        openBtn.append(topRow, metaRow, statsRow, footRow);

        const editBtn = document.createElement('button');
        editBtn.type = 'button';
        editBtn.className = 'dash-group-edit';
        editBtn.setAttribute('aria-label', `Modifier le groupe ${group.name}`);
        editBtn.title = `Modifier ${group.name}`;
        editBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>';
        editBtn.addEventListener('click', () => openGroupModal('edit', group.id));

        card.append(openBtn, editBtn);
        grid.appendChild(card);
      });

      const addCard = document.createElement('button');
      addCard.type = 'button';
      addCard.className = 'dash-group-card dash-group-card--add';
      addCard.addEventListener('click', () => openGroupModal('new'));
      const addIcon = document.createElement('span');
      addIcon.className = 'dash-add-plus';
      addIcon.setAttribute('aria-hidden', 'true');
      addIcon.textContent = '＋';
      const addTitle = document.createElement('strong');
      addTitle.textContent = 'Nouveau groupe';
      const addSub = document.createElement('span');
      addSub.textContent = 'Créer une classe ou un groupe supplémentaire';
      addCard.append(addIcon, addTitle, addSub);
      grid.appendChild(addCard);
    }

    function renderHomeView() {
      const hasGroup = hasActiveGroup();
      const showPortal = landingPortalRequested || !hasGroup;
      const portal = document.getElementById('homePortal');
      const dashboard = document.getElementById('homeDashboard');
      const returnButton = document.getElementById('homeBtnReturnDashboard');
      if (portal) portal.hidden = !showPortal;
      if (dashboard) dashboard.hidden = showPortal;
      if (returnButton) returnButton.hidden = !hasGroup || !landingPortalRequested;

      if (!hasGroup && !carnetIsSaved) {
        document.documentElement.setAttribute('data-palette', 'ocean');
        document.documentElement.classList.remove('theme-dark');
      }
      if (hasGroup && !showPortal) renderHomeDashboard();
    }

    function updateGradebookTopScroll() {
      const top = document.getElementById('gradebookTopScroll');
      const bottom = document.getElementById('gradebookScrollContainer');
      if (!top || !bottom) return;
      const table = bottom.querySelector('table');
      top.firstElementChild.style.width = `${table.scrollWidth}px`;
      const scrollable = bottom.scrollWidth > bottom.clientWidth + 1;
      top.classList.toggle('is-visible', scrollable);
      if (Math.abs(top.scrollLeft - bottom.scrollLeft) > 1) top.scrollLeft = bottom.scrollLeft;
      const frame = document.getElementById('gradebookFrame');
      if (!frame) return;
      const stickyCell = bottom.querySelector('thead th');
      const max = bottom.scrollWidth - bottom.clientWidth;
      frame.style.setProperty('--gb-sticky-w', `${stickyCell ? stickyCell.offsetWidth : 0}px`);
      frame.classList.toggle('gb-can-left', scrollable && bottom.scrollLeft > 2);
      frame.classList.toggle('gb-can-right', scrollable && bottom.scrollLeft < max - 2);
      positionGradebookArrows();
    }

    // Garde les flèches au centre de la portion visible du carnet.
    function positionGradebookArrows() {
      const frame = document.getElementById('gradebookFrame');
      if (!frame || !frame.offsetParent) return;
      const rect = frame.getBoundingClientRect();
      const middle = (Math.max(rect.top, 0) + Math.min(rect.bottom, window.innerHeight)) / 2 - rect.top;
      frame.style.setProperty('--gb-arrow-y', `${Math.max(28, Math.min(rect.height - 28, middle))}px`);
    }

    let gradebookScrollAnim = null;

    function scrollGradebookByColumn(direction) {
      const container = document.getElementById('gradebookScrollContainer');
      const cells = [...container.querySelectorAll('thead tr:first-child > th')];
      if (cells.length < 2) return;
      const stickyWidth = cells[0].offsetWidth;
      const stops = cells.slice(1).map(cell => cell.offsetLeft - stickyWidth);
      // Clics rapides : on part de la cible en cours pour avancer d'une évaluation à chaque clic.
      const current = gradebookScrollAnim ? gradebookScrollAnim.target : container.scrollLeft;
      const max = container.scrollWidth - container.clientWidth;
      let target = direction > 0 ? stops.find(stop => stop > current + 4) : stops.slice().reverse().find(stop => stop < current - 4);
      if (target === undefined) target = direction > 0 ? max : 0;
      target = Math.max(0, Math.min(max, target));
      if (gradebookScrollAnim) cancelAnimationFrame(gradebookScrollAnim.frame);
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        gradebookScrollAnim = null;
        container.scrollLeft = target;
        return;
      }
      // Animation pilotée image par image : le défilement « smooth » natif était interrompu par la synchronisation avec la barre du bas.
      const from = container.scrollLeft;
      const duration = 320;
      const start = performance.now();
      const anim = { target, frame: 0 };
      gradebookScrollAnim = anim;
      const step = now => {
        const t = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - t, 3);
        container.scrollLeft = from + (target - from) * eased;
        if (t < 1 && gradebookScrollAnim === anim) anim.frame = requestAnimationFrame(step);
        else if (gradebookScrollAnim === anim) gradebookScrollAnim = null;
      };
      anim.frame = requestAnimationFrame(step);
    }

    function isPristineInitialGroup() {
      const initial = createInitialState();
      const terms = JSON.parse(JSON.stringify(appState.terms));
      Object.values(terms).forEach(term => Object.values(term.subjectData).forEach(data => {
        const session = data.currentObsSession;
        if (session && Array.isArray(session.targetLevels) && !session.targetLevels.length) delete session.targetLevels;
      }));
      return ['groups', 'activeGroupId', 'groupStore', 'students', 'annualWeightMode', 'tagCategories']
        .every(key => JSON.stringify(appState[key]) === JSON.stringify(initial[key])) &&
        JSON.stringify(terms) === JSON.stringify(initial.terms);
    }

    function positionTour() {
      if (document.getElementById('tutorialOverlay').classList.contains('hidden')) return;
      const target = document.querySelector(tourSteps[tourIndex].target);
      const rect = target.getBoundingClientRect();
      const highlight = document.getElementById('tourHighlight');
      const left = Math.max(4, rect.left - 4);
      const top = Math.max(4, rect.top - 4);
      const right = Math.min(window.innerWidth - 4, rect.right + 4);
      const bottom = Math.min(window.innerHeight - 4, rect.bottom + 4);
      Object.assign(highlight.style, { left: `${left}px`, top: `${top}px`, width: `${Math.max(0, right - left)}px`, height: `${Math.max(0, bottom - top)}px` });
      const card = document.getElementById('tourCard');
      const cardRect = card.getBoundingClientRect();
      const cardLeft = Math.max(12, Math.min(window.innerWidth - cardRect.width - 12, left));
      const preferredTop = bottom + 12 + cardRect.height <= window.innerHeight - 12 ? bottom + 12 : top - cardRect.height - 12;
      const cardTop = Math.max(12, Math.min(window.innerHeight - cardRect.height - 12, preferredTop));
      Object.assign(card.style, { left: `${cardLeft}px`, top: `${cardTop}px` });
    }

    function renderTourStep() {
      const step = tourSteps[tourIndex];
      document.getElementById('tourProgress').textContent = `Étape ${tourIndex + 1} / ${tourSteps.length}`;
      document.getElementById('tourTitle').textContent = step.title;
      document.getElementById('tourDescription').textContent = step.description;
      document.getElementById('tourNext').textContent = tourIndex === tourSteps.length - 1 ? 'Terminer' : 'Suivant →';
      document.querySelector(step.target).scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'instant' });
      positionTour();
      document.getElementById('tourNext').focus();
    }

    function startTutorial() {
      requestObservationDraftExit(() => {
        tourPreviousView = appState.activeView;
        appState.activeView = 'viewGradebook';
        renderAll();
        tourIndex = 0;
        document.getElementById('tutorialOverlay').classList.remove('hidden');
        renderTourStep();
      });
    }

    function finishTutorial() {
      document.getElementById('tutorialOverlay').classList.add('hidden');
      if (tourPreviousView) appState.activeView = tourPreviousView;
      tourPreviousView = null;
      renderAll();
      if (!hasActiveGroup()) openGroupModal('new');
    }
