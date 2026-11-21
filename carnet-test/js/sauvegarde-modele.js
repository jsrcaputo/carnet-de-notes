    function setFileSyncStatus(status, message) {
      const unlink = document.getElementById('btnUnlinkJSON');
      if (unlink) {
        unlink.disabled = !activeFileHandle;
        unlink.textContent = activeFileHandle ? 'Délier le fichier' : 'Aucun fichier lié';
      }
      const notice = document.getElementById('backupEncryptionNotice');
      if (notice) notice.textContent = activeBackupEncryption
        ? `Ce carnet utilise un mot de passe : ses copies JSON restent chiffrées avec le même mot de passe${activeFileHandle ? ', y compris après déliaison' : ', même sans fichier lié'}. Sauvegardez avant de fermer ou d’actualiser la page.`
        : 'Le carnet reste en mémoire dans cet onglet : sauvegardez votre fichier JSON avant de fermer ou d’actualiser la page.';
      const indicator = document.getElementById('fileSyncStatus');
      if (!indicator) return;
      indicator.dataset.status = status;
      indicator.textContent = message;
      indicator.title = message;
    }

    function isMeaningfulSubjectData(data) {
      if (!isRecord(data)) return false;
      if ((Array.isArray(data.assignments) && data.assignments.length > 0) ||
          (Array.isArray(data.customRubrics) && data.customRubrics.length > 0)) return true;
      const records = isRecord(data.studentRecords) ? Object.values(data.studentRecords) : [];
      if (records.some(record => {
        if (!isRecord(record)) return false;
        return Object.keys(isRecord(record.scores) ? record.scores : {}).length > 0 ||
          Object.keys(isRecord(record.scoreMeta) ? record.scoreMeta : {}).length > 0 ||
          (Array.isArray(record.baremeChecked) && record.baremeChecked.length > 0) ||
          Boolean(record.baremeOverrideCode) ||
          Boolean(String(record.finalJudgmentOverride || '').trim()) ||
          Boolean(String(record.comment || '').trim());
      })) return true;
      const session = isRecord(data.currentObsSession) ? data.currentObsSession : null;
      if (!session) return false;
      if (session.editingAssignmentId || String(session.title || '').trim() || session.customRubric ||
          (Array.isArray(session.linkTargets) && session.linkTargets.length > 0)) return true;
      return isRecord(session.studentDrafts) && Object.values(session.studentDrafts).some(draft =>
        isRecord(draft) && (
          (Array.isArray(draft.checked) && draft.checked.length > 0) ||
          draft.overrideCode ||
          (Array.isArray(draft.tags) && draft.tags.length > 0) ||
          String(draft.comment || '').trim() ||
          String(draft.strengths || '').trim() ||
          String(draft.challenges || '').trim() ||
          draft.notEvaluated === true
        )
      );
    }

    function compactGroupForBackup(groupData) {
      if (!isRecord(groupData) || !isRecord(groupData.terms)) return groupData;
      const compact = { ...groupData, terms: {} };
      ['1', '2', '3'].forEach(termId => {
        const sourceTerm = groupData.terms[termId];
        if (!isRecord(sourceTerm)) {
          compact.terms[termId] = sourceTerm;
          return;
        }
        const subjectData = {};
        Object.entries(isRecord(sourceTerm.subjectData) ? sourceTerm.subjectData : {}).forEach(([subjectId, data]) => {
          if (isMeaningfulSubjectData(data)) subjectData[subjectId] = data;
        });
        compact.terms[termId] = { ...sourceTerm, subjectData };
      });
      return compact;
    }

    function createCompactBackupState() {
      const compactGroups = {};
      Object.entries(isRecord(appState.groupStore) ? appState.groupStore : {}).forEach(([groupId, data]) => {
        compactGroups[groupId] = compactGroupForBackup(data);
      });
      return {
        ...appState,
        groupStore: compactGroups,
        terms: compactGroupForBackup({ terms: appState.terms }).terms
      };
    }

    function serializeBackup() {
      return JSON.stringify({
        ...createCompactBackupState(),
        displayPreferences: { ...prefs },
        customWeightedPresets: loadAllCustomWeightedPresets()
      }, null, 2);
    }

    function updateUnlinkedSaveStatus() {
      if (!activeFileHandle && getBackupSnapshot() !== lastSavedFileSnapshot) {
        setFileSyncStatus('pending', 'Modifications à sauvegarder');
      }
    }

    function updateLegacyBrowserBackup() {
      try {
        const hasLegacy = !!window.localStorage.getItem(LOCAL_STORAGE_KEY);
        document.getElementById('legacyBrowserBackup').classList.toggle('hidden', !hasLegacy);
        document.getElementById('welcomeLegacyBrowserNotice').classList.toggle('hidden', !hasLegacy);
      } catch (error) {
        console.error('Impossible de vérifier l’ancienne copie du navigateur.', error);
        showToast('Impossible de vérifier si une ancienne copie existe dans ce navigateur.');
      }
    }

    function resetCarnetToBlank() {
      if (autosaveTimer) {
        clearTimeout(autosaveTimer);
        autosaveTimer = null;
      }
      if (typeof closeCommentBankModal === 'function') closeCommentBankModal();
      const customRubricDialog = document.getElementById('customRubricDialog');
      if (customRubricDialog && customRubricDialog.open && typeof closeCustomRubricEditor === 'function') {
        closeCustomRubricEditor();
      }
      if (typeof activeCommentBankContext !== 'undefined') activeCommentBankContext = null;
      if (typeof customRubricEditorDraft !== 'undefined') customRubricEditorDraft = null;
      if (typeof customRubricEditorId !== 'undefined') customRubricEditorId = null;
      if (typeof renderStudentsView === 'function' && renderStudentsView._state) {
        renderStudentsView._state.adaptStudentId = null;
        renderStudentsView._state.modStudentId = null;
      }
      document.querySelectorAll(
        '#compPrintSheet, #studentPrintSheet, #studentIndividualPrintSheet, #baremeBatchPrintSheet, #observablePrintSheet'
      ).forEach(element => element.remove());
      [...document.body.classList].filter(className => className.startsWith('print-'))
        .forEach(className => document.body.classList.remove(className));
      [
        'gradebookHeaderRow', 'gradebookBody', 'grStudentBand', 'grReportContent',
        'baremeStudentPills', 'baremeMatrixBody', 'sgMatrixBody', 'qoStudentGrid',
        'qoActiveStudentTagsStrip', 'cbPhraseList', 'customRubricEditor',
        'observablePrintStudents', 'summaryPrintStudents', 'baremePrintStudents'
      ].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.replaceChildren();
      });
      ['baremeCurrentStudentName', 'sgCurrentStudentName', 'sgMajorityExplanation', 'cbModalSubtitle'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = '';
      });
      ['qoSessionTitleInput', 'qoCommentInput', 'qoStrengthsInput', 'qoChallengesInput', 'cbTextarea'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
      });
      const printMeta = document.getElementById('printMeta');
      if (printMeta) printMeta.textContent = '';
      carnetIsSaved = false;
      activeFileHandle = null;
      activeFileWritable = false;
      activeBackupEncryption = null;
      linkedFileText = null;
      fileWriteBlocked = false;
      appState = createInitialState();
      applyActiveSubjects(appState);
      unlockedWeights.clear();
      weightMode = false;
      weightLevel = '';
      weightScope = '';
      gbFilter = '';
      gbLevelFilter = 'ALL';
      stFilter = '';
      observationDraftBaseline = null;
      pendingObservationExit = null;
      history.undo = [];
      history.redo = [];
      history.last = getEditableStateSnapshot();
      initialEditableSnapshot = getEditableStateSnapshot();
      lastSavedFileSnapshot = getBackupSnapshot();
      updateHistoryButtons();
      setFileSyncStatus('unlinked', 'Aucun fichier lié');
      const headerSearch = document.getElementById('headerStudentSearch');
      const listSearch = document.getElementById('studentSearch');
      const searchMessage = document.getElementById('studentSearchMessage');
      if (headerSearch) headerSearch.value = '';
      if (listSearch) listSearch.value = '';
      if (searchMessage) searchMessage.textContent = '';
      renderAll();
      showToast('Carnet réinitialisé à neuf.');
    }

