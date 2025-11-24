import React from 'react';

interface HeaderProps {
    currentView: 'calculator' | 'dashboard' | 'lpi';
    onNavigate: (view: 'calculator' | 'dashboard' | 'lpi') => void;
}

const Header: React.FC<HeaderProps> = ({ currentView, onNavigate }) => {
    return (
        <header className="sticky top-0 z-50">
            <div className="bg-gradient-to-r from-deepcal-dark to-deepcal-purple py-4 px-6 border-b border-purple-500/30 shadow-[0_0_15px_rgba(126,34,206,0.2)]">
                <div className="w-full max-w-full flex flex-col md:flex-row justify-between items-center">
                    <div className="flex items-center space-x-3 animate-[fadeIn_0.5s_ease-in-out]">
                        <div className="w-12 h-12 bg-deepcal-purple rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(168,85,247,0.6)]">
                            <i className="fas fa-infinity text-white text-xl" aria-hidden="true"></i>
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-300 to-purple-100 leading-none">
                                DeepCAL++ vΩ
                            </h1>
                            <p className="text-[10px] text-purple-200 tracking-widest uppercase">Symbolic Logistics Engine</p>
                        </div>
                    </div>
                    
                    <div className="mt-4 md:mt-0 flex items-center space-x-4">
                        <nav className="flex bg-black/20 rounded-lg p-1 mr-4 border border-purple-500/20" role="navigation" aria-label="Main Navigation">
                            <button 
                                onClick={() => onNavigate('calculator')}
                                aria-current={currentView === 'calculator' ? 'page' : undefined}
                                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-white/50 ${currentView === 'calculator' ? 'bg-deepcal-light text-white shadow-lg' : 'text-purple-200 hover:bg-white/5'}`}
                            >
                                <i className="fas fa-calculator mr-2" aria-hidden="true"></i>
                                Oracle
                            </button>
                            <button 
                                onClick={() => onNavigate('dashboard')}
                                aria-current={currentView === 'dashboard' ? 'page' : undefined}
                                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-white/50 ${currentView === 'dashboard' ? 'bg-deepcal-light text-white shadow-lg' : 'text-purple-200 hover:bg-white/5'}`}
                            >
                                <i className="fas fa-chart-line mr-2" aria-hidden="true"></i>
                                Dashboard
                            </button>
                            <button 
                                onClick={() => onNavigate('lpi')}
                                aria-current={currentView === 'lpi' ? 'page' : undefined}
                                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-white/50 ${currentView === 'lpi' ? 'bg-deepcal-light text-white shadow-lg' : 'text-purple-200 hover:bg-white/5'}`}
                            >
                                <i className="fas fa-network-wired mr-2" aria-hidden="true"></i>
                                LPI Index
                            </button>
                        </nav>
                        
                        <div className="hidden md:flex items-center border-l border-purple-400/30 pl-4">
                            <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse mr-2" aria-hidden="true"></div>
                            <span className="text-xs font-semibold tracking-wide text-purple-200">SYSTEM ONLINE</span>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
