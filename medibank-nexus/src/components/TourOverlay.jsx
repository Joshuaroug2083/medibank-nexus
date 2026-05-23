/**
 * TourOverlay — Spotlight cutout + tooltip bubble.
 *
 * Fixes applied:
 *  - Removed backdropFilter blur (was blurring the whole page)
 *  - Removed click-outside-to-skip div (was blocking tooltip button clicks)
 *  - Tooltip uses pointer-events: all so buttons are always clickable
 *  - SVG backdrop uses pointer-events: none so it never intercepts clicks
 *  - Escape key still skips via TourContext keyboard handler
 */
import { createPortal }  from 'react-dom';
import { useTour }       from '../context/TourContext';
import { IcX, IcArrowRight, IcArrowLeft, IcCheckCircle } from './Icons';

const PAD    = 10;
const RADIUS = 10;

/* ── Auto-calculate tooltip position ─────────────────────────── */
function calcTooltipPos(rect, placement, tipW = 320, tipH = 210) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  /* Centred modal (no target or explicit center) */
  if (!rect || placement === 'center') {
    return {
      position:  'fixed',
      top:       '50%',
      left:      '50%',
      transform: 'translate(-50%, -50%)',
      width:     Math.min(tipW, vw - 32),
      zIndex:    10002,
    };
  }

  const spotlight = {
    top:    Math.max(0, rect.vTop    - PAD),
    left:   Math.max(0, rect.vLeft   - PAD),
    right:  Math.min(vw, rect.vRight  + PAD),
    bottom: Math.min(vh, rect.vBottom + PAD),
  };

  const spaceBelow = vh - spotlight.bottom;
  const spaceAbove = spotlight.top;
  const spaceRight = vw - spotlight.right;
  const spaceLeft  = spotlight.left;
  const MARGIN     = 14;

  const best = (() => {
    if (placement && placement !== 'auto') return placement;
    if (spaceBelow >= tipH + MARGIN)  return 'bottom';
    if (spaceAbove >= tipH + MARGIN)  return 'top';
    if (spaceRight >= tipW + MARGIN)  return 'right';
    if (spaceLeft  >= tipW + MARGIN)  return 'left';
    return 'bottom'; /* last resort */
  })();

  const base  = { position: 'fixed', zIndex: 10002 };
  const cx    = (spotlight.left + spotlight.right)  / 2;
  const cy    = (spotlight.top  + spotlight.bottom) / 2;
  const maxW  = Math.min(tipW, vw - MARGIN * 2);

  switch (best) {
    case 'bottom': return { ...base,
      top:  spotlight.bottom + MARGIN,
      left: Math.max(MARGIN, Math.min(vw - maxW - MARGIN, cx - maxW / 2)),
      width: maxW,
    };
    case 'top': return { ...base,
      top:  Math.max(MARGIN, spotlight.top - tipH - MARGIN),
      left: Math.max(MARGIN, Math.min(vw - maxW - MARGIN, cx - maxW / 2)),
      width: maxW,
    };
    case 'right': return { ...base,
      top:   Math.max(MARGIN, Math.min(vh - tipH - MARGIN, cy - tipH / 2)),
      left:  spotlight.right + MARGIN,
      width: Math.min(maxW, vw - spotlight.right - MARGIN * 2),
    };
    case 'left': return { ...base,
      top:   Math.max(MARGIN, Math.min(vh - tipH - MARGIN, cy - tipH / 2)),
      left:  Math.max(MARGIN, spotlight.left - maxW - MARGIN),
      width: Math.min(maxW, spotlight.left - MARGIN * 2),
    };
    default: return { ...base,
      top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: maxW,
    };
  }
}

/* ── Build SVG spotlight path ───────────────────────────────── */
function buildSpotlightPath(rect) {
  if (!rect) return '';
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const x  = Math.max(0, rect.vLeft   - PAD);
  const y  = Math.max(0, rect.vTop    - PAD);
  const w  = Math.min(vw, rect.vRight  + PAD) - x;
  const h  = Math.min(vh, rect.vBottom + PAD) - y;
  const r  = RADIUS;
  return [
    `M 0 0 H ${vw} V ${vh} H 0 Z`,
    `M ${x+r} ${y} H ${x+w-r} Q ${x+w} ${y} ${x+w} ${y+r}`,
    `V ${y+h-r} Q ${x+w} ${y+h} ${x+w-r} ${y+h}`,
    `H ${x+r} Q ${x} ${y+h} ${x} ${y+h-r}`,
    `V ${y+r} Q ${x} ${y} ${x+r} ${y} Z`,
  ].join(' ');
}

/* ════════════════════════════════════════════════════════════════
   TOUR OVERLAY
════════════════════════════════════════════════════════════════ */
export default function TourOverlay() {
  const {
    active, currentStep, stepIdx, totalSteps, progress,
    targetRect, next, prev, skip, finish,
  } = useTour();

  if (!active || !currentStep) return null;

  const isLast   = stepIdx === totalSteps - 1;
  const isFirst  = stepIdx === 0;
  const isCentre = !targetRect || currentStep.placement === 'center';

  const tooltipStyle = calcTooltipPos(
    isCentre ? null : targetRect,
    currentStep.placement ?? 'auto',
  );

  const overlay = (
    <>
      {/* ── Dark backdrop — pointer-events: none so it never blocks clicks ── */}
      {!isCentre ? (
        /* SVG with spotlight cutout */
        <svg
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            width: '100vw', height: '100vh',
            pointerEvents: 'none',   /* ← never intercepts any click */
          }}
          aria-hidden="true"
        >
          <path
            d={buildSpotlightPath(targetRect)}
            fillRule="evenodd"
            fill="rgba(5, 15, 30, 0.68)"
          />
          {/* Glowing border around spotlight cutout */}
          {targetRect && (() => {
            const x = Math.max(0, targetRect.vLeft - PAD);
            const y = Math.max(0, targetRect.vTop  - PAD);
            const w = targetRect.vRight  + PAD - x;
            const h = targetRect.vBottom + PAD - y;
            return (
              <rect
                x={x} y={y} width={w} height={h} rx={RADIUS}
                fill="none"
                stroke="rgba(77, 157, 224, 0.85)"
                strokeWidth="2.5"
              />
            );
          })()}
        </svg>
      ) : (
        /* Solid dark overlay for centred steps — NO blur */
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(5, 15, 30, 0.70)',
            pointerEvents: 'none',   /* ← never intercepts any click */
          }}
          aria-hidden="true"
        />
      )}

      {/* ── Tooltip bubble ─────────────────────────────────────── */}
      {/* NOTE: no pointer-events restriction — buttons inside must be clickable */}
      <div
        className="tour-tooltip"
        style={tooltipStyle}
        role="dialog"
        aria-modal="true"
        aria-label={`Tour step ${stepIdx + 1} of ${totalSteps}: ${currentStep.title}`}
      >
        {/* Progress bar */}
        <div className="tour-progress-bar">
          <div className="tour-progress-fill" style={{ width: `${progress * 100}%` }} />
        </div>

        {/* Header */}
        <div className="tour-header">
          <div className="tour-step-count">{stepIdx + 1} / {totalSteps}</div>
          <button
            className="tour-skip-btn"
            onClick={skip}
            aria-label="Skip tour"
            type="button"
          >
            <IcX width={12} height={12} />
          </button>
        </div>

        {/* Content */}
        <div className="tour-body">
          <div className="tour-title">{currentStep.title}</div>
          <div className="tour-text">{currentStep.body}</div>
        </div>

        {/* Dot indicators */}
        <div className="tour-dots">
          {Array.from({ length: totalSteps }, (_, i) => (
            <div
              key={i}
              className={`tour-dot${i === stepIdx ? ' active' : ''}${i < stepIdx ? ' done' : ''}`}
            />
          ))}
        </div>

        {/* Navigation */}
        <div className="tour-nav">
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={skip}
            style={{ color: 'var(--text-400)', fontSize: '.78rem' }}
          >
            Skip tour
          </button>
          <div style={{ display: 'flex', gap: 8 }}>
            {!isFirst && (
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={prev}
                aria-label="Previous step"
                style={{ minWidth: 36, justifyContent: 'center' }}
              >
                <IcArrowLeft width={13} height={13} />
              </button>
            )}
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={isLast ? finish : next}
              aria-label={isLast ? 'Finish tour' : 'Next step'}
            >
              {isLast
                ? <><IcCheckCircle width={13} height={13} /> Done</>
                : <>Next <IcArrowRight width={13} height={13} /></>}
            </button>
          </div>
        </div>

        {/* Keyboard hint */}
        <div className="tour-kbd-hint">
          <kbd>→</kbd> Next &nbsp;·&nbsp; <kbd>←</kbd> Prev &nbsp;·&nbsp; <kbd>Esc</kbd> Skip
        </div>
      </div>
    </>
  );

  return createPortal(overlay, document.body);
}
