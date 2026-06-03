/**
 * StepsBar — animated wizard step indicator
 *
 * Usage:
 *   const STEPS = ['Personal Info', 'Medical', 'Emergency', 'Insurance', 'Review'];
 *
 *   <StepsBar steps={STEPS} current={2} />
 *   // current=0 → first step active, none done
 *   // current=2 → steps 0,1 done, step 2 active
 */

import { IcCheck } from './Icons';

export default function StepsBar({ steps = [], current = 0 }) {
  return (
    <div className="steps-bar" role="list" aria-label="Progress">
      {steps.map((label, i) => {
        const isDone   = i < current;
        const isActive = i === current;

        return (
          <div
            key={label}
            className={`step-item${isDone ? ' done' : isActive ? ' active' : ''}`}
            role="listitem"
            aria-current={isActive ? 'step' : undefined}
          >
            {/* Circle + label */}
            <div className="step-body">
              <div className={`step-circle${isDone ? ' done' : isActive ? ' active' : ''}`}>
                {isDone
                  ? <IcCheck width={13} height={13} />
                  : <span>{i + 1}</span>
                }
              </div>
              <div className="step-label">{label}</div>
            </div>

            {/* Connector line (not after last step) */}
            {i < steps.length - 1 && (
              <div className={`step-connector${isDone ? ' done' : ''}`} aria-hidden="true" />
            )}
          </div>
        );
      })}
    </div>
  );
}
