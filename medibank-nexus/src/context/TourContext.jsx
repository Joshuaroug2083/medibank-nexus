/**
 * TourContext — Page-by-page guided tour engine for MediBank Nexus.
 *
 * How it works:
 *  1. When a user navigates to a page for the first time, a tour auto-starts.
 *  2. The tour highlights DOM elements via [data-tour="step-key"] attributes.
 *  3. A spotlight cutout + tooltip bubble is rendered by <TourOverlay />.
 *  4. Users can navigate steps (Next / Prev), skip, or finish.
 *  5. Keyboard: → / Enter = next, ← = prev, Escape = skip.
 *  6. Completed tours are stored in localStorage — not shown again automatically.
 *  7. Any tour can be restarted from Settings → Appearance.
 *
 * Tour definitions live in src/data/tourDefs.js and are keyed by page + role.
 */
import {
  createContext, useContext, useState, useCallback,
  useEffect, useRef,
} from 'react';
import { useAuth }   from './AuthContext';
import { useAppCtx } from './AppContext';
import TOUR_DEFS     from '../data/tourDefs';

const TourCtx = createContext(null);
export const useTour = () => {
  const ctx = useContext(TourCtx);
  if (!ctx) throw new Error('useTour must be used inside <TourProvider>');
  return ctx;
};

function seenKey(userId, page) { return `nexus_tour_seen_${userId}_${page}`; }
function allSeenKey(userId)    { return `nexus_tour_seen_${userId}`; }

export function TourProvider({ children }) {
  const { user }     = useAuth();
  const { page }     = useAppCtx();

  const [active,    setActive]    = useState(false);   // tour is running
  const [steps,     setSteps]     = useState([]);       // current page's step list
  const [stepIdx,   setStepIdx]   = useState(0);        // current step index
  const [targetRect,setTargetRect]= useState(null);     // DOMRect of highlighted element
  const [tourPage,  setTourPage]  = useState(null);     // which page tour is for

  const animFrame = useRef(null);

  /* ── Resolve steps for page + role ─────────────────────── */
  const getSteps = useCallback((pageKey, role) => {
    const def = TOUR_DEFS[pageKey];
    if (!def) return [];
    /* Role-specific steps take priority, fallback to 'all' */
    return def[role] ?? def['all'] ?? [];
  }, []);

  /* ── Measure target element ─────────────────────────────── */
  const measureTarget = useCallback((step) => {
    if (!step?.target) { setTargetRect(null); return; }
    const el = document.querySelector(`[data-tour="${step.target}"]`);
    if (!el) { setTargetRect(null); return; }
    const rect = el.getBoundingClientRect();
    setTargetRect({
      top:    rect.top    + window.scrollY,
      left:   rect.left   + window.scrollX,
      width:  rect.width,
      height: rect.height,
      /* Viewport-relative for positioning tooltip */
      vTop:   rect.top,
      vLeft:  rect.left,
      vRight: rect.right,
      vBottom:rect.bottom,
    });
    /* Scroll element into view with some padding */
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
  }, []);

  /* ── Start tour for a given page ────────────────────────── */
  const startTour = useCallback((pageKey, role, force = false) => {
    if (!user) return;
    const tourSteps = getSteps(pageKey, role ?? user.role);
    if (!tourSteps.length) return;
    if (!force && localStorage.getItem(seenKey(user.id, pageKey))) return;

    setSteps(tourSteps);
    setStepIdx(0);
    setTourPage(pageKey);
    setActive(true);
  }, [user, getSteps]);

  /* ── Auto-start on page change ──────────────────────────── */
  useEffect(() => {
    if (!user || !page) return;
    /* Small delay so DOM elements from the new page are mounted */
    const t = setTimeout(() => startTour(page, user.role), 400);
    return () => clearTimeout(t);
  }, [page, user?.id]);  // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Measure target whenever step changes ───────────────── */
  useEffect(() => {
    if (!active || !steps[stepIdx]) return;
    /* Poll for element (it may render after a short delay) */
    let attempts = 0;
    const poll = setInterval(() => {
      const el = steps[stepIdx].target
        ? document.querySelector(`[data-tour="${steps[stepIdx].target}"]`)
        : null;
      if (el || attempts > 10) {
        clearInterval(poll);
        measureTarget(steps[stepIdx]);
      }
      attempts++;
    }, 80);
    return () => clearInterval(poll);
  }, [active, stepIdx, steps, measureTarget]);

  /* ── Re-measure on scroll / resize ─────────────────────── */
  useEffect(() => {
    if (!active) return;
    const remeasure = () => {
      cancelAnimationFrame(animFrame.current);
      animFrame.current = requestAnimationFrame(() => measureTarget(steps[stepIdx]));
    };
    window.addEventListener('scroll',  remeasure, { passive: true });
    window.addEventListener('resize',  remeasure);
    return () => {
      window.removeEventListener('scroll', remeasure);
      window.removeEventListener('resize', remeasure);
    };
  }, [active, steps, stepIdx, measureTarget]);

  /* ── Keyboard navigation ────────────────────────────────── */
  useEffect(() => {
    if (!active) return;
    const onKey = (e) => {
      if (e.key === 'ArrowRight' || e.key === 'Enter') { e.preventDefault(); next(); }
      if (e.key === 'ArrowLeft')                        { e.preventDefault(); prev(); }
      if (e.key === 'Escape')                           { e.preventDefault(); skip(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [active, stepIdx, steps.length]);  // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Navigation actions ─────────────────────────────────── */
  const next = useCallback(() => {
    if (stepIdx < steps.length - 1) {
      setStepIdx(i => i + 1);
    } else {
      finish();
    }
  }, [stepIdx, steps.length]);

  const prev = useCallback(() => {
    setStepIdx(i => Math.max(0, i - 1));
  }, []);

  const skip = useCallback(() => {
    if (user && tourPage) {
      localStorage.setItem(seenKey(user.id, tourPage), '1');
    }
    setActive(false);
    setTargetRect(null);
  }, [user, tourPage]);

  const finish = useCallback(() => {
    if (user && tourPage) {
      localStorage.setItem(seenKey(user.id, tourPage), '1');
      /* Track total tours seen */
      const allSeen = JSON.parse(localStorage.getItem(allSeenKey(user.id)) ?? '[]');
      if (!allSeen.includes(tourPage)) {
        localStorage.setItem(allSeenKey(user.id), JSON.stringify([...allSeen, tourPage]));
      }
    }
    setActive(false);
    setTargetRect(null);
  }, [user, tourPage]);

  /* ── Restart a specific page's tour ────────────────────── */
  const restartTour = useCallback((pageKey) => {
    if (!user) return;
    localStorage.removeItem(seenKey(user.id, pageKey));
    startTour(pageKey, user.role, true);
  }, [user, startTour]);

  /* ── Reset ALL tours (from Settings) ───────────────────── */
  const resetAllTours = useCallback(() => {
    if (!user) return;
    /* Remove all seen keys for this user */
    const keys = Object.keys(localStorage).filter(k => k.startsWith(`nexus_tour_seen_${user.id}`));
    keys.forEach(k => localStorage.removeItem(k));
  }, [user]);

  /* ── Get list of seen tours ─────────────────────────────── */
  const seenTours = useCallback(() => {
    if (!user) return [];
    return JSON.parse(localStorage.getItem(allSeenKey(user.id)) ?? '[]');
  }, [user]);

  const currentStep = steps[stepIdx] ?? null;
  const progress    = steps.length > 0 ? (stepIdx + 1) / steps.length : 0;

  return (
    <TourCtx.Provider value={{
      active,
      currentStep,
      stepIdx,
      totalSteps: steps.length,
      progress,
      targetRect,
      next,
      prev,
      skip,
      finish,
      startTour,
      restartTour,
      resetAllTours,
      seenTours,
    }}>
      {children}
    </TourCtx.Provider>
  );
}
