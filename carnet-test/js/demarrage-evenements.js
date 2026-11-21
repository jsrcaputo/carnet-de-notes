    window.addEventListener('DOMContentLoaded', () => {
      const topScroll = document.getElementById('gradebookTopScroll');
      const gradebookScroll = document.getElementById('gradebookScrollContainer');
      if (topScroll && gradebookScroll) {
        topScroll.addEventListener('scroll', () => {
          if (gradebookScrollAnim) return;
          if (Math.abs(gradebookScroll.scrollLeft - topScroll.scrollLeft) > 0.5) gradebookScroll.scrollLeft = topScroll.scrollLeft;
        });
        gradebookScroll.addEventListener('scroll', updateGradebookTopScroll, { passive: true });
        document.getElementById('gbScrollPrev').addEventListener('click', () => scrollGradebookByColumn(-1));
        document.getElementById('gbScrollNext').addEventListener('click', () => scrollGradebookByColumn(1));
        let arrowFrame = 0;
        window.addEventListener('scroll', () => {
          if (arrowFrame) return;
          arrowFrame = requestAnimationFrame(() => { arrowFrame = 0; positionGradebookArrows(); });
        }, { capture: true, passive: true });
        if (window.ResizeObserver) {
          const observer = new ResizeObserver(updateGradebookTopScroll);
          observer.observe(gradebookScroll);
          observer.observe(gradebookScroll.querySelector('table'));
        }
        window.addEventListener('resize', updateGradebookTopScroll);
      }
      const closeWeightGuide = () => {
        document.getElementById('weightGuide').classList.add('hidden');
        try {
          window.localStorage.setItem('carnet_notes_weight_guide_seen_v1', '1');
        } catch (error) {
          console.warn('Impossible de mémoriser le guide de pondération.', error);
        }
        document.getElementById('btnWeightMode').focus();
      };
      const weightGuide = document.getElementById('weightGuide');
      if (weightGuide) {
        document.getElementById('weightGuideDone').addEventListener('click', closeWeightGuide);
        weightGuide.addEventListener('keydown', event => {
          if (event.key === 'Escape') { event.preventDefault(); closeWeightGuide(); }
          if (event.key === 'Tab') { event.preventDefault(); document.getElementById('weightGuideDone').focus(); }
        });
        window.addEventListener('resize', positionWeightGuide);
        window.addEventListener('scroll', positionWeightGuide, true);
      }
      document.getElementById('welcomeClose').addEventListener('click', event => {
        event.stopPropagation();
        dismissWelcome();
      });
      document.getElementById('welcomeOverlay').addEventListener('click', event => {
        if (!event.target.closest('.welcome-card')) dismissWelcome();
      });
      document.getElementById('welcomeCreate').addEventListener('click', startGroupFromWelcome);
      document.getElementById('welcomeDemoToggle').addEventListener('click', event => {
        const toggle = event.currentTarget;
        const content = document.getElementById('welcomeDemoContent');
        const expanded = toggle.getAttribute('aria-expanded') === 'true';
        toggle.setAttribute('aria-expanded', String(!expanded));
        if (expanded) {
          content.classList.remove('is-open');
          window.setTimeout(() => { content.hidden = true; }, 340);
        } else {
          content.hidden = false;
          requestAnimationFrame(() => content.classList.add('is-open'));
        }
      });
      const demoChoices = document.querySelectorAll('#welcomeDemoChoices input[type="checkbox"]');
      const syncDemoChoices = () => {
        const selected = [...demoChoices].filter(input => input.checked);
        document.getElementById('welcomeDemo').disabled = selected.length !== 1;
      };
      demoChoices.forEach(input => input.addEventListener('change', event => {
        if (event.target.checked) {
          demoChoices.forEach(other => {
            if (other !== event.target) other.checked = false;
          });
        }
        syncDemoChoices();
      }));
      syncDemoChoices();
      document.getElementById('welcomeDemo').addEventListener('click', () => {
        const selectedOptionIds = [...demoChoices].filter(input => input.checked).map(input => input.value);
        if (selectedOptionIds.length !== 1) {
          showToast('Choisissez au moins une classe de démonstration.');
          return;
        }
        hideWelcome();
        requestObservationDraftExit(() => {
          const wasPristine = isPristineInitialGroup();
          if (wasPristine) initializeExampleGroups(selectedOptionIds);
          else ensureExampleGroups(selectedOptionIds);
          const firstOption = DEMO_OPTIONS.find(option => selectedOptionIds.includes(option.id));
          const firstGroupId = firstOption && firstOption.groups[0] ? firstOption.groups[0].id : null;
          if (firstGroupId) switchGroup(firstGroupId);
          appState.activeView = 'viewStudents';
          expandedSubjectGroup = null;
          renderAll();
          if (wasPristine) {
            history.undo = [];
            history.redo = [];
            history.last = getEditableStateSnapshot();
            updateHistoryButtons();
          }
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
      const brandHomeBtn = document.getElementById('btnSidebarBrandHome');
      if (brandHomeBtn) brandHomeBtn.addEventListener('click', showWelcome);
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
        const controls = [...modal.querySelectorAll('button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled)')]
          .filter(control => control.getClientRects().length);
        const first = controls[0];
        const last = controls[controls.length - 1];
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
          navigateToView(nextView, () => {
            appState.activeTerm = nextTerm;
            competencyTermSelected = null;
          });
        });
      });

      document.getElementById('btnNavGlobalReport').addEventListener('click', () => {
        navigateToView('viewGlobalReport', () => {
          if (appState.activeView !== 'viewGlobalReport') {
            viewBeforeGlobalReport = appState.activeView === 'viewStudents' ? 'viewStudents' : 'viewGradebook';
          }
        });
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
          if (!synth) {
            showToast('Aucune trace qualitative exploitable pour la synthèse. Choisissez des formulations selon vos observations.');
            return;
          }
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
        const button = document.getElementById('btnFullscreen');
        if (lbl) {
          lbl.textContent = document.fullscreenElement ? 'Quitter plein écran' : 'Plein écran';
        }
        if (button) {
          button.setAttribute('aria-label', document.fullscreenElement ? 'Quitter le plein écran' : 'Passer en plein écran');
          button.title = document.fullscreenElement ? 'Quitter le plein écran' : 'Basculer en plein écran';
        }
      });

      // Top bar "Élèves" button (toggles the student manager or returns to the gradebook)
      document.getElementById('btnNavStudentsTop').addEventListener('click', () => {
        const canReturn = hasActiveGroup() && appState.students.length > 0;
        navigateToView(appState.activeView === 'viewStudents' && canReturn ? 'viewGradebook' : 'viewStudents');
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
      const groupChoiceButton = document.getElementById('btnSidebarGroupChoice');
      const groupChoiceMenu = document.getElementById('sidebarChoiceMenu');
      if (groupChoiceButton && groupChoiceMenu) {
        const closeGroupChoice = () => {
          groupChoiceMenu.classList.add('hidden');
          groupChoiceButton.setAttribute('aria-expanded', 'false');
        };
        groupChoiceButton.addEventListener('click', () => {
          if (!groupChoiceMenu.classList.contains('hidden')) { closeGroupChoice(); return; }
          groupChoiceMenu.replaceChildren();
          const choices = [...document.querySelectorAll('#headerGroupSelect option')].filter(option => !option.disabled && !option.dataset.action);
          choices.forEach(option => {
            const button = document.createElement('button');
            button.type = 'button';
            button.setAttribute('role', 'menuitemradio');
            button.setAttribute('aria-checked', String(option.value === appState.activeGroupId));
            button.textContent = option.textContent;
            button.addEventListener('click', () => {
              closeGroupChoice();
              groupChoiceButton.focus();
              requestObservationDraftExit(() => switchGroup(option.value));
            });
            groupChoiceMenu.appendChild(button);
          });
          const addAction = (label, action) => {
            const button = document.createElement('button');
            button.type = 'button';
            button.setAttribute('role', 'menuitem');
            button.textContent = label;
            button.addEventListener('click', () => { closeGroupChoice(); action(); });
            groupChoiceMenu.appendChild(button);
          };
          addAction('＋ Créer un groupe', startNewGroup);
          if (choices.length) addAction('Gérer les groupes', () => navigateToView('viewStudents'));
          groupChoiceMenu.classList.remove('hidden');
          groupChoiceButton.setAttribute('aria-expanded', 'true');
          const rect = groupChoiceButton.getBoundingClientRect();
          const width = groupChoiceMenu.offsetWidth;
          const height = groupChoiceMenu.offsetHeight;
          const rightFits = rect.right + width + 8 <= window.innerWidth;
          const leftFits = rect.left - width - 8 >= 0;
          const left = rightFits ? rect.right + 8 : leftFits ? rect.left - width - 8 : Math.max(8, Math.min(rect.left, window.innerWidth - width - 8));
          const preferredTop = rightFits || leftFits ? rect.top : rect.bottom + 8;
          const top = Math.max(8, Math.min(preferredTop, window.innerHeight - height - 8));
          Object.assign(groupChoiceMenu.style, { left: `${left}px`, top: `${top}px` });
          groupChoiceMenu.querySelector('button').focus();
        });
        document.addEventListener('click', event => {
          if (!groupChoiceMenu.contains(event.target) && !groupChoiceButton.contains(event.target)) closeGroupChoice();
        });
        document.addEventListener('keydown', event => {
          if (event.key === 'Escape' && !groupChoiceMenu.classList.contains('hidden')) {
            closeGroupChoice();
            groupChoiceButton.focus();
          } else if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key) && groupChoiceMenu.contains(document.activeElement)) {
            event.preventDefault();
            const items = [...groupChoiceMenu.querySelectorAll('button')];
            const index = items.indexOf(document.activeElement);
            const next = event.key === 'Home' ? 0 : event.key === 'End' ? items.length - 1
              : (index + (event.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
            items[next].focus();
          }
        });
        window.addEventListener('resize', closeGroupChoice);
      }
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
      const btnStudentSearch = document.getElementById('btnStudentSearch');
      const headerStudentSearch = document.getElementById('headerStudentSearch');
      const studentSearchDropdown = document.getElementById('studentSearchDropdown');
      const studentSearchMessage = document.getElementById('studentSearchMessage');
      let studentJumpResults = [];
      let studentJumpActiveIndex = -1;
      let suppressNextSearchFocusOpen = false;
      let ignoreNextSlashTarget = null;
      let ignoreNextSlashUntil = 0;

      function attachSlashShortcutGuard(el) {
        if (!el) return;
        el.addEventListener('beforeinput', event => {
          if (ignoreNextSlashTarget === el && Date.now() <= ignoreNextSlashUntil && event.data === '/') {
            event.preventDefault();
            ignoreNextSlashTarget = null;
          }
        });
        el.addEventListener('input', () => {
          if (ignoreNextSlashTarget === el && Date.now() <= ignoreNextSlashUntil && el.value.endsWith('/')) {
            el.value = el.value.slice(0, -1);
            ignoreNextSlashTarget = null;
          }
        });
      }
      attachSlashShortcutGuard(headerStudentSearch);
      attachSlashShortcutGuard(document.getElementById('studentSearch'));

      function collectAllStudentsForJump() {
        const entries = [];
        appState.groups.forEach(group => {
          if (!group || group.placeholder) return;
          const isActiveGroup = group.id === appState.activeGroupId;
          const students = isActiveGroup
            ? (appState.students || [])
            : ((appState.groupStore[group.id] && appState.groupStore[group.id].students) || []);
          students.forEach(st => {
            if (!st || !st.id) return;
            entries.push({
              studentId: st.id,
              name: st.name || '',
              groupId: group.id,
              groupName: group.name || '',
              isActiveGroup
            });
          });
        });
        return entries;
      }

      function filterStudentsForJump(query) {
        const normQuery = normText(query).trim();
        const tokens = normQuery ? normQuery.split(/\s+/).filter(Boolean) : [];
        const all = collectAllStudentsForJump();

        const scored = [];
        all.forEach(entry => {
          const normName = normText(entry.name);
          const normGroup = normText(entry.groupName);
          const combined = `${normName} ${normGroup}`.trim();
          if (tokens.length && !tokens.every(tok => combined.includes(tok))) return;

          let rank = 3;
          if (!normQuery) {
            rank = 0;
          } else if (normName.startsWith(normQuery)) {
            rank = 0;
          } else if (normName.split(/\s+/).some(part => part.startsWith(normQuery))) {
            rank = 1;
          } else if (tokens.every(tok => normName.includes(tok))) {
            rank = 2;
          }
          scored.push({ entry, rank });
        });

        scored.sort((a, b) => {
          if (a.rank !== b.rank) return a.rank - b.rank;
          if (a.entry.isActiveGroup !== b.entry.isActiveGroup) return a.entry.isActiveGroup ? -1 : 1;
          const byName = a.entry.name.localeCompare(b.entry.name, 'fr', { sensitivity: 'base' });
          if (byName !== 0) return byName;
          return a.entry.groupName.localeCompare(b.entry.groupName, 'fr', { sensitivity: 'base' });
        });

        return scored.slice(0, tokens.length ? 30 : 20).map(item => item.entry);
      }

      function updateStudentJumpActiveOption() {
        if (!studentSearchDropdown) return;
        const buttons = [...studentSearchDropdown.querySelectorAll('.student-search-option')];
        buttons.forEach((btn, idx) => {
          const isActive = idx === studentJumpActiveIndex;
          btn.classList.toggle('is-active', isActive);
          btn.setAttribute('aria-selected', String(isActive));
        });
        if (studentJumpActiveIndex >= 0 && buttons[studentJumpActiveIndex]) {
          headerStudentSearch.setAttribute('aria-activedescendant', buttons[studentJumpActiveIndex].id);
          buttons[studentJumpActiveIndex].scrollIntoView({ block: 'nearest' });
        } else {
          headerStudentSearch.removeAttribute('aria-activedescendant');
        }
      }

      function closeStudentJumpDropdown() {
        if (!studentSearchDropdown) return;
        studentSearchDropdown.classList.add('hidden');
        headerStudentSearch.setAttribute('aria-expanded', 'false');
        headerStudentSearch.removeAttribute('aria-activedescendant');
        studentJumpActiveIndex = -1;
      }

      function jumpToStudentReport(entry) {
        if (!entry || !entry.studentId) return;
        closeStudentJumpDropdown();
        requestObservationDraftExit(() => {
          gbFilter = '';
          headerStudentSearch.value = '';
          studentSearchMessage.textContent = '';
          headerStudentSearch.blur();
          if (entry.groupId !== appState.activeGroupId) {
            switchGroup(entry.groupId);
          }
          competencyPanelOpen = false;
          expandedSubjectGroup = null;
          appState.activeView = 'viewGlobalReport';
          appState.selectedStudentId = entry.studentId;
          renderAll();
          const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
          window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' });
        });
      }

      function renderStudentJumpDropdown(query) {
        if (!studentSearchDropdown) return;
        const hasAnyStudent = collectAllStudentsForJump().length > 0;
        studentJumpResults = filterStudentsForJump(query);
        studentSearchDropdown.innerHTML = '';
        studentSearchMessage.textContent = '';

        if (!studentJumpResults.length) {
          const empty = document.createElement('div');
          empty.className = 'student-search-empty';
          empty.textContent = hasAnyStudent
            ? 'Aucun élève trouvé dans vos groupes.'
            : 'Aucun élève dans vos groupes.';
          studentSearchDropdown.appendChild(empty);
          studentJumpActiveIndex = -1;
        } else {
          studentJumpResults.forEach((entry, idx) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.role = 'option';
            btn.id = `studentSearchOpt_${idx}`;
            btn.className = 'student-search-option';
            btn.setAttribute('aria-selected', 'false');

            const nameSpan = document.createElement('span');
            nameSpan.className = 'student-search-name';
            nameSpan.textContent = entry.name;

            const groupSpan = document.createElement('span');
            groupSpan.className = 'student-search-group';
            groupSpan.textContent = entry.groupName;

            btn.append(nameSpan, groupSpan);
            btn.addEventListener('mousedown', event => {
              event.preventDefault();
            });
            btn.addEventListener('click', () => {
              jumpToStudentReport(entry);
            });
            studentSearchDropdown.appendChild(btn);
          });
          studentJumpActiveIndex = 0;
        }

        studentSearchDropdown.classList.remove('hidden');
        headerStudentSearch.setAttribute('aria-expanded', 'true');
        updateStudentJumpActiveOption();
      }

      headerStudentSearch.addEventListener('focus', () => {
        if (suppressNextSearchFocusOpen) return;
        renderStudentJumpDropdown(headerStudentSearch.value);
      });
      headerStudentSearch.addEventListener('input', () => {
        renderStudentJumpDropdown(headerStudentSearch.value);
      });
      headerStudentSearch.addEventListener('keydown', event => {
        const isOpen = studentSearchDropdown && !studentSearchDropdown.classList.contains('hidden');
        if (event.key === 'ArrowDown') {
          event.preventDefault();
          if (!isOpen) {
            renderStudentJumpDropdown(headerStudentSearch.value);
            return;
          }
          if (studentJumpResults.length) {
            studentJumpActiveIndex = (studentJumpActiveIndex + 1) % studentJumpResults.length;
            updateStudentJumpActiveOption();
          }
        } else if (event.key === 'ArrowUp') {
          event.preventDefault();
          if (!isOpen) {
            renderStudentJumpDropdown(headerStudentSearch.value);
            return;
          }
          if (studentJumpResults.length) {
            studentJumpActiveIndex = (studentJumpActiveIndex - 1 + studentJumpResults.length) % studentJumpResults.length;
            updateStudentJumpActiveOption();
          }
        } else if (event.key === 'Enter') {
          event.preventDefault();
          event.stopPropagation();
          event.stopImmediatePropagation();
          if (!isOpen && headerStudentSearch.value.trim()) {
            renderStudentJumpDropdown(headerStudentSearch.value);
          }
          const chosen = studentJumpResults.length
            ? studentJumpResults[studentJumpActiveIndex >= 0 ? studentJumpActiveIndex : 0]
            : null;
          if (chosen) {
            suppressNextSearchFocusOpen = true;
            closeStudentJumpDropdown();
            headerStudentSearch.blur();
            window.setTimeout(() => {
              suppressNextSearchFocusOpen = false;
              jumpToStudentReport(chosen);
            }, 0);
          }
        } else if (event.key === 'Escape') {
          if (isOpen) {
            event.preventDefault();
            closeStudentJumpDropdown();
          }
        } else if (event.key === 'Tab') {
          closeStudentJumpDropdown();
        }
      });
      document.addEventListener('click', event => {
        if (studentSearchPopover && !studentSearchPopover.contains(event.target)) {
          closeStudentJumpDropdown();
        }
      });
      if (btnStudentSearch) {
        btnStudentSearch.addEventListener('click', () => {
          const isOpen = studentSearchDropdown && !studentSearchDropdown.classList.contains('hidden');
          if (isOpen && headerStudentSearch.value.trim() && studentJumpResults.length) {
            const chosen = studentJumpResults[studentJumpActiveIndex >= 0 ? studentJumpActiveIndex : 0];
            if (chosen) {
              jumpToStudentReport(chosen);
              return;
            }
          }
          headerStudentSearch.focus({ preventScroll: true });
          renderStudentJumpDropdown(headerStudentSearch.value);
        });
      }
      document.getElementById('btnClearStudentFilter').addEventListener('click', () => {
        gbFilter = '';
        headerStudentSearch.value = '';
        studentSearchMessage.textContent = '';
        renderGradebookView();
        headerStudentSearch.focus({ preventScroll: true });
      });
      document.getElementById('btnOpenStudentsFromEmpty').addEventListener('click', () => {
        if (!hasActiveGroup()) {
          startNewGroup();
        } else if (navigateToView('viewStudents')) {
          document.getElementById('btnOpenAddStudent').click();
        }
      });

      document.getElementById('btnBackToGradebookFromBareme').addEventListener('click', () => {
        navigateToView('viewGradebook');
      });

      // Back to Gradebook button inside Visual Trace panel
      document.getElementById('btnBackToGradebookFromTrace').addEventListener('click', () => {
        navigateToView('viewGradebook');
      });

      const newEvaluationButton = document.getElementById('btnNewEvaluation');
      const newEvaluationChoices = document.getElementById('newEvaluationChoices');
      const closeEvaluationChoices = () => hideNewEvalChoicesPopover();
      newEvaluationButton.addEventListener('click', () => {
        const isOpen = !newEvaluationChoices.classList.contains('hidden') && !newEvaluationChoices.classList.contains('is-closing');
        if (isOpen) {
          closeEvaluationChoices();
          return;
        }
        newEvaluationChoices.classList.remove('is-closing', 'hidden');
        newEvaluationButton.setAttribute('aria-expanded', 'true');
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
        const controls = document.getElementById('weightControls');
        weightMode = false;
        unlockedWeights.clear();
        weightLevel = '';
        document.getElementById('btnWeightMode').setAttribute('aria-expanded', 'false');
        controls.classList.add('is-closing');
        window.setTimeout(() => {
          controls.classList.remove('is-closing');
          controls.classList.add('hidden');
          if (appState.activeView === 'viewGradebook') renderGradebookView();
        }, 190);
      };
      document.getElementById('btnWeightMode').addEventListener('click', () => {
        weightMode = !weightMode;
        if (!weightMode) {
          closeWeightMode();
        } else {
          renderGradebookView();
          showFirstMultiWeightTip();
        }
      });
      document.addEventListener('pointerdown', event => {
        if (!weightMode || event.target.closest('#btnWeightMode, #weightControls, [data-weight-box], [data-weight-lock], [data-weight-step], [data-weight-input], #weightGuide')) return;
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
      const btnUnlockAll = document.getElementById('btnUnlockAllWeights');
      if (btnUnlockAll) {
        btnUnlockAll.addEventListener('click', () => {
          unlockedWeights.clear();
          notifyUpdate('Toutes les pondérations sont maintenant libres');
          renderGradebookView();
        });
      }

      // Add Assignment Modal (Requires explicit custom name!)
      const modalAsg = document.getElementById('modalAddAssignment');
      let modalEditingAssignmentId = null;
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
        const isAll = modalAddAsgTargetLevels.length === 0;

        const allLbl = document.createElement('label');
        allLbl.className = `cursor-pointer inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition shadow-2xs ${isAll ? 'bg-indigo-50 border-indigo-300 text-indigo-900 ring-1 ring-indigo-300' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'}`;
        allLbl.innerHTML = `<input type="checkbox" class="rounded accent-indigo-600 w-4 h-4 cursor-pointer" ${isAll ? 'checked' : ''}><span>Tout le groupe (tous les niveaux)</span>`;
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
              if (!isAll && presentLevels.length === 2 && modalAddAsgTargetLevels.length === 1) modalAddAsgTargetLevels = [lvl];
              else if (!modalAddAsgTargetLevels.includes(lvl)) modalAddAsgTargetLevels.push(lvl);
            } else {
              if (modalAddAsgTargetLevels.length === 1) {
                showToast('Choisissez au moins un niveau ou tout le groupe.');
                renderModalAddAsgTargetLevels();
                return;
              }
              modalAddAsgTargetLevels = modalAddAsgTargetLevels.filter(x => x !== lvl);
            }
            renderModalAddAsgTargetLevels();
          });
          list.appendChild(lvlLbl);
        });
      };

      document.getElementById('btnOpenAddAssignment').addEventListener('click', () => {
        modalEditingAssignmentId = null;
        document.getElementById('modalAddAssignmentTitle').textContent = 'Ajout d’une évaluation';
        document.getElementById('btnConfirmAddAssignment').textContent = 'Ajouter au carnet';
        document.getElementById('btnConfirmAddAssignment').textContent = 'Ajouter au carnet';
        const titleIn = document.getElementById('inputAssignmentTitle');
        titleIn.value = '';
        document.getElementById('inputAssignmentOutOf').value = '100';
        modalAddAsgTargetLevels = (isMultiLevelGroup() && gbLevelFilter !== 'ALL') ? [gbLevelFilter] : [];
        renderModalAddAsgTargetLevels();
        const linkBox = document.getElementById('asgLinkedPartsBox');
        const linkList = document.getElementById('asgLinkedParts');
        linkList.innerHTML = '';
        const current = getCurrentSubjectConfig();
        const siblings = current.group ? getVisibleSubjectsForContext(SUBJECTS_CONFIG).filter(s => s.group === current.group && s.id !== current.id) : [];
        linkBox.classList.toggle('hidden', !siblings.length);
        siblings.forEach(s => {
          const label = document.createElement('label');
          label.className = 'inline-flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer';
          const cb = document.createElement('input');
          cb.type = 'checkbox';
          cb.value = s.id;
          label.append(cb, document.createTextNode(getSubjectContextDisplay(s).partLabel));
          linkList.appendChild(label);
        });
        document.getElementById('inputAssignmentDate').value = new Date().toISOString().slice(0, 10);
        modalAsg.classList.remove('hidden');
        modalAsg.classList.add('flex');
        setTimeout(() => titleIn.focus(), 50);
      });

      window.openAssignmentForEditing = asgId => {
        const termData = getActiveTermData();
        const subData = termData.subjectData[appState.activeSubjectId];
        const assignment = subData && (subData.assignments || []).find(item => item.id === asgId && !item.isObservation);
        if (!assignment) return;
        modalEditingAssignmentId = assignment.id;
        document.getElementById('modalAddAssignmentTitle').textContent = 'Modifier l’évaluation';
        document.getElementById('btnConfirmAddAssignment').textContent = 'Enregistrer les modifications';
        document.getElementById('inputAssignmentTitle').value = assignment.title || '';
        document.getElementById('inputAssignmentOutOf').value = String(getAssignmentOutOf(assignment));
        document.getElementById('inputAssignmentDate').value = assignment.date || new Date().toISOString().slice(0, 10);
        modalAddAsgTargetLevels = getAssignmentTargetLevels(assignment).slice();
        renderModalAddAsgTargetLevels();

        const linkBox = document.getElementById('asgLinkedPartsBox');
        const linkList = document.getElementById('asgLinkedParts');
        linkList.innerHTML = '';
        const current = getCurrentSubjectConfig();
        const siblings = current.group ? getVisibleSubjectsForContext(SUBJECTS_CONFIG).filter(s => s.group === current.group && s.id !== current.id) : [];
        linkBox.classList.toggle('hidden', !assignment.linkId || !siblings.length);
        siblings.forEach(subject => {
          const linked = assignment.linkId
            ? getLinkedAssignments(assignment).some(link => link.sub.id === subject.id)
            : false;
          const label = document.createElement('label');
          label.className = 'inline-flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer';
          const checkbox = document.createElement('input');
          checkbox.type = 'checkbox';
          checkbox.value = subject.id;
          checkbox.checked = linked;
          label.append(checkbox, document.createTextNode(getSubjectContextDisplay(subject).partLabel));
          linkList.appendChild(label);
        });
        modalAsg.classList.remove('hidden');
        modalAsg.classList.add('flex');
        setTimeout(() => document.getElementById('inputAssignmentTitle').focus(), 50);
      };

      const closeAsgModal = () => {
        modalAsg.classList.add('hidden');
        modalAsg.classList.remove('flex');
        modalEditingAssignmentId = null;
        document.getElementById('modalAddAssignmentTitle').textContent = 'Ajout d’une évaluation';
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
          showToast('Le dénominateur (note sur…) doit être un nombre positif, par exemple 40.');
          document.getElementById('inputAssignmentOutOf').focus();
          return;
        }
        if (modalEditingAssignmentId) {
          const termData = getActiveTermData();
          const subData = termData.subjectData[appState.activeSubjectId];
          const assignment = subData && (subData.assignments || []).find(item => item.id === modalEditingAssignmentId);
          if (!assignment) {
            closeAsgModal();
            showToast('Cette évaluation n’existe plus.');
            return;
          }
          const targetLevels = (isMultiLevelGroup() && modalAddAsgTargetLevels.length > 0)
            ? modalAddAsgTargetLevels.slice()
            : [];
          const linked = assignment.linkId
            ? Object.values(termData.subjectData).flatMap(data =>
                (data.assignments || []).filter(item => item.linkId === assignment.linkId))
            : [assignment];
          linked.forEach(item => {
            item.title = title;
            item.date = date;
            item.outOf = outOfRaw;
            if (targetLevels.length) item.targetLevels = targetLevels.slice();
            else delete item.targetLevels;
          });
          closeAsgModal();
          notifyUpdate(`Évaluation "${title}" modifiée`);
          renderAll();
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
        notifyUpdate('Repères de jugement réinitialisés');
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
          strengths: '',
          challenges: '',
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

      [['qoCommentInput', 'comment'], ['qoStrengthsInput', 'strengths'], ['qoChallengesInput', 'challenges']].forEach(([id, field]) => {
        document.getElementById(id).addEventListener('input', (e) => {
          const termData = getActiveTermData();
          const draft = termData.subjectData[appState.activeSubjectId].currentObsSession.studentDrafts[appState.selectedStudentId];
          if (draft) {
            draft[field] = e.target.value;
            if (e.target.value.trim()) draft.notEvaluated = false;
            renderQuickObsView();
          }
        });
      });

      // Commit Visual Trace Session to Gradebook (Top & Bottom buttons)
      document.getElementById('btnCommitObsSessionToGradebook').addEventListener('click', commitObservationSessionToGradebook);
      document.getElementById('btnCloseCustomRubric').addEventListener('click', closeCustomRubricEditor);
      document.getElementById('btnCancelCustomRubric').addEventListener('click', closeCustomRubricEditor);
      document.getElementById('btnApplyCustomRubric').addEventListener('click', applyCustomRubricEditor);
      document.getElementById('btnDeleteCustomRubric').addEventListener('click', deleteCustomRubricEditorItem);
      document.getElementById('customRubricDialog').addEventListener('cancel', event => {
        event.preventDefault();
        closeCustomRubricEditor();
      });

      setupPrintCenter();
      setupLegacyModalAccessibility();
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
        if (e.key !== 'Enter' || !e.shiftKey || !(e.target instanceof HTMLInputElement)) return;
        const td = e.target.closest('td');
        const row = td && td.parentElement;
        if (!row) return;
        e.preventDefault();
        e.stopImmediatePropagation();
        const column = Array.prototype.indexOf.call(row.children, td);
        let previous = row.previousElementSibling;
        while (previous) {
          const input = previous.children[column] && previous.children[column].querySelector('input');
          if (input) {
            input.focus();
            input.select();
            return;
          }
          previous = previous.previousElementSibling;
        }
      }, true);

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
      document.getElementById('btnCancelAddStudent').addEventListener('click', () => {
        document.getElementById('addStudentDialog').close();
      });
      document.getElementById('addStudentForm').addEventListener('submit', event => {
        event.preventDefault();
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
                comment: '',
                strengths: '',
                challenges: ''
              };
            }
          });
        });
        appState.selectedStudentId = null;
        appState.activeView = 'viewStudents';
        document.getElementById('addStudentDialog').close();
        notifyUpdate(`Élève ${name} ajouté(e)`);
        renderAll();
        document.getElementById('btnOpenAddStudent').focus();
      });

      // Excel Export
      const exportExcelDialog = document.getElementById('exportExcelDialog');
      const closeExportExcel = () => exportExcelDialog.close();
      document.getElementById('btnExportExcel').addEventListener('click', () => exportExcelDialog.showModal());
      document.getElementById('btnCloseExportExcel').addEventListener('click', closeExportExcel);
      document.getElementById('btnExportExcelNormal').addEventListener('click', async () => {
        closeExportExcel();
        try {
          await exportFormattedExcelWorkbook();
        } catch (error) {
          console.error('Échec de la création du classeur Excel.', error);
          showToast('Impossible de créer le fichier Excel. Réessayez ou utilisez la sauvegarde JSON.');
        }
      });
      document.getElementById('btnExportExcelProtected').addEventListener('click', () => {
        closeExportExcel();
        exportEncryptedExcel();
      });
      exportExcelDialog.addEventListener('keydown', event => {
        if (event.key === 'Escape') {
          event.preventDefault();
          closeExportExcel();
        }
      });

      const saveBackupDialog = document.getElementById('saveBackupDialog');
      const closeSaveBackup = () => saveBackupDialog.close();
      document.getElementById('btnExportJSON').addEventListener('click', () => {
        const normalTitle = document.querySelector('#btnSaveJSONNormal strong');
        const normalDescription = document.querySelector('#btnSaveJSONNormal span');
        const encryptedTitle = document.querySelector('#btnSaveJSONEncrypted strong');
        const encryptedDescription = document.querySelector('#btnSaveJSONEncrypted span');
        if (activeBackupEncryption) {
          normalTitle.textContent = 'Copie normale non chiffrée';
          normalDescription.textContent = 'Crée une copie JSON lisible sans mot de passe. Le fichier chiffré lié reste inchangé.';
        } else if (activeFileHandle) {
          normalTitle.textContent = 'Mettre à jour le fichier lié';
          normalDescription.textContent = 'Enregistre immédiatement les dernières modifications dans le fichier JSON déjà lié.';
        } else {
          normalTitle.textContent = 'Sauvegarde normale';
          normalDescription.textContent = 'Fichier JSON permettant de rouvrir et de mettre à jour le carnet. Son contenu est lisible si le fichier est ouvert directement.';
        }
        if (activeBackupEncryption && activeFileHandle) {
          encryptedTitle.textContent = 'Mettre à jour le fichier chiffré lié';
          encryptedDescription.textContent = 'Enregistre immédiatement dans le fichier déjà protégé, avec le même mot de passe.';
        } else {
          encryptedTitle.textContent = 'Sauvegarde chiffrée';
          encryptedDescription.textContent = 'Copie JSON protégée par mot de passe. Le fichier pourra rester lié si le navigateur autorise l’écriture directe.';
        }
        saveBackupDialog.showModal();
      });
      document.getElementById('btnCloseSaveBackup').addEventListener('click', closeSaveBackup);
      document.getElementById('btnSaveJSONNormal').addEventListener('click', () => {
        closeSaveBackup();
        if (activeBackupEncryption) downloadBackup(null);
        else saveJsonFileSmart();
      });
      document.getElementById('btnSaveJSONEncrypted').addEventListener('click', () => {
        closeSaveBackup();
        saveEncryptedJsonFileSmart();
      });
      saveBackupDialog.addEventListener('keydown', event => {
        if (event.key === 'Escape') {
          event.preventDefault();
          closeSaveBackup();
        }
      });
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
      document.getElementById('btnDownloadLegacyBrowser').addEventListener('click', () => {
        try {
          const raw = window.localStorage.getItem(LOCAL_STORAGE_KEY);
          if (!raw) { updateLegacyBrowserBackup(); showToast('Aucune ancienne copie trouvée dans ce navigateur.'); return; }
          downloadBlob(new Blob([raw], { type: 'application/json;charset=utf-8' }), 'ancienne-copie-carnet.json');
          showToast('Ancienne copie téléchargée. Vérifiez-la avant de l’effacer du navigateur.');
        } catch (error) {
          console.error('Impossible de télécharger l’ancienne copie.', error);
          showToast('Impossible de télécharger l’ancienne copie du navigateur.');
        }
      });
      document.getElementById('btnDeleteLegacyBrowser').addEventListener('click', () => {
        if (!window.confirm('Effacer définitivement l’ancienne copie de ce navigateur ? Assurez-vous d’avoir vérifié votre fichier JSON.')) return;
        try {
          window.localStorage.removeItem(LOCAL_STORAGE_KEY);
          updateLegacyBrowserBackup();
          showToast('Ancienne copie effacée de ce navigateur.');
        } catch (error) {
          console.error('Impossible d’effacer l’ancienne copie.', error);
          showToast('Impossible d’effacer l’ancienne copie du navigateur.');
        }
      });
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
        showToast(activeBackupEncryption
          ? 'Fichier délié. Les prochaines copies restent chiffrées avec le même mot de passe.'
          : 'Fichier délié. Les modifications ne seront plus enregistrées automatiquement.');
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
      updateLegacyBrowserBackup();
      ['input', 'change', 'drop', 'dragend'].forEach(eventName => {
        document.addEventListener(eventName, scheduleAppStateSave);
      });
      renderAll();
      recordHistory();
      initialEditableSnapshot = getEditableStateSnapshot();
      lastSavedFileSnapshot = getBackupSnapshot();
      updateHistoryButtons();
      showWelcome();

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
          const modalOpen = Boolean(
            document.querySelector('dialog[open]')
            || ['welcomeOverlay', 'tutorialOverlay', 'modalUnsavedObservation', 'modalAddAssignment', 'modalGroup', 'modalCommentBank']
              .some(id => {
                const el = document.getElementById(id);
                return el && !el.classList.contains('hidden');
              })
          );
          if (modalOpen) return;
          const noActiveGroup = document.documentElement.classList.contains('no-active-group');
          const target = (appState.activeView === 'viewStudents' && !noActiveGroup)
            ? 'studentSearch'
            : 'headerStudentSearch';
          const targetEl = document.getElementById(target);
          if (!targetEl) return;
          e.preventDefault();
          ignoreNextSlashTarget = targetEl;
          ignoreNextSlashUntil = Date.now() + 200;
          targetEl.focus({ preventScroll: true });
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
      const privacyPolicyDialog = document.getElementById('privacyPolicyDialog');
      document.getElementById('btnPrivacyPolicy').addEventListener('click', () => privacyPolicyDialog.showModal());
      document.getElementById('btnClosePrivacyPolicy').addEventListener('click', () => privacyPolicyDialog.close());
      privacyPolicyDialog.addEventListener('keydown', event => {
        if (event.key === 'Escape') {
          event.preventDefault();
          privacyPolicyDialog.close();
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
      document.addEventListener('pointerdown', event => {
        if (event.target.closest('.column-color-trigger, .column-color-popover')) return;
        document.querySelectorAll('.column-color-popover').forEach(popover => popover.classList.add('hidden'));
        document.querySelectorAll('.column-color-trigger').forEach(trigger => trigger.setAttribute('aria-expanded', 'false'));
      });
      settingsPanel.querySelectorAll('.sp-seg button').forEach(b => b.addEventListener('click', () => {
        prefs[b.parentElement.getAttribute('data-pref')] = b.getAttribute('data-val');
        applyPrefs();
      }));
      const textSizeSlider = document.getElementById('spTextSize');
      if (textSizeSlider) {
        textSizeSlider.addEventListener('input', event => {
          prefs.textSize = ['xs', 'sm', 'md', 'lg', 'xl'][Number(event.target.value)];
          applyPrefs();
          scheduleAppStateSave();
        });
      }
      settingsPanel.querySelectorAll('[data-palette-val]').forEach(b => b.addEventListener('click', () => {
        prefs.palette = b.getAttribute('data-palette-val');
        applyPrefs();
        scheduleAppStateSave();
      }));
      settingsPanel.querySelectorAll('[data-pref-check]').forEach(cb => cb.addEventListener('change', () => {
        prefs[cb.getAttribute('data-pref-check')] = cb.checked;
        applyPrefs();
        scheduleAppStateSave();
        if (appState.activeView === 'viewGradebook') renderGradebookView();
      }));
      window.addEventListener('beforeunload', event => {
        const needsBackupPrompt = getBackupSnapshot() !== lastSavedFileSnapshot;
        if (needsBackupPrompt) {
          event.preventDefault();
          event.returnValue = '';
        }
      });
      document.getElementById('btnCloseCarnet').addEventListener('click', async () => {
        closeSettingsPanel();
        requestObservationDraftExit(async () => {
          if (activeFileWrite) await activeFileWrite;
          const hasChanges = getBackupSnapshot() !== lastSavedFileSnapshot;
          if (hasChanges && !window.confirm('Ce carnet contient des modifications non sauvegardées. Fermer quand même ?')) return;
          if (!window.confirm('Fermer ce carnet sur ce poste partagé ? Les données affichées dans cet onglet seront effacées.')) return;
          resetCarnetToBlank();
          showWelcome();
        });
      });
    });
