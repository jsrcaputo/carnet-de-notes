(function () {
  function isCurrentGroupDemo() {
    if (typeof appState === 'undefined' || !appState || !Array.isArray(appState.groups)) return false;
    const active = appState.groups.find(group => group && group.id === appState.activeGroupId);
    return Boolean(active && typeof isExampleGroup === 'function' && isExampleGroup(active));
  }

  function isCurrentGroupPreschool() {
    if (typeof appState === 'undefined' || !appState || !Array.isArray(appState.groups)) return false;
    const active = appState.groups.find(group => group && group.id === appState.activeGroupId);
    if (active && active.level === 'P') return true;
    const students = Array.isArray(appState.students) ? appState.students : [];
    return students.length > 0 && students.every(student => student && student.gradeLevel === 'P');
  }

  function isCurrentGroupAccueil() {
    return typeof isAccueilGroup === 'function' && Boolean(isAccueilGroup());
  }

  function isCurrentSubjectIlss() {
    if (typeof getCurrentSubjectConfig !== 'function') return false;
    try {
      const subject = getCurrentSubjectConfig();
      return Boolean(subject && subject.isIlss);
    } catch (error) {
      return false;
    }
  }

  function countRealGroups() {
    if (typeof appState === 'undefined' || !appState || !Array.isArray(appState.groups)) return 0;
    return appState.groups.filter(group => group && !group.placeholder).length;
  }

  function hasCurrentSubjectAssignments() {
    if (typeof appState === 'undefined' || !appState || !appState.terms) return false;
    const term = appState.terms[String(appState.activeTerm)];
    if (!term || !term.subjectData || !appState.activeSubjectId) return false;
    const subject = term.subjectData[appState.activeSubjectId];
    return Boolean(subject && Array.isArray(subject.assignments) && subject.assignments.length > 0);
  }

  window.ERIKA_TOURS = {
    homePortal: {
      label: 'Accueil',
      autoOffer: true,
      steps: [
        {
          id: 'portal-start',
          target: '.home-actions-grid',
          title: 'Bienvenue dans votre carnet',
          body: 'Bonjour, je suis Erika. Pour démarrer, créez votre groupe, rouvrez votre fichier de sauvegarde ou explorez une classe de démonstration.',
          placement: 'bottom',
          padding: 10
        },
        {
          id: 'portal-demo',
          target: '#homeDemoToggle',
          title: 'Tester sans risque',
          body: 'Envie de découvrir l’outil avant d’entrer vos élèves ? La démonstration ouvre une classe fictive déjà remplie : vous pouvez cliquer partout sans rien briser.',
          placement: 'top',
          padding: 8
        }
      ]
    },

    homeDashboard: {
      label: 'Bilan et suivi',
      autoOffer: true,
      steps: [
        {
          id: 'dash-sidebar',
          target: '.test-sidebar',
          title: 'Votre menu permanent',
          body: () => countRealGroups() > 1
            ? 'À gauche, changez de groupe, passez d’une étape à l’autre, ouvrez une matière ou consultez la synthèse annuelle.'
            : 'Votre menu à gauche vous suit partout pour changer d’étape, ouvrir une matière, gérer vos élèves ou consulter la synthèse.',
          placement: 'right',
          padding: 6
        },
        {
          id: 'dash-search',
          target: '#studentSearchPopover',
          title: 'Retrouver un élève en 2 secondes',
          body: 'Tapez un prénom ici pour ouvrir directement la synthèse complète de l’élève sans fouiller les listes.',
          placement: 'bottom',
          padding: 8,
          when: () => typeof appState !== 'undefined' && Array.isArray(appState.students) && appState.students.length > 0
        },
        {
          id: 'dash-privacy',
          target: '#dashPrivacyToggle',
          title: 'Masquer pour le TNI',
          body: 'Avant de projeter votre écran en classe, cliquez ici pour masquer d’un seul coup les notes et noms sensibles.',
          placement: 'bottom',
          padding: 8,
          when: () => typeof appState !== 'undefined' && Array.isArray(appState.students) && appState.students.length > 0
        },
        {
          id: 'dash-tabs',
          target: '#dashTabs',
          fallbackTarget: '#dashOverviewSection',
          title: 'Vos deux vues utiles',
          body: () => isCurrentGroupDemo()
            ? 'Voici une classe fictive pour tester librement. Passez d’ici entre « À faire » pour vos suivis en cours et « Vigie élèves » pour voir tout le groupe d’un coup d’œil.'
            : 'Passez d’ici entre « À faire » pour vos corrections et reprises en cours, et « Vigie élèves » pour repérer en 10 secondes les élèves à soutenir.',
          placement: 'bottom',
          padding: 8,
          when: () => typeof appState !== 'undefined' && Array.isArray(appState.students) && appState.students.length > 0
        },
        {
          id: 'dash-competencies',
          target: '#dashCompetenciesWrap',
          fallbackTarget: '#dashEmptyState',
          title: () => isCurrentGroupPreschool() ? 'Les 5 domaines du préscolaire' : 'Suivi par compétence',
          body: () => {
            if (typeof appState !== 'undefined' && (!appState.students || appState.students.length === 0)) {
              return 'Ajoutez d’abord vos élèves pour activer vos suivis de correction et votre vigie de classe.';
            }
            return isCurrentGroupPreschool()
              ? 'Chaque ligne suit un domaine du préscolaire, sans pourcentage. Cliquez dessus pour observer la classe ou utilisez « + » pour lancer une trace.'
              : isCurrentGroupAccueil()
                ? 'Chaque ligne suit une compétence. En ILSS, les résultats s’expriment en paliers et en cotes, sans pourcentage; la mathématique garde sa pondération. Cliquez sur une ligne pour l’ouvrir.'
                : 'Chaque ligne suit une compétence du bulletin avec son avancement et sa pondération. Cliquez dessus pour l’ouvrir ou utilisez « + » pour ajouter un travail.';
          },
          placement: 'top',
          padding: 8,
          beforeEnter: () => {
            if (typeof window.setDashboardTab === 'function') window.setDashboardTab('todo');
          }
        }
      ]
    },

    students: {
      label: 'Listes et groupes',
      autoOffer: true,
      steps: [
        {
          id: 'students-groupbar',
          target: '#groupBar',
          title: 'Votre groupe et vos élèves',
          body: () => (typeof appState !== 'undefined' && appState.students.length === 0)
            ? 'Votre groupe est prêt. Cliquez sur « ＋ Ajout d’élève » pour bâtir votre liste — pensez à utiliser des prénoms ou initiales anonymisés.'
            : 'Ici, vous gérez vos groupes et ajoutez de nouveaux élèves à tout moment.',
          placement: 'bottom',
          padding: 8
        },
        {
          id: 'students-tools',
          target: '#studentListTools',
          title: 'Trier votre classe en un clic',
          body: 'Réorganisez l’ordre d’affichage par prénom ou par nom : ce tri s’applique automatiquement à tout le carnet.',
          placement: 'bottom',
          padding: 8,
          when: () => typeof appState !== 'undefined' && Array.isArray(appState.students) && appState.students.length >= 2
        },
        {
          id: 'students-row',
          target: '#studentManagerList > [data-student-id]:first-child',
          title: () => isCurrentGroupAccueil() ? 'L’année réelle de chaque élève' : 'Niveau, adaptations et bulletin modifié',
          body: () => isCurrentGroupAccueil()
            ? 'En classe d’accueil, choisissez l’année scolaire de chaque élève : les grilles de mathématique et les repères ILSS s’ajustent à son cycle. Vous pouvez aussi noter des adaptations.'
            : 'Le niveau choisi ici règle automatiquement les grilles du bon cycle. Juste à côté, vous pouvez aussi noter des adaptations ou activer un bulletin modifié.',
          placement: 'bottom',
          padding: 8,
          when: () => typeof appState !== 'undefined' && Array.isArray(appState.students) && appState.students.length > 0
        }
      ]
    },

    gradebook: {
      label: 'Carnet de notes',
      autoOffer: true,
      steps: [
        {
          id: 'gb-empty',
          target: '#emptyRosterNotice',
          title: 'Commencer avec votre liste',
          body: 'Ajoutez d’abord vos élèves et choisissez leur niveau : votre tableau de notes apparaîtra juste ici.',
          placement: 'bottom',
          padding: 8,
          when: () => typeof appState !== 'undefined' && Array.isArray(appState.students) && appState.students.length === 0
        },
        {
          id: 'gb-new-eval',
          target: '#btnNewEvaluation',
          title: 'Ajouter une évaluation',
          body: () => isCurrentSubjectIlss()
            ? 'Cliquez ici pour ajouter une évaluation : « Déjà réalisée » pour consigner un palier et une cote, ou « Observable » pour cocher une grille de paliers directement à l’écran.'
            : 'Pour ajouter un travail, cliquez ici. Vous choisissez entre une évaluation déjà notée ou une grille observable à cocher directement à l’écran.',
          placement: 'bottom',
          padding: 8,
          when: () => typeof appState !== 'undefined' && Array.isArray(appState.students) && appState.students.length > 0
        },
        {
          id: 'gb-weights',
          target: '#btnWeightMode',
          title: 'Pondération et cadenas',
          body: 'Ajustez ici le poids de chaque travail : verrouillez un cadenas sur une évaluation et les autres se rééquilibrent automatiquement.',
          placement: 'bottom',
          padding: 8,
          when: () => typeof appState !== 'undefined' && Array.isArray(appState.students) && appState.students.length > 0 && hasCurrentSubjectAssignments() && !isCurrentGroupPreschool()
        },
        {
          id: 'gb-summary-cols',
          target: '#gradebookHeaderRow th:nth-last-child(-n+3)',
          title: 'Jugement, note finale et commentaires',
          body: 'À droite, le carnet prépare le bilan d’étape : repères de jugement, note finale modifiable d’un clic et commentaires au bulletin.',
          placement: 'bottom',
          padding: 6,
          when: () => typeof appState !== 'undefined' && Array.isArray(appState.students) && appState.students.length > 0 && !isCurrentSubjectIlss()
        },
        {
          id: 'gb-ilss-summary-cols',
          target: '#gradebookHeaderRow th:nth-last-child(-n+2)',
          title: 'Jugement d’étape et commentaires',
          body: 'À droite, le carnet propose un jugement d’étape (palier et cote) à partir de vos évaluations. Cliquez dessus pour le modifier; « Auto » rétablit la proposition. Les commentaires viennent d’une banque propre à l’accueil.',
          placement: 'bottom',
          padding: 6,
          when: () => typeof appState !== 'undefined' && Array.isArray(appState.students) && appState.students.length > 0 && isCurrentSubjectIlss()
        },
        {
          id: 'gb-ilss-cells',
          target: '#gradebookBody [data-ilss-cell]',
          title: 'Paliers et cotes, sans pourcentage',
          body: 'Chaque case indique le palier (P1 à P5) et la cote (A à D). Cliquez pour les choisir; dans une grille observable, le clic rouvre la grille de l’élève.',
          placement: 'bottom',
          padding: 8,
          when: () => typeof appState !== 'undefined' && Array.isArray(appState.students) && appState.students.length > 0 && isCurrentSubjectIlss() && hasCurrentSubjectAssignments()
        },
        {
          id: 'gb-adapt-markers',
          target: '#gradebookBody tr:first-child td:nth-child(2) .score-cell-wrap',
          fallbackTarget: '#gradebookBody .score-cell-wrap',
          title: 'Marqueurs d’adaptation et de suivi',
          body: 'Entrez les notes comme dans un tableur. Le bouton « ••• » de chaque case note les marqueurs d’adaptation (Aide, Temps+, Outil, Mod) et de suivi (NR, Justifié, À reprendre).',
          placement: 'bottom',
          padding: 8,
          when: () => typeof appState !== 'undefined' && Array.isArray(appState.students) && appState.students.length > 0 && hasCurrentSubjectAssignments() && !isCurrentSubjectIlss()
        },
        {
          id: 'gb-table-empty',
          target: '#gradebookScrollContainer',
          fallbackTarget: '#gradebookFrame',
          title: () => isCurrentSubjectIlss() ? 'Consigner les paliers' : 'Saisir les notes et repères',
          body: () => isCurrentSubjectIlss()
            ? 'Votre tableau s’affichera ici dès votre première évaluation. Chaque colonne situera ensuite chaque élève sur un palier, avec sa cote.'
            : 'Votre tableau s’affichera ici dès votre première évaluation. Vous naviguerez ensuite case par case comme dans un tableur.',
          placement: 'top',
          padding: 6,
          when: () => typeof appState !== 'undefined' && Array.isArray(appState.students) && appState.students.length > 0 && !hasCurrentSubjectAssignments()
        }
      ]
    },

    quickObs: {
      label: 'Trace observable',
      autoOffer: true,
      steps: [
        {
          id: 'qo-title',
          target: '.test-trace-save-bar',
          title: 'Nommer et enregistrer',
          body: 'Donnez un nom à votre activité observée ici. Quand vous avez fini, cliquez sur « Enregistrer au carnet » pour créer la colonne.',
          placement: 'bottom',
          padding: 8
        },
        {
          id: 'qo-modes',
          target: '#qoModeSegment',
          fallbackTarget: '#qoToolModeBar',
          title: 'Trois modes de grille',
          body: 'Passez ici d’une grille rapide à une grille pondérée ou créez votre propre grille sur mesure selon l’activité observée.',
          placement: 'bottom',
          padding: 8
        },
        {
          id: 'qo-grid',
          target: '#observationPrintGrid',
          fallbackTarget: '#qoStudentBox',
          title: 'Observer en un clic',
          body: () => isCurrentSubjectIlss()
            ? 'Choisissez un élève en haut, puis cochez dans chaque rangée la manifestation observée, du palier 1 au palier 5 : le palier se propose tout seul et reste modifiable à droite.'
            : 'Choisissez un élève en haut, puis cliquez une case par rangée : la cote se calcule toute seule. Vous pouvez aussi passer en grille pondérée ou créer la vôtre.',
          placement: 'top',
          padding: 8
        },
        {
          id: 'qo-side',
          target: '#qoSidePanel',
          title: () => isCurrentSubjectIlss() ? 'Palier, cote, forces et défis' : 'Forces, défis et notes rapides',
          body: () => isCurrentSubjectIlss()
            ? 'Ici, confirmez ou ajustez le palier et la cote, cochez des forces ou des défis et ajoutez une note. Tout se regroupe ensuite pour rédiger vos commentaires plus vite.'
            : 'Cochez ici des forces ou des défis et ajoutez une note rapide. Tout se regroupe ensuite pour rédiger vos commentaires de bulletin plus vite.',
          placement: 'left',
          padding: 8
        }
      ]
    },

    bareme: {
      label: 'Jugement professionnel',
      autoOffer: true,
      steps: [
        {
          id: 'bareme-matrix',
          target: '#viewBareme .observation-matrix',
          fallbackTarget: '#viewBareme',
          title: 'Situer l’élève sur l’étape',
          body: 'Cochez un repère par rangée pour situer l’élève sur l’ensemble de l’étape. Vous gardez toujours le dernier mot en cliquant sur la cote en haut.',
          placement: 'top',
          padding: 8
        }
      ]
    },

    globalReport: {
      label: 'Synthèse',
      autoOffer: true,
      steps: [
        {
          id: 'gr-pick-student',
          target: '#grStudentBand',
          title: 'Choisir un élève',
          body: 'Choisissez un élève ici pour afficher son portrait complet sur les trois étapes de l’année.',
          placement: 'bottom',
          padding: 8
        }
      ]
    },

    globalReportStudent: {
      label: 'Portrait de l’élève',
      autoOffer: true,
      steps: [
        {
          id: 'gr-print-export',
          target: ['#btnPrintView', '#btnExportExcel'],
          title: 'Imprimer ou exporter',
          body: 'Sortez une fiche propre en PDF pour les rencontres de parents ou exportez votre carnet complet vers Excel en un clic.',
          placement: 'bottom',
          padding: 8,
          when: () => typeof appState !== 'undefined' && Boolean(appState.selectedStudentId)
        },
        {
          id: 'gr-portrait',
          target: '#grReportContent .ps-section',
          fallbackTarget: '#grReportContent > div:nth-child(2)',
          title: 'Portrait des trois étapes',
          body: () => isCurrentGroupPreschool()
            ? 'Ici, les cinq domaines du préscolaire sont réunis avec leur parcours sur l’année et vos constats, sans pourcentage officiel.'
            : isCurrentGroupAccueil()
              ? 'Retrouvez ici les trois étapes. En ILSS, chaque compétence affiche son palier et sa cote, sans pourcentage; la mathématique garde ses étapes de 20, 20 et 60 %.'
              : 'Retrouvez ici les trois étapes (20, 20 et 60 %), la tendance et vos commentaires. Cliquez sur une matière pour retourner dans son carnet.',
          placement: 'top',
          padding: 8,
          when: () => typeof appState !== 'undefined' && Boolean(appState.selectedStudentId)
        },
        {
          id: 'gr-competencies',
          target: '#competencyPositioning > summary',
          title: 'Niveaux de compétence',
          body: 'Pour établir les niveaux de compétence ou préparer un commentaire, ouvrez les échelles ici et cliquez sur les phrases qui décrivent l’élève.',
          placement: 'top',
          padding: 8,
          when: () => typeof appState !== 'undefined' && Boolean(appState.selectedStudentId) && !isCurrentGroupPreschool()
        }
      ]
    },

    saveReminder: {
      label: 'Sauvegarde',
      autoOffer: false,
      steps: [
        {
          id: 'save-reminder-bar',
          target: ['#btnExportJSON', '#fileSyncStatus'],
          title: 'Pensez à sauvegarder votre fichier',
          body: 'Vos données restent uniquement sur votre appareil. Cliquez sur « Sauvegarder » avant de fermer l’onglet pour conserver votre travail et le reprendre plus tard.',
          placement: 'bottom',
          padding: 8
        }
      ]
    }
  };
})();
