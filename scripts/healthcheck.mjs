#!/usr/bin/env node
import { config as loadEnv } from 'dotenv';

// Load base .env then override with .env.local when present
loadEnv();
loadEnv({ path: '.env.local', override: true });

const args = new Set(process.argv.slice(2));
const runLive = args.has('--live');
const timeoutMs = 7000;

const env = process.env;
const normalizeAzureEndpoint = (raw) => {
    if (!raw) return null;
    const trimmed = raw.trim();
    if (!trimmed) return null;
    if (trimmed.includes('/chat/completions')) return trimmed;
    if (trimmed.endsWith('/models') || trimmed.endsWith('/models/')) {
        return `${trimmed.replace(/\/$/, '')}/chat/completions?api-version=2024-05-01-preview`;
    }
    return trimmed;
};

const azureEndpoint = normalizeAzureEndpoint(
    env.AZURE_CHAT_ENDPOINT ||
        env.VITE_AZURE_CHAT_ENDPOINT ||
        env.END_POINT_TARGET_URI ||
        env.FOUNDRY_PROJECT_ENDPOINT ||
        env.AZURE_AI_SERVICES_ENDPOINT
);
const azureKey = env.AZURE_CHAT_KEY || env.VITE_AZURE_CHAT_KEY || env.END_POINT_KEY || env.AZURE_API_KEY;
const geminiKey = env.VITE_GEMINI_API_KEY || env.GEMINI_API_KEY || env.GOOGLE_API_KEY || env.GEMINI_API_KEY;

const statuses = [];

const symbols = {
    ok: '[OK]   ',
    warn: '[WARN] ',
    error: '[FAIL] ',
};

const logStatus = (name, status, detail) => {
    statuses.push({ name, status, detail });
    console.log(`${symbols[status]}${name}: ${detail}`);
};

const withTimeout = async (fn) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
        return await fn(controller);
    } finally {
        clearTimeout(timer);
    }
};

const extractAzureContent = (data) => {
    const choice = data?.choices?.[0];
    const content = choice?.message?.content;
    if (typeof content === 'string') return content;
    if (Array.isArray(content)) {
        return content
            .map((part) => {
                if (typeof part === 'string') return part;
                if (part && typeof part === 'object' && 'text' in part && typeof part.text === 'string') {
                    return part.text;
                }
                return '';
            })
            .filter(Boolean)
            .join(' ')
            .trim();
    }
    if (content && typeof content === 'object' && 'text' in content && typeof content.text === 'string') {
        return content.text;
    }
    return '';
};

const pingAzure = async () => {
    const payload = {
        messages: [
            { role: 'system', content: 'You are performing a health check. Respond briefly.' },
            { role: 'user', content: 'Confirm Azure chat online.' },
        ],
        temperature: 0,
        max_tokens: 24,
        model: 'Phi-4',
    };

    const response = await withTimeout((controller) =>
        fetch(azureEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'api-key': azureKey,
                Authorization: `Bearer ${azureKey}`,
            },
            body: JSON.stringify(payload),
            signal: controller.signal,
        })
    );

    if (!response.ok) {
        const body = await response.text().catch(() => '');
        throw new Error(`HTTP ${response.status}${body ? `: ${body.slice(0, 140)}` : ''}`);
    }

    const data = await response.json().catch(() => ({}));
    const text = extractAzureContent(data);
    return text || 'Received empty content.';
};

const pingGemini = async () => {
    const response = await withTimeout((controller) =>
        fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: 'Health check: reply with "online".' }] }],
                generationConfig: { temperature: 0, maxOutputTokens: 6 },
            }),
            signal: controller.signal,
        })
    );

    if (!response.ok) {
        const body = await response.text().catch(() => '');
        throw new Error(`HTTP ${response.status}${body ? `: ${body.slice(0, 140)}` : ''}`);
    }

    const data = await response.json().catch(() => ({}));
    const candidate = data?.candidates?.[0];
    const text = candidate?.content?.parts?.map((p) => p.text || '').filter(Boolean).join(' ').trim();
    return text || 'Received empty content.';
};

const main = async () => {
    console.log('--- DeepCAL service preflight ---');

    const azureConfigured = Boolean(azureEndpoint && azureKey);
    const geminiConfigured = Boolean(geminiKey);

    logStatus(
        'Azure Chat config',
        azureConfigured ? 'ok' : 'error',
        azureConfigured ? 'Endpoint and key present' : 'Missing endpoint/key (chatbot + LPI will fallback)'
    );
    logStatus(
        'Gemini config',
        geminiConfigured ? 'ok' : 'warn',
        geminiConfigured ? 'Key present' : 'Not configured (Azure/local only)'
    );

    if (runLive && azureConfigured) {
        try {
            const reply = await pingAzure();
            logStatus('Azure live test', 'ok', `Responded: ${reply.slice(0, 80)}`);
        } catch (err) {
            logStatus('Azure live test', 'error', err instanceof Error ? err.message : 'Unknown error');
        }
    } else if (runLive) {
        logStatus('Azure live test', 'warn', 'Skipped (missing credentials)');
    }

    if (runLive && geminiConfigured) {
        try {
            const reply = await pingGemini();
            logStatus('Gemini live test', 'ok', `Responded: ${reply.slice(0, 80)}`);
        } catch (err) {
            logStatus('Gemini live test', 'error', err instanceof Error ? err.message : 'Unknown error');
        }
    } else if (runLive) {
        logStatus('Gemini live test', 'warn', 'Skipped (missing credentials)');
    }

    const hasError = statuses.some((s) => s.status === 'error');
    if (hasError) {
        console.log('Preflight failed. Fix the errors above before deploying to Vercel.');
        process.exit(1);
    }

    console.log('Preflight passed. Engines are ready for Vercel deploy.');
};

main().catch((err) => {
    console.error('Preflight crashed', err);
    process.exit(1);
});
