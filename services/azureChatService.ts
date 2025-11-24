import { LpiResult, LpiScenario } from '../types';

export type ChatRole = 'system' | 'user' | 'assistant';

export interface ChatMessage {
    role: ChatRole;
    content: string;
}

interface AzureChatChoice {
    message?: {
        role?: ChatRole;
        content?: unknown;
    };
    finish_reason?: string;
}

interface AzureChatResponse {
    choices?: AzureChatChoice[];
}

const normalizeAzureEndpoint = (raw?: string | null): string | null => {
    if (!raw) return null;
    const trimmed = raw.trim();
    if (!trimmed) return null;
    if (trimmed.includes('/chat/completions')) return trimmed;
    if (trimmed.endsWith('/models') || trimmed.endsWith('/models/')) {
        return `${trimmed.replace(/\/$/, '')}/chat/completions?api-version=2024-05-01-preview`;
    }
    return trimmed;
};

const SYSTEM_PROMPT = [
    'You are the MoGrid Prepositioning AI copilot.',
    'Give concise, operational answers about hazard readiness, stockpiling, and logistics.',
    'Always ground your guidance in the provided country/hazard context and suggest concrete next actions.',
].join(' ');

const LPI_SYSTEM_PROMPT = [
    'You are the Azure orchestration layer for the Logistics Prepositioning Index (LPI).',
    'Return valid JSON that matches the LpiResult type with budgetAnalysis, commodityStockpile, logisticsPlan, and planningAssumptions.',
    'Keep responses concise and operational. Always ground outputs in the provided scenario and user follow-ups.',
].join(' ');

const normalizeContent = (content: unknown): string => {
    if (typeof content === 'string') return content;
    if (Array.isArray(content)) {
        return content
            .map((part) => {
                if (typeof part === 'string') return part;
                if (part && typeof part === 'object' && 'text' in part && typeof (part as { text?: unknown }).text === 'string') {
                    return (part as { text: string }).text;
                }
                return '';
            })
            .filter(Boolean)
            .join(' ')
            .trim();
    }
    if (content && typeof content === 'object' && 'text' in content && typeof (content as { text?: unknown }).text === 'string') {
        return (content as { text: string }).text;
    }
    return '';
};

const resolveAzureConfig = () => {
    const endpoint = normalizeAzureEndpoint(
        process.env.AZURE_CHAT_ENDPOINT ||
            import.meta.env?.VITE_AZURE_CHAT_ENDPOINT ||
            import.meta.env?.END_POINT_TARGET_URI ||
            import.meta.env?.FOUNDRY_PROJECT_ENDPOINT ||
            import.meta.env?.AZURE_AI_SERVICES_ENDPOINT ||
            process.env.VITE_AZURE_CHAT_ENDPOINT ||
            process.env.END_POINT_TARGET_URI ||
            process.env.FOUNDRY_PROJECT_ENDPOINT ||
            process.env.AZURE_AI_SERVICES_ENDPOINT
    );

    const apiKey =
        process.env.AZURE_CHAT_KEY ||
        import.meta.env?.VITE_AZURE_CHAT_KEY ||
        import.meta.env?.END_POINT_KEY ||
        import.meta.env?.AZURE_API_KEY ||
        process.env.VITE_AZURE_CHAT_KEY ||
        process.env.END_POINT_KEY ||
        process.env.AZURE_API_KEY;

    if (!endpoint || !apiKey) {
        return null;
    }

    return { endpoint, apiKey };
};

const resolveAzureProxyUrl = () => {
    return import.meta.env?.VITE_AZURE_PROXY_PATH || process.env.VITE_AZURE_PROXY_PATH || process.env.AZURE_PROXY_PATH || null;
};

export const isAzureConfigured = (): boolean => {
    return Boolean(resolveAzureConfig() || resolveAzureProxyUrl());
};

const buildFallback = (messages: ChatMessage[], reason: string): ChatMessage => {
    const lastUser = [...messages].reverse().find((m) => m.role === 'user');
    const userText = lastUser?.content || 'your request';
    return {
        role: 'assistant',
        content: `Azure copilot fallback (${reason}). Based on ${userText}, recommend focusing on top routes, verify stock buffers, and monitor corridor delays.`,
    };
};

const callAzureChat = async (messages: ChatMessage[], context?: string, maxTokens = 1024): Promise<ChatMessage> => {
    const payload = {
        messages: [
            {
                role: 'system' as const,
                content: context ? `${SYSTEM_PROMPT} ${context}` : SYSTEM_PROMPT,
            },
            ...messages,
        ],
        temperature: 0.2,
        max_tokens: maxTokens,
        top_p: 0.9,
        model: 'Phi-4',
    };

    // Prefer server-side proxy (keeps keys off the client bundle)
    const proxyUrl = resolveAzureProxyUrl();
    if (proxyUrl) {
        try {
            const response = await fetch(proxyUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (response.ok) {
                const data = (await response.json()) as AzureChatResponse;
                const choice = data?.choices?.[0];
                const content = normalizeContent(choice?.message?.content);
                if (content) {
                    return { role: 'assistant', content };
                }
                return buildFallback(messages, 'empty response');
            }
        } catch (err) {
            // Fall through to direct call
            console.warn('Proxy call to Azure failed, trying direct endpoint', err);
        }
    }

    const cfg = resolveAzureConfig();
    if (!cfg) {
        return buildFallback(messages, 'missing credentials');
    }

    const { endpoint, apiKey } = cfg;

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'api-key': apiKey,
                Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const body = await response.text().catch(() => '');
            return buildFallback(messages, `upstream ${response.status}${body ? `: ${body}` : ''}`);
        }

        const data = (await response.json()) as AzureChatResponse;
        const choice = data?.choices?.[0];
        const content = normalizeContent(choice?.message?.content);

        if (!content) {
            return buildFallback(messages, 'empty response');
        }

        return {
            role: 'assistant',
            content,
        };
    } catch (err) {
        const reason = err instanceof Error ? err.message : 'network error';
        return buildFallback(messages, reason);
    }
};

export const chatWithAzure = async (messages: ChatMessage[], context?: string): Promise<ChatMessage> => {
    return callAzureChat(messages, context);
};

const parseJsonFromMessage = (content: string): LpiResult => {
    const start = content.indexOf('{');
    const end = content.lastIndexOf('}');
    if (start === -1 || end === -1 || end <= start) {
        throw new Error('Azure response did not contain JSON payload.');
    }

    const jsonText = content.slice(start, end + 1);
    return JSON.parse(jsonText) as LpiResult;
};

const buildLpiUserPrompt = (scenario: LpiScenario, instruction?: string): string => {
    return [
        `Country: ${scenario.country} (${scenario.region})`,
        `Disease: ${scenario.disease} | Severity: ${scenario.severity}`,
        `Population at risk: ${scenario.population} (${scenario.vulnerabilityGroup})`,
        `Season: ${scenario.season} | Infrastructure: ${scenario.infrastructure} | Capacity: ${scenario.localCapacity}`,
        'Return a JSON object that matches LpiResult with:',
        '- changeSummary, executiveSummary',
        '- riskAssessment { riskLevel, reproductionNumberR0, projectedSpreadRadiusKm }',
        '- logisticsConstraints[], planningAssumptions[]',
        '- commodityStockpile[{ category, items[{ commodityName, quantity, unit }] }]',
        '- logisticsPlan { prepositioningHub, totalWeightKg, totalVolumeCbm, transportMode, estimatedLeadTimeDays }',
        '- budgetAnalysis { totalCostUSD, breakdown[{ pillar, estimatedCostUSD }] }',
        '- keyInterventions[]',
        instruction ? `User request: ${instruction}` : 'Generate a fresh plan.',
    ].join('\n');
};

export const generateLpiPlanWithAzure = async (
    scenario: LpiScenario
): Promise<{ result: LpiResult; messages: ChatMessage[] }> => {
    const userPrompt = buildLpiUserPrompt(scenario);
    const messages: ChatMessage[] = [{ role: 'user', content: userPrompt }];
    const assistant = await callAzureChat(messages, LPI_SYSTEM_PROMPT, 1536);
    const result = parseJsonFromMessage(assistant.content);

    return { result, messages: [...messages, assistant] };
};

export const refineLpiPlanWithAzure = async (
    scenario: LpiScenario,
    userMessage: string,
    history: ChatMessage[]
): Promise<{ result: LpiResult; messages: ChatMessage[] }> => {
    const prompt = buildLpiUserPrompt(scenario, userMessage);
    const messages: ChatMessage[] = [...history.filter((m) => m.role !== 'system'), { role: 'user', content: prompt }];
    const assistant = await callAzureChat(messages, LPI_SYSTEM_PROMPT, 1536);
    const result = parseJsonFromMessage(assistant.content);
    return { result, messages: [...messages, assistant] };
};
