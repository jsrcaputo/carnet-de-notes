    async function downloadBackup(encryption = activeBackupEncryption) {
      try {
        const snapshot = getBackupSnapshot();
        const cleartext = serializeBackup();
        const payload = encryption ? await encryptBackup(cleartext, encryption) : cleartext;
        const data = new Blob([payload], { type: 'application/json;charset=utf-8' });
        downloadBlob(data, `Carnet_de_notes_2026_2027_${new Date().toISOString().slice(0, 10)}.json`);
        carnetIsSaved = true;
        if (!activeFileHandle) {
          lastSavedFileSnapshot = snapshot;
          setFileSyncStatus('unlinked', 'Copie téléchargée : non liée');
        }
        showToast(`Copie JSON${encryption ? ' chiffrée' : ''} téléchargée. Elle ne se met pas à jour automatiquement.`);
      } catch (error) {
        console.error('Échec de la création de la sauvegarde JSON.', error);
        showToast('Impossible de créer la copie JSON.');
      }
    }

    async function downloadEncryptedBackup() {
      try {
        if (!window.crypto || !window.crypto.subtle) throw new Error('Le chiffrement nécessite un contexte sécurisé (HTTPS ou fichier local).');
        const password = await requestBackupPassword(true);
        if (password === null) return;
        const salt = crypto.getRandomValues(new Uint8Array(16));
        const key = await deriveBackupKey(password, salt);
        await downloadBackup({ key, salt });
      } catch (error) {
        console.error('Impossible de chiffrer la sauvegarde.', error);
        showToast(error instanceof Error ? error.message : 'Impossible de chiffrer la sauvegarde.');
      }
    }

    async function saveEncryptedJsonFileSmart() {
      if (fileOperation) return;
      if (activeFileHandle && activeBackupEncryption) {
        if (fileWriteBlocked) {
          showToast('Sauvegarde interrompue. Téléchargez une copie, puis rechargez le fichier.');
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
            showToast('Autorisation d’écriture refusée. Téléchargez une copie chiffrée.');
            return;
          }
        }
        const saved = await queueLinkedFileSave(true);
        if (saved) showToast('Carnet chiffré enregistré dans le fichier lié.');
        return;
      }
      if (typeof window.showSaveFilePicker !== 'function') {
        await downloadEncryptedBackup();
        return;
      }
      let encryption = null;
      try {
        const password = await requestBackupPassword(true);
        if (password === null) return;
        const salt = crypto.getRandomValues(new Uint8Array(16));
        const key = await deriveBackupKey(password, salt);
        encryption = { key, salt };
        fileOperation = true;
        const handle = await window.showSaveFilePicker({
          suggestedName: `Carnet_de_notes_2026_2027_${new Date().toISOString().slice(0, 10)}_chiffre.json`,
          types: [{ description: 'Sauvegarde du carnet chiffrée (.json)', accept: { 'application/json': ['.json'] } }]
        });
        const existingText = await (await handle.getFile()).text();
        if (existingText && !window.confirm(`Le fichier « ${handle.name} » contient déjà des données. Le remplacer par ce carnet chiffré ?`)) return;
        activeFileHandle = handle;
        carnetIsSaved = true;
        activeFileWritable = true;
        linkedFileText = existingText;
        activeBackupEncryption = encryption;
        fileWriteBlocked = false;
        fileOperation = false;
        const saved = await queueLinkedFileSave(true);
        if (saved) showToast('Fichier chiffré lié : les modifications seront enregistrées automatiquement.');
      } catch (error) {
        if (error.name === 'AbortError') return;
        if (['NotAllowedError', 'SecurityError', 'NotSupportedError', 'TypeError'].includes(error.name)) {
          if (encryption) await downloadBackup(encryption);
          else await downloadEncryptedBackup();
          return;
        }
        console.error('Impossible de lier la sauvegarde chiffrée.', error);
        showToast('Impossible de lier le fichier chiffré. Une copie téléchargée peut être utilisée.');
      } finally {
        fileOperation = false;
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
          const cleartext = serializeBackup();
          setFileSyncStatus('saving', 'Enregistrement en cours…');
          try {
            const payload = activeBackupEncryption ? await encryptBackup(cleartext, activeBackupEncryption) : cleartext;
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
        if (handle === activeFileHandle) setFileSyncStatus('saved', `Fichier lié${activeBackupEncryption ? ' chiffré' : ''} : ${handle.name}`);
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
        await downloadBackup();
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
        carnetIsSaved = true;
        activeFileWritable = true;
        linkedFileText = existingText;
        fileWriteBlocked = false;
        fileOperation = false;
        const saved = await queueLinkedFileSave(true);
        if (saved) showToast('Fichier lié : les modifications seront enregistrées automatiquement.');
      } catch (error) {
        if (error.name === 'AbortError') return;
        if (['NotAllowedError', 'SecurityError', 'NotSupportedError', 'TypeError'].includes(error.name)) {
          await downloadBackup(null);
          return;
        }
        console.error('Impossible de lier le fichier JSON.', error);
        setFileSyncStatus('error', 'Fichier non lié');
        showToast('Impossible de lier le fichier. Téléchargez une copie JSON.');
      } finally {
        fileOperation = false;
        if (activeFileHandle && !fileWriteBlocked && getBackupSnapshot() !== lastSavedFileSnapshot) scheduleAppStateSave();
      }
    }

    function parseBackup(text) {
      const fileData = JSON.parse(text);
      const importedPrefs = readDisplayPreferences(fileData && fileData.displayPreferences);
      const importedPresets = fileData && fileData.customWeightedPresets;
      if (importedPresets !== undefined && (!importedPresets || typeof importedPresets !== 'object' || Array.isArray(importedPresets) ||
          Object.values(importedPresets).some(weights => !weights || typeof weights !== 'object' || Array.isArray(weights) ||
            Object.values(weights).some(weight => typeof weight !== 'number' || !Number.isFinite(weight) || weight < 0)))) {
        throw new Error('Les pondérations personnalisées de ce fichier sont invalides.');
      }
      if (fileData && typeof fileData === 'object') {
        delete fileData.displayPreferences;
        delete fileData.customWeightedPresets;
      }
      const previousSubjects = SUBJECTS_CONFIG.slice();
      try {
        const importedState = normalizeImportedState(fileData);
        importedState.groups.forEach(updateExampleGroupName);
        return { importedState, importedPrefs, importedPresets };
      } finally {
        SUBJECTS_CONFIG.length = 0;
        SUBJECTS_CONFIG.push(...previousSubjects);
      }
    }

    function restoreCustomWeightedPresets(presets) {
      if (presets === undefined) return;
      try {
        window.localStorage.setItem(CUSTOM_RUBRICS_STORAGE_KEY, JSON.stringify(presets));
      } catch (error) {
        console.error('Impossible de restaurer les pondérations personnalisées.', error);
        throw new Error('Impossible de restaurer les pondérations personnalisées dans ce navigateur.');
      }
    }

    async function loadBackupFile(file, handle, expectedSnapshot, writable = false) {
      try {
        if (!file || !Number.isFinite(file.size) || file.size > MAX_JSON_IMPORT_BYTES) {
          throw new Error('Le fichier dépasse la taille maximale autorisée de 25 Mo.');
        }
        const text = await file.text();
        const decrypted = await decryptBackup(text);
        if (!decrypted) return false;
        const { importedState, importedPrefs, importedPresets } = parseBackup(decrypted.text);
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
        restoreCustomWeightedPresets(importedPresets);
        appState = importedState;
        applyActiveSubjects(appState);
        gbFilter = '';
        document.getElementById('headerStudentSearch').value = '';
        document.getElementById('studentSearchMessage').textContent = '';
        unlockedWeights.clear();
        weightMode = false;
        weightLevel = '';
        weightScope = '';
        Object.assign(prefs, importedPrefs);
        carnetIsSaved = true;
        applyPrefs();
        observationDraftBaseline = null;
        history.undo = [];
        history.redo = [];
        history.last = getEditableStateSnapshot();
        initialEditableSnapshot = getEditableStateSnapshot();
        updateHistoryButtons();
        renderAll();
        activeFileHandle = handle;
        activeFileWritable = !!handle && writable;
        activeBackupEncryption = decrypted.encryption;
        linkedFileText = handle ? text : null;
        fileWriteBlocked = false;
        lastSavedFileSnapshot = getBackupSnapshot();
        setFileSyncStatus(handle ? (writable ? 'saved' : 'pending') : 'unlinked', handle ? (writable ? `Fichier lié${activeBackupEncryption ? ' chiffré' : ''} : ${handle.name}` : 'Lecture seule : cliquez sur Sauvegarder') : 'Aucun fichier lié');
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
        if (error.name === 'AbortError') return;
        if (['NotAllowedError', 'SecurityError', 'NotSupportedError', 'TypeError'].includes(error.name)) {
          pendingImportSnapshot = expectedSnapshot;
          document.getElementById('inputImportJSON').click();
          return;
        }
        console.error('Impossible d’ouvrir le fichier JSON.', error);
        showToast('Impossible d’ouvrir le fichier JSON.');
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
