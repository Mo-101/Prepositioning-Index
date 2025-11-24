import React, { useState } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import InputPanel from './components/InputPanel';
import OutputPanel from './components/OutputPanel';
import Dashboard from './components/Dashboard';
import LpiPage from './components/LpiPage';
import FloatingChatbot from './components/FloatingChatbot';
import { FormData } from './types';

const App: React.FC = () => {
    const [currentView, setCurrentView] = useState<'calculator' | 'dashboard' | 'lpi'>('calculator');
    const [resultsVisible, setResultsVisible] = useState(false);
    const [formData, setFormData] = useState<FormData | null>(null);

    const handleCalculate = (data: FormData) => {
        setFormData(data);
        setResultsVisible(true);
    };

    return (
        <div className="min-h-screen flex flex-col bg-[#0f172a] text-slate-200 font-sans selection:bg-purple-500/30">
            <Header currentView={currentView} onNavigate={setCurrentView} />
            
            <main className="flex-1 py-8">
                {/* Background decoration */}
                <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-20 left-10 w-96 h-96 bg-purple-900/10 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-20 right-10 w-[500px] h-[500px] bg-blue-900/10 rounded-full blur-3xl"></div>
                </div>

                <div className="relative z-10">
                    {currentView === 'calculator' && (
                        <div className="w-full px-6 lg:px-10 max-w-full">
                             <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                <InputPanel onCalculate={handleCalculate} />
                                <OutputPanel formData={formData} isVisible={resultsVisible} />
                            </div>
                        </div>
                    )}
                    
                    {currentView === 'dashboard' && <Dashboard />}

                    {currentView === 'lpi' && <LpiPage />}
                </div>
            </main>

            <Footer />
            <FloatingChatbot />
        </div>
    );
};

export default App;
