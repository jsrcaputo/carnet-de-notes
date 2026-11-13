    let activeFileHandle = null;
    let linkedFileText = null;
    let activeFileWrite = null;
    let activeFileWritable = false;
    let fileWriteBlocked = false;
    let fileOperation = false;
    let pendingImportSnapshot = null;

    function setFileSyncStatus(status, message) {
      const indicator = document.getElementById('fileSyncStatus');
      indicator.dataset.status = status;
      indicator.textContent = message;
      indicator.title = message;
    }

    function serializeBackup() {
      return JSON.stringify({ ...appState, displayPreferences: { ...prefs } }, null, 2);
    }

    function downloadBackup() {
      try {
        const snapshot = getBackupSnapshot();
        const data = new Blob([serializeBackup()], { type: 'application/json;charset=utf-8' });
        const url = URL.createObjectURL(data);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Carnet_de_notes_2026_2027_${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        if (!activeFileHandle) lastSavedFileSnapshot = snapshot;
        showToast('Copie JSON téléchargée. Elle ne se met pas à jour automatiquement.');
      } catch (error) {
        console.error('Échec de la création de la sauvegarde JSON.', error);
        showToast('Impossible de créer la copie JSON.');
      }
    }

    function queueLinkedFileSave(force = false) {
      if (!activeFileHandle || !activeFileWritable || fileWriteBlocked || fileOperation) return Promise.resolve(false);
      if (activeFileWrite) return activeFileWrite;
      const handle = activeFileHandle;
      activeFileWrite = (async () => {
        let first = force;
        while (handle === activeFileHandle && !fileWriteBlocked &&
               (first || getBackupSnapshot() !== lastSavedFileSnapshot)) {
          first = false;
          const snapshot = getBackupSnapshot();
          const payload = serializeBackup();
          setFileSyncStatus('saving', 'Enregistrement en cours…');
          try {
            const currentText = await (await handle.getFile()).text();
            if (currentText !== linkedFileText) {
              fileWriteBlocked = true;
              setFileSyncStatus('error', 'Fichier modifié ailleurs : sauvegarde interrompue');
              showToast('Le fichier a changé ailleurs. Téléchargez une copie avant de le recharger.');
              return false;
            }
            const writable = await handle.createWritable();
            try {
              await writable.write(payload);
              await writable.close();
            } catch (error) {
              if (typeof writable.abort === 'function') await writable.abort().catch(abortError => console.error('Impossible d’annuler l’écriture.', abortError));
              throw error;
            }
            linkedFileText = payload;
            lastSavedFileSnapshot = snapshot;
          } catch (error) {
            console.error('Échec de la sauvegarde directe.', error);
            fileWriteBlocked = true;
            setFileSyncStatus('error', 'Sauvegarde interrompue : téléchargez une copie');
            showToast('Sauvegarde directe impossible. Téléchargez une copie JSON.');
            return false;
          }
        }
        if (handle === activeFileHandle) setFileSyncStatus('saved', `Fichier lié : ${handle.name}`);
        return true;
      })().finally(() => { activeFileWrite = null; });
      return activeFileWrite;
    }

    async function saveJsonFileSmart() {
      if (fileOperation) return;
      if (activeFileHandle) {
        if (fileWriteBlocked) {
          showToast('Sauvegarde interrompue. Téléchargez une copie, puis rechargez ou déliez le fichier.');
          return;
        }
        if (!activeFileWritable) {
          try {
            activeFileWritable = await activeFileHandle.requestPermission({ mode: 'readwrite' }) === 'granted';
          } catch (error) {
            console.error('Impossible de demander l’autorisation d’écriture.', error);
          }
          if (!activeFileWritable) {
            setFileSyncStatus('error', 'Autorisation d’écriture requise');
            showToast('Autorisation d’écriture refusée. Téléchargez une copie JSON.');
            return;
          }
        }
        const saved = await queueLinkedFileSave(true);
        if (saved) showToast('Carnet enregistré dans le fichier lié.');
        return;
      }
      if (typeof window.showSaveFilePicker !== 'function') {
        downloadBackup();
        return;
      }
      fileOperation = true;
      try {
        const handle = await window.showSaveFilePicker({
          suggestedName: `Carnet_de_notes_2026_2027_${new Date().toISOString().slice(0, 10)}.json`,
          types: [{ description: 'Sauvegarde du carnet (.json)', accept: { 'application/json': ['.json'] } }]
        });
        const existingText = await (await handle.getFile()).text();
        if (existingText && !window.confirm(`Le fichier « ${handle.name} » contient déjà des données. Le remplacer par ce carnet ?`)) return;
        activeFileHandle = handle;
        activeFileWritable = true;
        linkedFileText = existingText;
        fileWriteBlocked = false;
        fileOperation = false;
        const saved = await queueLinkedFileSave(true);
        if (saved) showToast('Fichier lié : les modifications seront enregistrées automatiquement.');
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Impossible de lier le fichier JSON.', error);
          setFileSyncStatus('error', 'Fichier non lié');
          showToast('Impossible de lier le fichier. Téléchargez une copie JSON.');
        }
      } finally {
        fileOperation = false;
        if (activeFileHandle && !fileWriteBlocked && getBackupSnapshot() !== lastSavedFileSnapshot) scheduleAppStateSave();
      }
    }

    function parseBackup(text) {
      const fileData = JSON.parse(text);
      const importedPrefs = readDisplayPreferences(fileData && fileData.displayPreferences);
      if (fileData && typeof fileData === 'object') delete fileData.displayPreferences;
      const previousSubjects = SUBJECTS_CONFIG.slice();
      try {
        const importedState = normalizeImportedState(fileData);
        importedState.groups.forEach(updateExampleGroupName);
        return { importedState, importedPrefs };
      } finally {
        SUBJECTS_CONFIG.length = 0;
        SUBJECTS_CONFIG.push(...previousSubjects);
      }
    }

    async function loadBackupFile(file, handle, expectedSnapshot, writable = false) {
      try {
        const text = await file.text();
        const { importedState, importedPrefs } = parseBackup(text);
        if (activeFileWrite) await activeFileWrite;
        if (activeFileHandle && getBackupSnapshot() !== lastSavedFileSnapshot) {
          if (fileWriteBlocked || !activeFileWritable) {
            showToast('Modifications non enregistrées. Sauvegardez une copie et déliez le fichier avant de charger.');
            return false;
          }
          fileOperation = false;
          const saving = queueLinkedFileSave();
          fileOperation = true;
          if (!await saving) return false;
        }
        if (getBackupSnapshot() !== expectedSnapshot) {
          showToast('Le carnet a changé pendant le chargement. Réessayez.');
          return false;
        }
        if (autosaveTimer) {
          clearTimeout(autosaveTimer);
          autosaveTimer = null;
        }
        appState = importedState;
        applyActiveSubjects(appState);
        gbFilter = '';
        document.getElementById('headerStudentSearch').value = '';
        document.getElementById('studentSearchMessage').textContent = '';
        unlockedWeights.clear();
        weightLevel = '';
        weightScope = '';
        Object.assign(prefs, importedPrefs);
        applyPrefs();
        renderAll();
        recordHistory();
        activeFileHandle = handle;
        activeFileWritable = !!handle && writable;
        linkedFileText = handle ? text : null;
        fileWriteBlocked = false;
        lastSavedFileSnapshot = getBackupSnapshot();
        setFileSyncStatus(handle ? (writable ? 'saved' : 'pending') : 'unlinked', handle ? (writable ? `Fichier lié : ${handle.name}` : 'Lecture seule : cliquez sur Sauvegarder') : 'Aucun fichier lié');
        notifyUpdate(handle ? (writable ? 'Fichier chargé et lié pour la sauvegarde automatique.' : 'Fichier chargé. Cliquez sur Sauvegarder pour autoriser l’écriture.') : 'Fichier chargé. Sauvegardez une copie après vos modifications.');
        return true;
      } catch (error) {
        console.error('Impossible de charger la sauvegarde JSON.', error);
        showToast(error instanceof SyntaxError ? 'Ce fichier JSON est invalide.' : (error instanceof Error ? error.message : 'Impossible de lire ce fichier JSON.'));
        return false;
      }
    }

    async function chooseBackupFile() {
      const expectedSnapshot = getBackupSnapshot();
      if (typeof window.showOpenFilePicker !== 'function') {
        pendingImportSnapshot = expectedSnapshot;
        document.getElementById('inputImportJSON').click();
        return;
      }
      fileOperation = true;
      let loaded = false;
      try {
        const [handle] = await window.showOpenFilePicker({
          types: [{ description: 'Sauvegarde du carnet (.json)', accept: { 'application/json': ['.json'] } }],
          multiple: false
        });
        if (activeFileWrite) await activeFileWrite;
        const writable = typeof handle.queryPermission !== 'function' || await handle.queryPermission({ mode: 'readwrite' }) === 'granted';
        loaded = await loadBackupFile(await handle.getFile(), handle, expectedSnapshot, writable);
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Impossible d’ouvrir le fichier JSON.', error);
          showToast('Impossible d’ouvrir le fichier JSON.');
        }
      } finally {
        fileOperation = false;
        if (!loaded && importFromWelcome) showWelcome();
        importFromWelcome = false;
        if (activeFileHandle && !fileWriteBlocked && getBackupSnapshot() !== lastSavedFileSnapshot) scheduleAppStateSave();
      }
    }

    function openJsonFileSmart() {
      requestObservationDraftExit(() => {
        if (getEditableStateSnapshot() !== initialEditableSnapshot) {
          document.getElementById('backupLoadDialog').showModal();
        } else {
          chooseBackupFile();
        }
      });
    }

    // =========================================================================
    // 3. CALCULATION HELPERS (WEIGHTED ASSIGNMENTS + MAJORITY RUBRICS)
    // =========================================================================
