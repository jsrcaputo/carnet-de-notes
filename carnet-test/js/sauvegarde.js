    let activeFileHandle = null;
    let linkedFileText = null;
    let activeFileWrite = null;
    let activeFileWritable = false;
    let fileWriteBlocked = false;
    let fileOperation = false;
    let pendingImportSnapshot = null;
    let activeBackupEncryption = null;
    // Vrai dès qu'un carnet a été ouvert ou enregistré dans cette session.
    let carnetIsSaved = false;
    const LOCAL_STORAGE_KEY = 'carnet_notes_autosave_2026_v1';
    const ENCRYPTED_BACKUP_FORMAT = 'carnet-notes-chiffre';
    const ENCRYPTED_EXCEL_FORMAT = 'carnet-excel-chiffre';
    const BACKUP_KEY_ITERATIONS = 600000;

    function backupBytesToBase64(bytes) {
      let text = '';
      for (let i = 0; i < bytes.length; i += 0x8000) {
        text += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
      }
      return btoa(text);
    }

    function backupBase64ToBytes(value) {
      if (typeof value !== 'string' || value.length % 4 !== 0 || /[^A-Za-z0-9+/=]/.test(value)) {
        throw new Error('La sauvegarde chiffrée est invalide.');
      }
      try {
        const binary = atob(value);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        return bytes;
      } catch (error) {
        if (error.name !== 'InvalidCharacterError') throw error;
        throw new Error('La sauvegarde chiffrée est invalide.');
      }
    }

    async function deriveBackupKey(password, salt) {
      if (!window.crypto || !window.crypto.subtle) throw new Error('Le chiffrement nécessite un contexte sécurisé (HTTPS ou fichier local).');
      const material = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveKey']);
      return crypto.subtle.deriveKey(
        { name: 'PBKDF2', salt, iterations: BACKUP_KEY_ITERATIONS, hash: 'SHA-256' },
        material, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']
      );
    }

    async function encryptBackup(text, encryption, format = ENCRYPTED_BACKUP_FORMAT) {
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, encryption.key, new TextEncoder().encode(text));
      return JSON.stringify({
        format, version: 1,
        salt: backupBytesToBase64(encryption.salt), iv: backupBytesToBase64(iv),
        ciphertext: backupBytesToBase64(new Uint8Array(ciphertext))
      }, null, 2);
    }

    function requestBackupPassword(creating, errorMessage = '', isExcel = false) {
      const dialog = document.getElementById('backupPasswordDialog');
      const form = document.getElementById('backupPasswordForm');
      const password = document.getElementById('backupPassword');
      const confirmation = document.getElementById('backupPasswordConfirm');
      const error = document.getElementById('backupPasswordError');
      const match = document.getElementById('backupPasswordMatch');
      const confirmButton = document.getElementById('btnConfirmBackupPassword');
      document.getElementById('backupPasswordTitle').textContent = isExcel
        ? (creating ? 'Protéger l’export Excel' : 'Ouvrir l’export Excel chiffré')
        : (creating ? 'Protéger la sauvegarde' : 'Ouvrir la sauvegarde chiffrée');
      document.getElementById('backupPasswordHelp').textContent = creating
        ? (isExcel
          ? 'Choisissez un mot de passe de 12 à 255 caractères et confirmez-le. Vous le saisirez directement dans Excel. Si vous le perdez, le fichier sera irrécupérable.'
          : 'Choisissez un mot de passe de 12 caractères ou plus et confirmez-le. Si vous le perdez, le fichier sera irrécupérable. Cette copie ne chiffre pas un fichier déjà lié.')
        : 'Entrez le mot de passe utilisé pour protéger ce fichier.';
      document.getElementById('backupPasswordConfirmRow').hidden = !creating;
      confirmation.required = creating;
      confirmation.disabled = !creating;
      password.value = '';
      confirmation.value = '';
      error.textContent = errorMessage;
      return new Promise(resolve => {
        const updateMatch = () => {
          const matches = password.value === confirmation.value;
          const hasConfirmation = confirmation.value.length > 0;
          match.textContent = creating && hasConfirmation
            ? (matches ? 'Les deux mots de passe sont identiques.' : 'Les deux mots de passe sont différents.')
            : '';
          match.dataset.state = hasConfirmation && matches ? 'match' : 'mismatch';
          confirmation.setAttribute('aria-invalid', String(creating && hasConfirmation && !matches));
          confirmButton.disabled = creating
            ? password.value.length < 12 || (isExcel && password.value.length > 255) || !matches
            : !password.value.length;
        };
        const input = () => {
          error.textContent = '';
          updateMatch();
        };
        const finish = value => {
          form.removeEventListener('submit', submit);
          dialog.removeEventListener('cancel', cancel);
          document.getElementById('btnCancelBackupPassword').removeEventListener('click', cancel);
          password.removeEventListener('input', input);
          confirmation.removeEventListener('input', input);
          password.value = '';
          confirmation.value = '';
          dialog.close();
          resolve(value);
        };
        const submit = event => {
          event.preventDefault();
          if (creating && password.value.length < 12) {
            error.textContent = 'Utilisez au moins 12 caractères.';
            return;
          }
          if (creating && isExcel && password.value.length > 255) {
            error.textContent = 'Utilisez au plus 255 caractères pour Excel.';
            return;
          }
          if (creating && password.value !== confirmation.value) {
            error.textContent = 'Les deux mots de passe ne correspondent pas.';
            return;
          }
          finish(password.value);
        };
        const cancel = event => { event.preventDefault(); finish(null); };
        form.addEventListener('submit', submit);
        dialog.addEventListener('cancel', cancel);
        document.getElementById('btnCancelBackupPassword').addEventListener('click', cancel);
        password.addEventListener('input', input);
        confirmation.addEventListener('input', input);
        updateMatch();
        dialog.showModal();
        password.focus();
      });
    }

    async function decryptBackup(text, expectedFormat = ENCRYPTED_BACKUP_FORMAT) {
      const envelope = JSON.parse(text);
      if (!envelope || envelope.format !== expectedFormat) {
        if (expectedFormat === ENCRYPTED_EXCEL_FORMAT) throw new Error('Ce fichier n’est pas un export Excel chiffré du carnet.');
        if (envelope && envelope.format === ENCRYPTED_EXCEL_FORMAT) throw new Error('Pour cet ancien export, utilisez « Récupérer un ancien export » dans les options.');
        return { text, encryption: null };
      }
      if (envelope.version !== 1) throw new Error('Cette version de sauvegarde chiffrée n’est pas prise en charge.');
      const salt = backupBase64ToBytes(envelope.salt);
      const iv = backupBase64ToBytes(envelope.iv);
      const ciphertext = backupBase64ToBytes(envelope.ciphertext);
      if (salt.length !== 16 || iv.length !== 12 || ciphertext.length < 16) throw new Error('La sauvegarde chiffrée est invalide.');
      let message = '';
      while (true) {
        const password = await requestBackupPassword(false, message, expectedFormat === ENCRYPTED_EXCEL_FORMAT);
        if (password === null) return null;
        const key = await deriveBackupKey(password, salt);
        try {
          const clear = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext);
          return { text: new TextDecoder('utf-8', { fatal: true }).decode(clear), encryption: { key, salt } };
        } catch (error) {
          if (error.name !== 'OperationError') throw error;
          message = 'Mot de passe incorrect ou fichier endommagé.';
        }
      }
    }

    function downloadBlob(data, filename) {
      const url = URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }

    function setFileSyncStatus(status, message) {
      const unlink = document.getElementById('btnUnlinkJSON');
      if (unlink) {
        unlink.disabled = !activeFileHandle;
        unlink.textContent = activeFileHandle ? 'Délier le fichier' : 'Aucun fichier lié';
      }
      const download = document.getElementById('btnDownloadJSON');
      if (download) download.textContent = activeBackupEncryption ? 'Télécharger une copie JSON chiffrée' : 'Télécharger une copie JSON';
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

    function serializeBackup() {
      return JSON.stringify({ ...appState, displayPreferences: { ...prefs }, customWeightedPresets: loadAllCustomWeightedPresets() }, null, 2);
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
      history.undo = [];
      history.redo = [];
      history.last = getEditableStateSnapshot();
      lastSavedFileSnapshot = getBackupSnapshot();
      updateHistoryButtons();
      setFileSyncStatus('unlinked', 'Aucun fichier lié');
      renderAll();
      showToast('Carnet réinitialisé à neuf.');
    }

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
        weightLevel = '';
        weightScope = '';
        Object.assign(prefs, importedPrefs);
        carnetIsSaved = true;
        applyPrefs();
        renderAll();
        recordHistory();
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
