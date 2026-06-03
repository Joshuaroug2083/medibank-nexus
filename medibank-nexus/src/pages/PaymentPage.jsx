/**
 * PaymentPage — Paystack payment for Pro plan
 *
 * Flow:
 *   1. Hospital onboarding data passed in as `onboardingData`
 *   2. User clicks "Pay with Paystack" → Paystack inline popup opens
 *   3. On success → onPaymentSuccess(reference) called → App completes onboarding
 *   4. On close without payment → stays on page
 *
 * To go live:
 *   - Set VITE_PAYSTACK_PUBLIC_KEY in .env (pk_live_xxxxxxxx)
 *   - Create a Paystack subscription plan for Pro and set the plan code
 *     in TIER_CONFIG.pro.paystackCode
 *   - Handle the webhook at POST /api/v1/billing/paystack-webhook
 *     to verify payment and activate the hospital account
 */
import { useState, useEffect } from 'react';
import {
  IcHospital, IcShield, IcCheckCircle, IcArrowLeft,
  IcLock, IcPill, IcBarChart, IcCPU, IcPeople,
} from '../components/Icons';

const PAYSTACK_PUBLIC_KEY = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY ?? 'pk_test_xxxx';
const PRO_AMOUNT_KOBO     = 8_000_000; // ₦80,000 × 100

const PRO_FEATURES = [
  [IcPeople,  'Up to 30 staff accounts'],
  [IcPill,    'Pharmacy & Rx Queue'],
  [IcBarChart,'Analytics Dashboard'],
  [IcCPU,     'Nexus AI Assistant'],
  [IcShield,  'NDPR Compliance Reports'],
  [IcCheckCircle, 'Patient Portal & SMS Reminders'],
  [IcCheckCircle, 'Lab & Investigations'],
  [IcCheckCircle, 'Drug Formulary'],
  [IcCheckCircle, 'Priority support'],
];

function loadPaystackScript() {
  return new Promise((resolve, reject) => {
    if (window.PaystackPop) { resolve(); return; }
    const script = document.createElement('script');
    script.src = 'https://js.paystack.co/v1/inline.js';
    script.onload  = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

export default function PaymentPage({ onboardingData, onPaymentSuccess, onBack }) {
  const [loading,    setLoading]    = useState(false);
  const [scriptErr,  setScriptErr]  = useState(false);
  const [verifying,  setVerifying]  = useState(false);

  const email    = onboardingData?.adminEmail    ?? '';
  const name     = onboardingData?.name          ?? 'Your Hospital';
  const adminName= onboardingData?.adminName     ?? '';
  const phone    = onboardingData?.adminPhone    ?? '';

  useEffect(() => {
    loadPaystackScript().catch(() => setScriptErr(true));
  }, []);

  const handlePay = async () => {
    setLoading(true);
    try {
      await loadPaystackScript();
    } catch {
      setScriptErr(true);
      setLoading(false);
      return;
    }

    const ref = `NEXUS-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

    const handler = window.PaystackPop.setup({
      key:       PAYSTACK_PUBLIC_KEY,
      email,
      amount:    PRO_AMOUNT_KOBO,
      currency:  'NGN',
      ref,
      metadata: {
        custom_fields: [
          { display_name: 'Hospital',      variable_name: 'hospital',       value: name     },
          { display_name: 'Admin Name',    variable_name: 'admin_name',     value: adminName },
          { display_name: 'Phone',         variable_name: 'phone',          value: phone    },
        ],
      },
      callback: (response) => {
        /* Payment successful — reference returned */
        setVerifying(true);
        onPaymentSuccess(response.reference);
      },
      onClose: () => {
        setLoading(false);
      },
    });

    handler.openIframe();
    setLoading(false);
  };

  if (verifying) {
    return (
      <div style={{
        minHeight: '100vh', background: 'var(--bg)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
      }}>
        <div style={{ textAlign: 'center', maxWidth: 400 }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: 'var(--success-light)', border: '2px solid var(--success)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px', color: 'var(--success)',
          }}>
            <IcCheckCircle width={30} height={30} />
          </div>
          <h2 style={{ fontWeight: 900, fontSize: '1.4rem', marginBottom: 10, color: 'var(--text-900)' }}>
            Payment confirmed!
          </h2>
          <p style={{ color: 'var(--text-500)', lineHeight: 1.7 }}>
            Activating your Pro account for <strong>{name}</strong>…
          </p>
          <div style={{
            marginTop: 20, padding: '12px 18px', background: 'var(--primary-light)',
            borderRadius: 'var(--radius-lg)', fontSize: '.82rem', color: 'var(--primary)', fontWeight: 600,
          }}>
            Setting up your workspace — just a moment
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: 'var(--font)' }}>
      {/* Nav */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'white', borderBottom: '1px solid var(--border)',
        boxShadow: 'var(--shadow-sm)', padding: '0 24px', height: 58,
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <button className="btn btn-outline btn-sm" onClick={onBack} disabled={loading}>
          <IcArrowLeft width={13} height={13} /> Back
        </button>
        <div className="brand" style={{ marginLeft: 4 }}>
          <div className="brand-logo"><IcHospital width={18} height={18} /></div>
          <span className="brand-name">MediBank <span>Nexus</span></span>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, fontSize: '.76rem', color: 'var(--text-400)' }}>
          <IcLock width={12} height={12} /> Secured by Paystack
        </div>
      </nav>

      <div style={{ maxWidth: 860, margin: '0 auto', padding: '40px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{
            display: 'inline-block', padding: '4px 14px', borderRadius: 'var(--radius-full)',
            background: 'var(--primary-light)', color: 'var(--primary)',
            fontSize: '.78rem', fontWeight: 700, marginBottom: 14,
          }}>
            Pro Plan · Monthly Subscription
          </div>
          <h1 style={{ fontSize: 'clamp(1.4rem,4vw,2rem)', fontWeight: 900, color: 'var(--text-900)', marginBottom: 8 }}>
            Activate your Pro account
          </h1>
          <p style={{ color: 'var(--text-500)', fontSize: '.9rem' }}>
            Complete payment to unlock all Pro features for <strong>{name}</strong>
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr minmax(0,340px)', gap: 24 }}>

          {/* ── Left: order summary ── */}
          <div style={{ background: 'white', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border)', padding: '28px' }}>
            <div style={{ fontWeight: 800, fontSize: '.95rem', color: 'var(--text-900)', marginBottom: 20 }}>
              Order Summary
            </div>

            {/* Hospital info */}
            <div style={{
              background: 'var(--primary-light)', borderRadius: 'var(--radius-lg)',
              padding: '14px 16px', marginBottom: 20,
              display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: 'var(--radius-md)',
                background: 'var(--primary)', color: 'white',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <IcHospital width={18} height={18} />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '.9rem', color: 'var(--text-900)' }}>{name}</div>
                <div style={{ fontSize: '.75rem', color: 'var(--text-400)', marginTop: 2 }}>{email}</div>
              </div>
            </div>

            {/* Line item */}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: '.87rem', color: 'var(--text-700)' }}>Pro Plan — Monthly</span>
                <span style={{ fontWeight: 700, fontSize: '.87rem', color: 'var(--text-900)' }}>₦80,000</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: '.78rem', color: 'var(--text-400)' }}>
                <span>Billed monthly, cancel anytime</span>
                <span>NGN</span>
              </div>
              <div style={{ height: 1, background: 'var(--border)', margin: '14px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontWeight: 800, fontSize: '.95rem', color: 'var(--text-900)' }}>Total due today</span>
                <span style={{ fontWeight: 900, fontSize: '1.2rem', color: 'var(--primary)' }}>₦80,000</span>
              </div>
              <div style={{ fontSize: '.72rem', color: 'var(--text-400)', textAlign: 'right' }}>
                Auto-renews monthly · Cancel anytime
              </div>
            </div>

            {/* Features included */}
            <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
              <div style={{ fontWeight: 700, fontSize: '.8rem', color: 'var(--text-500)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '.05em' }}>
                What's included
              </div>
              {PRO_FEATURES.map(([Icon, label]) => (
                <div key={label} style={{ display: 'flex', gap: 8, marginBottom: 7, fontSize: '.82rem', color: 'var(--text-700)', alignItems: 'center' }}>
                  <Icon width={13} height={13} style={{ color: 'var(--success)', flexShrink: 0 }} />
                  {label}
                </div>
              ))}
            </div>

            {/* Error message */}
            {scriptErr && (
              <div style={{
                marginTop: 16, padding: '10px 14px',
                background: 'var(--danger-light)', borderRadius: 'var(--radius)',
                border: '1px solid var(--danger)', fontSize: '.8rem', color: 'var(--danger-dark)',
              }}>
                Could not load the Paystack payment widget. Please check your internet connection and try again.
              </div>
            )}
          </div>

          {/* ── Right: pay button + trust badges ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Pay button */}
            <div style={{ background: 'white', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border)', padding: '28px' }}>
              <div style={{ fontWeight: 800, fontSize: '.95rem', color: 'var(--text-900)', marginBottom: 6 }}>
                Payment method
              </div>
              <p style={{ fontSize: '.8rem', color: 'var(--text-400)', marginBottom: 20, lineHeight: 1.6 }}>
                Pay securely with your debit card, bank transfer, or USSD.
                Powered by Paystack — Nigeria's most trusted payment platform.
              </p>

              <button
                className="btn btn-primary btn-full"
                style={{ fontSize: '1rem', padding: '14px 20px' }}
                onClick={handlePay}
                disabled={loading || scriptErr}
              >
                {loading
                  ? 'Opening payment…'
                  : <><IcLock width={15} height={15} /> Pay ₦80,000 — Activate Pro</>
                }
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center', marginTop: 12, fontSize: '.72rem', color: 'var(--text-400)' }}>
                <IcShield width={12} height={12} />
                256-bit SSL encryption · Powered by Paystack
              </div>
            </div>

            {/* Trust badges */}
            <div style={{ background: 'white', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border)', padding: '20px' }}>
              {[
                ['30-day money-back guarantee',    IcShield,       'var(--success)'],
                ['Cancel anytime, no penalties',   IcCheckCircle,  'var(--primary)'],
                ['Instant account activation',     IcCheckCircle,  'var(--teal)'  ],
                ['NDPR & data protection compliant',IcLock,        'var(--warning)'],
              ].map(([label, Icon, color]) => (
                <div key={label} style={{ display: 'flex', gap: 10, marginBottom: 12, alignItems: 'center', fontSize: '.82rem', color: 'var(--text-700)' }}>
                  <Icon width={14} height={14} style={{ color, flexShrink: 0 }} />
                  {label}
                </div>
              ))}
            </div>

            {/* Support */}
            <div style={{
              padding: '14px 16px', background: 'var(--primary-light)',
              borderRadius: 'var(--radius-lg)', fontSize: '.78rem', color: 'var(--primary)', lineHeight: 1.6,
            }}>
              <strong>Need help?</strong> WhatsApp us at <strong>+234 800 MEDIBANK</strong> or email{' '}
              <strong>support@medibanknexus.com</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
