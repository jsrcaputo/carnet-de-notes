(function () {
  let activeSession = null; // { envId, steps, index }
  let syncFrame = 0;
  let spotAnimFrame = 0;
  let swapTimer = 0;
  let manualSyncTimer = 0;
  let isStepTransitioning = false;
  let currentGeom = null; // { x, y, w, h, r }
  let previousFocus = null;
  let domBuilt = false;
  let resizeObserver = null;
  let cardResizeObserver = null;
  let dialogObserver = null;
  let activeHighlightedEls = [];
  let observedTargetEls = [];

  function clearHighlightedTargets() {
    activeHighlightedEls.forEach((el) => {
      if (el && el.classList) {
        el.classList.remove('erika-spotlight-target');
      }
    });
    activeHighlightedEls = [];
  }

  function clearObservedTargets() {
    if (resizeObserver) {
      observedTargetEls.forEach((el) => {
        if (el) resizeObserver.unobserve(el);
      });
    }
    observedTargetEls = [];
  }

  let rootEl = null;
  let backdropEl = null;
  let guardEl = null;
  let ringEl = null;
  let cardEl = null;
  let arrowEl = null;
  let progressEl = null;
  let titleEl = null;
  let bodyEl = null;
  let descEl = null;
  let interactiveHintEl = null;
  let prevBtn = null;
  let skipBtn = null;
  let nextBtn = null;
  let closeBtn = null;
  let liveEl = null;

  function prefersReducedMotion() {
    if (typeof window.isReducedMotionEnabled === 'function') return window.isReducedMotionEnabled();
    return document.documentElement.classList.contains('reduce-motion') || document.body.classList.contains('reduce-motion');
  }

  function isInsideFixedChrome(el) {
    if (!el) return false;
    if (el.closest('header.test-topbar, aside.test-sidebar')) return true;
    let node = el;
    while (node && node !== document.body && node !== document.documentElement) {
      if (window.getComputedStyle(node).position === 'fixed') return true;
      node = node.parentElement;
    }
    return false;
  }

  function getToursMap() {
    return (typeof window.ERIKA_TOURS === 'object' && window.ERIKA_TOURS) ? window.ERIKA_TOURS : {};
  }

  function isElementVisible(el) {
    if (!el || !el.isConnected) return false;
    const style = window.getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return false;
    const rect = el.getBoundingClientRect();
    return rect.width > 1 && rect.height > 1;
  }

  function resolveTargets(selectorSpec) {
    if (!selectorSpec) return [];
    const selectors = Array.isArray(selectorSpec) ? selectorSpec : [selectorSpec];
    const seen = new Set();
    const matched = [];
    selectors.forEach(sel => {
      if (!sel) return;
      document.querySelectorAll(sel).forEach(el => {
        if (!seen.has(el) && isElementVisible(el)) {
          seen.add(el);
          matched.push(el);
        }
      });
    });
    return matched;
  }

  function resolveStepElements(step) {
    let els = resolveTargets(step.target);
    if (!els.length && step.fallbackTarget) {
      els = resolveTargets(step.fallbackTarget);
    }
    return els;
  }

  function isStepEligible(step) {
    if (!step) return false;
    if (typeof step.when === 'function') {
      try {
        if (!step.when()) return false;
      } catch (error) {
        return false;
      }
    }
    return resolveStepElements(step).length > 0;
  }

  function resolveText(value, fallback = '') {
    if (typeof value === 'function') {
      try {
        return String(value() || '');
      } catch (error) {
        return fallback;
      }
    }
    return typeof value === 'string' ? value : fallback;
  }

  function isUserTypingInField() {
    const active = document.activeElement;
    if (!active) return false;
    if (active.isContentEditable) return true;
    if (active.tagName === 'TEXTAREA') return true;
    if (active.tagName === 'INPUT') {
      const type = String(active.type || 'text').toLowerCase();
      return !['button', 'submit', 'reset', 'checkbox', 'radio', 'range'].includes(type);
    }
    return false;
  }

  function ensureDom() {
    if (domBuilt) return;
    domBuilt = true;

    rootEl = document.createElement('div');
    rootEl.id = 'erikaTourRoot';
    rootEl.className = 'erika-tour-root hidden no-print';

    backdropEl = document.createElement('div');
    backdropEl.className = 'erika-tour-backdrop';
    backdropEl.setAttribute('aria-hidden', 'true');
    backdropEl.addEventListener('click', () => close());

    guardEl = document.createElement('div');
    guardEl.className = 'erika-tour-hole-guard';
    guardEl.setAttribute('aria-hidden', 'true');

    ringEl = document.createElement('div');
    ringEl.className = 'erika-tour-ring';
    ringEl.setAttribute('aria-hidden', 'true');

    cardEl = document.createElement('div');
    cardEl.id = 'erikaTourCard';
    cardEl.className = 'erika-tour-card';
    cardEl.setAttribute('role', 'dialog');
    cardEl.setAttribute('aria-modal', 'true');
    cardEl.setAttribute('aria-labelledby', 'erikaTourTitle');
    cardEl.setAttribute('aria-describedby', 'erikaTourDesc');
    cardEl.tabIndex = -1;

    arrowEl = document.createElement('div');
    arrowEl.className = 'erika-tour-arrow';
    arrowEl.setAttribute('aria-hidden', 'true');

    const head = document.createElement('div');
    head.className = 'erika-tour-head';
    const avatar = document.createElement('img');
    avatar.className = 'erika-tour-avatar';
    avatar.src = 'carnet-test/assets/erika-avatar.svg';
    avatar.alt = '';
    avatar.width = 42;
    avatar.height = 42;
    avatar.setAttribute('aria-hidden', 'true');

    const meta = document.createElement('div');
    meta.className = 'erika-tour-meta';
    const speaker = document.createElement('span');
    speaker.className = 'erika-tour-speaker';
    speaker.textContent = 'Erika';
    progressEl = document.createElement('span');
    progressEl.className = 'erika-tour-progress';
    meta.append(speaker, progressEl);

    closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'erika-tour-close';
    closeBtn.setAttribute('aria-label', 'Fermer le guide d’Erika');
    closeBtn.title = 'Fermer (Échap)';
    closeBtn.textContent = '×';
    closeBtn.addEventListener('click', () => close());

    head.append(avatar, meta, closeBtn);

    bodyEl = document.createElement('div');
    bodyEl.className = 'erika-tour-body';
    titleEl = document.createElement('h2');
    titleEl.id = 'erikaTourTitle';
    titleEl.className = 'erika-tour-title';
    descEl = document.createElement('p');
    descEl.id = 'erikaTourDesc';
    descEl.className = 'erika-tour-text';
    interactiveHintEl = document.createElement('p');
    interactiveHintEl.className = 'erika-tour-interactive-hint hidden';
    interactiveHintEl.textContent = 'Vous pouvez essayer cette zone directement avant de poursuivre.';
    bodyEl.append(titleEl, descEl, interactiveHintEl);

    const actions = document.createElement('div');
    actions.className = 'erika-tour-actions';

    skipBtn = document.createElement('button');
    skipBtn.type = 'button';
    skipBtn.className = 'erika-tour-btn erika-tour-btn-secondary';
    skipBtn.textContent = 'Passer';
    skipBtn.addEventListener('click', () => close());

    const navGroup = document.createElement('div');
    navGroup.className = 'erika-tour-nav-group';

    prevBtn = document.createElement('button');
    prevBtn.type = 'button';
    prevBtn.className = 'erika-tour-btn erika-tour-btn-secondary';
    prevBtn.textContent = '← Retour';
    prevBtn.addEventListener('click', () => prev());

    nextBtn = document.createElement('button');
    nextBtn.type = 'button';
    nextBtn.className = 'erika-tour-btn erika-tour-btn-primary';
    nextBtn.textContent = 'Suivant →';
    nextBtn.addEventListener('click', () => next());

    navGroup.append(prevBtn, nextBtn);
    actions.append(skipBtn, navGroup);

    cardEl.append(arrowEl, head, bodyEl, actions);

    liveEl = document.createElement('div');
    liveEl.id = 'erikaTourLive';
    liveEl.className = 'erika-tour-live';
    liveEl.setAttribute('aria-live', 'polite');
    liveEl.setAttribute('aria-atomic', 'true');

    rootEl.append(backdropEl, guardEl, ringEl, cardEl, liveEl);
    document.body.appendChild(rootEl);

    bindGlobalEvents();
  }

  function bindGlobalEvents() {
    window.addEventListener('resize', scheduleGeometrySync);
    window.addEventListener('scroll', scheduleGeometrySync, { capture: true, passive: true });
    window.addEventListener('beforeprint', () => {
      if (isOpen()) close({ silent: true });
    });

    if (window.ResizeObserver) {
      resizeObserver = new ResizeObserver(scheduleGeometrySync);
      resizeObserver.observe(document.documentElement);
      if (cardEl) {
        cardResizeObserver = new ResizeObserver(() => {
          repositionCardOnly();
        });
        cardResizeObserver.observe(cardEl);
      }
    }

    if (window.MutationObserver) {
      dialogObserver = new MutationObserver(() => {
        if (isOpen() && document.querySelector('dialog[open]')) {
          close({ silent: true });
        }
      });
      document.querySelectorAll('dialog').forEach(dialog => {
        dialogObserver.observe(dialog, { attributes: true, attributeFilter: ['open'] });
      });
    }

    document.addEventListener('keydown', event => {
      if (!isOpen()) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        close();
        return;
      }
      if (event.key === 'Tab') {
        handleTabTrap(event);
        return;
      }
      if (!isUserTypingInField()) {
        if (event.key === 'ArrowRight') {
          event.preventDefault();
          next();
        } else if (event.key === 'ArrowLeft' && activeSession && activeSession.index > 0) {
          event.preventDefault();
          prev();
        }
      }
    }, true);
  }

  function handleTabTrap(event) {
    const focusables = [...cardEl.querySelectorAll(
      'button:not(:disabled):not(.hidden), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled)'
    )].filter(el => el.getClientRects().length > 0 && window.getComputedStyle(el).display !== 'none');
    const step = getActiveStep();
    if (step && step.interactive) {
      resolveStepElements(step).forEach(el => {
        el.querySelectorAll('button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])')
          .forEach(ctrl => {
            if (ctrl.getClientRects().length > 0 && !focusables.includes(ctrl)) focusables.push(ctrl);
          });
      });
    }
    if (!focusables.length) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (event.shiftKey && (document.activeElement === first || !focusables.includes(document.activeElement))) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && (document.activeElement === last || !focusables.includes(document.activeElement))) {
      event.preventDefault();
      first.focus();
    }
  }

  function getActiveStep() {
    if (!activeSession) return null;
    return activeSession.steps[activeSession.index] || null;
  }

  function prepareScrollPlan(els) {
    const primary = els[0];
    if (!primary) {
      return { startScrollY: window.scrollY, targetScrollY: window.scrollY, deltaY: 0, isFixed: false };
    }

    const sidebar = primary.closest('.test-sidebar');
    if (sidebar && window.getComputedStyle(sidebar).position === 'fixed') {
      const sRect = sidebar.getBoundingClientRect();
      const tRect = primary.getBoundingClientRect();
      if (tRect.top < sRect.top + 12 || tRect.bottom > sRect.bottom - 12) {
        const targetScroll = sidebar.scrollTop + (tRect.top - sRect.top) - 24;
        sidebar.scrollTo({ top: Math.max(0, targetScroll), behavior: 'auto' });
      }
      return { startScrollY: window.scrollY, targetScrollY: window.scrollY, deltaY: 0, isFixed: true };
    }

    const gbContainer = primary.closest('#gradebookScrollContainer');
    if (gbContainer && els.length === 1 && primary !== gbContainer) {
      const cRect = gbContainer.getBoundingClientRect();
      const firstHeader = gbContainer.querySelector('thead th:first-child');
      const stickyColW = firstHeader ? firstHeader.getBoundingClientRect().width : 0;
      const tRect = primary.getBoundingClientRect();
      if (tRect.left < cRect.left + stickyColW + 12) {
        gbContainer.scrollLeft = Math.max(0, gbContainer.scrollLeft - (cRect.left + stickyColW + 18 - tRect.left));
        if (typeof updateGradebookTopScroll === 'function') updateGradebookTopScroll();
      } else if (tRect.right > cRect.right - 12) {
        gbContainer.scrollLeft += (tRect.right - cRect.right + 18);
        if (typeof updateGradebookTopScroll === 'function') updateGradebookTopScroll();
      }
    }

    if (isInsideFixedChrome(primary)) {
      return { startScrollY: window.scrollY, targetScrollY: window.scrollY, deltaY: 0, isFixed: true };
    }

    const header = document.querySelector('header.test-topbar');
    const headerRect = (header && window.getComputedStyle(header).display !== 'none') ? header.getBoundingClientRect() : null;
    const stickyTop = (headerRect && ['fixed', 'sticky'].includes(window.getComputedStyle(header).position))
      ? headerRect.bottom + 14
      : 16;

    const combined = getUnionRect(els);
    const startScrollY = window.scrollY;
    const maxScrollY = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    let targetScrollY = startScrollY;
    const desiredBottomLimit = window.innerHeight - 24;
    if (combined.top < stickyTop || combined.bottom > desiredBottomLimit) {
      const rawTargetY = startScrollY + combined.top - Math.max(stickyTop + 12, Math.round((window.innerHeight - combined.height) / 2));
      targetScrollY = Math.max(0, Math.min(maxScrollY, Math.round(rawTargetY)));
    }
    return {
      startScrollY,
      targetScrollY,
      deltaY: targetScrollY - startScrollY,
      isFixed: false
    };
  }

  function getUnionRect(els) {
    let left = Infinity;
    let top = Infinity;
    let right = -Infinity;
    let bottom = -Infinity;
    els.forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.width <= 0 || r.height <= 0) return;
      left = Math.min(left, r.left);
      top = Math.min(top, r.top);
      right = Math.max(right, r.right);
      bottom = Math.max(bottom, r.bottom);
    });
    if (!Number.isFinite(left)) {
      return { left: 24, top: 24, right: 120, bottom: 80, width: 96, height: 56 };
    }
    return { left, top, right, bottom, width: right - left, height: bottom - top };
  }

  function computeHoleGeometry(step, els) {
    const raw = getUnionRect(els);
    const pad = typeof step.padding === 'number' ? step.padding : 8;
    let left = raw.left - pad;
    let top = raw.top - pad;
    let right = raw.right + pad;
    let bottom = raw.bottom + pad;

    const primary = els[0];
    // Respecter les conteneurs défilants réels (barre latérale fixe ou tableau carnet)
    let ancestor = primary ? primary.parentElement : null;
    while (ancestor && ancestor !== document.body && ancestor !== document.documentElement) {
      const style = window.getComputedStyle(ancestor);
      if (['auto', 'scroll'].includes(style.overflowX) || ['auto', 'scroll'].includes(style.overflowY)) {
        const ar = ancestor.getBoundingClientRect();
        left = Math.max(left, ar.left + 2);
        top = Math.max(top, ar.top + 2);
        right = Math.min(right, ar.right - 2);
        bottom = Math.min(bottom, ar.bottom - 2);
      }
      ancestor = ancestor.parentElement;
    }

    // Ne jamais chevaucher le bandeau supérieur fixe lorsqu'on cible le contenu de <main>
    const inMain = primary && Boolean(primary.closest('main'));
    if (inMain) {
      const header = document.querySelector('header.test-topbar');
      if (header && window.getComputedStyle(header).display !== 'none') {
        const hStyle = window.getComputedStyle(header);
        if (['fixed', 'sticky'].includes(hStyle.position)) {
          const hRect = header.getBoundingClientRect();
          if (hRect.bottom > 0 && hRect.top <= 4) {
            top = Math.max(top, hRect.bottom + 2);
          }
        }
      }
    }

    left = Math.max(4, left);
    top = Math.max(4, top);
    right = Math.min(window.innerWidth - 4, right);
    bottom = Math.min(window.innerHeight - 4, bottom);

    const w = Math.max(24, right - left);
    const h = Math.max(24, bottom - top);

    let radius = 14;
    if (typeof step.radius === 'number') {
      radius = step.radius;
    } else if (els.length === 1 && primary) {
      const cs = window.getComputedStyle(primary);
      const parsed = parseFloat(cs.borderTopLeftRadius);
      if (Number.isFinite(parsed) && parsed > 0) {
        radius = Math.min(28, Math.round(parsed) + Math.min(pad, 6));
      }
    }
    radius = Math.max(6, Math.min(radius, Math.floor(Math.min(w, h) / 2)));

    return { x: left, y: top, w, h, r: radius };
  }

  function buildRoundedHoleClipPath(geom) {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const { x, y, w, h, r } = geom;
    const segs = 4;
    const holePts = [];

    const addArc = (cx, cy, startDeg, endDeg) => {
      for (let i = 0; i <= segs; i++) {
        const rad = ((startDeg + ((endDeg - startDeg) * i) / segs) * Math.PI) / 180;
        holePts.push(`${(cx + r * Math.cos(rad)).toFixed(1)}px ${(cy + r * Math.sin(rad)).toFixed(1)}px`);
      }
    };

    // Départ horizontal au bord gauche (zéro ligne diagonale), sens horaire autour du trou arrondi
    const seamY = `${(y + r).toFixed(1)}px`;
    const startPt = `${x.toFixed(1)}px ${seamY}`;
    addArc(x + r, y + r, 180, 270);
    addArc(x + w - r, y + r, -90, 0);
    addArc(x + w - r, y + h - r, 0, 90);
    addArc(x + r, y + h - r, 90, 180);

    const outer = `0px 0px, ${vw}px 0px, ${vw}px ${vh}px, 0px ${vh}px, 0px ${seamY}`;
    const inner = holePts.join(', ');
    return `polygon(evenodd, ${outer}, ${startPt}, ${inner}, ${startPt}, 0px ${seamY}, 0px 0px)`;
  }

  function applyHoleGeometry(geom) {
    currentGeom = geom;
    const clip = buildRoundedHoleClipPath(geom);
    backdropEl.style.clipPath = clip;
    backdropEl.style.webkitClipPath = clip;

    const transformVal = `translate3d(${geom.x.toFixed(1)}px, ${geom.y.toFixed(1)}px, 0)`;
    const wPx = `${geom.w.toFixed(1)}px`;
    const hPx = `${geom.h.toFixed(1)}px`;
    const rPx = `${geom.r.toFixed(1)}px`;

    guardEl.style.transform = transformVal;
    guardEl.style.width = wPx;
    guardEl.style.height = hPx;
    guardEl.style.borderRadius = rPx;

    ringEl.style.transform = transformVal;
    ringEl.style.width = wPx;
    ringEl.style.height = hPx;
    ringEl.style.borderRadius = rPx;
  }

  function applyCardTransform(transformValue, instant = false) {
    if (instant) {
      cardEl.classList.add('is-sync-instant');
      cardEl.style.transform = transformValue;
      if (!manualSyncTimer) {
        void cardEl.offsetWidth;
        cardEl.classList.remove('is-sync-instant');
      }
    } else {
      cardEl.style.transform = transformValue;
    }
  }

  function positionCard(step, geom, instant = false) {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const gap = 14;
    const margin = 12;

    if (vw <= 720) {
      cardEl.classList.add('is-sheet');
      const cardRect = cardEl.getBoundingClientRect();
      const cardW = Math.min(520, vw - 20);
      const left = Math.round((vw - cardW) / 2);
      const holeNearBottom = geom.y + geom.h > vh - cardRect.height - 28 && geom.y > cardRect.height + 28;
      const top = holeNearBottom ? margin : Math.max(margin, vh - cardRect.height - margin);
      cardEl.dataset.placement = holeNearBottom ? 'top' : 'bottom';
      applyCardTransform(`translate3d(${left}px, ${Math.round(top)}px, 0)`, instant);
      return;
    }

    cardEl.classList.remove('is-sheet');
    const cardRect = cardEl.getBoundingClientRect();
    const cw = cardRect.width || 340;
    const ch = cardRect.height || 200;

    const targetCenterX = geom.x + geom.w / 2;
    const targetCenterY = geom.y + geom.h / 2;
    const preferred = step.placement && step.placement !== 'auto' ? step.placement : 'bottom';
    const order = [...new Set([preferred, 'bottom', 'top', 'right', 'left'])];

    const fits = {
      bottom: geom.y + geom.h + gap + ch + margin <= vh,
      top: geom.y - gap - ch - margin >= 0,
      right: geom.x + geom.w + gap + cw + margin <= vw,
      left: geom.x - gap - cw - margin >= 0
    };

    const chosen = order.find(side => fits[side]) || 'floating';
    let left = margin;
    let top = margin;

    if (chosen === 'bottom') {
      top = geom.y + geom.h + gap;
      left = Math.max(margin, Math.min(vw - cw - margin, targetCenterX - cw / 2));
      cardEl.style.setProperty('--erika-arrow-offset', `${Math.max(22, Math.min(cw - 22, targetCenterX - left))}px`);
    } else if (chosen === 'top') {
      top = geom.y - gap - ch;
      left = Math.max(margin, Math.min(vw - cw - margin, targetCenterX - cw / 2));
      cardEl.style.setProperty('--erika-arrow-offset', `${Math.max(22, Math.min(cw - 22, targetCenterX - left))}px`);
    } else if (chosen === 'right') {
      left = geom.x + geom.w + gap;
      top = Math.max(margin, Math.min(vh - ch - margin, targetCenterY - ch / 2));
      cardEl.style.setProperty('--erika-arrow-offset', `${Math.max(24, Math.min(ch - 24, targetCenterY - top))}px`);
    } else if (chosen === 'left') {
      left = geom.x - gap - cw;
      top = Math.max(margin, Math.min(vh - ch - margin, targetCenterY - ch / 2));
      cardEl.style.setProperty('--erika-arrow-offset', `${Math.max(24, Math.min(ch - 24, targetCenterY - top))}px`);
    } else {
      left = vw - cw - 16;
      top = vh - ch - 16;
    }

    cardEl.dataset.placement = chosen;
    applyCardTransform(`translate3d(${Math.round(left)}px, ${Math.round(top)}px, 0)`, instant);
  }

  function repositionCardOnly() {
    if (!isOpen() || isStepTransitioning) return;
    const step = getActiveStep();
    if (!step || !currentGeom) return;
    positionCard(step, currentGeom, true);
  }

  function runStepTransition(step, els, scrollPlan, animate) {
    if (spotAnimFrame) {
      window.cancelAnimationFrame(spotAnimFrame);
      spotAnimFrame = 0;
    }

    const hasVerticalScroll = !scrollPlan.isFixed && Math.abs(scrollPlan.deltaY) > 1;
    if (!animate || !currentGeom || prefersReducedMotion()) {
      isStepTransitioning = false;
      if (hasVerticalScroll) {
        window.scrollTo(0, scrollPlan.targetScrollY);
      }
      const finalGeom = computeHoleGeometry(step, els);
      applyHoleGeometry(finalGeom);
      positionCard(step, finalGeom, true);
      return;
    }

    cardEl.classList.remove('is-sync-instant');
    if (manualSyncTimer) {
      window.clearTimeout(manualSyncTimer);
      manualSyncTimer = 0;
    }

    const baseGeom = computeHoleGeometry(step, els);
    const predictedGeom = { ...baseGeom };
    if (hasVerticalScroll) {
      predictedGeom.y = Math.max(4, Math.min(window.innerHeight - 4 - baseGeom.h, baseGeom.y - scrollPlan.deltaY));
    }
    positionCard(step, predictedGeom, false);

    const from = { ...currentGeom };
    const start = performance.now();
    const duration = 260;
    isStepTransitioning = true;

    const tick = now => {
      if (!isOpen()) {
        spotAnimFrame = 0;
        isStepTransitioning = false;
        return;
      }
      const t = Math.min(1, (now - start) / duration);
      const ease = 1 - Math.pow(1 - t, 3);
      if (hasVerticalScroll) {
        window.scrollTo(0, scrollPlan.startScrollY + scrollPlan.deltaY * ease);
      }
      const liveDest = computeHoleGeometry(step, els);
      applyHoleGeometry({
        x: from.x + (liveDest.x - from.x) * ease,
        y: from.y + (liveDest.y - from.y) * ease,
        w: from.w + (liveDest.w - from.w) * ease,
        h: from.h + (liveDest.h - from.h) * ease,
        r: from.r + (liveDest.r - from.r) * ease
      });

      if (t < 1) {
        spotAnimFrame = window.requestAnimationFrame(tick);
      } else {
        spotAnimFrame = 0;
        isStepTransitioning = false;
        if (hasVerticalScroll) {
          window.scrollTo(0, scrollPlan.targetScrollY);
        }
        const settled = computeHoleGeometry(step, els);
        applyHoleGeometry(settled);
        if (
          Math.abs(settled.x - predictedGeom.x) > 1.5
          || Math.abs(settled.y - predictedGeom.y) > 1.5
          || Math.abs(settled.w - predictedGeom.w) > 1.5
          || Math.abs(settled.h - predictedGeom.h) > 1.5
        ) {
          positionCard(step, settled, true);
        }
      }
    };
    spotAnimFrame = window.requestAnimationFrame(tick);
  }

  function syncGeometryNow(instantCard = true) {
    if (!isOpen() || isStepTransitioning) return;
    const step = getActiveStep();
    if (!step) return;
    const els = resolveStepElements(step);
    if (!els.length) {
      close({ silent: true });
      return;
    }
    const geom = computeHoleGeometry(step, els);
    applyHoleGeometry(geom);
    positionCard(step, geom, instantCard);
  }

  function scheduleGeometrySync() {
    if (!isOpen() || isStepTransitioning || syncFrame) return;
    if (cardEl) {
      cardEl.classList.add('is-sync-instant');
      window.clearTimeout(manualSyncTimer);
      manualSyncTimer = window.setTimeout(() => {
        manualSyncTimer = 0;
        if (cardEl) cardEl.classList.remove('is-sync-instant');
      }, 90);
    }
    syncFrame = window.requestAnimationFrame(() => {
      syncFrame = 0;
      syncGeometryNow(true);
    });
  }

  function renderCurrentStep(animate = true) {
    if (!activeSession) return;
    const step = getActiveStep();
    if (!step) {
      close();
      return;
    }

    if (syncFrame) {
      window.cancelAnimationFrame(syncFrame);
      syncFrame = 0;
    }
    if (spotAnimFrame) {
      window.cancelAnimationFrame(spotAnimFrame);
      spotAnimFrame = 0;
    }
    isStepTransitioning = false;

    if (typeof step.beforeEnter === 'function') {
      try {
        step.beforeEnter();
      } catch (error) {
        // Ignorer un hook avant-entrée défaillant sans bloquer la visite
      }
    }

    const els = resolveStepElements(step);
    if (!els.length) {
      if (activeSession.index < activeSession.steps.length - 1) {
        activeSession.index += 1;
        renderCurrentStep(animate);
      } else {
        close();
      }
      return;
    }

    clearObservedTargets();
    if (resizeObserver) {
      els.forEach(el => resizeObserver.observe(el));
      observedTargetEls = els.slice();
    }

    clearHighlightedTargets();
    els.forEach((el) => {
      if (el && el.classList) {
        el.classList.add('erika-spotlight-target');
      }
    });
    activeHighlightedEls = els.slice();

    const total = activeSession.steps.length;
    const num = activeSession.index + 1;
    const isFirst = num === 1;
    const isLast = num === total;
    const interactive = Boolean(step.interactive);

    rootEl.classList.toggle('is-interactive', interactive);
    cardEl.setAttribute('aria-modal', interactive ? 'false' : 'true');
    interactiveHintEl.hidden = !interactive;
    interactiveHintEl.classList.toggle('hidden', !interactive);

    const titleText = resolveText(step.title);
    const bodyText = resolveText(step.body);

    progressEl.textContent = total > 1 ? `Étape ${num} sur ${total}` : 'Repère rapide';
    titleEl.textContent = titleText;
    descEl.textContent = bodyText;

    const hideSkip = !isFirst || total === 1;
    skipBtn.hidden = hideSkip;
    skipBtn.classList.toggle('hidden', hideSkip);
    prevBtn.hidden = isFirst;
    prevBtn.classList.toggle('hidden', isFirst);
    nextBtn.textContent = isLast ? 'Compris' : 'Suivant →';

    if (swapTimer) {
      window.clearTimeout(swapTimer);
      swapTimer = 0;
    }
    if (animate && currentGeom && !prefersReducedMotion()) {
      bodyEl.classList.add('is-swapping');
      swapTimer = window.setTimeout(() => {
        swapTimer = 0;
        if (bodyEl) bodyEl.classList.remove('is-swapping');
      }, 110);
    } else {
      bodyEl.classList.remove('is-swapping');
    }

    const scrollPlan = prepareScrollPlan(els);
    runStepTransition(step, els, scrollPlan, animate);

    if (liveEl) {
      liveEl.textContent = `Erika : ${titleText}. ${bodyText}`;
    }

    window.requestAnimationFrame(() => {
      if (isOpen() && nextBtn) {
        nextBtn.focus({ preventScroll: true });
      }
    });
  }

  function isOpen() {
    return Boolean(activeSession && rootEl && !rootEl.classList.contains('hidden'));
  }

  function getCurrentEnv() {
    if (typeof hasActiveGroup === 'function' && !hasActiveGroup()) return 'homePortal';
    if (typeof landingPortalRequested !== 'undefined' && landingPortalRequested) return 'homePortal';
    if (typeof appState === 'undefined' || !appState) return 'homePortal';
    switch (appState.activeView) {
      case 'viewHome':
        return 'homeDashboard';
      case 'viewStudents':
        return 'students';
      case 'viewQuickObs':
        return 'quickObs';
      case 'viewBareme':
        return 'bareme';
      case 'viewGlobalReport':
        return appState.selectedStudentId ? 'globalReportStudent' : 'globalReport';
      default:
        return 'gradebook';
    }
  }

  function getStepVisualPosition(step) {
    const els = resolveStepElements(step);
    if (!els.length) return { top: Number.POSITIVE_INFINITY, left: Number.POSITIVE_INFINITY };
    const rect = getUnionRect(els);
    const fixed = isInsideFixedChrome(els[0]);
    return {
      top: fixed ? rect.top : rect.top + window.scrollY,
      left: rect.left
    };
  }

  function start(envId, options = {}) {
    const resolvedEnv = envId || getCurrentEnv();
    const tours = getToursMap();
    const tour = tours[resolvedEnv];
    if (!tour || !Array.isArray(tour.steps)) return false;

    const eligibleSteps = tour.steps.filter(isStepEligible);
    if (!eligibleSteps.length) return false;

    const orderedSteps = eligibleSteps
      .map((step, originalIndex) => ({ step, originalIndex, pos: getStepVisualPosition(step) }))
      .sort((a, b) => {
        if (Math.abs(a.pos.top - b.pos.top) > 16) return a.pos.top - b.pos.top;
        if (Math.abs(a.pos.left - b.pos.left) > 4) return a.pos.left - b.pos.left;
        return a.originalIndex - b.originalIndex;
      })
      .map(entry => entry.step);

    ensureDom();

    if (!isOpen()) {
      previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      currentGeom = null;
    }

    let startIndex = 0;
    if (options.startStepId) {
      const idx = orderedSteps.findIndex(step => step.id === options.startStepId);
      if (idx >= 0) startIndex = idx;
    }

    activeSession = {
      envId: resolvedEnv,
      steps: orderedSteps,
      index: startIndex
    };

    rootEl.classList.remove('hidden');
    renderCurrentStep(false);
    window.requestAnimationFrame(() => {
      if (rootEl) rootEl.classList.add('is-visible');
    });
    return true;
  }

  function next() {
    if (!activeSession) return;
    if (activeSession.index >= activeSession.steps.length - 1) {
      close();
      return;
    }
    activeSession.index += 1;
    renderCurrentStep(true);
  }

  function prev() {
    if (!activeSession || activeSession.index <= 0) return;
    activeSession.index -= 1;
    renderCurrentStep(true);
  }

  function close(options = {}) {
    clearObservedTargets();
    clearHighlightedTargets();
    if (syncFrame) {
      window.cancelAnimationFrame(syncFrame);
      syncFrame = 0;
    }
    if (spotAnimFrame) {
      window.cancelAnimationFrame(spotAnimFrame);
      spotAnimFrame = 0;
    }
    if (swapTimer) {
      window.clearTimeout(swapTimer);
      swapTimer = 0;
    }
    if (manualSyncTimer) {
      window.clearTimeout(manualSyncTimer);
      manualSyncTimer = 0;
    }
    isStepTransitioning = false;
    activeSession = null;
    currentGeom = null;

    if (cardEl) cardEl.classList.remove('is-sync-instant');
    if (bodyEl) bodyEl.classList.remove('is-swapping');
    if (rootEl) {
      rootEl.classList.remove('is-visible', 'is-interactive');
      rootEl.classList.add('hidden');
    }
    if (!options.silent && previousFocus && previousFocus.isConnected) {
      previousFocus.focus({ preventScroll: true });
    }
    previousFocus = null;
  }

  function onAppRender() {
    if (isOpen()) {
      const currentEnv = getCurrentEnv();
      const allowedSame = activeSession && (
        activeSession.envId === currentEnv
        || activeSession.envId === 'saveReminder'
      );
      if (!allowedSame) {
        close({ silent: true });
      } else {
        scheduleGeometrySync();
      }
    }
  }

  window.ErikaTour = {
    getCurrentEnv,
    start,
    next,
    prev,
    close,
    isOpen,
    onAppRender
  };
})();
