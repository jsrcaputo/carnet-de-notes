    (function initializeThemeHint() {
      try {
        const raw = localStorage.getItem('carnet_notes_prefs_2026_v1');
        const prefs = raw ? JSON.parse(raw) : null;
        const root = document.documentElement;
        root.setAttribute('data-palette', 'ocean');
        root.classList.remove('theme-dark');
        if (prefs && ['xs', 'sm', 'lg', 'xl'].indexOf(prefs.textSize) !== -1) {
          root.classList.add(`ts-${prefs.textSize}`);
        }
      } catch (error) {
        console.warn('Impossible de lire les préférences initiales.', error);
      }
    }());
