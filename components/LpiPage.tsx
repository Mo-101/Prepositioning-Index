import React, { useState, useEffect, useRef } from 'react';
import { LpiScenario, LpiResult } from '../types';
import { ChatMessage, generateLpiPlanWithAzure, refineLpiPlanWithAzure } from '../services/azureChatService';

const LpiPage: React.FC = () => {
    const [scenario, setScenario] = useState<LpiScenario>({
        country: 'South Sudan',
        region: 'Juba',
        disease: 'Ebola',
        severity: 'High',
        population: 10000,
        vulnerabilityGroup: 'General Population',
        season: 'Dry Season',
        infrastructure: 'Accessible (Paved)',
        localCapacity: 'Minimal (Level 1)'
    });
    const [loading, setLoading] = useState(false);
    const [loadingStage, setLoadingStage] = useState<string>('');
    const [results, setResults] = useState<LpiResult | null>(null);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('summary');

    const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
    const [modelMessages, setModelMessages] = useState<ChatMessage[]>([]);
    const [currentUserMessage, setCurrentUserMessage] = useState('');
    const [isResponding, setIsResponding] = useState(false);
    const chatHistoryRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (chatHistoryRef.current) {
            chatHistoryRef.current.scrollTop = chatHistoryRef.current.scrollHeight;
        }
    }, [chatHistory, isResponding, results, activeTab]);

    const handleInputChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
        const { name, value } = e.target;
        setScenario(prev => ({ ...prev, [name]: value }));
    };

    const handleInitialGeneration = async () => {
        setLoading(true);
        setLoadingStage('Initializing parameters...');
        setError('');
        setResults(null);
        setChatHistory([]);
        setActiveTab('summary');

        try {
            const initialUserMessage = `Generating plan for: ${scenario.severity} ${scenario.disease} in ${scenario.country} (${scenario.region}). Context: ${scenario.season}, ${scenario.infrastructure}, ${scenario.localCapacity}.`;
            setChatHistory([{ role: 'user', content: initialUserMessage }]);

            setLoadingStage('Calling Azure orchestrator...');
            const { result, messages } = await generateLpiPlanWithAzure(scenario);

            setLoadingStage('Calculating supply chain metrics...');
            setResults(result);
            setModelMessages(messages);
            setChatHistory([
                { role: 'user', content: initialUserMessage },
                { role: 'assistant', content: result?.changeSummary || 'Plan generated.' },
            ]);
        } catch (err) {
            console.error('AI Error:', err);
            setError(err instanceof Error ? err.message : 'Simulation failed. Please check your connection and try again.');
        } finally {
            setLoadingStage('');
            setLoading(false);
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUserMessage.trim()) return;

        const messageToSend = currentUserMessage;
        setChatHistory(prev => [...prev, { role: 'user', content: messageToSend }]);
        setCurrentUserMessage('');
        setIsResponding(true);
        setError('');

        try {
            const { result, messages } = await refineLpiPlanWithAzure(scenario, messageToSend, modelMessages);
            setResults(result);
            setModelMessages(messages);
            if (result?.changeSummary) {
                setChatHistory(prev => [...prev, { role: 'assistant', content: result.changeSummary }]);
            }

        } catch (err) {
            console.error("Chat Error:", err);
            setError(err instanceof Error ? err.message : 'Failed to get a response.');
        } finally {
            setIsResponding(false);
        }
    };

    return (
        <div className="w-full px-6 lg:px-10 pb-12 animate-[fadeIn_0.5s_ease-out] max-w-full">
            {/* Config Section */}
            <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 border border-purple-500/30 rounded-2xl p-8 shadow-2xl backdrop-blur-sm mb-8">
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-white mb-2 flex justify-center items-center">
                        <i className="fas fa-network-wired text-deepcal-light mr-3" aria-hidden="true"></i>
                        Logistic Prepositioning Index (LPI)
                    </h2>
                    <p className="text-purple-200/80 max-w-2xl mx-auto font-light">
                        AI-driven outbreak simulation using granular risk vectors (Seasonality, Infrastructure, Capacity).
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    {/* Basic Context */}
                    <div>
                        <label htmlFor="country" className="block text-xs font-mono text-purple-300 mb-2 uppercase tracking-wider">Country</label>
                        <select id="country" name="country" value={scenario.country} onChange={handleInputChange} className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-deepcal-light focus:border-deepcal-light">
                            {['South Sudan', 'DR Congo', 'Nigeria', 'Zambia'].map(o => <option key={o}>{o}</option>)}
                        </select>
                    </div>
                    <div>
                         <label htmlFor="region" className="block text-xs font-mono text-purple-300 mb-2 uppercase tracking-wider">Region / District</label>
                         <input id="region" type="text" name="region" value={scenario.region} onChange={handleInputChange} className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-deepcal-light placeholder-slate-500" />
                    </div>
                    <div>
                        <label htmlFor="population" className="block text-xs font-mono text-purple-300 mb-2 uppercase tracking-wider">Population at Risk</label>
                        <input id="population" type="number" name="population" value={scenario.population} onChange={handleInputChange} step="1000" className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-deepcal-light" />
                    </div>

                    {/* Threat Vectors */}
                    <div>
                        <label htmlFor="disease" className="block text-xs font-mono text-purple-300 mb-2 uppercase tracking-wider">Disease</label>
                        <select id="disease" name="disease" value={scenario.disease} onChange={handleInputChange} className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-deepcal-light">
                            {['Ebola', 'Cholera', 'Measles', 'Marburg', 'Mpox'].map(o => <option key={o}>{o}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="severity" className="block text-xs font-mono text-purple-300 mb-2 uppercase tracking-wider">Severity</label>
                        <select id="severity" name="severity" value={scenario.severity} onChange={handleInputChange} className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-deepcal-light">
                            {['Moderate', 'High', 'Critical'].map(o => <option key={o}>{o}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="vulnerabilityGroup" className="block text-xs font-mono text-purple-300 mb-2 uppercase tracking-wider">Vulnerability Group</label>
                        <select id="vulnerabilityGroup" name="vulnerabilityGroup" value={scenario.vulnerabilityGroup} onChange={handleInputChange} className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-deepcal-light">
                            {['General Population', 'Children <5', 'Elderly', 'Displaced Persons (IDPs)', 'Pregnant Women'].map(o => <option key={o}>{o}</option>)}
                        </select>
                    </div>

                    {/* Logistics Constraints (Granular Points) */}
                    <div>
                        <label htmlFor="season" className="block text-xs font-mono text-amber-300 mb-2 uppercase tracking-wider">Seasonality</label>
                        <select id="season" name="season" value={scenario.season} onChange={handleInputChange} className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-amber-500">
                            {['Dry Season', 'Rainy Season', 'Harmattan', 'Winter'].map(o => <option key={o}>{o}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="infrastructure" className="block text-xs font-mono text-amber-300 mb-2 uppercase tracking-wider">Infrastructure</label>
                        <select id="infrastructure" name="infrastructure" value={scenario.infrastructure} onChange={handleInputChange} className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-amber-500">
                            {['Accessible (Paved)', 'Remote (Unpaved)', 'Conflict Zone (Secure Escort)', 'Island/Coastal'].map(o => <option key={o}>{o}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="localCapacity" className="block text-xs font-mono text-amber-300 mb-2 uppercase tracking-wider">Local Capacity</label>
                        <select id="localCapacity" name="localCapacity" value={scenario.localCapacity} onChange={handleInputChange} className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-amber-500">
                            {['Minimal (Level 1)', 'Partial (Level 2)', 'Robust (Level 3)'].map(o => <option key={o}>{o}</option>)}
                        </select>
                    </div>
                </div>
                
                <div className="flex justify-center">
                    <button 
                        onClick={handleInitialGeneration} 
                        disabled={loading} 
                        className={`
                            px-8 py-3 rounded-lg font-bold text-white shadow-lg transition-all transform hover:scale-105 flex items-center min-w-[240px] justify-center focus:outline-none focus:ring-4 focus:ring-purple-500/50
                            ${loading ? 'bg-slate-700 cursor-wait' : 'bg-gradient-to-r from-deepcal-purple to-deepcal-light hover:shadow-purple-500/30'}
                        `}
                    >
                        {loading ? (
                            <>
                                <i className="fas fa-microchip fa-spin mr-2" aria-hidden="true"></i> 
                                {loadingStage}
                            </>
                        ) : (
                            <>
                                <i className="fas fa-play mr-2" aria-hidden="true"></i> Run Advanced Simulation
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Error Message */}
            <div aria-live="polite">
                {error && (
                    <div className="mb-8 p-4 bg-red-900/30 border border-red-500/50 rounded-lg text-red-200 text-center animate-pulse" role="alert">
                        <i className="fas fa-exclamation-triangle mr-2" aria-hidden="true"></i> {error}
                    </div>
                )}
            </div>

            {/* Results Section */}
            {results && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-[fadeIn_0.5s_ease-out]">
                    
                    {/* Left Column: Data View */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Risk & Logistics Header */}
                        <div className="bg-slate-900/50 border border-purple-500/20 rounded-xl p-5 flex flex-col md:flex-row gap-6">
                            <div className="flex-1">
                                <h3 className="text-xs text-slate-400 uppercase mb-2 font-bold tracking-wider">Risk Assessment</h3>
                                <div className="flex items-center gap-4">
                                    <div className="text-3xl font-bold text-red-400">{results.riskAssessment?.riskLevel}</div>
                                    <div className="text-sm text-slate-400">
                                        <div className="flex items-center"><i className="fas fa-virus mr-2 text-deepcal-light" aria-hidden="true"></i> R0: {results.riskAssessment?.reproductionNumberR0}</div>
                                        <div className="flex items-center"><i className="fas fa-circle-nodes mr-2 text-deepcal-light" aria-hidden="true"></i> Radius: {results.riskAssessment?.projectedSpreadRadiusKm}km</div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex-1 border-l border-slate-700/50 md:pl-6">
                                <h3 className="text-xs text-slate-400 uppercase mb-2 font-bold tracking-wider">Logistics Constraints</h3>
                                <div className="flex flex-wrap gap-2">
                                    {results.logisticsConstraints?.map((c, i) => (
                                        <span key={i} className="px-2 py-1 bg-amber-900/30 text-amber-200 text-xs rounded border border-amber-500/30">
                                            {c}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Planning Assumptions (New AI Logic Display) */}
                        {results.planningAssumptions && results.planningAssumptions.length > 0 && (
                            <div className="bg-blue-900/20 border border-blue-500/20 rounded-xl p-5">
                                <h3 className="text-xs text-blue-300 uppercase mb-2 font-bold tracking-wider flex items-center">
                                    <i className="fas fa-brain mr-2" aria-hidden="true"></i> AI Planning Logic
                                </h3>
                                <ul className="space-y-1">
                                    {results.planningAssumptions.map((assumption, i) => (
                                        <li key={i} className="text-sm text-slate-300 flex items-start">
                                            <i className="fas fa-check text-blue-500 mt-1 mr-2 text-xs" aria-hidden="true"></i>
                                            {assumption}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Summary Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="bg-slate-800/60 border border-purple-500/20 p-4 rounded-xl">
                                <div className="text-xs text-slate-400 uppercase mb-1">Total Cost</div>
                                <div className="text-xl font-bold text-green-400">
                                    ${results.budgetAnalysis?.totalCostUSD?.toLocaleString()}
                                </div>
                            </div>
                            <div className="bg-slate-800/60 border border-purple-500/20 p-4 rounded-xl">
                                <div className="text-xs text-slate-400 uppercase mb-1">Total Weight</div>
                                <div className="text-xl font-bold text-blue-400">
                                    {results.logisticsPlan?.totalWeightKg?.toLocaleString()} <span className="text-xs text-slate-500">kg</span>
                                </div>
                            </div>
                            <div className="bg-slate-800/60 border border-purple-500/20 p-4 rounded-xl">
                                <div className="text-xs text-slate-400 uppercase mb-1">Transport Mode</div>
                                <div className="text-lg font-bold text-purple-400 flex items-center">
                                    <i className={`fas ${results.logisticsPlan?.transportMode?.toLowerCase().includes('air') ? 'fa-plane' : 'fa-truck'} mr-2`} aria-hidden="true"></i>
                                    {results.logisticsPlan?.transportMode}
                                </div>
                            </div>
                            <div className="bg-slate-800/60 border border-purple-500/20 p-4 rounded-xl">
                                <div className="text-xs text-slate-400 uppercase mb-1">Est. Lead Time</div>
                                <div className="text-xl font-bold text-amber-400">
                                    {results.logisticsPlan?.estimatedLeadTimeDays} <span className="text-xs text-slate-500">days</span>
                                </div>
                            </div>
                        </div>

                        {/* Tabs Navigation */}
                        <div className="bg-slate-900/50 border-b border-purple-500/20 flex overflow-x-auto" role="tablist">
                            {['summary', 'commodities', 'budget'].map(tab => (
                                <button
                                    key={tab}
                                    role="tab"
                                    id={`tab-${tab}`} // The id attribute is used to identify the tab element.
                                    aria-selected={activeTab === tab ? 'true' : 'false'} // The aria-selected attribute indicates whether the tab is currently selected.
                                    aria-controls={`panel-${tab}`}
                                    tabIndex={activeTab === tab ? 0 : -1}
                                    onClick={() => setActiveTab(tab)}
                                    className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-deepcal-light ${
                                        activeTab === tab 
                                        ? 'border-deepcal-light text-white bg-white/5' 
                                        : 'border-transparent text-slate-400 hover:text-white hover:bg-white/5'
                                    }`}
                                >
                                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                                </button>
                            ))}
                        </div>

                        {/* Tab Content */}
                        <div className="bg-slate-800/40 border border-purple-500/10 rounded-b-xl p-6 min-h-[400px]" role="tabpanel" id={`panel-${activeTab}`} aria-labelledby={`tab-${activeTab}`}>
                            {activeTab === 'summary' && (
                                <div className="space-y-6 animate-[fadeIn_0.3s]">
                                    <div>
                                        <h3 className="text-lg font-semibold text-white mb-2">Executive Summary</h3>
                                        <p className="text-slate-300 leading-relaxed text-sm">
                                            {results.executiveSummary}
                                        </p>
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-white mb-2">Key Strategic Interventions</h3>
                                        <ul className="space-y-2">
                                            {results.keyInterventions?.map((item: string, i: number) => (
                                                <li key={i} className="flex items-start text-sm text-slate-300">
                                                    <span className="mr-2 text-deepcal-light" aria-hidden="true">•</span> {item}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'commodities' && (
                                <div className="space-y-6 animate-[fadeIn_0.3s]">
                                    {results.commodityStockpile?.map((cat, idx) => (
                                        <div key={idx} className="bg-slate-900/50 rounded-lg overflow-hidden border border-slate-700/50">
                                            <div className="px-4 py-2 bg-slate-800/80 text-xs font-bold text-purple-300 uppercase tracking-wider">
                                                {cat.category}
                                            </div>
                                            <table className="w-full text-sm text-left text-slate-300">
                                                <caption className="sr-only">List of {cat.category} commodities</caption>
                                                <thead className="text-xs text-slate-400 uppercase bg-slate-900/50">
                                                    <tr>
                                                        <th scope="col" className="px-4 py-2">Item</th>
                                                        <th scope="col" className="px-4 py-2 text-right">Qty</th>
                                                        <th scope="col" className="px-4 py-2">Unit</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-700/30">
                                                    {cat.items?.map((item, i) => (
                                                        <tr key={i} className="hover:bg-white/5">
                                                            <td className="px-4 py-2">{item.commodityName}</td>
                                                            <td className="px-4 py-2 text-right font-mono text-deepcal-light">
                                                                {item.quantity?.toLocaleString()}
                                                            </td>
                                                            <td className="px-4 py-2 text-xs text-slate-500">{item.unit}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {activeTab === 'budget' && (
                                <div className="space-y-4 animate-[fadeIn_0.3s]">
                                    <h3 className="text-lg font-semibold text-white">Estimated Budget Breakdown</h3>
                                    <div className="space-y-3">
                                        {results.budgetAnalysis?.breakdown?.map((pillar, i) => (
                                            <div key={i} className="bg-slate-900/50 p-3 rounded-lg flex justify-between items-center border border-slate-700/50 hover:border-deepcal-light/30 transition-colors">
                                                <span className="text-slate-300 text-sm">{pillar.pillar}</span>
                                                <span className="font-mono text-green-400 font-bold">
                                                    ${pillar.estimatedCostUSD?.toLocaleString()}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="mt-6 pt-4 border-t border-slate-700 flex justify-between items-center">
                                        <span className="text-white font-semibold">Total Estimated Cost</span>
                                        <span className="text-xl font-bold text-green-400">
                                            ${results.budgetAnalysis?.totalCostUSD?.toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Chat Interface */}
                    <div className="bg-slate-800/60 border border-purple-500/20 rounded-xl flex flex-col h-[600px] shadow-lg backdrop-blur-sm overflow-hidden">
                        <div className="p-4 border-b border-purple-500/20 bg-slate-900/50">
                            <h3 className="text-sm font-bold text-white flex items-center">
                                <i className="fas fa-robot mr-2 text-deepcal-light" aria-hidden="true"></i>
                                LPI Planner Assistant
                            </h3>
                            <p className="text-xs text-slate-400 mt-1">Refine the plan with natural language.</p>
                        </div>
                        
                        <div ref={chatHistoryRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-900/30 custom-scrollbar" aria-live="polite">
                            {chatHistory.length === 0 && (
                                <div className="text-center text-slate-500 text-sm mt-10 italic">
                                    Generate a plan to start the conversation...
                                </div>
                            )}
                            {chatHistory.map((msg, idx) => (
                                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`
                                        max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-md
                                        ${msg.role === 'user' 
                                            ? 'bg-deepcal-purple text-white rounded-br-none' 
                                            : 'bg-slate-700 text-slate-200 rounded-bl-none'}
                                    `}>
                                        {msg.content}
                                    </div>
                                </div>
                            ))}
                            {isResponding && (
                                <div className="flex justify-start">
                                    <div className="bg-slate-700 rounded-2xl rounded-bl-none px-4 py-3 text-sm text-slate-400 flex items-center shadow-md">
                                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce mr-1"></span>
                                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce mr-1 delay-75"></span>
                                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-150"></span>
                                        <span className="sr-only">Typing...</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        <form onSubmit={handleSendMessage} className="p-4 bg-slate-900/50 border-t border-purple-500/20">
                            <div className="relative">
                                <label htmlFor="chatInput" className="sr-only">Refine plan with AI</label>
                                <input
                                    id="chatInput"
                                    type="text"
                                    value={currentUserMessage}
                                    onChange={(e) => setCurrentUserMessage(e.target.value)}
                                    placeholder="E.g., Increase population to 20k..."
                                    className="w-full bg-slate-800 border border-slate-600 rounded-full pl-4 pr-12 py-3 text-sm text-white focus:outline-none focus:border-deepcal-light focus:ring-1 focus:ring-deepcal-light placeholder-slate-500"
                                    disabled={!results || isResponding}
                                />
                                <button
                                    type="submit"
                                    aria-label="Send message"
                                    disabled={!results || isResponding || !currentUserMessage.trim()}
                                    className="absolute right-2 top-1.5 p-1.5 bg-deepcal-light text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-deepcal-purple disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-deepcal-light"
                                >
                                    <i className="fas fa-paper-plane text-xs" aria-hidden="true"></i>
                                </button>
                            </div>
                        </form>
                    </div>

                </div>
            )}
        </div>
    );
};

export default LpiPage;
