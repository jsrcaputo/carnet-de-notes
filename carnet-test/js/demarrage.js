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
      // Un carnet non enregistré s'accueille toujours en affichage clair, palette bleue.
      if (!carnetIsSaved) {
        document.documentElement.setAttribute('data-palette', 'ocean');
        document.documentElement.classList.remove('theme-dark');
      }
      const demoToggle = document.getElementById('welcomeDemoToggle');
      const demoContent = document.getElementById('welcomeDemoContent');
      if (demoToggle && demoContent) {
        demoToggle.setAttribute('aria-expanded', 'false');
        demoContent.classList.remove('is-open');
        demoContent.hidden = true;
      }
      document.getElementById('welcomeOverlay').classList.remove('hidden');
      document.getElementById('welcomeOverlay').focus({ preventScroll: true });
    }

    function hideWelcome() {
      document.getElementById('welcomeOverlay').classList.add('hidden');
      hideFirstGroupHint();
      applyPrefs();
    }

    function dismissWelcome() {
      hideWelcome();
      showFirstGroupHint();
    }

    function showFirstGroupHint() {
      if (!isPristineInitialGroup()) return;
      const hint = document.getElementById('firstGroupHint');
      if (!hint) return;
      hint.classList.remove('hidden');
      window.setTimeout(() => hint.classList.add('hidden'), 9000);
    }

    function hideFirstGroupHint() {
      const hint = document.getElementById('firstGroupHint');
      if (hint) hint.classList.add('hidden');
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

    function positionWeightGuide() {
      const guide = document.getElementById('weightGuide');
      if (!guide || guide.classList.contains('hidden')) return;
      const target = document.getElementById('gbLevelFilterBar');
      if (!target) return;
      const rect = target.getBoundingClientRect();
      const left = Math.max(0, rect.left - 4);
      const top = Math.max(0, rect.top - 4);
      const right = Math.min(window.innerWidth, rect.right + 4);
      const bottom = Math.min(window.innerHeight, rect.bottom + 4);
      const setRect = (element, x, y, width, height) => {
        Object.assign(element.style, { left: `${x}px`, top: `${y}px`, width: `${Math.max(0, width)}px`, height: `${Math.max(0, height)}px` });
      };
      setRect(guide.querySelector('[data-side="top"]'), 0, 0, window.innerWidth, top);
      setRect(guide.querySelector('[data-side="bottom"]'), 0, bottom, window.innerWidth, window.innerHeight - bottom);
      setRect(guide.querySelector('[data-side="left"]'), 0, top, left, bottom - top);
      setRect(guide.querySelector('[data-side="right"]'), right, top, window.innerWidth - right, bottom - top);
      setRect(document.getElementById('weightGuideHighlight'), left, top, right - left, bottom - top);
      const card = document.getElementById('weightGuideCard');
      const cardLeft = Math.max(12, Math.min(window.innerWidth - card.offsetWidth - 12, left));
      const cardTop = bottom + 12 + card.offsetHeight <= window.innerHeight - 12
        ? bottom + 12 : Math.max(12, top - card.offsetHeight - 12);
      Object.assign(card.style, { left: `${cardLeft}px`, top: `${cardTop}px` });
    }

    function showFirstMultiWeightTip() {
      if (!isMultiLevelGroup() || !document.getElementById('weightGuide')) return;
      try {
        if (window.localStorage.getItem('carnet_notes_weight_guide_seen_v1') === '1') return;
      } catch (error) {
        console.warn('Impossible de lire la préférence du guide de pondération.', error);
      }
      const target = document.getElementById('gbLevelFilterBar');
      if (!target) return;
      target.scrollIntoView({ block: 'center', inline: 'nearest' });
      document.getElementById('weightGuide').classList.remove('hidden');
      positionWeightGuide();
      document.getElementById('weightGuideDone').focus();
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
        appState.activeView = 'viewStudents';
        expandedSubjectGroup = null;
        renderAll();
        returnToWelcomeAfterGroup = true;
        openGroupModal('new');
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
