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
    let dashActiveTab = 'todo';
    let dashFollowupMode = 'student';
    let dashRadarFilter = 'watch';
    let dashRadarLevel = 'ALL';
    let dashPrivacyMasked = false;
    const dashOpenSubjectGroups = new Set();

    function setDashboardTab(tab) {
      dashActiveTab = tab === 'students' ? 'students' : 'todo';
      renderHomeDashboard();
    }

    function setDashboardFollowupMode(mode) {
      dashFollowupMode = mode === 'assignment' ? 'assignment' : 'student';
      renderHomeDashboard();
    }

    function toggleDashboardPrivacyMask() {
      dashPrivacyMasked = !dashPrivacyMasked;
      renderHomeDashboard();
    }

    function setDemoPanelOpen(toggleId, panelId, open, immediate = false) {
      const toggle = document.getElementById(toggleId);
      const panel = document.getElementById(panelId);
      if (!toggle || !panel) return;
      const isOpen = !!open;
      toggle.setAttribute('aria-expanded', String(isOpen));
      panel.setAttribute('aria-hidden', String(!isOpen));
      if ('inert' in panel) panel.inert = !isOpen;

      if (typeof panel._collapseCleanup === 'function') {
        panel._collapseCleanup();
        panel._collapseCleanup = null;
      }

      const reduced = immediate || (typeof isReducedMotionEnabled === 'function' && isReducedMotionEnabled());
      if (reduced) {
        panel.classList.toggle('is-open', isOpen);
        panel.style.height = isOpen ? 'auto' : '0px';
        return;
      }

      const inner = panel.querySelector('.home-demo-collapse-inner') || panel.firstElementChild;
      const targetHeight = inner ? Math.ceil(inner.scrollHeight) : 0;

      if (isOpen) {
        if (panel.classList.contains('is-open') && panel.style.height === 'auto') return;
        const startHeight = Math.round(panel.getBoundingClientRect().height);
        panel.style.height = `${startHeight}px`;
        void panel.offsetHeight;
        panel.classList.add('is-open');
        panel.style.height = `${targetHeight}px`;

        const finishOpen = () => {
          panel.removeEventListener('transitionend', onEnd);
          window.clearTimeout(fallbackTimer);
          panel._collapseCleanup = null;
          if (panel.classList.contains('is-open')) {
            panel.style.height = 'auto';
          }
        };
        const onEnd = event => {
          if (event.target === panel && event.propertyName === 'height') finishOpen();
        };
        panel.addEventListener('transitionend', onEnd);
        const fallbackTimer = window.setTimeout(finishOpen, 340);
        panel._collapseCleanup = () => {
          panel.removeEventListener('transitionend', onEnd);
          window.clearTimeout(fallbackTimer);
        };
      } else {
        if (!panel.classList.contains('is-open') && (panel.style.height === '0px' || !panel.style.height)) return;
        const currentHeight = Math.round(panel.getBoundingClientRect().height);
        panel.style.height = `${currentHeight}px`;
        void panel.offsetHeight;
        panel.classList.remove('is-open');
        panel.style.height = '0px';

        const finishClose = () => {
          panel.removeEventListener('transitionend', onEnd);
          window.clearTimeout(fallbackTimer);
          panel._collapseCleanup = null;
        };
        const onEnd = event => {
          if (event.target === panel && event.propertyName === 'height') finishClose();
        };
        panel.addEventListener('transitionend', onEnd);
        const fallbackTimer = window.setTimeout(finishClose, 340);
        panel._collapseCleanup = () => {
          panel.removeEventListener('transitionend', onEnd);
          window.clearTimeout(fallbackTimer);
        };
      }
    }

    function resetHomeDemoPanels() {
      setDemoPanelOpen('homeDemoToggle', 'homeDemoPanel', false, true);
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
      const open = typeof hasActiveGroup === 'function' ? hasActiveGroup() : false;
      button.disabled = !open;
      button.classList.toggle('is-disabled-by-save', false);
      button.title = open
        ? 'Fermer le carnet et effacer les données de cet onglet'
        : 'Aucun carnet ouvert';
    }

    function returnToLandingPortal() {
      requestObservationDraftExit(() => {
        if (!window.confirm('Retourner à la page principale ?\n\nLe tableau de bord et les groupes ouverts resteront disponibles pendant cette session.')) return;
        landingPortalRequested = true;
        appState.selectedStudentId = null;
        appState.activeView = 'viewHome';
        renderAll();
        window.scrollTo({ top: 0, behavior: isReducedMotionEnabled() ? 'auto' : 'smooth' });
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

    const PRESCHOOL_CONSTAT_SHORT = {
      4: 'Très bien',
      3: 'Adéquatement',
      2: 'Certaines difficultés',
      1: 'Difficultés importantes',
      0: 'À observer'
    };

    /** Vérifie si une matière possède un brouillon d'observation non enregistré au carnet. */
    function hasActiveObsSessionDraft(subData) {
      const session = subData && subData.currentObsSession;
      if (!session || typeof session !== 'object') return false;
      if (session.editingAssignmentId || String(session.title || '').trim() || session.customRubric) return true;
      if (Array.isArray(session.linkTargets) && session.linkTargets.length > 0) return true;
      const drafts = session.studentDrafts && typeof session.studentDrafts === 'object'
        ? Object.values(session.studentDrafts)
        : [];
      return drafts.some(draft => draft && typeof draft === 'object' && (
        (Array.isArray(draft.checked) && draft.checked.length > 0) ||
        (draft.criteria && typeof draft.criteria === 'object' && Object.keys(draft.criteria).length > 0) ||
        draft.ilssPalier ||
        draft.ilssCote ||
        (Array.isArray(draft.quickComments) && draft.quickComments.length > 0) ||
        draft.overrideCode ||
        (Array.isArray(draft.tags) && draft.tags.length > 0) ||
        Boolean(String(draft.comment || '').trim()) ||
        Boolean(String(draft.strengths || '').trim()) ||
        Boolean(String(draft.challenges || '').trim()) ||
        draft.notEvaluated === true
      ));
    }

    /** Convertit un pourcentage interne préscolaire en rang de constat (1 à 4). */
    function getPreschoolConstatRank(pct) {
      if (pct === null || !Number.isFinite(pct) || typeof pctToClosestGradeCode !== 'function') return 0;
      const family = String(pctToClosestGradeCode(pct)).charAt(0);
      return ({ A: 4, B: 4, C: 3, D: 2, E: 1 })[family] || 0;
    }

    /** Retourne un libellé très court pour la micro-bande d'un élève. */
    function getCompactSubjectBadgeLabel(sub, displaySub) {
      if (!sub) return '';
      if (sub.prescoOnly) {
        const part = String((displaySub && displaySub.partLabel) || sub.partLabel || '');
        if (part.startsWith('Physique')) return 'Physique';
        return part.split(/\s+/)[0] || part;
      }
      const exactLabels = {
        math_resoudre: 'Math C1',
        math_raisonner: 'Math C2',
        fra_lecture: 'Lecture',
        fra_ecriture: 'Écriture',
        fra_oral: 'Oral',
        sciences_global: 'Sci. C1',
        sciences_outils: 'Sci. C2',
        sciences_comm: 'Sci. C3',
        univers_social: 'U.S. C1',
        us_changement: 'U.S. C2',
        us_diversite: 'U.S. C3',
        ccq_global: 'CCQ',
        ilss_oral: 'ILSS Oral',
        ilss_lecture: 'ILSS Lect.',
        ilss_ecriture: 'ILSS Écr.'
      };
      if (exactLabels[sub.id]) return exactLabels[sub.id];
      const match = String(sub.id || '').match(/_(c\d+(?:c\d+)?)$/i);
      const compSuffix = match ? ` ${match[1].toUpperCase()}` : '';
      const grp = sub.group || sub.id;
      const prefixes = {
        maths: 'Math',
        anglais: 'Angl.',
        sciences: 'Sci.',
        social: 'U.S.',
        univers_social: 'U.S.',
        ccq: 'CCQ',
        art_dram: 'Art dr.',
        art_plast: 'Arts pl.',
        arts_plastiques: 'Arts pl.',
        education_physique: 'ÉPS'
      };
      const base = prefixes[grp] || (displaySub && displaySub.tabLabel) || sub.tabLabel || sub.shortName || sub.id;
      return compSuffix && !base.includes(compSuffix.trim()) ? `${base}${compSuffix}` : base;
    }

    /** Compte rapidement les points d'attention opérationnels d'un groupe donné (cartes multi-groupes). */
    function countGroupUrgentActions(group, termId) {
      if (!group) return 0;
      const isActive = group.id === appState.activeGroupId;
      const data = isActive ? appState : (appState.groupStore[group.id] || {});
      const students = Array.isArray(data.students) ? data.students : [];
      const subjectIds = Array.isArray(group.subjectIds) ? group.subjectIds : [];
      const term = data.terms && data.terms[String(termId || appState.activeTerm)];
      if (!term || !term.subjectData) return 0;

      let count = 0;
      const seenSlots = new Set();
      subjectIds.forEach(subId => {
        const subData = term.subjectData[subId];
        if (!subData) return;
        const sub = ALL_SUBJECTS_CONFIG.find(item => item.id === subId);
        if (hasActiveObsSessionDraft(subData)) count += 1;
        const assignments = Array.isArray(subData.assignments) ? subData.assignments : [];
        if (sub && !sub.prescoOnly && !sub.isIlss && assignments.length > 0 && typeof isWeightSumValid100 === 'function') {
          if (!isWeightSumValid100(subData)) count += 1;
        }
        const records = subData.studentRecords || {};
        students.forEach(st => {
          const rec = records[st.id];
          if (!rec) return;
          assignments.forEach(asg => {
            if (!asg) return;
            const key = `${st.id}::${asg.linkId ? `lnk:${asg.linkId}` : `id:${asg.id}`}`;
            if (seenSlots.has(key)) return;
            const valUpper = String((rec.scores && rec.scores[asg.id]) ?? '').trim().toUpperCase();
            const flags = rec && typeof getCellFlags === 'function' ? getCellFlags(rec, asg.id) : [];
            if (valUpper === 'NR' || valUpper === 'REP' || flags.includes('ABS')) {
              seenSlots.add(key);
              count += 1;
            }
          });
        });
      });
      return count;
    }

    /** Agrège toutes les données actionnables et de vigie du groupe actif pour l'étape courante. */
    function collectActiveGroupDashboardData() {
      const termId = String(appState.activeTerm || '1');
      const prevTermId = termId === '3' ? '2' : termId === '2' ? '1' : null;
      const activeGroup = appState.groups.find(g => g.id === appState.activeGroupId) || null;
      const students = Array.isArray(appState.students) ? appState.students : [];
      const termData = (appState.terms && appState.terms[termId]) || { subjectData: {}, observations: [] };
      const visibleSubjects = typeof getVisibleSubjectsForContext === 'function'
        ? getVisibleSubjectsForContext(SUBJECTS_CONFIG)
        : SUBJECTS_CONFIG.slice();
      const presentLevels = typeof getPresentStudentLevels === 'function'
        ? getPresentStudentLevels()
        : [];
      const isMulti = presentLevels.length > 1;
      const isPrescoGroup = visibleSubjects.length > 0 && visibleSubjects.every(s => Boolean(s.prescoOnly));

      const blockers = [];
      const inProgress = [];
      const followups = [];
      const seenFollowups = new Set();
      let justifiedCount = 0;
      const seenJustified = new Set();
      const priorityComments = [];
      const studentSignalsMap = new Map();

      students.forEach(st => {
        studentSignalsMap.set(st.id, {
          student: st,
          adaptSummary: typeof getStudentAdaptationSummary === 'function'
            ? getStudentAdaptationSummary(st)
            : { adaptations: [], hasModified: false },
          pills: [],
          below60: [],
          drops: [],
          aidePlusCount: 0,
          challengeCounts: new Map(),
          followupItems: [],
          incompleteModified: [],
          evalsWithClassWork: 0,
          evalsCompletedByStudent: 0
        });
      });

      const missingLevelCount = students.filter(st => !String(st.gradeLevel || '').trim()).length;
      if (missingLevelCount > 0) {
        blockers.push({
          kind: 'missing-level',
          badge: 'Configuration',
          badgeTone: 'warn',
          title: `${missingLevelCount} élève${missingLevelCount > 1 ? 's' : ''} sans niveau scolaire`,
          detail: 'Le niveau règle les grilles du bon cycle dans les carnets.',
          actionLabel: 'Compléter les niveaux',
          onClick: () => navigateToView('viewStudents')
        });
      }

      const competencies = visibleSubjects.map((sub, subIdx) => {
        const displaySub = typeof getSubjectContextDisplay === 'function'
          ? getSubjectContextDisplay(sub)
          : { shortName: sub.shortName, partLabel: sub.partLabel, officialWeightLabel: sub.officialWeight ? `${sub.officialWeight} %` : '' };
        const label = sub.prescoOnly
          ? (displaySub.partLabel || displaySub.shortName)
          : (displaySub.shortName || displaySub.fullName);
        const subData = termData.subjectData && termData.subjectData[sub.id];
        const assignments = (subData && Array.isArray(subData.assignments)) ? subData.assignments : [];
        const records = (subData && subData.studentRecords) ? subData.studentRecords : {};

        if (hasActiveObsSessionDraft(subData)) {
          const draftTitle = String(subData.currentObsSession && subData.currentObsSession.title || '').trim();
          blockers.push({
            kind: 'obs-draft',
            badge: 'Brouillon',
            badgeTone: 'brand',
            title: `Trace observable non enregistrée — ${label}`,
            detail: draftTitle ? `Activité « ${draftTitle} » en attente d’enregistrement au carnet.` : 'Une grille commencée n’a pas encore été enregistrée au carnet.',
            actionLabel: 'Reprendre la grille',
            onClick: () => {
              if (sub.isIlss && typeof startIlssObservationSession === 'function') {
                appState.activeSubjectId = sub.id;
                expandedSubjectGroup = sub.group || null;
                startIlssObservationSession(sub, (subData.currentObsSession && subData.currentObsSession.editingAssignmentId) || '');
                return;
              }
              navigateToView('viewQuickObs', () => {
                appState.activeSubjectId = sub.id;
                expandedSubjectGroup = (sub.group && sub.group !== 'presco') ? sub.group : null;
              });
            }
          });
        }

        let weightValid = null;
        let weightIssueText = '';
        let invalidWeightLevel = '';
        if (!sub.prescoOnly && !sub.isIlss && assignments.length > 0 && typeof isWeightSumValid100 === 'function') {
          if (isMulti && presentLevels.length > 0 && typeof isLevelWeightSumValid100 === 'function') {
            const invalidLevels = [];
            presentLevels.forEach(lvl => {
              const hasForLvl = assignments.some(asg => typeof isAssignmentForLevel === 'function' && isAssignmentForLevel(asg, lvl));
              if (!hasForLvl) return;
              if (!isLevelWeightSumValid100(subData, lvl)) {
                const total = typeof getTotalAssignmentWeightsForLevel === 'function'
                  ? Math.round(getTotalAssignmentWeightsForLevel(subData, lvl))
                  : 0;
                const shortLvl = lvl === '1' ? '1re' : `${lvl}e`;
                invalidLevels.push({ lvl, label: `${shortLvl} (${total} %)` });
              }
            });
            weightValid = invalidLevels.length === 0;
            if (!weightValid) {
              invalidWeightLevel = invalidLevels[0].lvl;
              weightIssueText = invalidLevels.map(item => item.label).join(' · ');
            }
          } else {
            weightValid = isWeightSumValid100(subData);
            if (!weightValid && typeof getTotalAssignmentWeightsForLevel === 'function') {
              weightIssueText = `${Math.round(getTotalAssignmentWeightsForLevel(subData, ''))} % au total`;
            }
          }
          if (weightValid === false) {
            blockers.push({
              kind: 'weight',
              badge: 'Pondération',
              badgeTone: 'warn',
              title: `Pondération à ajuster — ${label}`,
              detail: `${weightIssueText || 'La somme des travaux'} (devrait totaliser 100 %).`,
              actionLabel: 'Ajuster les poids',
              onClick: () => navigateToView('viewGradebook', () => {
                appState.activeSubjectId = sub.id;
                expandedSubjectGroup = (sub.group && sub.group !== 'presco') ? sub.group : null;
                gbLevelFilter = invalidWeightLevel || 'ALL';
                weightMode = true;
                weightLevel = invalidWeightLevel || '';
                weightScope = [appState.activeGroupId, appState.activeTerm, sub.id].join('|');
              })
            });
          }
        }

        let writtenCount = 0;
        let obsCount = 0;
        assignments.forEach((asg, asgIdx) => {
          if (!asg) return;
          if (asg.isObservation) obsCount += 1;
          else writtenCount += 1;

          const missingNames = [];
          let firstMissingStudentId = null;
          let partialObsCount = 0;
          let firstPartialStudentId = null;
          let unconfirmedLinkedCount = 0;
          let applicableForAsg = 0;

          students.forEach(st => {
            if (!isSubjectApplicableForStudent(sub, st) || !isAssignmentForStudent(asg, st)) return;
            applicableForAsg += 1;
            const rec = records[st.id];
            const rawVal = rec && rec.scores ? rec.scores[asg.id] : undefined;
            const valStr = String(rawVal ?? '').trim();
            const valUpper = valStr.toUpperCase();
            const meta = rec && rec.scoreMeta ? rec.scoreMeta[asg.id] : null;
            const flags = rec && typeof getCellFlags === 'function' ? getCellFlags(rec, asg.id) : [];

            const isNotEval = Boolean(asg.isObservation && meta && meta.notEvaluated === true);
            let hasScore = valStr !== '' || isNotEval;
            let isPartialTrace = Boolean(asg.isObservation && meta && meta.hasData && meta.isComplete === false && valStr === '');
            let isLinkedPending = Boolean(meta && meta.linkedCopy === true);
            if (sub.isIlss && typeof getIlssAssignmentResult === 'function') {
              const ilssRes = getIlssAssignmentResult(sub, termId, asg, st);
              const critCount = ilssRes.meta && ilssRes.meta.criteria ? Object.keys(ilssRes.meta.criteria).length : 0;
              hasScore = Boolean(ilssRes.palier || ilssRes.cote);
              isPartialTrace = Boolean(asg.isObservation && critCount > 0 && !hasScore);
              isLinkedPending = false;
            }

            const radarEntry = studentSignalsMap.get(st.id);
            if (radarEntry) {
              radarEntry.evalsWithClassWork += 1;
              if (hasScore || isPartialTrace) radarEntry.evalsCompletedByStudent += 1;
              if (flags.includes('AIDE+') || flags.includes('AIDE1')) radarEntry.aidePlusCount += 1;
              if (meta && Array.isArray(meta.tags) && typeof groupObservationTags === 'function') {
                const grouped = groupObservationTags(meta.tags);
                (grouped.challenges || []).forEach(tag => {
                  radarEntry.challengeCounts.set(tag, (radarEntry.challengeCounts.get(tag) || 0) + 1);
                });
              }
              if (sub.isIlss && meta && Array.isArray(meta.quickComments) && typeof ILSS_OBSERVATION_PAIRS !== 'undefined') {
                const pairs = ILSS_OBSERVATION_PAIRS[sub.ilssCompetency] || [];
                meta.quickComments.forEach(txt => {
                  if (pairs.some(pair => pair[1] === txt)) {
                    radarEntry.challengeCounts.set(txt, (radarEntry.challengeCounts.get(txt) || 0) + 1);
                  }
                });
              }
            }

            if (isPartialTrace) {
              partialObsCount += 1;
              if (!firstPartialStudentId) firstPartialStudentId = st.id;
            } else if (!hasScore) {
              missingNames.push(st.name || 'Élève');
              if (!firstMissingStudentId) firstMissingStudentId = st.id;
            }
            if (isLinkedPending) unconfirmedLinkedCount += 1;

            const evalKey = asg.linkId ? `lnk:${asg.linkId}` : `id:${asg.id}`;
            const slotKey = `${st.id}::${evalKey}`;
            const followupReason = valUpper === 'NR'
              ? 'Non remis'
              : valUpper === 'REP'
                ? 'En reprise'
                : flags.includes('ABS')
                  ? 'À reprendre'
                  : '';

            if (followupReason && !seenFollowups.has(slotKey)) {
              seenFollowups.add(slotKey);
              const fItem = {
                studentId: st.id,
                studentName: st.name || 'Élève',
                subjectId: sub.id,
                subjectGroup: sub.group || '',
                subjectLabel: label,
                asgId: asg.id,
                asgTitle: asg.title || 'Évaluation',
                asgDate: asg.date || '',
                reason: followupReason
              };
              followups.push(fItem);
              if (radarEntry) radarEntry.followupItems.push(fItem);
            } else if ((valUpper === 'JUST' || valUpper === 'JUS') && !seenJustified.has(slotKey)) {
              seenJustified.add(slotKey);
              justifiedCount += 1;
            }
          });

          const sortStamp = String(asg.date || '');
          const evalOrder = (assignments.length - asgIdx);
          const firstFocusStudent = firstPartialStudentId || firstMissingStudentId || (students[0] && students[0].id) || null;
          const entryBase = {
            asgId: asg.id,
            title: asg.title || 'Évaluation',
            date: sortStamp,
            isObservation: Boolean(asg.isObservation),
            isIlss: Boolean(sub.isIlss),
            subjectId: sub.id,
            subjectGroup: sub.group || '',
            subjectLabel: label,
            applicableCount: applicableForAsg,
            missingCount: missingNames.length,
            missingPreview: missingNames.slice(0, 3),
            partialObsCount,
            unconfirmedLinkedCount,
            firstStudentId: firstFocusStudent,
            orderScore: (sortStamp ? Date.parse(`${sortStamp}T12:00:00`) || 0 : 0) + evalOrder + (subIdx * 0.001)
          };
          if (applicableForAsg > 0 && (missingNames.length > 0 || partialObsCount > 0 || unconfirmedLinkedCount > 0)) {
            inProgress.push(entryBase);
          }
        });

        const distribution = sub.prescoOnly
          ? { 4: 0, 3: 0, 2: 0, 1: 0 }
          : sub.isIlss
            ? { p1: 0, p2: 0, p3: 0, p4: 0, p5: 0 }
            : { A: 0, B: 0, C: 0, D: 0, E: 0 };
        let applicableCount = 0;
        let evaluatedCount = 0;

        students.forEach(st => {
          if (!isSubjectApplicableForStudent(sub, st)) return;
          applicableCount += 1;
          const radarEntry = studentSignalsMap.get(st.id);
          const rec = records[st.id];
          if (sub.isIlss) {
            const ilssFinal = typeof getIlssFinalJudgment === 'function'
              ? getIlssFinalJudgment(sub, termId, st)
              : { palier: '', cote: '' };
            const ilssLabel = typeof formatIlssResult === 'function' ? formatIlssResult(ilssFinal) : '';
            if (ilssFinal.palier || ilssFinal.cote) evaluatedCount += 1;
            if (ilssFinal.palier && Object.prototype.hasOwnProperty.call(distribution, `p${ilssFinal.palier}`)) {
              distribution[`p${ilssFinal.palier}`] += 1;
            }
            if (radarEntry) {
              radarEntry.pills.push({
                subjectId: sub.id,
                shortLabel: getCompactSubjectBadgeLabel(sub, displaySub),
                fullLabel: label,
                code: ilssLabel || '—',
                ilssCote: ilssFinal.cote || '',
                pct: null,
                isIlss: true,
                isPresco: false,
                isModified: false
              });
              if (ilssFinal.cote === 'D') {
                radarEntry.below60.push({ subjectId: sub.id, label, pct: null, ilssCote: 'D', ilssLabel: ilssLabel || 'Cote D' });
              }
            }
            const ilssComment = st.ilssByTerm?.[termId]?.judgments?.[sub.ilssCompetency]?.comment;
            if (ilssFinal.cote === 'D' && !(typeof ilssComment === 'string' && ilssComment.trim())) {
              priorityComments.push({
                studentId: st.id,
                studentName: st.name || 'Élève',
                subjectId: sub.id,
                subjectGroup: sub.group || '',
                subjectLabel: label,
                statusText: ilssLabel || 'Cote D',
                isIlss: true
              });
            }
            return;
          }
          const sum = computeStudentSubjectSummary(termId, sub.id, st.id);
          const finalPct = sum && sum.finalPct !== null && Number.isFinite(sum.finalPct) ? sum.finalPct : null;
          const isModified = typeof isSubjectModifiedForStudent === 'function' && isSubjectModifiedForStudent(st, sub);
          const cycle = typeof getStudentCycle === 'function' ? getStudentCycle(st.gradeLevel) : null;
          const isFeedbackOnly = cycle === 1 && ['sciences', 'social'].includes(sub.group || sub.id);

          if (finalPct !== null) {
            evaluatedCount += 1;
          }

          if (sub.prescoOnly) {
            const rank = getPreschoolConstatRank(finalPct);
            if (rank > 0) distribution[rank] += 1;
            if (radarEntry) {
              radarEntry.pills.push({
                subjectId: sub.id,
                shortLabel: getCompactSubjectBadgeLabel(sub, displaySub),
                fullLabel: label,
                code: rank ? String(rank) : '—',
                rank,
                pct: null,
                isPresco: true,
                isModified
              });
              if (rank > 0 && rank <= 2) {
                radarEntry.below60.push({ subjectId: sub.id, label, pct: null, constatRank: rank });
              }
              if (prevTermId && rank > 0) {
                const prevSum = computeStudentSubjectSummary(prevTermId, sub.id, st.id);
                const prevRank = getPreschoolConstatRank(prevSum ? prevSum.finalPct : null);
                if (prevRank > 0 && rank < prevRank) {
                  radarEntry.drops.push({ subjectId: sub.id, label, diff: rank - prevRank, isPresco: true });
                }
              }
            }
            if (rank > 0 && rank <= 2 && !(rec && typeof rec.comment === 'string' && rec.comment.trim())) {
              priorityComments.push({
                studentId: st.id,
                studentName: st.name || 'Élève',
                subjectId: sub.id,
                subjectGroup: sub.group || '',
                subjectLabel: label,
                statusText: PRESCHOOL_CONSTAT_SHORT[rank]
              });
            }
          } else {
            const code = finalPct !== null && typeof pctToClosestGradeCode === 'function'
              ? pctToClosestGradeCode(finalPct)
              : null;
            const family = code ? String(code).charAt(0) : null;
            if (family && Object.prototype.hasOwnProperty.call(distribution, family)) {
              distribution[family] += 1;
            }
            if (radarEntry) {
              radarEntry.pills.push({
                subjectId: sub.id,
                shortLabel: getCompactSubjectBadgeLabel(sub, displaySub),
                fullLabel: label,
                code: code || '—',
                family: family || '',
                pct: finalPct,
                isPresco: false,
                isModified
              });
              if (!isFeedbackOnly && finalPct !== null && finalPct < 60) {
                radarEntry.below60.push({ subjectId: sub.id, label, pct: finalPct, code });
              }
              if (!isFeedbackOnly && prevTermId && finalPct !== null) {
                const prevSum = computeStudentSubjectSummary(prevTermId, sub.id, st.id);
                const prevPct = prevSum && prevSum.finalPct !== null && Number.isFinite(prevSum.finalPct) ? prevSum.finalPct : null;
                if (prevPct !== null && (finalPct - prevPct) <= -5) {
                  radarEntry.drops.push({ subjectId: sub.id, label, diff: Math.round(finalPct - prevPct), isPresco: false });
                }
              }
            }
            if (!isFeedbackOnly && finalPct !== null && finalPct < 60 && !(rec && typeof rec.comment === 'string' && rec.comment.trim())) {
              priorityComments.push({
                studentId: st.id,
                studentName: st.name || 'Élève',
                subjectId: sub.id,
                subjectGroup: sub.group || '',
                subjectLabel: label,
                statusText: `${finalPct} %`
              });
            }
          }

          if (isModified && typeof getIncompleteModifiedCompetency === 'function') {
            const missingMod = getIncompleteModifiedCompetency(st, sub);
            if (missingMod && missingMod.missing && missingMod.missing.length > 0) {
              const firstScale = missingMod.missing[0];
              if (radarEntry) radarEntry.incompleteModified.push({ label, tabId: missingMod.tabId, scaleId: firstScale.id });
              blockers.push({
                kind: 'modified-comp',
                badge: 'MOD.',
                badgeTone: 'warn',
                title: `Échelle de compétence manquante — ${st.name || 'Élève'} (${label})`,
                detail: 'Ce bulletin modifié requiert de positionner le niveau de compétence.',
                actionLabel: 'Positionner',
                onClick: () => {
                  const opened = navigateToView('viewGlobalReport', () => {
                    appState.selectedStudentId = st.id;
                  });
                  if (opened && typeof beginMissingModifiedCompetencyGuide === 'function') {
                    window.setTimeout(() => beginMissingModifiedCompetencyGuide(st.id, missingMod.tabId, firstScale.id), 60);
                  }
                }
              });
            }
          }
        });

        const rawWeight = displaySub && displaySub.officialWeight !== undefined && displaySub.officialWeight !== null
          ? displaySub.officialWeight
          : sub.officialWeight;
        let fallbackWeight = null;
        if (rawWeight === null || rawWeight === undefined || !Number.isFinite(Number(rawWeight))) {
          if (sub.id === 'fra_lecture' || sub.id === 'fra_ecriture') fallbackWeight = 40;
          else if (sub.id === 'fra_oral') fallbackWeight = 20;
          else if (sub.id === 'math_resoudre' || sub.id === 'math_raisonner') {
            const lvlPool = presentLevels.length
              ? presentLevels
              : (activeGroup && activeGroup.level ? [String(activeGroup.level)] : []);
            const allCycle1 = lvlPool.length > 0 && lvlPool.every(lvl => lvl === '1' || lvl === '2');
            const allCycle23 = lvlPool.length > 0 && lvlPool.every(lvl => ['3', '4', '5', '6'].includes(lvl));
            if (allCycle1) fallbackWeight = sub.id === 'math_resoudre' ? 20 : 80;
            else if (allCycle23) fallbackWeight = sub.id === 'math_resoudre' ? 30 : 70;
          }
        }
        const effectiveWeight = (rawWeight !== null && rawWeight !== undefined && Number.isFinite(Number(rawWeight)))
          ? Number(rawWeight)
          : fallbackWeight;
        const officialWeightLabel = !sub.prescoOnly && !sub.singleResult && !sub.isIlss
          ? (effectiveWeight !== null
            ? `${effectiveWeight} %`
            : displaySub.officialWeightLabel
              ? displaySub.officialWeightLabel.replace(/^Pondération bulletin\s*:\s*/i, '')
              : '')
          : '';

        return {
          sub,
          displaySub,
          label,
          iconKey: sub.group || (sub.id === 'ccq_global' ? 'ccq' : 'maths'),
          isPresco: Boolean(sub.prescoOnly),
          isIlss: Boolean(sub.isIlss),
          officialWeightLabel,
          writtenCount,
          obsCount,
          evalCount: assignments.length,
          applicableCount,
          evaluatedCount,
          weightValid,
          weightIssueText,
          invalidWeightLevel,
          distribution
        };
      });

      inProgress.sort((a, b) => b.orderScore - a.orderScore);

      // Ajouter les défis répétés issus du journal d'observations libres
      const freeObs = Array.isArray(termData.observations) ? termData.observations : [];
      freeObs.forEach(obs => {
        if (!obs || !obs.studentId) return;
        const radarEntry = studentSignalsMap.get(obs.studentId);
        if (!radarEntry) return;
        radarEntry.evalsCompletedByStudent += 1;
        if (Array.isArray(obs.tags) && typeof groupObservationTags === 'function') {
          const grouped = groupObservationTags(obs.tags);
          (grouped.challenges || []).forEach(tag => {
            radarEntry.challengeCounts.set(tag, (radarEntry.challengeCounts.get(tag) || 0) + 1);
          });
        }
      });

      const studentRadar = [...studentSignalsMap.values()].map(entry => {
        const repeatedChallenges = [...entry.challengeCounts.entries()]
          .filter(([, count]) => count >= 2)
          .sort((a, b) => b[1] - a[1]);
        const hasAdaptations = entry.adaptSummary.adaptations.length > 0;
        const hasModified = entry.adaptSummary.hasModified;
        const supportHeavy = entry.aidePlusCount >= 2 || repeatedChallenges.length > 0;
        const hasDrop = entry.drops.length > 0;
        const hasBelow60 = entry.below60.length > 0;
        const hasFollowups = entry.followupItems.length > 0;
        const lowObs = entry.evalsWithClassWork >= 2 && entry.evalsCompletedByStudent <= Math.floor(entry.evalsWithClassWork / 2);

        const signals = [];
        entry.below60.forEach(item => {
          const shortSubject = item.label.split('•').pop().trim();
          signals.push({
            tone: 'warn',
            text: item.ilssCote
              ? `${shortSubject} : ${item.ilssLabel || 'Cote D'}`
              : item.pct !== null ? `${shortSubject} : ${item.pct} %` : `${item.label} : ${PRESCHOOL_CONSTAT_SHORT[item.constatRank]}`,
            maskedText: `${shortSubject} : suivi`,
            onClick: () => jumpFromReportToSubject(item.subjectId, entry.student.id)
          });
        });
        entry.drops.forEach(drop => {
          signals.push({
            tone: 'warn',
            text: drop.isPresco ? `Baisse (${drop.label})` : `${drop.diff} % (${drop.label.split('•').pop().trim()})`,
            maskedText: `Tendance à suivre (${drop.label.split('•').pop().trim()})`,
            onClick: () => jumpFromReportToSubject(drop.subjectId, entry.student.id)
          });
        });
        if (entry.aidePlusCount >= 2) {
          signals.push({
            tone: hasAdaptations ? 'neutral' : 'brand',
            text: hasAdaptations ? `${entry.aidePlusCount}× AIDE+` : `${entry.aidePlusCount}× AIDE+ (sans adaptation consignée)`
          });
        }
        if (repeatedChallenges.length > 0) {
          const [topTag, topCount] = repeatedChallenges[0];
          signals.push({ tone: 'neutral', text: `${topTag} · ${topCount}×` });
        }
        if (hasFollowups) {
          signals.push({
            tone: 'warn',
            text: `${entry.followupItems.length} ${entry.followupItems.length > 1 ? 'travaux' : 'travail'} en suivi`,
            onClick: () => jumpFromReportToSubject(entry.followupItems[0].subjectId, entry.student.id)
          });
        }
        if (entry.incompleteModified.length > 0) {
          signals.push({
            tone: 'warn',
            text: `MOD. sans échelle (${entry.incompleteModified.length})`
          });
        }
        if (lowObs && !hasBelow60) {
          signals.push({
            tone: 'muted',
            text: entry.evalsCompletedByStudent === 0 ? 'Aucune trace consignée' : `Peu observé (${entry.evalsCompletedByStudent}/${entry.evalsWithClassWork})`
          });
        }

        const isWatch = hasBelow60 || hasDrop || (supportHeavy && !hasAdaptations) || entry.incompleteModified.length > 0;
        const isSupport = hasAdaptations || hasModified || supportHeavy;

        return {
          ...entry,
          hasAdaptations,
          hasModified,
          supportHeavy,
          hasBelow60,
          hasDrop,
          hasFollowups,
          lowObs,
          isWatch,
          isSupport,
          signals
        };
      });

      const todoCount = blockers.length + inProgress.length + followups.length;
      const watchCount = studentRadar.filter(entry => entry.isWatch).length;

      return {
        termId,
        activeGroup,
        students,
        visibleSubjects,
        presentLevels,
        isMulti,
        isPrescoGroup,
        blockers,
        inProgress,
        followups,
        justifiedCount,
        competencies,
        priorityComments,
        studentRadar,
        todoCount,
        watchCount
      };
    }

    /** Met à jour le libellé adaptatif et la pastille d'actions dans la barre latérale. */
    function updateSidebarDashboardBadge() {
      const labelEl = document.getElementById('sidebarDashboardLabel');
      const badgeEl = document.getElementById('sidebarDashboardBadge');
      if (!labelEl && !badgeEl) return;
      const realGroups = Array.isArray(appState.groups) ? appState.groups.filter(g => g && !g.placeholder) : [];
      if (labelEl) {
        labelEl.textContent = realGroups.length <= 1 ? 'Bilan de classe' : 'Tableau de bord';
      }
      if (!badgeEl) return;
      if (!hasActiveGroup()) {
        badgeEl.classList.add('hidden');
        badgeEl.textContent = '';
        return;
      }
      const urgent = countGroupUrgentActions(
        realGroups.find(g => g.id === appState.activeGroupId),
        appState.activeTerm
      );
      badgeEl.classList.toggle('hidden', urgent === 0);
      badgeEl.textContent = urgent > 99 ? '99+' : String(urgent);
    }

    function createActionRow({ badge, badgeTone = 'neutral', title, detail, actionLabel = 'Ouvrir', onClick }) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'dash-action-row';
      btn.addEventListener('click', onClick);

      const left = document.createElement('span');
      left.className = 'dash-action-main';

      if (badge) {
        const badgeEl = document.createElement('span');
        badgeEl.className = `dash-badge is-${badgeTone}`;
        badgeEl.textContent = badge;
        left.appendChild(badgeEl);
      }

      const copy = document.createElement('span');
      copy.className = 'dash-action-copy';
      const titleEl = document.createElement('strong');
      titleEl.textContent = title;
      copy.appendChild(titleEl);
      if (detail) {
        const detailEl = document.createElement('small');
        detailEl.textContent = detail;
        copy.appendChild(detailEl);
      }
      left.appendChild(copy);

      const right = document.createElement('span');
      right.className = 'dash-action-cta';
      right.textContent = `${actionLabel} `;
      const arrow = document.createElement('span');
      arrow.className = 'home-arrow';
      arrow.setAttribute('aria-hidden', 'true');
      arrow.textContent = '→';
      right.appendChild(arrow);

      btn.append(left, right);
      return btn;
    }

    /** Affiche l'onglet « À faire » du bilan de classe. */
    function renderDashboardTodoTab(data) {
      const blockersWrap = document.getElementById('dashBlockersWrap');
      const blockersList = document.getElementById('dashBlockersList');
      const inProgressTitle = document.getElementById('dashInProgressTitle');
      const inProgressList = document.getElementById('dashInProgressList');
      const followupsWrap = document.getElementById('dashFollowupsWrap');
      const followupsList = document.getElementById('dashFollowupsList');
      const justifiedNote = document.getElementById('dashJustifiedNote');
      const compTitle = document.getElementById('dashCompetenciesTitle');
      const compList = document.getElementById('dashCompetenciesList');
      const commentsWrap = document.getElementById('dashCommentsPriorityWrap');
      const commentsList = document.getElementById('dashCommentsPriorityList');
      if (!blockersWrap || !blockersList || !inProgressList || !followupsWrap || !followupsList || !compList || !commentsWrap || !commentsList) return;

      // 1. Points à débloquer
      blockersList.replaceChildren();
      blockersWrap.classList.toggle('hidden', data.blockers.length === 0);
      data.blockers.forEach(item => {
        blockersList.appendChild(createActionRow(item));
      });

      // 2. Corrections et grilles en cours
      inProgressList.replaceChildren();
      if (inProgressTitle) {
        inProgressTitle.textContent = data.isPrescoGroup
          ? 'Observations et grilles en cours'
          : 'Corrections et grilles en cours';
      }
      if (data.inProgress.length > 0) {
        data.inProgress.slice(0, 8).forEach(ev => {
          const details = [ev.subjectLabel];
          if (ev.date) details.push(ev.date);
          if (ev.partialObsCount > 0) details.push(`${ev.partialObsCount} grille${ev.partialObsCount > 1 ? 's' : ''} partielle${ev.partialObsCount > 1 ? 's' : ''}`);
          if (ev.missingCount > 0) {
            const preview = ev.missingPreview.join(', ');
            details.push(`${ev.missingCount} manquante${ev.missingCount > 1 ? 's' : ''}${preview ? ` (${preview}${ev.missingCount > ev.missingPreview.length ? '…' : ''})` : ''}`);
          }
          if (ev.unconfirmedLinkedCount > 0) details.push(`${ev.unconfirmedLinkedCount} recopiée${ev.unconfirmedLinkedCount > 1 ? 's' : ''} à confirmer`);

          inProgressList.appendChild(createActionRow({
            badge: ev.isObservation ? 'Trace obs.' : 'À compléter',
            badgeTone: ev.isObservation ? 'brand' : 'neutral',
            title: ev.title,
            detail: details.join(' · '),
            actionLabel: ev.isObservation ? 'Continuer' : 'Compléter',
            onClick: () => {
              if (ev.isIlss && ev.isObservation && typeof startIlssObservationSession === 'function') {
                const subObj = SUBJECTS_CONFIG.find(s => s.id === ev.subjectId);
                if (subObj) {
                  appState.activeSubjectId = ev.subjectId;
                  expandedSubjectGroup = ev.subjectGroup || null;
                  startIlssObservationSession(subObj, ev.asgId, ev.firstStudentId || '');
                  return;
                }
              }
              if (ev.isObservation && typeof openVisualTraceForEditing === 'function') {
                appState.activeSubjectId = ev.subjectId;
                expandedSubjectGroup = (ev.subjectGroup && ev.subjectGroup !== 'presco') ? ev.subjectGroup : null;
                openVisualTraceForEditing(ev.asgId, ev.firstStudentId);
              } else {
                jumpFromReportToSubject(ev.subjectId, ev.firstStudentId);
              }
            }
          }));
        });
        if (data.inProgress.length > 8) {
          const more = document.createElement('p');
          more.className = 'dash-more-note';
          more.textContent = `+ ${data.inProgress.length - 8} autre${data.inProgress.length - 8 > 1 ? 's' : ''} évaluation${data.inProgress.length - 8 > 1 ? 's' : ''} à compléter dans vos matières.`;
          inProgressList.appendChild(more);
        }
      } else {
        const calm = document.createElement('div');
        calm.className = 'dash-calm-card';
        const calmMsg = document.createElement('p');
        calmMsg.textContent = data.competencies.some(comp => comp.evalCount > 0)
          ? 'Toutes vos évaluations et traces en cours sont à jour.'
          : 'Aucune évaluation ou trace créée pour cette étape pour le moment.';
        calm.appendChild(calmMsg);
        inProgressList.appendChild(calm);
      }

      // 3. Reprises et travaux non remis (sans JUST)
      document.querySelectorAll('[data-dash-followup-mode]').forEach(btn => {
        btn.setAttribute('aria-pressed', String(btn.dataset.dashFollowupMode === dashFollowupMode));
      });
      followupsList.replaceChildren();
      const showFollowupsSection = data.followups.length > 0 || data.justifiedCount > 0;
      followupsWrap.classList.toggle('hidden', !showFollowupsSection);
      if (data.followups.length > 0) {
        if (dashFollowupMode === 'assignment') {
          const byAsg = new Map();
          data.followups.forEach(item => {
            const key = `${item.subjectId}::${item.asgId}`;
            if (!byAsg.has(key)) byAsg.set(key, { ...item, items: [] });
            byAsg.get(key).items.push(item);
          });
          [...byAsg.values()].slice(0, 10).forEach(group => {
            const names = group.items.map(i => `${i.studentName} (${i.reason})`).slice(0, 4).join(', ');
            followupsList.appendChild(createActionRow({
              badge: `${group.items.length} élève${group.items.length > 1 ? 's' : ''}`,
              badgeTone: 'warn',
              title: `${group.asgTitle} — ${group.subjectLabel}`,
              detail: `${names}${group.items.length > 4 ? '…' : ''}`,
              actionLabel: 'Ouvrir',
              onClick: () => jumpFromReportToSubject(group.subjectId, group.items[0].studentId)
            }));
          });
        } else {
          const byStudent = new Map();
          data.followups.forEach(item => {
            if (!byStudent.has(item.studentId)) byStudent.set(item.studentId, { studentId: item.studentId, studentName: item.studentName, items: [] });
            byStudent.get(item.studentId).items.push(item);
          });
          [...byStudent.values()].slice(0, 10).forEach(group => {
            const summary = group.items.slice(0, 3).map(i => `${i.asgTitle} (${i.reason})`).join(' · ');
            followupsList.appendChild(createActionRow({
              badge: `${group.items.length} suivi${group.items.length > 1 ? 's' : ''}`,
              badgeTone: 'warn',
              title: group.studentName,
              detail: `${summary}${group.items.length > 3 ? ` (+${group.items.length - 3})` : ''}`,
              actionLabel: 'Voir au carnet',
              onClick: () => jumpFromReportToSubject(group.items[0].subjectId, group.studentId)
            }));
          });
        }
      }
      if (justifiedNote) {
        justifiedNote.classList.toggle('hidden', data.justifiedCount === 0);
        if (data.justifiedCount > 0) {
          justifiedNote.textContent = `${data.justifiedCount} absence${data.justifiedCount > 1 ? 's' : ''} justifiée${data.justifiedCount > 1 ? 's' : ''} (JUST) enregistrée${data.justifiedCount > 1 ? 's' : ''} dans cette étape.`;
        }
      }

      // 4. Couverture par compétence officielle (non fusionnée)
      if (compTitle) {
        compTitle.textContent = data.isPrescoGroup
          ? 'Domaines de développement — Étape ' + data.termId
          : 'Couverture de l’étape par matière';
      }
      compList.querySelectorAll('details[data-group-key]').forEach(group => {
        if (group.open) dashOpenSubjectGroups.add(group.dataset.groupKey);
        else dashOpenSubjectGroups.delete(group.dataset.groupKey);
      });
      compList.replaceChildren();
      compList.classList.toggle('is-presco', data.isPrescoGroup);
      const hasIlssComp = data.competencies.some(comp => comp.isIlss);
      const distributionHelp = document.createElement('p');
      distributionHelp.className = 'dash-dist-help';
      distributionHelp.textContent = data.isPrescoGroup
        ? 'La barre répartit les élèves ayant un résultat selon un constat estimé à partir de ce résultat. Les élèves sans résultat sont exclus.'
        : hasIlssComp
          ? 'En ILSS, la barre répartit les élèves selon leur palier (1 à 5), sans pourcentage. En mathématique et autres matières, elle répartit les cotes de A à E.'
          : 'La barre répartit les élèves ayant un résultat final dans la compétence, par cote de A à E. Les élèves sans résultat sont exclus.';
      compList.appendChild(distributionHelp);
      const subjectGroups = new Map();
      data.competencies.forEach(comp => {
        let rowsContainer = compList;
        if (!data.isPrescoGroup) {
          const subjectKey = comp.sub.group || comp.sub.id;
          if (!subjectGroups.has(subjectKey)) {
            const group = document.createElement('details');
            group.className = 'dash-subject-group';
            group.dataset.groupKey = `${appState.activeGroupId}|${data.termId}|${subjectKey}`;
            group.open = dashOpenSubjectGroups.has(group.dataset.groupKey);
            const summary = document.createElement('summary');
            const name = document.createElement('strong');
            name.textContent = comp.sub.groupLabel || comp.displaySub.shortName || comp.label;
            const count = document.createElement('span');
            count.className = 'dash-subject-count';
            const countValue = data.competencies.filter(item => (item.sub.group || item.sub.id) === subjectKey).length;
            count.textContent = `${countValue} compétence${countValue > 1 ? 's' : ''}`;
            summary.append(name, count);
            const rows = document.createElement('div');
            rows.className = 'dash-subject-competencies';
            group.append(summary, rows);
            compList.appendChild(group);
            subjectGroups.set(subjectKey, rows);
          }
          rowsContainer = subjectGroups.get(subjectKey);
        }
        const row = document.createElement('div');
        row.className = 'dash-comp-row';

        const mainBtn = document.createElement('button');
        mainBtn.type = 'button';
        mainBtn.className = 'dash-comp-open';
        mainBtn.addEventListener('click', () => {
          navigateToView('viewGradebook', () => {
            appState.activeSubjectId = comp.sub.id;
            expandedSubjectGroup = (comp.sub.group && comp.sub.group !== 'presco') ? comp.sub.group : null;
          });
        });

        const head = document.createElement('div');
        head.className = 'dash-comp-head';
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('class', 'dash-subject-icon');
        svg.setAttribute('viewBox', '0 0 24 24');
        svg.setAttribute('fill', 'none');
        svg.setAttribute('stroke', 'currentColor');
        svg.setAttribute('stroke-width', '1.8');
        svg.setAttribute('stroke-linecap', 'round');
        svg.setAttribute('stroke-linejoin', 'round');
        svg.setAttribute('aria-hidden', 'true');
        svg.innerHTML = (typeof subjectIcons !== 'undefined' && subjectIcons[comp.iconKey]) ? subjectIcons[comp.iconKey] : '';

        const title = document.createElement('strong');
        title.className = 'dash-comp-name';
        title.textContent = comp.label;
        head.append(svg, title);

        if (comp.officialWeightLabel) {
          const wChip = document.createElement('span');
          wChip.className = 'dash-comp-weight';
          wChip.textContent = comp.officialWeightLabel;
          head.appendChild(wChip);
        }

        const meta = document.createElement('div');
        meta.className = 'dash-comp-meta';
        if (comp.evalCount === 0) {
          const empty = document.createElement('span');
          empty.className = 'is-muted';
          empty.textContent = data.isPrescoGroup ? 'Aucune observation cette étape' : 'Aucune trace cette étape';
          meta.appendChild(empty);
        } else {
          const parts = [];
          if (comp.writtenCount > 0) parts.push(`${comp.writtenCount} ${comp.writtenCount > 1 ? 'travaux' : 'travail'}`);
          if (comp.obsCount > 0) parts.push(`${comp.obsCount} trace${comp.obsCount > 1 ? 's' : ''} obs.`);
          parts.push(`${comp.evaluatedCount}/${comp.applicableCount} élèves`);
          const statsSpan = document.createElement('span');
          statsSpan.textContent = parts.join(' · ');
          meta.appendChild(statsSpan);
        }

        if (!comp.isPresco && !comp.isIlss && comp.weightValid !== null) {
          const wState = document.createElement('span');
          wState.className = `dash-comp-wstate ${comp.weightValid ? 'is-ok' : 'is-warn'}`;
          wState.textContent = comp.weightValid ? '100 % ✓' : '⚠ Pondération ≠ 100 %';
          meta.appendChild(wState);
        }

        mainBtn.append(head, meta);

        // Mini-barre de distribution des constats / paliers / cotes (sans moyenne trompeuse)
        const totalDist = Object.values(comp.distribution).reduce((acc, n) => acc + n, 0);
        if (totalDist > 0 && !dashPrivacyMasked) {
          const distBar = document.createElement('div');
          distBar.className = 'dash-dist-bar';
          const order = comp.isPresco
            ? ['4', '3', '2', '1']
            : comp.isIlss
              ? ['p1', 'p2', 'p3', 'p4', 'p5']
              : ['A', 'B', 'C', 'D', 'E'];
          const labels = comp.isPresco
            ? PRESCHOOL_CONSTAT_SHORT
            : comp.isIlss
              ? { p1: 'Palier 1', p2: 'Palier 2', p3: 'Palier 3', p4: 'Palier 4', p5: 'Palier 5' }
              : { A: 'Très satisfaisant (A)', B: 'Satisfaisant (B)', C: 'Acceptable (C)', D: 'Peu satisfaisant (D)', E: 'Insuffisant (E)' };
          distBar.setAttribute('aria-hidden', 'true');
          order.forEach(k => {
            const count = comp.distribution[k] || 0;
            if (!count) return;
            const seg = document.createElement('span');
            seg.className = `dash-dist-seg is-k-${k}`;
            seg.style.width = `${(count / totalDist) * 100}%`;
            distBar.appendChild(seg);
          });
          mainBtn.appendChild(distBar);
          const distSummary = document.createElement('span');
          distSummary.className = 'dash-dist-summary';
          order.filter(k => comp.distribution[k] > 0).forEach(k => {
            const item = document.createElement('span');
            item.className = `dash-dist-key is-k-${k}`;
            item.textContent = `${labels[k]} : ${comp.distribution[k]}`;
            distSummary.appendChild(item);
          });
          mainBtn.appendChild(distSummary);
        }

        row.appendChild(mainBtn);
        rowsContainer.appendChild(row);
      });

      // 5. Commentaires prioritaires (< 60 % ou difficultés au préscolaire sans commentaire rédigé)
      commentsList.replaceChildren();
      commentsWrap.classList.toggle('hidden', data.priorityComments.length === 0);
      data.priorityComments.slice(0, 8).forEach(item => {
        commentsList.appendChild(createActionRow({
          badge: 'À expliquer',
          badgeTone: 'brand',
          title: `${item.studentName} — ${item.subjectLabel}`,
          detail: data.isPrescoGroup
            ? `Constat « ${item.statusText} » sans commentaire rédigé.`
            : item.isIlss
              ? `Jugement « ${item.statusText} » sans commentaire rédigé.`
              : `Résultat de ${item.statusText} sans commentaire rédigé pour les parents.`,
          actionLabel: 'Rédiger',
          onClick: () => {
            const opened = navigateToView('viewGradebook', () => {
              appState.activeSubjectId = item.subjectId;
              expandedSubjectGroup = (item.subjectGroup && item.subjectGroup !== 'presco') ? item.subjectGroup : null;
            }, { skipScrollTop: true });
            if (opened) {
              window.setTimeout(() => {
                if (typeof flashGradebookStudentRow === 'function') flashGradebookStudentRow(item.studentId);
                if (typeof openCommentBankModal === 'function') openCommentBankModal(item.studentId, item.subjectId, data.termId);
              }, 40);
            }
          }
        }));
      });
    }

    /** Affiche l'onglet « Vigie élèves » (radar transversal centré sur la classe réelle). */
    function renderDashboardStudentsTab(data) {
      const filtersBar = document.getElementById('dashRadarFilters');
      const levelBar = document.getElementById('dashRadarLevelFilter');
      const radarList = document.getElementById('dashRadarList');
      if (!filtersBar || !levelBar || !radarList) return;

      const baseRoster = data.isMulti && dashRadarLevel !== 'ALL'
        ? data.studentRadar.filter(entry => String(entry.student.gradeLevel) === dashRadarLevel)
        : data.studentRadar;

      const filters = [
        { id: 'watch', label: 'À surveiller', count: baseRoster.filter(e => e.isWatch).length },
        { id: 'support', label: 'Soutien / PIA', count: baseRoster.filter(e => e.isSupport).length },
        { id: 'followups', label: 'Reprises / NR', count: baseRoster.filter(e => e.hasFollowups).length },
        { id: 'lowObs', label: 'Peu observés', count: baseRoster.filter(e => e.lowObs).length },
        { id: 'all', label: 'Toute la classe', count: baseRoster.length }
      ];

      filtersBar.replaceChildren();
      filters.forEach(f => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'dash-radar-filter-pill';
        btn.setAttribute('aria-pressed', String(dashRadarFilter === f.id));
        const txt = document.createElement('span');
        txt.textContent = f.label;
        const cnt = document.createElement('span');
        cnt.className = 'dash-filter-count';
        cnt.textContent = String(f.count);
        btn.append(txt, cnt);
        btn.addEventListener('click', () => {
          dashRadarFilter = f.id;
          renderHomeDashboard();
        });
        filtersBar.appendChild(btn);
      });

      levelBar.replaceChildren();
      if (data.isMulti && data.presentLevels.length > 1) {
        levelBar.classList.remove('hidden');
        const allLevels = ['ALL', ...data.presentLevels];
        if (!allLevels.includes(dashRadarLevel)) dashRadarLevel = 'ALL';
        allLevels.forEach(lvl => {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.setAttribute('aria-pressed', String(dashRadarLevel === lvl));
          btn.textContent = lvl === 'ALL' ? 'Tous' : (lvl === 'P' ? 'Présco' : (lvl === '1' ? '1re' : `${lvl}e`));
          btn.addEventListener('click', () => {
            dashRadarLevel = lvl;
            renderHomeDashboard();
          });
          levelBar.appendChild(btn);
        });
      } else {
        levelBar.classList.add('hidden');
      }

      const visibleEntries = baseRoster.filter(entry => {
        if (dashRadarFilter === 'watch') return entry.isWatch;
        if (dashRadarFilter === 'support') return entry.isSupport;
        if (dashRadarFilter === 'followups') return entry.hasFollowups;
        if (dashRadarFilter === 'lowObs') return entry.lowObs;
        return true;
      });

      radarList.replaceChildren();
      if (!visibleEntries.length) {
        const empty = document.createElement('p');
        empty.className = 'dash-calm-card';
        empty.textContent = dashRadarFilter === 'watch'
          ? 'Aucun signal de fragilité détecté dans cette sélection pour le moment.'
          : 'Aucun élève ne correspond à ce filtre.';
        radarList.appendChild(empty);
        return;
      }

      visibleEntries.forEach(entry => {
        const row = document.createElement('article');
        row.className = 'dash-radar-row';

        const top = document.createElement('div');
        top.className = 'dash-radar-top';

        const identity = document.createElement('div');
        identity.className = 'dash-radar-identity';
        const nameBtn = document.createElement('button');
        nameBtn.type = 'button';
        nameBtn.className = 'dash-radar-name';
        nameBtn.textContent = entry.student.name || 'Élève';
        nameBtn.addEventListener('click', () => {
          navigateToView('viewGlobalReport', () => {
            appState.selectedStudentId = entry.student.id;
          });
        });
        identity.appendChild(nameBtn);

        if (data.isMulti && entry.student.gradeLevel) {
          const lvlChip = document.createElement('span');
          lvlChip.className = 'dash-chip is-demo';
          lvlChip.textContent = entry.student.gradeLevel === '1' ? '1re' : `${entry.student.gradeLevel}e`;
          identity.appendChild(lvlChip);
        }
        if (entry.hasAdaptations) {
          const adChip = document.createElement('span');
          adChip.className = 'dash-chip is-active';
          adChip.textContent = `${entry.adaptSummary.adaptations.length} adapt.`;
          identity.appendChild(adChip);
        }
        if (entry.hasModified) {
          const modChip = document.createElement('span');
          modChip.className = 'dash-chip is-warn';
          modChip.textContent = 'MOD.';
          identity.appendChild(modChip);
        }

        const synthBtn = document.createElement('button');
        synthBtn.type = 'button';
        synthBtn.className = 'dash-inline-link';
        synthBtn.innerHTML = '<span>Synthèse</span><span class="home-arrow" aria-hidden="true">→</span>';
        synthBtn.addEventListener('click', () => {
          navigateToView('viewGlobalReport', () => {
            appState.selectedStudentId = entry.student.id;
          });
        });

        top.append(identity, synthBtn);
        row.appendChild(top);

        if (entry.signals.length > 0) {
          const sigRow = document.createElement('div');
          sigRow.className = 'dash-radar-signals';
          entry.signals.slice(0, 4).forEach(sig => {
            const el = document.createElement(sig.onClick ? 'button' : 'span');
            if (sig.onClick) {
              el.type = 'button';
              el.addEventListener('click', sig.onClick);
            }
            el.className = `dash-signal-chip is-${sig.tone || 'neutral'}`;
            el.textContent = dashPrivacyMasked && sig.maskedText ? sig.maskedText : sig.text;
            sigRow.appendChild(el);
          });
          row.appendChild(sigRow);
        }

        if (entry.pills.length > 0) {
          const pillRow = document.createElement('div');
          pillRow.className = 'dash-radar-pills';
          entry.pills.forEach(pill => {
            const pBtn = document.createElement('button');
            pBtn.type = 'button';
            let tone = 'neutral';
            if (!dashPrivacyMasked) {
              if (pill.isPresco) {
                tone = pill.rank >= 3 ? 'ok' : pill.rank === 2 ? 'warn' : pill.rank === 1 ? 'alert' : 'neutral';
              } else if (pill.isIlss) {
                tone = (pill.ilssCote === 'A' || pill.ilssCote === 'B') ? 'ok' : pill.ilssCote === 'C' ? 'mid' : pill.ilssCote === 'D' ? 'warn' : 'neutral';
              } else if (pill.pct !== null) {
                tone = pill.pct >= 75 ? 'ok' : pill.pct >= 60 ? 'mid' : 'alert';
              }
            }
            pBtn.className = `dash-subj-pill is-${tone}`;
            pBtn.title = dashPrivacyMasked
              ? `${pill.fullLabel} — ouvrir au carnet`
              : `${pill.fullLabel} : ${pill.isIlss ? pill.code : (pill.pct !== null ? `${pill.pct} % (${pill.code})` : (pill.isPresco ? PRESCHOOL_CONSTAT_SHORT[pill.rank] : 'aucun résultat'))}`;
            pBtn.textContent = dashPrivacyMasked
              ? pill.shortLabel
              : (pill.isPresco ? pill.shortLabel : `${pill.shortLabel} · ${pill.code}`);
            pBtn.addEventListener('click', () => jumpFromReportToSubject(pill.subjectId, entry.student.id));
            pillRow.appendChild(pBtn);
          });
          row.appendChild(pillRow);
        }

        radarList.appendChild(row);
      });
    }

    /** Affiche le bilan actif de la classe (À faire / Vigie élèves). */
    function renderActiveGroupOverview(activeStats) {
      const heading = document.getElementById('dashOverviewHeading');
      const meta = document.getElementById('dashOverviewMeta');
      const tabsWrap = document.getElementById('dashTabs');
      const todoCountEl = document.getElementById('dashTabTodoCount');
      const watchCountEl = document.getElementById('dashTabWatchCount');
      const emptyStateEl = document.getElementById('dashEmptyState');
      const todoPanelEl = document.getElementById('dashPanelTodo');
      const studentsPanelEl = document.getElementById('dashPanelStudents');
      if (!heading || !meta || !emptyStateEl || !todoPanelEl || !studentsPanelEl) return;

      const data = collectActiveGroupDashboardData();
      const groupName = data.activeGroup ? data.activeGroup.name : 'Mon groupe';
      const studentCount = data.students.length;
      const levelLabel = activeStats ? activeStats.levelLabel : '';

      heading.textContent = `Portrait de la classe — ${groupName}`;
      meta.textContent = `${levelLabel ? `${levelLabel} · ` : ''}${studentCount} élève${studentCount > 1 ? 's' : ''} · Étape ${data.termId}`;

      if (todoCountEl) todoCountEl.textContent = String(data.todoCount);
      if (watchCountEl) watchCountEl.textContent = String(data.watchCount);

      if (studentCount === 0) {
        if (tabsWrap) tabsWrap.classList.add('hidden');
        emptyStateEl.classList.remove('hidden');
        todoPanelEl.classList.add('hidden');
        studentsPanelEl.classList.add('hidden');
        return;
      }

      if (tabsWrap) tabsWrap.classList.remove('hidden');
      emptyStateEl.classList.add('hidden');

      document.querySelectorAll('[data-dash-tab]').forEach(btn => {
        btn.setAttribute('aria-selected', String(btn.dataset.dashTab === dashActiveTab));
      });
      todoPanelEl.classList.toggle('hidden', dashActiveTab !== 'todo');
      studentsPanelEl.classList.toggle('hidden', dashActiveTab !== 'students');

      if (dashActiveTab === 'students') {
        renderDashboardStudentsTab(data);
      } else {
        renderDashboardTodoTab(data);
      }
    }

    function getGroupDashboardStats(group) {
      const isActive = group.id === appState.activeGroupId;
      const data = isActive ? appState : (appState.groupStore[group.id] || {});
      const students = Array.isArray(data.students) ? data.students : [];
      const studentCount = students.length;

      let levelLabel = '';
      if (group.level === 'accueil') {
        levelLabel = 'Accueil (Multi)';
      } else if (group.level && GRADE_LEVEL_LABELS[group.level]) {
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

      return {
        studentCount,
        levelLabel,
        disciplineLabel,
        evalCount: seenEvalKeys.size,
        pendingActions: countGroupUrgentActions(group, appState.activeTerm)
      };
    }

    function renderHomeDashboard() {
      const root = document.getElementById('homeDashboard');
      const dashTitle = document.getElementById('dashTitle');
      const grid = document.getElementById('dashGroupsGrid');
      const countEl = document.getElementById('dashGroupsCount');
      const summaryMeta = document.getElementById('dashSummaryMeta');
      if (!grid || !countEl || !summaryMeta) return;

      dashPrivacyMasked = false;
      document.querySelectorAll('[data-dash-term]').forEach(button =>
        button.setAttribute('aria-pressed', String(button.dataset.dashTerm === String(appState.activeTerm))));

      if (root) root.classList.remove('is-privacy-masked');

      const groups = appState.groups.filter(g => g && !g.placeholder);
      const isMultiGroup = groups.length > 1;
      if (dashTitle) dashTitle.textContent = isMultiGroup ? 'Tableau de bord' : 'Bilan de classe';

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
      updateSidebarDashboardBadge();
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
        openBtn.setAttribute('aria-pressed', String(isActive));
        openBtn.addEventListener('click', () => {
          requestObservationDraftExit(() => {
            if (group.id !== appState.activeGroupId) switchGroup(group.id);
            const reducedMotion = isReducedMotionEnabled();
            window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' });
          });
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
        if (stats.pendingActions > 0) {
          const pendingChip = document.createElement('span');
          pendingChip.className = 'dash-chip is-warn';
          pendingChip.textContent = `${stats.pendingActions} à traiter`;
          badges.appendChild(pendingChip);
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
        openLabel.textContent = isActive ? 'Bilan affiché' : 'Afficher le bilan ';
        if (!isActive) {
          const arrow = document.createElement('span');
          arrow.className = 'home-arrow';
          arrow.setAttribute('aria-hidden', 'true');
          arrow.textContent = '→';
          openLabel.appendChild(arrow);
        }
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
      addCard.append(addIcon, addTitle);
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
      if (typeof isReducedMotionEnabled === 'function' && isReducedMotionEnabled()) {
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
