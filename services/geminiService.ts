import { FormData, RankedForwarder } from '../types';
import { chatWithAzure, ChatMessage, isAzureConfigured } from './azureChatService';

interface GeminiCandidate {
    content?: {
        parts?: { text?: string }[];
    };
}

interface GeminiResponse {
    candidates?: GeminiCandidate[];
}

const resolveGeminiKey = (): string | null => {
    const key =
        import.meta.env?.VITE_GEMINI_API_KEY ||
        process.env.VITE_GEMINI_API_KEY ||
        process.env.GEMINI_API_KEY;
    return key && key.trim().length > 0 ? key.trim() : null;
};

const extractText = (response: GeminiResponse): string => {
    const candidate = response.candidates?.[0];
    const parts = candidate?.content?.parts || [];
    const text = parts.map((p) => p.text || '').filter(Boolean).join(' ').trim();
    return text;
};

const buildPrompt = (rankings: RankedForwarder[], formData: FormData): string => {
    const top = rankings.slice(0, 3).map((f, idx) => `${idx + 1}. ${f.name} (score ${f.score.toFixed(2)}, $${f.avgCost.toFixed(0)}, ${f.avgTransitDays}d)`).join('\n');
    return [
        'You are Gemini providing live, vivid logistics insights.',
        'Keep responses under 120 words and avoid markdown lists.',
        'Prioritize transit resilience and surprise risks (weather, corridors, customs).',
        `Route: ${formData.origin} → ${formData.destination} | Weight: ${formData.weight}kg | Volume: ${formData.volume} cbm`,
        'Forwarder rankings:',
        top || 'No forwarder data available.',
        'Give one actionable recommendation and one watch-out for the next 72 hours.',
    ].join('\n');
};

const callGemini = async (prompt: string, apiKey: string): Promise<string> => {
    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { temperature: 0.6, maxOutputTokens: 120 },
            }),
        }
    );

    if (!response.ok) {
        const body = await response.text().catch(() => '');
        throw new Error(`Gemini responded with ${response.status}. ${body || 'No body'}`);
    }

    const data = (await response.json()) as GeminiResponse;
    const text = extractText(data);
    return text || 'Gemini responded with no content. Try again shortly.';
};

export const generateOracleInsight = async (
    rankings: RankedForwarder[],
    formData: FormData
): Promise<{ text: string; provider: 'azure' | 'gemini' | 'local' }> => {
    const prompt = buildPrompt(rankings, formData);
    const geminiKey = resolveGeminiKey();
    const messages: ChatMessage[] = [{ role: 'user', content: prompt }];

    // 1) Azure Phi-4 primary (only if configured)
    if (isAzureConfigured()) {
        try {
            const reply = await chatWithAzure(messages, 'Provide concise logistics outlook (<=120 words).');
            const fallbackPrefix = 'Azure copilot fallback';
            if (!reply.content.trim().startsWith(fallbackPrefix)) {
                return { text: reply.content, provider: 'azure' };
            }
            console.warn('Azure returned fallback text, trying Gemini instead');
        } catch (err) {
            console.warn('Azure request failed, trying Gemini fallback', err);
        }
    } else {
        console.warn('Azure not configured, trying Gemini fallback');
    }

    // 2) Gemini fallback
    if (geminiKey) {
        try {
            const text = await callGemini(prompt, geminiKey);
            return { text, provider: 'gemini' };
        } catch (err) {
            console.warn('Gemini request failed, using local heuristic', err);
        }
    }

    // 3) Local heuristic
    return {
        text: 'Live feed unavailable. Recommend a multimodal plan: split shipments between the top two forwarders and stage 48h of buffer stock near destination.',
        provider: 'local',
    };
};
