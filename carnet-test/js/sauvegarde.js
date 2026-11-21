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
    const BACKUP_KEY_ITERATIONS = 600000;
    const MAX_JSON_IMPORT_BYTES = 25 * 1024 * 1024;

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

    async function decryptBackup(text) {
      const envelope = JSON.parse(text);
      if (!envelope || envelope.format !== ENCRYPTED_BACKUP_FORMAT) return { text, encryption: null };
      if (envelope.version !== 1) throw new Error('Cette version de sauvegarde chiffrée n’est pas prise en charge.');
      const salt = backupBase64ToBytes(envelope.salt);
      const iv = backupBase64ToBytes(envelope.iv);
      const ciphertext = backupBase64ToBytes(envelope.ciphertext);
      if (salt.length !== 16 || iv.length !== 12 || ciphertext.length < 16) throw new Error('La sauvegarde chiffrée est invalide.');
      let message = '';
      while (true) {
        const password = await requestBackupPassword(false, message);
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
