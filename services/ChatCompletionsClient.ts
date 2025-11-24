import { ChatMessage } from './azureChatService';

interface ChatCompletionChoice {
    message?: {
        role?: ChatMessage['role'];
        content?: unknown;
    };
}

interface ChatCompletionResponse {
    choices?: ChatCompletionChoice[];
}

export interface ChatCompletionOptions {
    model?: string;
    max_tokens?: number;
    temperature?: number;
    top_p?: number;
    presence_penalty?: number;
    frequency_penalty?: number;
    stream?: boolean;
}

/**
 * Lightweight client for Azure AI Inference chat completions using fetch.
 * Mirrors the REST samples shown in the deployment page.
 */
export class ChatCompletionsClient {
    private readonly endpoint: string;
    private readonly apiKey: string;

    constructor(endpoint: string, apiKey: string) {
        this.endpoint = endpoint;
        this.apiKey = apiKey;
    }

    async complete(messages: ChatMessage[], options: ChatCompletionOptions = {}): Promise<string> {
        const payload = {
            messages,
            model: options.model ?? 'Phi-4',
            max_tokens: options.max_tokens ?? 1024,
            temperature: options.temperature ?? 0.3,
            top_p: options.top_p ?? 0.9,
            presence_penalty: options.presence_penalty ?? 0,
            frequency_penalty: options.frequency_penalty ?? 0,
            stream: options.stream ?? false,
        };

        const response = await fetch(this.endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'api-key': this.apiKey,
                Authorization: `Bearer ${this.apiKey}`,
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const body = await response.text().catch(() => '');
            throw new Error(`Azure chat returned ${response.status}. ${body || 'No response body.'}`);
        }

        const data = (await response.json()) as ChatCompletionResponse;
        const choice = data.choices?.[0];
        const content = extractContent(choice?.message?.content);
        if (!content) {
            throw new Error('Azure chat returned empty content.');
        }
        return content;
    }
}

const extractContent = (content: unknown): string => {
    if (typeof content === 'string') return content;
    if (Array.isArray(content)) {
        return content
            .map((c) => (typeof c === 'string' ? c : ''))
            .filter(Boolean)
            .join(' ')
            .trim();
    }
    if (content && typeof content === 'object' && 'text' in content && typeof (content as { text?: unknown }).text === 'string') {
        return (content as { text: string }).text;
    }
    return '';
};

export const getAzureClientFromEnv = (): ChatCompletionsClient | null => {
    const endpoint =
        import.meta.env?.VITE_AZURE_CHAT_ENDPOINT ||
        import.meta.env?.END_POINT_TARGET_URI ||
        import.meta.env?.AZURE_AI_SERVICES_ENDPOINT ||
        process.env.VITE_AZURE_CHAT_ENDPOINT ||
        process.env.END_POINT_TARGET_URI ||
        process.env.AZURE_AI_SERVICES_ENDPOINT;

    const apiKey =
        import.meta.env?.VITE_AZURE_CHAT_KEY ||
        import.meta.env?.END_POINT_KEY ||
        import.meta.env?.AZURE_API_KEY ||
        process.env.VITE_AZURE_CHAT_KEY ||
        process.env.END_POINT_KEY ||
        process.env.AZURE_API_KEY;

    if (!endpoint || !apiKey) return null;
    return new ChatCompletionsClient(endpoint, apiKey);
};
