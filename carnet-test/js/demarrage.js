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

    function openFullPageInNewTab() {
      try {
        const pageCopy = document.documentElement.cloneNode(true);
        const base = document.createElement('base');
        base.href = document.baseURI;
        pageCopy.querySelector('head').prepend(base);
        let htmlSource = '<!DOCTYPE html>\n' + pageCopy.outerHTML;
        if (window.ECHELLES_PRIMAIRE) {
          // Le nouvel onglet (blob) ne peut pas charger echelles-niveaux.js : on en embarque le contenu.
          const inlineData = JSON.stringify(window.ECHELLES_PRIMAIRE).replace(/<\//g, '<\\/');
          htmlSource = htmlSource.replace(/<script[^>]*src="echelles-niveaux\.js"[^>]*><\/script>/, () => `<script>window.ECHELLES_PRIMAIRE = ${inlineData};<\/script>`);
        }
        const blob = new Blob([htmlSource], { type: 'text/html;charset=utf-8' });
        const blobUrl = URL.createObjectURL(blob);
        window.open(blobUrl, '_blank');
        showToast('Ouvert en pleine page dans un nouvel onglet!');
      } catch (e) {
        showToast('Utilisez le bouton Plein écran');
      }
    }

    // =========================================================================
    // 7. EVENT LISTENERS & INITIALIZATION
    // =========================================================================
    let returnToWelcomeAfterGroup = false;
    let importFromWelcome = false;
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

    function showWelcome() {
      document.getElementById('welcomeOverlay').classList.remove('hidden');
      document.getElementById('welcomeLoad').focus();
    }

    function hideWelcome() {
      document.getElementById('welcomeOverlay').classList.add('hidden');
    }

    function dismissWelcome() {
      hideWelcome();
      if (isPristineInitialGroup()) {
        expandedSubjectGroup = null;
        initializeExampleGroups();
      } else {
        navigateToView('viewStudents');
      }
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

    function startGroupFromWelcome() {
      hideWelcome();
      requestObservationDraftExit(() => {
        const pristine = isPristineInitialGroup();
        ensureExampleGroups();
        appState.activeView = 'viewStudents';
        expandedSubjectGroup = null;
        renderAll();
        const group = appState.groups[0];
        returnToWelcomeAfterGroup = true;
        openGroupModal(pristine ? 'edit' : 'new', pristine ? group.id : null);
        if (pristine) {
          document.getElementById('groupModalTitle').textContent = 'Créer votre premier groupe';
          document.querySelectorAll('#groupSubjectList input[data-discipline]').forEach(cb => { cb.checked = false; });
        }
      });
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
      hideWelcome();
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
      startGroupFromWelcome();
    }

    window.addEventListener('DOMContentLoaded', () => {
      document.getElementById('welcomeClose').addEventListener('click', dismissWelcome);
      document.getElementById('welcomeOverlay').addEventListener('click', event => {
        if (event.target.id === 'welcomeOverlay') dismissWelcome();
      });
      document.getElementById('welcomeCreate').addEventListener('click', startGroupFromWelcome);
      document.querySelectorAll('[data-example-group]').forEach(button => {
        button.addEventListener('click', () => {
          const groupId = button.getAttribute('data-example-group');
          requestObservationDraftExit(() => {
            if (isPristineInitialGroup()) initializeExampleGroups();
            else ensureExampleGroups();
            hideWelcome();
            switchGroup(groupId);
            appState.activeView = 'viewStudents';
            expandedSubjectGroup = null;
            renderAll();
          });
        });
      });
      document.getElementById('welcomeLoad').addEventListener('click', () => {
        importFromWelcome = true;
        hideWelcome();
        openJsonFileSmart();
      });
      document.getElementById('inputImportJSON').addEventListener('cancel', () => {
        if (importFromWelcome) showWelcome();
        importFromWelcome = false;
        pendingImportSnapshot = null;
      });
      document.getElementById('btnOpenWelcomeFromSidebar').addEventListener('click', showWelcome);
      document.getElementById('tourSkip').addEventListener('click', finishTutorial);
      document.getElementById('tourNext').addEventListener('click', () => {
        if (tourIndex === tourSteps.length - 1) finishTutorial();
        else { tourIndex++; renderTourStep(); }
      });
      window.addEventListener('resize', positionTour);
      window.addEventListener('scroll', positionTour, true);
      document.addEventListener('keydown', event => {
        if (event.key !== 'Tab') return;
        const modal = ['welcomeOverlay', 'tutorialOverlay'].map(id => document.getElementById(id))
          .find(el => !el.classList.contains('hidden'));
        if (!modal) return;
        const buttons = [...modal.querySelectorAll('button:not(:disabled)')].filter(button => button.getClientRects().length);
        const first = buttons[0];
        const last = buttons[buttons.length - 1];
        if (event.shiftKey && (document.activeElement === first || !modal.contains(document.activeElement))) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && (document.activeElement === last || !modal.contains(document.activeElement))) {
          event.preventDefault();
          first.focus();
        }
      });
      document.getElementById('btnStayOnObservation').addEventListener('click', () => closeObservationWarning(true));
      document.getElementById('btnLeaveObservation').addEventListener('click', () => closeObservationWarning(false));
      document.getElementById('modalUnsavedObservation').addEventListener('click', event => {
        if (event.target.id === 'modalUnsavedObservation') closeObservationWarning(true);
      });
      document.addEventListener('keydown', event => {
        const welcome = document.getElementById('welcomeOverlay');
        if (event.key === 'Escape' && welcome && !welcome.classList.contains('hidden')) {
          dismissWelcome();
          return;
        }
        const modal = document.getElementById('modalUnsavedObservation');
        if (event.key === 'Escape' && modal && !modal.classList.contains('hidden')) {
          closeObservationWarning(true);
        }
      });

      // Term Switcher (Étape 1, 2, 3) & Bulletin global button
      let viewBeforeGlobalReport = 'viewGradebook';
      document.querySelectorAll('.term-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const nextTerm = btn.getAttribute('data-term');
          const nextView = appState.activeView === 'viewGlobalReport' ? viewBeforeGlobalReport : appState.activeView;
          if (navigateToView(nextView, () => {
            appState.activeTerm = nextTerm;
            competencyTermSelected = null;
          })) {
            notifyUpdate(`Basculé vers l'Étape ${appState.activeTerm}`);
          }
        });
      });

      document.getElementById('btnNavGlobalReport').addEventListener('click', () => {
        navigateToView('viewGlobalReport', () => {
          if (appState.activeView !== 'viewGlobalReport') {
            viewBeforeGlobalReport = appState.activeView === 'viewStudents' ? 'viewStudents' : 'viewGradebook';
          }
        });
      });

      document.getElementById('btnPrintGlobalReport').addEventListener('click', () => {
        document.body.classList.add('print-global-report');
        const cleanup = () => {
          document.body.classList.remove('print-global-report');
          window.removeEventListener('afterprint', cleanup);
        };
        window.addEventListener('afterprint', cleanup);
        window.print();
      });

      const btnOffWeight = document.getElementById('btnAnnualWeightOfficial');
      if (btnOffWeight) {
        btnOffWeight.addEventListener('click', () => {
          appState.annualWeightMode = 'official';
          notifyUpdate('Pondération officielle MEQ : 20 % · 20 % · 60 %');
          renderGlobalReportView();
        });
      }

      const cycleGlobalStudent = (step) => {
        if (!appState.students.length) return;
        const idx = appState.students.findIndex(s => s.id === appState.selectedStudentId);
        const nextIdx = idx < 0
          ? 0
          : (idx + step + appState.students.length) % appState.students.length;
        appState.selectedStudentId = appState.students[nextIdx].id;
        renderGlobalReportView();
      };
      const btnPrevStu = document.getElementById('btnGrPrevStudent');
      const btnNextStu = document.getElementById('btnGrNextStudent');
      if (btnPrevStu) btnPrevStu.addEventListener('click', () => cycleGlobalStudent(-1));
      if (btnNextStu) btnNextStu.addEventListener('click', () => cycleGlobalStudent(1));

      // Banque & Assistant de commentaires (Modale)
      const modalCb = document.getElementById('modalCommentBank');
      if (modalCb) {
        document.getElementById('btnCbClose').addEventListener('click', closeCommentBankModal);
        document.getElementById('btnCbCancel').addEventListener('click', closeCommentBankModal);
        modalCb.addEventListener('click', (ev) => {
          if (ev.target === modalCb) closeCommentBankModal();
        });
        document.getElementById('cbPronounSelect').addEventListener('change', (ev) => {
          if (activeCommentBankContext) {
            const st = appState.students.find(s => s.id === activeCommentBankContext.studentId);
            if (st) st.pronoun = ev.target.value;
          }
          renderCommentBankPhrases();
        });
        document.getElementById('btnCbAutoSynthesize').addEventListener('click', () => {
          if (!activeCommentBankContext) return;
          const mode = document.getElementById('cbPronounSelect').value;
          const synth = synthesizeStudentSubjectComment(
            activeCommentBankContext.termId,
            activeCommentBankContext.subjectId,
            activeCommentBankContext.studentId,
            mode
          );
          const area = document.getElementById('cbTextarea');
          area.value = synth;
          updateCommentBankCharCount();
          renderCommentBankPhrases();
          area.focus();
        });
        document.getElementById('cbTextarea').addEventListener('input', () => {
          updateCommentBankCharCount();
          renderCommentBankPhrases();
        });
        document.getElementById('btnCbClear').addEventListener('click', () => {
          const area = document.getElementById('cbTextarea');
          area.value = '';
          updateCommentBankCharCount();
          renderCommentBankPhrases();
          area.focus();
        });
        document.getElementById('btnCbCopy').addEventListener('click', () => {
          const area = document.getElementById('cbTextarea');
          const done = () => showToast('Commentaire copié dans le presse-papiers');
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(area.value).then(done, () => { area.select(); document.execCommand('copy'); done(); });
          } else {
            area.select();
            document.execCommand('copy');
            done();
          }
        });
        document.getElementById('btnCbSave').addEventListener('click', () => {
          if (!activeCommentBankContext) return;
          const { termId, subjectId, studentId } = activeCommentBankContext;
          const rec = appState.terms[termId].subjectData[subjectId].studentRecords[studentId];
          if (rec) {
            rec.comment = document.getElementById('cbTextarea').value.trim();
          }
          closeCommentBankModal();
          notifyUpdate('Commentaire appliqué au carnet');
          renderGradebookView();
          scheduleAppStateSave();
        });
      }

      // Fullscreen
      document.getElementById('btnFullscreen').addEventListener('click', toggleFullscreenOrPopout);
      document.addEventListener('fullscreenchange', () => {
        const lbl = document.getElementById('fullscreenBtnLabel');
        if (lbl) {
          lbl.textContent = document.fullscreenElement ? 'Quitter plein écran' : 'Plein écran';
        }
      });

      // Top bar "Élèves" button (toggles the student manager or returns to the gradebook)
      document.getElementById('btnNavStudentsTop').addEventListener('click', () => {
        navigateToView(appState.activeView === 'viewStudents' ? 'viewGradebook' : 'viewStudents');
      });
      const sidebarGroupButton = document.getElementById('btnSidebarGroupMenu');
      const sidebarGroupMenu = document.getElementById('sidebarGroupMenu');
      const closeSidebarGroupMenu = () => {
        sidebarGroupMenu.classList.add('hidden');
        sidebarGroupButton.setAttribute('aria-expanded', 'false');
      };
      sidebarGroupButton.addEventListener('click', () => {
        const open = sidebarGroupMenu.classList.toggle('hidden') === false;
        sidebarGroupButton.setAttribute('aria-expanded', String(open));
      });
      const startNewGroup = () => {
        closeSidebarGroupMenu();
        requestObservationDraftExit(() => {
          appState.activeView = 'viewStudents';
          expandedSubjectGroup = null;
          renderAll();
          openGroupModal('new');
        });
      };
      document.getElementById('btnSidebarNewGroup').addEventListener('click', startNewGroup);
      document.getElementById('btnSidebarManageGroups').addEventListener('click', () => {
        closeSidebarGroupMenu();
        navigateToView('viewStudents');
      });
      document.addEventListener('click', event => {
        if (!sidebarGroupMenu.contains(event.target) && !sidebarGroupButton.contains(event.target)) closeSidebarGroupMenu();
      });
      document.addEventListener('keydown', event => {
        if (event.key === 'Escape' && !sidebarGroupMenu.classList.contains('hidden')) {
          closeSidebarGroupMenu();
          sidebarGroupButton.focus();
        }
      });
      const studentSearchPopover = document.getElementById('studentSearchPopover');
      const headerStudentSearch = document.getElementById('headerStudentSearch');
      const studentSearchMessage = document.getElementById('studentSearchMessage');
      headerStudentSearch.addEventListener('input', () => { studentSearchMessage.textContent = ''; });
      studentSearchPopover.addEventListener('submit', event => {
        event.preventDefault();
        const query = headerStudentSearch.value.trim();
        const matches = appState.students.filter(student => studentMatches(student, query));
        if (!query || !matches.length) {
          studentSearchMessage.textContent = query ? 'Aucun élève trouvé dans ce groupe.' : 'Entrez le nom d’un élève.';
          return;
        }
        navigateToView('viewGradebook', () => {
          gbFilter = query;
          gbLevelFilter = 'ALL';
          studentSearchMessage.textContent = '';
        });
      });
      document.getElementById('btnClearStudentFilter').addEventListener('click', () => {
        gbFilter = '';
        headerStudentSearch.value = '';
        studentSearchMessage.textContent = '';
        renderGradebookView();
      });
      document.getElementById('btnOpenStudentsFromEmpty').addEventListener('click', () => {
        if (!hasActiveGroup()) {
          startNewGroup();
        } else if (navigateToView('viewStudents')) {
          document.getElementById('newStudentName').focus();
        }
      });

      document.getElementById('btnBackToGradebookFromBareme').addEventListener('click', () => {
        navigateToView('viewGradebook');
      });

      document.getElementById('btnBackToGradebookFromStudents').addEventListener('click', () => {
        navigateToView('viewGradebook');
      });

      // Back to Gradebook button inside Visual Trace panel
      document.getElementById('btnBackToGradebookFromTrace').addEventListener('click', () => {
        navigateToView('viewGradebook');
      });

      const newEvaluationButton = document.getElementById('btnNewEvaluation');
      const newEvaluationChoices = document.getElementById('newEvaluationChoices');
      const closeEvaluationChoices = () => {
        newEvaluationChoices.classList.add('hidden');
        newEvaluationButton.setAttribute('aria-expanded', 'false');
      };
      newEvaluationButton.addEventListener('click', () => {
        const open = newEvaluationChoices.classList.toggle('hidden') === false;
        newEvaluationButton.setAttribute('aria-expanded', String(open));
      });
      newEvaluationChoices.addEventListener('click', event => {
        if (event.target.closest('button')) closeEvaluationChoices();
      });
      document.addEventListener('click', event => {
        if (!newEvaluationButton.contains(event.target) && !newEvaluationChoices.contains(event.target)) closeEvaluationChoices();
      });
      document.addEventListener('keydown', event => {
        if (event.key === 'Escape' && !newEvaluationChoices.classList.contains('hidden')) {
          closeEvaluationChoices();
          newEvaluationButton.focus();
        }
      });

      document.getElementById('btnAddVisualTraceFromGb').addEventListener('click', () => {
        startNewVisualTraceSession();
      });

      // Equal Weights Button
      const closeWeightMode = () => {
        weightMode = false;
        unlockedWeights.clear();
        weightLevel = '';
        document.getElementById('btnWeightMode').setAttribute('aria-expanded', 'false');
        document.getElementById('weightControls').classList.add('hidden');
        document.querySelectorAll('#gradebookHeaderRow .weight-tools').forEach(tools => tools.remove());
        document.querySelectorAll('#gradebookHeaderRow [data-weight-input]').forEach(input => {
          const asg = getActiveTermData().subjectData[appState.activeSubjectId].assignments.find(item => item.id === input.getAttribute('data-weight-input'));
          if (!asg) return;
          const level = isMultiLevelGroup() ? ensureValidGbLevelFilter() : 'ALL';
          const value = document.createElement('span');
          value.setAttribute('data-weight-asg', asg.id);
          value.className = 'text-[11px] font-bold';
          value.title = 'Pondération (%)';
          value.textContent = String(getAssignmentWeightForLevel(asg, level));
          input.replaceWith(value);
        });
      };
      document.getElementById('btnWeightMode').addEventListener('click', () => {
        weightMode = !weightMode;
        if (!weightMode) {
          closeWeightMode();
        } else {
          renderGradebookView();
        }
      });
      document.addEventListener('pointerdown', event => {
        if (!weightMode || event.target.closest('#btnWeightMode, #weightControls, #gbLevelFilterBar, [data-weight-lock], [data-weight-step], [data-weight-input]')) return;
        setTimeout(() => {
          if (weightMode) closeWeightMode();
        }, 0);
      });
      document.getElementById('btnResetEqualWeights').addEventListener('click', () => {
        const termData = getActiveTermData();
        const subData = termData.subjectData[appState.activeSubjectId];
        subData.equalWeights = true;
        recalculateEqualWeights(subData);
        unlockedWeights.clear();
        weightLevel = '';
        notifyUpdate('Pondération répartie équitablement (100%)');
        renderAll();
      });

      // Add Assignment Modal (Requires explicit custom name!)
      const modalAsg = document.getElementById('modalAddAssignment');
      const renderModalAddAsgTargetLevels = () => {
        const box = document.getElementById('asgTargetLevelsBox');
        const list = document.getElementById('asgTargetLevelsList');
        if (!box || !list) return;
        const presentLevels = getPresentStudentLevels();
        const isMulti = presentLevels.length > 1;
        box.classList.toggle('hidden', !isMulti);
        list.innerHTML = '';
        if (!isMulti) {
          modalAddAsgTargetLevels = [];
          return;
        }
        modalAddAsgTargetLevels = modalAddAsgTargetLevels.filter(l => presentLevels.includes(l));
        if (modalAddAsgTargetLevels.length === presentLevels.length) {
          modalAddAsgTargetLevels = [];
        }

        const isAll = modalAddAsgTargetLevels.length === 0;

        const allLbl = document.createElement('label');
        allLbl.className = `cursor-pointer inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition shadow-2xs ${isAll ? 'bg-emerald-50 border-emerald-300 text-emerald-900 ring-1 ring-emerald-300' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'}`;
        allLbl.innerHTML = `<input type="checkbox" class="rounded accent-emerald-600 w-4 h-4 cursor-pointer" ${isAll ? 'checked' : ''}><span>Tout le groupe (tous les niveaux)</span>`;
        allLbl.querySelector('input').addEventListener('change', () => {
          modalAddAsgTargetLevels = [];
          renderModalAddAsgTargetLevels();
        });
        list.appendChild(allLbl);

        presentLevels.forEach(lvl => {
          const isChecked = !isAll && modalAddAsgTargetLevels.includes(lvl);
          const count = appState.students.filter(s => String(s.gradeLevel) === lvl).length;
          const lvlLbl = document.createElement('label');
          lvlLbl.className = `cursor-pointer inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition shadow-2xs ${isChecked ? 'bg-indigo-50 border-indigo-300 text-indigo-900 ring-1 ring-indigo-300' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`;
          lvlLbl.innerHTML = `<input type="checkbox" value="${lvl}" class="rounded accent-indigo-600 w-4 h-4 cursor-pointer" ${isChecked ? 'checked' : ''}><span>${escapeHtml(GRADE_LEVEL_LABELS[lvl] || lvl)} <span class="font-normal text-slate-500 text-[11px]">(${count} élève${count > 1 ? 's' : ''})</span></span>`;
          lvlLbl.querySelector('input').addEventListener('change', (e) => {
            if (isAll) modalAddAsgTargetLevels = [];
            if (e.target.checked) {
              if (!modalAddAsgTargetLevels.includes(lvl)) modalAddAsgTargetLevels.push(lvl);
            } else {
              modalAddAsgTargetLevels = modalAddAsgTargetLevels.filter(x => x !== lvl);
            }
            if (modalAddAsgTargetLevels.length === 0 || modalAddAsgTargetLevels.length === presentLevels.length) {
              modalAddAsgTargetLevels = [];
            }
            renderModalAddAsgTargetLevels();
          });
          list.appendChild(lvlLbl);
        });
      };

      document.getElementById('btnOpenAddAssignment').addEventListener('click', () => {
        const titleIn = document.getElementById('inputAssignmentTitle');
        titleIn.value = '';
        document.getElementById('inputAssignmentOutOf').value = '100';
        modalAddAsgTargetLevels = (isMultiLevelGroup() && gbLevelFilter !== 'ALL') ? [gbLevelFilter] : [];
        renderModalAddAsgTargetLevels();
        const linkBox = document.getElementById('asgLinkedPartsBox');
        const linkList = document.getElementById('asgLinkedParts');
        linkList.innerHTML = '';
        const current = getCurrentSubjectConfig();
        const siblings = current.group ? SUBJECTS_CONFIG.filter(s => s.group === current.group && s.id !== current.id) : [];
        linkBox.classList.toggle('hidden', !siblings.length);
        siblings.forEach(s => {
          const label = document.createElement('label');
          label.className = 'inline-flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer';
          const cb = document.createElement('input');
          cb.type = 'checkbox';
          cb.value = s.id;
          label.append(cb, document.createTextNode(s.partLabel));
          linkList.appendChild(label);
        });
        document.getElementById('inputAssignmentDate').value = new Date().toISOString().slice(0, 10);
        modalAsg.classList.remove('hidden');
        modalAsg.classList.add('flex');
        setTimeout(() => titleIn.focus(), 50);
      });

      const closeAsgModal = () => {
        modalAsg.classList.add('hidden');
        modalAsg.classList.remove('flex');
        newEvaluationButton.focus();
      };
      document.getElementById('btnCloseModalAssignment').addEventListener('click', closeAsgModal);
      document.getElementById('btnCancelModalAssignment').addEventListener('click', closeAsgModal);
      modalAsg.addEventListener('keydown', event => {
        if (event.key === 'Escape') {
          event.preventDefault();
          closeAsgModal();
          return;
        }
        if (event.key !== 'Tab') return;
        const controls = [...modalAsg.querySelectorAll('button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled)')]
          .filter(control => control.getClientRects().length);
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      });

      ['inputAssignmentTitle', 'inputAssignmentOutOf', 'inputAssignmentDate'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
          el.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              document.getElementById('btnConfirmAddAssignment').click();
            }
          });
        }
      });

      document.getElementById('btnConfirmAddAssignment').addEventListener('click', () => {
        const titleIn = document.getElementById('inputAssignmentTitle');
        const title = titleIn.value.trim();
        if (!title) {
          showToast('Veuillez entrer le nom du travail avant de l’ajouter');
          titleIn.focus();
          return;
        }
        const date = document.getElementById('inputAssignmentDate').value;
        const outOfRaw = Number(String(document.getElementById('inputAssignmentOutOf').value).replace(',', '.'));
        if (!Number.isFinite(outOfRaw) || outOfRaw <= 0) {
          showToast('La pondération (note sur…) doit être un nombre positif, par exemple 40.');
          document.getElementById('inputAssignmentOutOf').focus();
          return;
        }
        const termData = getActiveTermData();
        const linkedIds = [...document.querySelectorAll('#asgLinkedParts input:checked')].map(cb => cb.value);
        const targetIds = [appState.activeSubjectId, ...linkedIds];
        const linkId = targetIds.length > 1 ? 'lnk_' + Date.now() : undefined;
        const stamp = Date.now();
        const targetLevels = (isMultiLevelGroup() && modalAddAsgTargetLevels.length > 0)
          ? modalAddAsgTargetLevels.slice()
          : [];
        targetIds.forEach(subId => {
          const subData = termData.subjectData[subId];
          const entry = {
            id: `asg_${stamp}_${subId}`,
            title,
            date,
            weight: 100,
            outOf: outOfRaw,
            isObservation: false
          };
          if (targetLevels.length) entry.targetLevels = targetLevels.slice();
          if (linkId) { entry.linkId = linkId; entry.linkOrigin = subId === appState.activeSubjectId; }
          subData.assignments.push(entry);
          if (subData.equalWeights) recalculateEqualWeights(subData);
        });
        closeAsgModal();
        const lvlSuffix = targetLevels.length ? ` (${formatShortLevelTag(targetLevels[0])})` : '';
        notifyUpdate(targetIds.length > 1
          ? `Évaluation "${title}"${lvlSuffix} ajoutée à ${targetIds.length} compétences`
          : `Travail "${title}"${lvlSuffix} ajouté au carnet`);
        renderAll();
      });

      // Reset buttons for Barème & Visual Trace Session
      document.getElementById('btnClearStudentBareme').addEventListener('click', () => {
        if (!appState.selectedStudentId) {
          showToast('Sélectionner un nom d’abord');
          return;
        }
        const termData = getActiveTermData();
        const rec = termData.subjectData[appState.activeSubjectId].studentRecords[appState.selectedStudentId];
        if (!rec) return;
        rec.baremeChecked = [];
        rec.baremeOverrideCode = null;
        notifyUpdate('Barème réinitialisé');
        renderAll();
      });

      document.getElementById('btnClearCurrentStudentObs').addEventListener('click', () => {
        if (!appState.selectedStudentId) {
          showToast('Sélectionner un nom d’abord');
          return;
        }
        const termData = getActiveTermData();
        const session = termData.subjectData[appState.activeSubjectId].currentObsSession;
        session.studentDrafts[appState.selectedStudentId] = {
          checked: [],
          overrideCode: null,
          tags: [],
          comment: '',
          notEvaluated: true
        };
        notifyUpdate('Élève remis à N/A (« - ») pour cette trace');
        renderQuickObsView();
      });

      // Session Title Input & Student Comment Input in Traces observables
      document.getElementById('qoSessionTitleInput').addEventListener('input', (e) => {
        const termData = getActiveTermData();
        termData.subjectData[appState.activeSubjectId].currentObsSession.title = e.target.value;
      });
      document.getElementById('qoSessionTitleInput').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          e.target.blur();
        }
      });

      document.getElementById('qoCommentInput').addEventListener('input', (e) => {
        const termData = getActiveTermData();
        const draft = termData.subjectData[appState.activeSubjectId].currentObsSession.studentDrafts[appState.selectedStudentId];
        if (draft) {
          draft.comment = e.target.value;
          if (e.target.value.trim()) draft.notEvaluated = false;
          renderQuickObsView();
        }
      });

      // Commit Visual Trace Session to Gradebook (Top & Bottom buttons)
      document.getElementById('btnCommitObsSessionToGradebook').addEventListener('click', commitObservationSessionToGradebook);

      // Print buttons
      const printWithClass = (classes, meta) => {
        document.getElementById('printMeta').textContent = meta || '';
        document.body.classList.add(...classes);
        const cleanup = () => {
          document.body.classList.remove(...classes);
          window.removeEventListener('afterprint', cleanup);
        };
        window.addEventListener('afterprint', cleanup);
        window.print();
      };
      const printMetaText = () => {
        const group = appState.groups.find(g => g.id === appState.activeGroupId);
        const st = appState.students.find(s => s.id === appState.selectedStudentId);
        const sub = getCurrentSubjectConfig();
        return [group && !group.placeholder ? group.name : '', `Étape ${appState.activeTerm}`, appState.activeView === 'viewBareme' && st ? st.name : '', sub && sub.shortName]
          .filter(Boolean).join(' · ');
      };
      const printObservationGrid = blank => {
        printWithClass(blank ? ['print-observation-grid', 'print-observation-blank'] : ['print-observation-grid']);
      };
      const printCurrentView = event => {
        const view = appState.activeView;
        if (view === 'viewStudents') printStudentList();
        else if (view === 'viewGradebook') printWithClass(['print-gradebook'], printMetaText());
        else if (view === 'viewBareme') printWithClass(['print-bareme'], printMetaText());
        else if (view === 'viewGlobalReport') document.getElementById('btnPrintGlobalReport').click();
        else if (view === 'viewQuickObs') {
          const rect = event.currentTarget.getBoundingClientRect();
          openMouseBar(event.clientX || rect.left, event.clientY || rect.bottom, [
            { label: 'Page de l’élève', onPick: () => printObservationGrid(false) },
            { label: 'Grille vierge', onPick: () => printObservationGrid(true) }
          ]);
        } else window.print();
      };
      document.getElementById('btnPrintView').addEventListener('click', printCurrentView);
      document.getElementById('btnPrintBareme').addEventListener('click', printCurrentView);
      document.getElementById('btnPrintSubjectGrid').addEventListener('click', printCurrentView);
      // Le pavé numérique saisit des chiffres dans les champs numériques, même sans Verr. Num.
      document.addEventListener('keydown', e => {
        const input = e.target;
        if (!(input instanceof HTMLInputElement) || input.disabled || input.readOnly ||
            e.altKey || e.ctrlKey || e.metaKey || e.shiftKey || e.isComposing ||
            !(input.type === 'number' || input.inputMode === 'decimal' || input.inputMode === 'numeric')) return;
        const match = /^Numpad([0-9])$/.exec(e.code);
        const value = match ? match[1] : e.code === 'NumpadDecimal' ? '.' : null;
        if (value === null || e.key === value || (e.code === 'NumpadDecimal' && e.key === ',')) return;
        e.preventDefault();
        if (!document.execCommand('insertText', false, value)) {
          showToast('Impossible de saisir ce chiffre. Activez Verr. Num. et réessayez.');
        }
      }, true);

      // Navigation clavier façon tableur dans la grille de notes
      document.getElementById('gradebookBody').addEventListener('keydown', (e) => {
        const inp = e.target;
        if (e.defaultPrevented || !(inp instanceof HTMLInputElement) || e.altKey || e.ctrlKey || e.metaKey) return;
        const td = inp.closest('td');
        const tr = td && td.parentElement;
        if (!tr) return;
        const key = e.key;
        const vertical = key === 'ArrowDown' || key === 'ArrowUp' || key === 'Enter';
        const horizontal = key === 'ArrowLeft' || key === 'ArrowRight';
        if (!vertical && !horizontal) return;
        const focusCell = (cell) => {
          const target = cell && cell.querySelector('input');
          if (!target) return false;
          target.focus();
          if (typeof target.select === 'function') target.select();
          return true;
        };
        if (vertical) {
          e.preventDefault();
          const step = key === 'ArrowUp' || (key === 'Enter' && e.shiftKey) ? -1 : 1;
          const colIdx = Array.prototype.indexOf.call(tr.children, td);
          let row = step === 1 ? tr.nextElementSibling : tr.previousElementSibling;
          while (row) {
            if (focusCell(row.children[colIdx])) return;
            row = step === 1 ? row.nextElementSibling : row.previousElementSibling;
          }
          return;
        }
        const atStart = inp.selectionStart === 0 && inp.selectionEnd === 0;
        const atEnd = inp.selectionStart === inp.value.length && inp.selectionEnd === inp.value.length;
        const allSelected = inp.selectionStart === 0 && inp.selectionEnd === inp.value.length;
        const dir = key === 'ArrowRight' ? 1 : -1;
        if (!(allSelected || (dir === 1 ? atEnd : atStart))) return;
        e.preventDefault();
        let cell = dir === 1 ? td.nextElementSibling : td.previousElementSibling;
        while (cell) {
          if (focusCell(cell)) return;
          cell = dir === 1 ? cell.nextElementSibling : cell.previousElementSibling;
        }
      });



      // Groupes
      const cancelGroupModal = () => {
        closeGroupModal();
        if (returnToWelcomeAfterGroup) showWelcome();
        returnToWelcomeAfterGroup = false;
      };
      document.getElementById('btnGroupClose').addEventListener('click', cancelGroupModal);
      document.getElementById('btnGroupCancel').addEventListener('click', cancelGroupModal);
      document.getElementById('btnGroupSave').addEventListener('click', saveGroupModal);
      ['groupNameInput', 'groupLevelSelect', 'groupCopySelect'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
          el.addEventListener('keydown', e => {
            if (e.key === 'Enter') {
              e.preventDefault();
              saveGroupModal();
            }
          });
        }
      });
      document.getElementById('headerGroupSelect').addEventListener('change', e => {
        const select = e.target;
        const option = select.selectedOptions[0];
        const groupId = select.value;
        select.value = appState.activeGroupId;
        if (select.selectedIndex < 0) select.value = '';
        if (option && option.dataset.action === 'new') {
          startNewGroup();
        } else {
          requestObservationDraftExit(() => switchGroup(groupId));
        }
      });

      // Add Student
      document.getElementById('btnAddStudent').addEventListener('click', () => {
        if (!hasActiveGroup()) {
          showToast('Créez d’abord un groupe pour ajouter des élèves.');
          return;
        }
        const nameIn = document.getElementById('newStudentName');
        const lastNameIn = document.getElementById('newStudentLastName');
        const firstName = nameIn.value.trim();
        const lastName = lastNameIn.value.trim();
        if (!firstName) {
          showToast('Veuillez entrer le prénom de l’élève');
          return;
        }
        const name = [firstName, lastName].filter(Boolean).join(' ');
        const newId = 'stu_' + Date.now();
        appState.students.push({
          id: newId,
          name,
          firstName,
          lastName,
          gradeLevel: (appState.groups.find(g => g.id === appState.activeGroupId) || {}).level || '',
          adaptations: [],
          customAdapt: '',
          competencyLevelsByCycle: {},
          competencyCriterionLevelsByCycle: {},
          competencyEvidenceByCycle: {}
        });
        ['1', '2', '3'].forEach(tKey => {
          ALL_SUBJECTS_CONFIG.forEach(sub => {
            const sd = appState.terms[tKey].subjectData[sub.id];
            sd.studentRecords[newId] = {
              scores: {},
              scoreMeta: {},
              baremeChecked: [],
              baremeOverrideCode: null,
              finalJudgmentOverride: '',
              comment: ''
            };
            if (sd.currentObsSession) {
              sd.currentObsSession.studentDrafts[newId] = {
                checked: [],
                overrideCode: null,
                tags: [],
                comment: ''
              };
            }
          });
        });
        appState.selectedStudentId = null;
        appState.activeView = 'viewStudents';
        nameIn.value = '';
        lastNameIn.value = '';
        notifyUpdate(`Élève ${name} ajouté(e)`);
        renderAll();
        nameIn.focus();
      });

      ['newStudentName', 'newStudentLastName'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
          el.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              document.getElementById('btnAddStudent').click();
            }
          });
        }
      });

      // Excel Export
      document.getElementById('btnExportExcel').addEventListener('click', () => {
        try {
          exportFormattedExcelWorkbook();
        } catch (error) {
          console.error('Échec de la création du classeur Excel.', error);
          showToast('Impossible de créer le fichier Excel. Réessayez ou utilisez la sauvegarde JSON.');
        }
      });

      document.getElementById('btnExportJSON').addEventListener('click', saveJsonFileSmart);
      document.getElementById('btnOpenJSONDirect').addEventListener('click', openJsonFileSmart);
      const backupLoadDialog = document.getElementById('backupLoadDialog');
      const cancelBackupLoad = () => {
        backupLoadDialog.close();
        if (importFromWelcome) showWelcome();
        importFromWelcome = false;
      };
      document.getElementById('btnCancelBackupLoad').addEventListener('click', cancelBackupLoad);
      backupLoadDialog.addEventListener('cancel', event => {
        event.preventDefault();
        cancelBackupLoad();
      });
      backupLoadDialog.addEventListener('keydown', event => {
        if (event.key === 'Escape') {
          event.preventDefault();
          event.stopPropagation();
          cancelBackupLoad();
        }
      });
      document.getElementById('btnConfirmBackupLoad').addEventListener('click', () => {
        backupLoadDialog.close();
        chooseBackupFile();
      });
      document.getElementById('btnDownloadJSON').addEventListener('click', downloadBackup);
      document.getElementById('btnUnlinkJSON').addEventListener('click', async () => {
        if (fileOperation || !activeFileHandle) return;
        fileOperation = true;
        if (activeFileWrite) await activeFileWrite;
        activeFileHandle = null;
        activeFileWritable = false;
        linkedFileText = null;
        fileWriteBlocked = false;
        fileOperation = false;
        setFileSyncStatus('unlinked', 'Aucun fichier lié');
        showToast('Fichier délié. Les modifications ne seront plus enregistrées automatiquement.');
      });

      document.getElementById('inputImportJSON').addEventListener('change', async (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) {
          if (importFromWelcome) showWelcome();
          importFromWelcome = false;
          pendingImportSnapshot = null;
          return;
        }
        e.target.value = '';
        fileOperation = true;
        const loaded = await loadBackupFile(file, null, pendingImportSnapshot);
        fileOperation = false;
        pendingImportSnapshot = null;
        if (!loaded && importFromWelcome) showWelcome();
        importFromWelcome = false;
        if (activeFileHandle && !fileWriteBlocked && getBackupSnapshot() !== lastSavedFileSnapshot) scheduleAppStateSave();
      });

      applyPrefs();
      ['input', 'change', 'click', 'drop', 'dragend'].forEach(eventName => {
        document.addEventListener(eventName, scheduleAppStateSave);
      });
      renderAll();
      recordHistory();
      initialEditableSnapshot = getEditableStateSnapshot();
      lastSavedFileSnapshot = getBackupSnapshot();
      updateHistoryButtons();
      if (!appState.students || appState.students.length === 0) showWelcome();

      // Recherche et tri des élèves
      document.getElementById('studentSearch').addEventListener('input', e => {
        stFilter = e.target.value;
        renderStudentsView();
      });
      document.getElementById('studentSearch').addEventListener('keydown', e => {
        if (e.key === 'Enter') { e.preventDefault(); e.target.blur(); }
      });
      let studentSortKey = '';
      let studentSortDirection = 1;
      const sortButtons = { firstName: 'btnSortAZ', lastName: 'btnSortLastName', level: 'btnSortGrade' };
      const compareText = (a, b) => a.localeCompare(b, 'fr', { sensitivity: 'base' });
      const sortStudents = key => {
        studentSortDirection = studentSortKey === key ? -studentSortDirection : 1;
        studentSortKey = key;
        const first = s => s.firstName || s.name || '';
        const last = s => s.lastName || '';
        const level = s => s.gradeLevel === 'P' ? 0 : (Number(s.gradeLevel) || 99);
        appState.students.sort((a, b) => {
          if (key === 'lastName' && (!last(a) || !last(b)) && Boolean(last(a)) !== Boolean(last(b))) return last(a) ? -1 : 1;
          if (key === 'level' && (level(a) === 99 || level(b) === 99) && level(a) !== level(b)) return level(a) === 99 ? 1 : -1;
          const result = key === 'firstName' ? compareText(first(a), first(b)) || compareText(last(a), last(b))
            : key === 'lastName' ? compareText(last(a), last(b)) || compareText(first(a), first(b))
            : level(a) - level(b) || compareText(first(a), first(b)) || compareText(last(a), last(b));
          return result * studentSortDirection;
        });
        Object.entries(sortButtons).forEach(([id, buttonId]) => {
          const button = document.getElementById(buttonId);
          const label = id === 'firstName' ? 'Prénom' : id === 'lastName' ? 'Nom' : 'Niveau';
          const direction = id === key && studentSortDirection === -1 ? '↑' : '↓';
          button.innerHTML = `${label} <span aria-hidden="true">${direction}</span>`;
          button.setAttribute('aria-label', `Trier par ${label.toLowerCase()}${id === key ? (studentSortDirection === 1 ? ', ordre croissant' : ', ordre décroissant') : ''}`);
        });
        renderAll();
        showToast('Ordre des élèves mis à jour');
      };
      Object.entries(sortButtons).forEach(([key, buttonId]) => {
        document.getElementById(buttonId).addEventListener('click', () => sortStudents(key));
      });

      // Annuler / rétablir
      document.getElementById('btnUndo').addEventListener('click', undoAction);
      document.getElementById('btnRedo').addEventListener('click', redoAction);
      document.addEventListener('focusin', e => {
        if (e.target && 'value' in e.target) e.target.__focusValue = e.target.value;
      });
      document.addEventListener('keydown', e => {
        const t = e.target;
        const typing = t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable);
        const mod = e.ctrlKey || e.metaKey;
        const key = e.key.toLowerCase();
        if (mod && (key === 'z' || key === 'y')) {
          // Dans un champ modifié, Ctrl+Z reste l'annulation native du texte
          if (typing && t.value !== t.__focusValue) return;
          e.preventDefault();
          if (key === 'y' || e.shiftKey) redoAction(); else undoAction();
          return;
        }
        if (e.key === '/' && !mod && !typing) {
          const target = appState.activeView === 'viewStudents' ? 'studentSearch' : null;
          if (target) { e.preventDefault(); document.getElementById(target).focus(); }
        }
        if (e.key === 'Escape') closeSettingsPanel();
      });

      // Options d'affichage
      const settingsPanel = document.getElementById('settingsPanel');
      const settingsBtn = document.getElementById('btnSettings');
      const backupHelpDialog = document.getElementById('backupHelpDialog');
      document.getElementById('btnBackupHelp').addEventListener('click', () => {
        closeSettingsPanel();
        backupHelpDialog.showModal();
      });
      document.getElementById('btnCloseBackupHelp').addEventListener('click', () => backupHelpDialog.close());
      document.getElementById('btnDoneBackupHelp').addEventListener('click', () => backupHelpDialog.close());
      backupHelpDialog.addEventListener('keydown', event => {
        if (event.key === 'Escape') {
          event.preventDefault();
          event.stopPropagation();
          backupHelpDialog.close();
        }
      });
      const referencesDialog = document.getElementById('referencesDialog');
      document.getElementById('btnReferences').addEventListener('click', () => {
        closeSettingsPanel();
        referencesDialog.showModal();
      });
      document.getElementById('btnCloseReferences').addEventListener('click', () => referencesDialog.close());
      window.closeSettingsPanel = () => {
        settingsPanel.classList.add('hidden');
        settingsBtn.setAttribute('aria-expanded', 'false');
      };
      settingsBtn.addEventListener('click', e => {
        e.stopPropagation();
        const open = settingsPanel.classList.toggle('hidden') === false;
        settingsBtn.setAttribute('aria-expanded', String(open));
      });
      document.addEventListener('click', e => {
        if (!settingsPanel.contains(e.target) && e.target !== settingsBtn && !settingsBtn.contains(e.target)) closeSettingsPanel();
      });
      settingsPanel.querySelectorAll('.sp-seg button').forEach(b => b.addEventListener('click', () => {
        prefs[b.parentElement.getAttribute('data-pref')] = b.getAttribute('data-val');
        applyPrefs();
      }));
      settingsPanel.querySelectorAll('[data-pref-check]').forEach(cb => cb.addEventListener('change', () => {
        prefs[cb.getAttribute('data-pref-check')] = cb.checked;
        applyPrefs();
      }));
      window.addEventListener('beforeunload', event => {
        const needsBackupPrompt = (prefs.backupReminder || !!activeFileHandle) && getBackupSnapshot() !== lastSavedFileSnapshot;
        if (needsBackupPrompt) {
          event.preventDefault();
          event.returnValue = '';
        }
      });
    });
