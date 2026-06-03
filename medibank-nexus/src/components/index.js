/**
 * MediBank Nexus — Component Barrel
 *
 * Import everything from here:
 *   import { Button, Badge, Modal, useToast } from '../components';
 *   import { IcHospital, IcPill } from '../components';
 */

/* ── Shared UI components ── */
export { default as Alert      } from './Alert';
export { default as Avatar     } from './Avatar';
export { default as Badge      } from './Badge';
export { default as Button     } from './Button';
export { default as Card       } from './Card';
export { default as EmptyState } from './EmptyState';
export { default as Modal      } from './Modal';
export { default as ProgressBar} from './ProgressBar';
export { default as Spinner    } from './Spinner';
export { default as StatCard   } from './StatCard';
export { default as StepsBar   } from './StepsBar';
export { default as Toggle     } from './Toggle';

/* ── Toast system ── */
export { ToastProvider, useToast } from './Toast';

/* ── Icons (re-exported for convenience) ── */
export * from './Icons';
