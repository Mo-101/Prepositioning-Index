import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChatMessage, chatWithAzure, isAzureConfigured } from '../services/azureChatService';

const FloatingChatbot: React.FC = () => {
    const [open, setOpen] = useState(false);
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            role: 'assistant',
            content: 'Hi, I am your Azure copilot. Ask me anything about routes, risks, or stock.',
        },
    ]);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState('');
    const listRef = useRef<HTMLDivElement>(null);
    const azureReady = useMemo(() => isAzureConfigured(), []);

    useEffect(() => {
        if (listRef.current) {
            listRef.current.scrollTop = listRef.current.scrollHeight;
        }
    }, [messages, sending, open]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = input.trim();
        if (!trimmed || sending) return;

        const userMessage: ChatMessage = { role: 'user', content: trimmed };
        const nextMessages = [...messages, userMessage];
        setMessages(nextMessages);
        setInput('');
        setSending(true);
        setError('');

        try {
            const reply = await chatWithAzure(nextMessages, 'Act as the logistics and preparedness copilot. Keep replies under 120 words.');
            setMessages([...nextMessages, reply]);
        } catch (err) {
            console.error('Azure chat error', err);
            setError('Azure AI is unavailable. Try again shortly.');
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end space-y-3">
            {open && (
                <div className="w-80 sm:w-96 bg-slate-900 border border-purple-500/30 rounded-2xl shadow-2xl overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 bg-slate-800/80 border-b border-purple-500/30">
                        <div>
                            <div className="text-sm font-semibold text-white">Azure Copilot</div>
                            <div className="text-xs text-slate-400">Operational Q&A and quick guidance</div>
                        </div>
                        <button
                            onClick={() => setOpen(false)}
                            className="text-slate-300 hover:text-white transition-colors"
                            aria-label="Close chatbot"
                        >
                            <i className="fas fa-times"></i>
                        </button>
                    </div>

                    {!azureReady && (
                        <div className="px-4 py-2 text-xs text-yellow-200 bg-yellow-900/30 border-b border-yellow-700/40">
                            Azure credentials not detected; responses will use the offline fallback. Set VITE_AZURE_CHAT_ENDPOINT and VITE_AZURE_CHAT_KEY for live answers.
                        </div>
                    )}

                    <div ref={listRef} className="max-h-80 overflow-y-auto px-4 py-3 space-y-3 bg-slate-900/70">
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div
                                    className={`px-3 py-2 rounded-xl text-sm shadow ${msg.role === 'user'
                                        ? 'bg-purple-600 text-white rounded-br-none'
                                        : 'bg-slate-800 text-slate-100 rounded-bl-none'
                                    }`}
                                >
                                    {msg.content}
                                </div>
                            </div>
                        ))}
                        {sending && (
                            <div className="flex justify-start">
                                <div className="bg-slate-800 text-slate-300 text-xs px-3 py-2 rounded-xl rounded-bl-none flex items-center space-x-1">
                                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></span>
                                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-75"></span>
                                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-150"></span>
                                </div>
                            </div>
                        )}
                        {error && (
                            <div className="text-xs text-red-300 bg-red-900/30 border border-red-500/40 px-3 py-2 rounded-lg">
                                {error}
                            </div>
                        )}
                    </div>

                    <form onSubmit={handleSend} className="border-t border-slate-800 bg-slate-900/80 px-3 py-2">
                        <div className="flex items-center space-x-2">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Ask about hazards, routes, stock..."
                                className="flex-1 bg-slate-800 text-sm text-white px-3 py-2 rounded-lg border border-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                disabled={sending}
                            />
                            <button
                                type="submit"
                                disabled={sending || !input.trim()}
                                className="bg-purple-600 hover:bg-purple-500 text-white px-3 py-2 rounded-lg text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                aria-label="Send message"
                            >
                                <i className="fas fa-paper-plane"></i>
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <button
                onClick={() => setOpen((prev) => !prev)}
                className="flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded-full shadow-lg hover:shadow-purple-500/30 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                aria-expanded={open}
                aria-label="Toggle Azure chatbot"
            >
                <i className="fas fa-comments"></i>
                <span className="text-sm font-semibold">{open ? 'Hide Copilot' : 'Azure Copilot'}</span>
            </button>
        </div>
    );
};

export default FloatingChatbot;
