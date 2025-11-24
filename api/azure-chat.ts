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

const resolveAzureConfig = () => {
    const endpoint = normalizeAzureEndpoint(
        process.env.AZURE_CHAT_ENDPOINT ||
            process.env.VITE_AZURE_CHAT_ENDPOINT ||
            process.env.END_POINT_TARGET_URI ||
            process.env.FOUNDRY_PROJECT_ENDPOINT ||
            process.env.AZURE_AI_SERVICES_ENDPOINT
    );
    const apiKey =
        process.env.AZURE_CHAT_KEY ||
        process.env.VITE_AZURE_CHAT_KEY ||
        process.env.END_POINT_KEY ||
        process.env.AZURE_API_KEY;
    if (!endpoint || !apiKey) return null;
    return { endpoint, apiKey };
};

export default async function handler(req: any, res: any) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const cfg = resolveAzureConfig();
    if (!cfg) {
        return res.status(500).json({ error: 'Azure chat endpoint/key not configured on server' });
    }

    const { endpoint, apiKey } = cfg;

    let payload: unknown;
    try {
        payload = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    } catch (err) {
        return res.status(400).json({ error: 'Invalid JSON body', detail: err instanceof Error ? err.message : String(err) });
    }

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

        const text = await response.text();
        try {
            const json = JSON.parse(text);
            return res.status(response.status).json(json);
        } catch {
            return res.status(response.status).send(text);
        }
    } catch (err) {
        return res.status(500).json({ error: 'Azure chat request failed', detail: err instanceof Error ? err.message : String(err) });
    }
}
