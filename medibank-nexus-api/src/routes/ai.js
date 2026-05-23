/**
 * AI Routes — Multi-provider proxy
 *
 * Supports Claude (Anthropic), GPT-4o (OpenAI), and Gemini (Google).
 * Model selection is per-request (from user's clinical preferences).
 * API keys: uses user's stored key if available, falls back to platform key.
 * All keys are decrypted server-side — never sent to the client.
 */
import { Router }  from 'express';
import authenticate from '../middleware/auth.js';
import { audit }    from '../middleware/audit.js';
import { decrypt }  from '../security/encryption.js';
import db           from '../db.js';

const router = Router();
router.use(authenticate);

/* ── API endpoints ─────────────────────────────────────────── */
const ENDPOINTS = {
  anthropic: 'https://api.anthropic.com/v1/messages',
  openai:    'https://api.openai.com/v1/chat/completions',
  google:    'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent',
};

/* Map frontend model keys → provider + model ID */
const MODEL_MAP = {
  claude: { provider: 'anthropic', modelId: 'claude-sonnet-4-5'        },
  gpt4:   { provider: 'openai',    modelId: 'gpt-4o'                   },
  gemini: { provider: 'google',    modelId: 'gemini-1.5-pro'           },
};

/* Resolve the best available provider when the requested one has no key */
function resolveFallback(requestedProvider) {
  const priority = ['google', 'anthropic', 'openai'];
  const envMap = {
    anthropic: process.env.ANTHROPIC_API_KEY,
    openai:    process.env.OPENAI_API_KEY,
    google:    process.env.GOOGLE_AI_API_KEY,
  };
  // Try requested first, then priority order
  const order = [requestedProvider, ...priority.filter(p => p !== requestedProvider)];
  for (const p of order) {
    if (envMap[p]) return { provider: p, apiKey: envMap[p] };
  }
  return null;
}

/* ── Role-scoped system prompt ─────────────────────────────── */
function systemPrompt(role) {
  return `You are Nexus AI, an intelligent medical assistant embedded in MediBank Nexus — a Nigerian hospital documentation and management platform. The current user is a ${role}.

Guidelines:
- Respond helpfully and concisely (2–4 sentences max unless a longer response is clearly needed).
- Use clinically accurate, role-appropriate language.
- Never fabricate patient data, drug names, or dosages you are not certain about.
- Always recommend verifying critical clinical information with official sources.
- For Nigerian context: use local drug brand names where relevant, reference NHIS, MDCN guidelines.`;
}

/* ── Get user's stored API key for a provider ─────────────── */
async function getUserApiKey(userId, hospitalId, provider) {
  try {
    const row = await db('user_integrations')
      .where({ user_id: userId, hospital_id: hospitalId, provider })
      .first();
    if (!row?.access_token) return null;
    return decrypt(row.access_token);
  } catch {
    return null;
  }
}

/* ── Call Anthropic ─────────────────────────────────────────── */
async function callAnthropic(apiKey, modelId, systemText, messages, maxTokens) {
  const res = await fetch(ENDPOINTS.anthropic, {
    method: 'POST',
    headers: {
      'Content-Type':      'application/json',
      'x-api-key':         apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model:      modelId,
      max_tokens: maxTokens,
      system:     systemText,
      messages,
    }),
  });
  const data = await res.json();
  if (!res.ok) throw Object.assign(new Error(data.error?.message ?? 'Anthropic error'), { status: res.status });
  return data.content?.[0]?.text ?? '';
}

/* ── Call OpenAI ────────────────────────────────────────────── */
async function callOpenAI(apiKey, modelId, systemText, messages, maxTokens) {
  /* Convert Anthropic-style messages to OpenAI format */
  const oaiMessages = [
    { role: 'system', content: systemText },
    ...messages.map(m => ({ role: m.role, content: m.content })),
  ];

  const res = await fetch(ENDPOINTS.openai, {
    method: 'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model:      modelId,
      max_tokens: maxTokens,
      messages:   oaiMessages,
    }),
  });
  const data = await res.json();
  if (!res.ok) throw Object.assign(new Error(data.error?.message ?? 'OpenAI error'), { status: res.status });
  return data.choices?.[0]?.message?.content ?? '';
}

/* ── Call Google Gemini ─────────────────────────────────────── */
async function callGemini(apiKey, systemText, messages, maxTokens) {
  /* Gemini uses a different message format */
  const contents = messages.map(m => ({
    role:  m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  const url = `${ENDPOINTS.google}?key=${apiKey}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: systemText }] },
      contents,
      generationConfig:   { maxOutputTokens: maxTokens },
    }),
  });
  const data = await res.json();
  if (!res.ok) throw Object.assign(new Error(data.error?.message ?? 'Gemini error'), { status: res.status });
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
}

/* ════════════════════════════════════════════════════════════
   POST /api/v1/ai/message
   Body: { messages, model?, systemOverride?, maxTokens? }
════════════════════════════════════════════════════════════ */
router.post('/message', async (req, res, next) => {
  try {
    const { messages, model, systemOverride, maxTokens = 400 } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'messages array is required' });
    }

    /* Resolve provider + model */
    const { provider, modelId } = MODEL_MAP[model] ?? MODEL_MAP.claude;

    /* Get API key: user key → platform key → fallback to any available provider */
    let apiKey = await getUserApiKey(req.user.id, req.hospitalId, provider);
    let activeProvider = provider;
    let activeModelId  = modelId;

    if (!apiKey) {
      const fallback = resolveFallback(provider);
      if (!fallback) {
        return res.status(503).json({ error: 'AI service is not configured. Please contact your administrator.' });
      }
      apiKey         = fallback.apiKey;
      activeProvider = fallback.provider;
      // Update modelId to match the fallback provider
      const fallbackEntry = Object.values(MODEL_MAP).find(m => m.provider === activeProvider);
      activeModelId = fallbackEntry?.modelId ?? modelId;
    }

    const sysPrompt = systemOverride ?? systemPrompt(req.user.role);
    let reply;

    switch (activeProvider) {
      case 'openai':
        reply = await callOpenAI(apiKey, activeModelId, sysPrompt, messages, maxTokens);
        break;
      case 'google':
        reply = await callGemini(apiKey, sysPrompt, messages, maxTokens);
        break;
      default:
        reply = await callAnthropic(apiKey, activeModelId, sysPrompt, messages, maxTokens);
    }

    audit({ userId: req.user.id, hospitalId: req.hospitalId, action: 'ai_query', entity: 'ai' });

    /* Return in Anthropic-compatible format so the frontend works regardless of provider */
    return res.json({
      content: [{ type: 'text', text: reply }],
      model:   activeModelId,
      provider: activeProvider,
    });

  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    next(err);
  }
});

/* ════════════════════════════════════════════════════════════
   POST /api/v1/ai/summarize-visit
════════════════════════════════════════════════════════════ */
router.post('/summarize-visit', async (req, res, next) => {
  try {
    /* Accept both { visit: {...} } (legacy) and flat payload from ConsultationPage */
    const payload = req.body.visit ?? req.body;
    const { model } = req.body;

    const { provider: reqProvider, modelId: reqModelId } = MODEL_MAP[model] ?? MODEL_MAP.gemini;
    let apiKey = await getUserApiKey(req.user.id, req.hospitalId, reqProvider);
    let activeProvider = reqProvider;
    let modelId        = reqModelId;

    if (!apiKey) {
      const fallback = resolveFallback(reqProvider);
      if (!fallback) return res.status(503).json({ error: 'AI service not configured.' });
      apiKey         = fallback.apiKey;
      activeProvider = fallback.provider;
      const fe = Object.values(MODEL_MAP).find(m => m.provider === activeProvider);
      modelId = fe?.modelId ?? reqModelId;
    }

    const vitals = payload.vitals ?? {};
    const rxLines = Array.isArray(payload.prescriptions) && payload.prescriptions.length
      ? payload.prescriptions.map(r => `  - ${r.drug} ${r.dose ?? ''}, ${r.frequency ?? ''}, for ${r.duration ?? ''} (${r.route ?? 'Oral'})${r.notes ? '. Note: ' + r.notes : ''}`).join('\n')
      : '  None';

    const prompt = `You are an AI clinical assistant. Generate a concise SOAP-format clinical visit note from the data below.

Patient: ${payload.patientName ?? payload.name ?? 'Unknown'}, ${payload.age ?? '?'}y ${payload.gender ?? ''}, Blood Group: ${payload.bloodGroup ?? '--'}, Genotype: ${payload.genotype ?? '--'}
Known Allergies: ${(payload.allergies ?? []).join(', ') || 'None'}
Existing Conditions: ${(payload.conditions ?? []).join(', ') || 'None'}
Current Medications: ${(payload.medications ?? []).join(', ') || 'None'}

Vitals: BP ${vitals.bp ?? payload.bp ?? '--'} mmHg, Pulse ${vitals.pulse ?? payload.pulse ?? '--'} bpm, Temp ${vitals.temp ?? payload.temp ?? '--'}°C, SpO₂ ${vitals.spo2 ?? payload.spo2 ?? '--'}%, RR ${vitals.rr ?? payload.rr ?? '--'}/min

Chief Complaint: ${payload.chief ?? 'N/A'}
History of Presenting Illness: ${payload.hpi ?? 'N/A'}
Assessment / Diagnosis: ${payload.diagnosis ?? 'N/A'}
Plan: ${payload.plan ?? 'N/A'}

Prescriptions:
${rxLines}

Generate a professional SOAP note (Subjective, Objective, Assessment, Plan). Be concise and medically accurate. Flag any abnormal vitals. Suitable for a Nigerian hospital EMR.`;

    const sysText = 'You are a medical scribe. Generate concise, professional SOAP-format clinical summaries for Nigerian hospital records. Write in third person, past tense. Be brief and accurate.';
    let summary;

    switch (activeProvider) {
      case 'openai':
        summary = await callOpenAI(apiKey, modelId, sysText, [{ role: 'user', content: prompt }], 600);
        break;
      case 'google':
        summary = await callGemini(apiKey, sysText, [{ role: 'user', content: prompt }], 600);
        break;
      default:
        summary = await callAnthropic(apiKey, modelId, sysText, [{ role: 'user', content: prompt }], 600);
    }

    /* Return in both formats for compatibility */
    return res.json({
      summary,
      content: [{ type: 'text', text: summary }],
    });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    next(err);
  }
});

export default router;
