import React from 'react';

const Footer: React.FC = () => {
    return (
        <footer className="py-6 px-6 lg:px-10 border-t border-slate-700 mt-8 bg-slate-900/50 backdrop-blur-sm">
            <div className="w-full max-w-full text-center">
                <div className="flex flex-col md:flex-row justify-center items-center space-y-3 md:space-y-0 md:space-x-8 text-sm text-slate-400">
                    <div className="flex items-center hover:text-deepcal-light transition-colors cursor-help">
                        <i className="fas fa-brain text-deepcal-light mr-2"></i>
                        PHASE I – Simulated Symbolic Engine
                    </div>
                    <div className="flex items-center hover:text-deepcal-light transition-colors cursor-help">
                        <i className="fas fa-chart-network text-deepcal-light mr-2"></i>
                        PHASE II – Visual Dashboard
                    </div>
                    <div className="flex items-center hover:text-deepcal-light transition-colors cursor-help">
                        <i className="fas fa-wave-square text-deepcal-light mr-2"></i>
                        PHASE III – DeepTalk Voice (Q3 2025)
                    </div>
                    <div className="flex items-center hover:text-deepcal-light transition-colors cursor-help">
                        <i className="fas fa-bolt text-deepcal-light mr-2"></i>
                        PHASE IV – Live Shipment Integration (Q4 2025)
                    </div>
                </div>
                <div className="mt-6 text-xs text-slate-600 font-mono">
                    © 2025 DeepCAL++ Technologies • The First Symbolic Logistical Intelligence Engine • 🔱
                </div>
            </div>
        </footer>
    );
};

export default Footer;
