/**
 * TabSubscription — Admin > Subscription & Billing
 *
 * Shows current plan, trial countdown, staff usage,
 * in-app upgrade to Pro via Paystack, and payment history.
 */
import { useState, useEffect, useCallback } from 'react';
import { useAuth }    from '../../context/AuthContext';
import { apiFetch }   from '../../context/AuthContext';
import {
  IcShield, IcCheckCircle, IcWarning, IcStar,
  IcPeople, IcArrowRight, IcLock,
} from '../../components/Icons';

const PAYSTACK_KEY = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY ?? 'pk_test_xxxx';

function loadPaystack() {
  return new Promise((resolve, reject) => {
    if (window.PaystackPop) { resolve(); return; }
    const s = document.createElement('script');
    s.src     = 'https://js.paystack.co/v1/inline.js';
    s.onload  = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

const TIER_META = {
  free_trial: { label: 'Free Trial', color: 'var(--warning)',  bg: 'var(--warning-light)', icon: IcStar     },
  pro:        { label: 'Pro',        color: 'var(--primary)',  bg: 'var(--primary-light)', icon: IcShield   },
  custom:     { label: 'Custom',     color: 'var(--teal)',     bg: 'var(--teal-light)',    icon: IcCheckCircle },
  past_due:   { label: 'Past Due',   color: 'var(--danger)',   bg: 'var(--danger-light)',  icon: IcWarning  },
};

const STAFF_LIMITS = { free_trial: 5, pro: 30, custom: null };

export default function TabSubscription() {
  const { user }           = useAuth();
  const [sub,     setSub]  = useState(null);
  const [loading, setLoad] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const [upgraded,  setUpgraded]  = useState(false);
  const [error,   setError] = useState('');

  const fetchSub = useCallback(async () => {
    setLoad(true);
    try {
      const res  = await apiFetch('/api/v1/billing/subscription');
      if (res.ok) {
        const data = await res.json();
        setSub(data.subscription);
      }
    } catch {
      /* API not running — show mock data */
      setSub({
        tier:       user?.hospital?.tier ?? 'free_trial',
        status:     'trial',
        staffCount: 3,
      });
    } finally {
      setLoad(false);
    }
  }, [user]);

  useEffect(() => { fetchSub(); }, [fetchSub]);

  const handleUpgrade = async () => {
    setUpgrading(true);
    setError('');
    try {
      await loadPaystack();
    } catch {
      setError('Could not load payment widget. Check your internet connection.');
      setUpgrading(false);
      return;
    }

    try {
      /* Get a payment reference from the API */
      const res  = await apiFetch('/api/v1/billing/subscription/upgrade', { method: 'POST' });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Failed to initiate upgrade');
        setUpgrading(false);
        return;
      }

      const handler = window.PaystackPop.setup({
        key:       data.paystackKey ?? PAYSTACK_KEY,
        email:     data.email,
        amount:    data.amount,
        currency:  'NGN',
        ref:       data.reference,
        metadata:  data.metadata,
        callback:  () => {
          /* Webhook will activate the account; poll for confirmation */
          setUpgraded(true);
          setTimeout(() => fetchSub(), 3000);
        },
        onClose: () => setUpgrading(false),
      });

      handler.openIframe();
    } catch {
      setError('Network error. Please try again.');
      setUpgrading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-400)' }}>
        Loading subscription…
      </div>
    );
  }

  const tier      = sub?.tier ?? 'free_trial';
  const meta      = TIER_META[tier] ?? TIER_META.free_trial;
  const TierIcon  = meta.icon;
  const staffMax  = STAFF_LIMITS[tier];
  const staffUsed = sub?.staffCount ?? 0;
  const staffPct  = staffMax ? Math.min(100, Math.round((staffUsed / staffMax) * 100)) : 0;

  let daysLeft = null;
  if (sub?.trialEndDate) {
    daysLeft = Math.max(0, Math.ceil((new Date(sub.trialEndDate) - Date.now()) / 86_400_000));
  }

  return (
    <div style={{ maxWidth: 680 }}>
      <h3 style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-900)', marginBottom: 20 }}>
        Subscription & Billing
      </h3>

      {/* ── Current Plan Card ── */}
      <div style={{
        background: 'white', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)',
        padding: '24px', marginBottom: 20,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 'var(--radius-lg)',
            background: meta.bg, color: meta.color,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <TierIcon width={22} height={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-900)' }}>
                {meta.label} Plan
              </span>
              <span style={{
                fontSize: '.72rem', fontWeight: 700, padding: '2px 8px',
                borderRadius: 'var(--radius-full)', background: meta.bg, color: meta.color,
              }}>
                {sub?.status?.toUpperCase() ?? 'ACTIVE'}
              </span>
            </div>
            <div style={{ fontSize: '.8rem', color: 'var(--text-400)', marginTop: 2 }}>
              {tier === 'free_trial' && 'Limited to 5 staff · 30-day trial'}
              {tier === 'pro'        && '₦80,000/month · Up to 30 staff'}
              {tier === 'custom'     && 'Custom plan · Unlimited staff'}
            </div>
          </div>
          {tier === 'pro' && (
            <div style={{ marginLeft: 'auto', fontSize: '.82rem', fontWeight: 700, color: 'var(--success)' }}>
              <IcCheckCircle width={14} height={14} style={{ marginRight: 4 }} />
              Active
            </div>
          )}
        </div>

        {/* Trial countdown */}
        {tier === 'free_trial' && daysLeft !== null && (
          <div style={{
            padding: '12px 16px', borderRadius: 'var(--radius-lg)', marginBottom: 16,
            background: daysLeft <= 7 ? 'var(--danger-light)' : 'var(--warning-light)',
            border: `1px solid ${daysLeft <= 7 ? 'var(--danger)' : 'var(--warning)'}`,
            fontSize: '.84rem', color: daysLeft <= 7 ? 'var(--danger-dark)' : 'var(--warning-dark)',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <IcWarning width={15} height={15} />
            {daysLeft > 0
              ? <><strong>{daysLeft} days</strong> remaining in your free trial</>
              : <><strong>Trial expired.</strong> Upgrade to Pro to continue.</>
            }
          </div>
        )}

        {/* Staff usage */}
        <div style={{ marginBottom: staffMax ? 16 : 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.82rem', color: 'var(--text-600)', marginBottom: 6 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <IcPeople width={13} height={13} /> Staff accounts used
            </span>
            <span style={{ fontWeight: 700, color: 'var(--text-900)' }}>
              {staffUsed} {staffMax ? `/ ${staffMax}` : '(unlimited)'}
            </span>
          </div>
          {staffMax && (
            <div style={{ height: 6, background: 'var(--border)', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${staffPct}%`,
                background: staffPct >= 90 ? 'var(--danger)' : staffPct >= 70 ? 'var(--warning)' : 'var(--primary)',
                borderRadius: 4,
                transition: 'width .4s',
              }} />
            </div>
          )}
        </div>

        {/* Last payment */}
        {sub?.lastPayment && (
          <div style={{
            marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)',
            fontSize: '.8rem', color: 'var(--text-400)',
          }}>
            Last payment: <strong>₦{(sub.lastPayment.amount / 100).toLocaleString()}</strong>
            {' '}&mdash;{' '}
            {new Date(sub.lastPayment.paid_at).toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' })}
          </div>
        )}
      </div>

      {/* ── Upgrade to Pro (only shown on free_trial) ── */}
      {(tier === 'free_trial' || tier === 'past_due') && !upgraded && (
        <div style={{
          background: 'white', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)',
          padding: '24px', marginBottom: 20,
        }}>
          <div style={{ fontWeight: 800, fontSize: '.95rem', color: 'var(--text-900)', marginBottom: 8 }}>
            Upgrade to Pro
          </div>
          <p style={{ fontSize: '.84rem', color: 'var(--text-500)', lineHeight: 1.6, marginBottom: 16 }}>
            Unlock all features, up to 30 staff accounts, analytics, pharmacy, Nexus AI, and priority support.
            <strong> ₦80,000/month</strong> — cancel anytime.
          </p>

          {error && (
            <div style={{ padding: '10px 14px', background: 'var(--danger-light)', border: '1px solid var(--danger)', borderRadius: 'var(--radius)', fontSize: '.82rem', color: 'var(--danger-dark)', marginBottom: 14 }}>
              <IcWarning width={13} height={13} style={{ marginRight: 6 }} />{error}
            </div>
          )}

          <button
            className="btn btn-primary"
            onClick={handleUpgrade}
            disabled={upgrading}
            style={{ fontSize: '.9rem', padding: '11px 22px' }}
          >
            {upgrading
              ? <><div className="btn-spinner" /> Opening payment…</>
              : <><IcLock width={14} height={14} /> Pay ₦80,000 — Activate Pro <IcArrowRight width={13} height={13} /></>
            }
          </button>

          <div style={{ marginTop: 10, fontSize: '.72rem', color: 'var(--text-400)', display: 'flex', alignItems: 'center', gap: 5 }}>
            <IcShield width={11} height={11} /> Secured by Paystack · 256-bit SSL
          </div>
        </div>
      )}

      {/* ── Upgrade confirmed ── */}
      {upgraded && (
        <div style={{
          background: 'var(--success-light)', border: '1px solid var(--success)',
          borderRadius: 'var(--radius-xl)', padding: '20px 24px',
          display: 'flex', gap: 12, alignItems: 'center', marginBottom: 20,
        }}>
          <IcCheckCircle width={22} height={22} style={{ color: 'var(--success)', flexShrink: 0 }} />
          <div>
            <div style={{ fontWeight: 700, fontSize: '.9rem', color: 'var(--success-dark)' }}>
              Payment received — activating your Pro account
            </div>
            <div style={{ fontSize: '.8rem', color: 'var(--success-dark)', marginTop: 2 }}>
              Your plan will update within a few seconds. Refresh if it doesn't change.
            </div>
          </div>
        </div>
      )}

      {/* ── Pro plan features summary ── */}
      {tier !== 'free_trial' && tier !== 'past_due' && (
        <div style={{
          background: 'white', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)',
          padding: '20px 24px',
        }}>
          <div style={{ fontWeight: 700, fontSize: '.84rem', color: 'var(--text-500)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 12 }}>
            Your plan includes
          </div>
          {[
            'Up to 30 staff accounts',
            'Full pharmacy & Rx Queue',
            'Analytics Dashboard',
            'Nexus AI Assistant',
            'NDPR Compliance Reports',
            'Patient Portal & SMS Reminders',
            'Lab & Investigations module',
            'Drug Formulary',
            'Priority support',
          ].map(f => (
            <div key={f} style={{ display: 'flex', gap: 8, fontSize: '.83rem', color: 'var(--text-700)', marginBottom: 7 }}>
              <IcCheckCircle width={13} height={13} style={{ color: 'var(--success)', flexShrink: 0, marginTop: 1 }} />
              {f}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
