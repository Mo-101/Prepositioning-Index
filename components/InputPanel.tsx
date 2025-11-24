import React, { useState } from 'react';
import { FormData } from '../types';
import { AVAILABLE_FORWARDERS } from '../constants';

interface InputPanelProps {
    onCalculate: (data: FormData) => void;
}

const InputPanel: React.FC<InputPanelProps> = ({ onCalculate }) => {
    const [formData, setFormData] = useState<FormData>({
        request_reference: `SR_${new Date().getFullYear().toString().slice(2)}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}_NBO hub`,
        origin: 'Nairobi, Kenya',
        destination: 'Lusaka, Zambia',
        weight: 7850,
        volume: 24.5,
        cargoType: 'Emergency Health Kits',
        forwarders: ['Kuehne Nagel', 'DHL Global Forwarding', 'Siginon Logistics'],
        // Initial defaults for dynamic inputs
        kuehne_nagel_price: 18681,
        kuehne_nagel_days: 6,
        dhl_global_price: 33865,
        dhl_global_days: 7,
        siginon_price: 32000,
        siginon_days: 8,
        scan_global_price: 35000,
        scan_global_days: 9,
        agility_price: 37000,
        agility_days: 10
    });

    const handleInputChange = (field: keyof FormData, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleForwarderPriceChange = (forwarderId: string, field: 'price' | 'days', value: string) => {
        setFormData(prev => ({ 
            ...prev, 
            [`${forwarderId}_${field}`]: parseFloat(value) || 0 
        }));
    };

    const handleForwarderToggle = (forwarderName: string) => {
        setFormData(prev => ({
            ...prev,
            forwarders: prev.forwarders.includes(forwarderName)
                ? prev.forwarders.filter(f => f !== forwarderName)
                : [...prev.forwarders, forwarderName]
        }));
    };

    return (
        <div className="lg:col-span-1">
            <div className="h-full bg-gradient-to-br from-slate-800/80 to-slate-900/90 border border-purple-500/30 rounded-2xl p-6 shadow-xl backdrop-blur-sm">
                <h2 className="text-xl font-semibold mb-6 flex items-center text-white">
                    <i className="fas fa-shipping-fast mr-3 text-deepcal-light" aria-hidden="true"></i>
                    Shipment Configuration
                </h2>

                <div className="space-y-6">
                    {/* Route Details */}
                    <div>
                        <h3 className="font-medium mb-3 flex items-center text-slate-200">
                            <i className="fas fa-route mr-2 text-blue-400" aria-hidden="true"></i>
                            Route Details
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="origin" className="block text-xs font-mono text-slate-300 mb-1 uppercase tracking-wider">Origin</label>
                                <select 
                                    id="origin"
                                    className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-deepcal-light text-white transition-all"
                                    value={formData.origin}
                                    onChange={(e) => handleInputChange('origin', e.target.value)}
                                >
                                    <option>Nairobi, Kenya</option>
                                    <option>Dubai, UAE</option>
                                    <option>Shanghai, China</option>
                                </select>
                            </div>
                            <div>
                                <label htmlFor="destination" className="block text-xs font-mono text-slate-300 mb-1 uppercase tracking-wider">Destination</label>
                                <select 
                                    id="destination"
                                    className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-deepcal-light text-white transition-all"
                                    value={formData.destination}
                                    onChange={(e) => handleInputChange('destination', e.target.value)}
                                >
                                    <option>Lusaka, Zambia</option>
                                    <option>Johannesburg, South Africa</option>
                                    <option>Lagos, Nigeria</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Cargo Specifications */}
                    <div>
                        <h3 className="font-medium mb-3 flex items-center text-slate-200">
                            <i className="fas fa-box-open mr-2 text-yellow-400" aria-hidden="true"></i>
                            Cargo Specifications
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="weight" className="block text-xs font-mono text-slate-300 mb-1 uppercase tracking-wider">Weight (kg)</label>
                                <input
                                    id="weight"
                                    type="number"
                                    value={formData.weight}
                                    onChange={(e) => handleInputChange('weight', parseFloat(e.target.value))}
                                    className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-deepcal-light text-sm"
                                />
                            </div>
                            <div>
                                <label htmlFor="volume" className="block text-xs font-mono text-slate-300 mb-1 uppercase tracking-wider">Volume (CBM)</label>
                                <input
                                    id="volume"
                                    type="number"
                                    value={formData.volume}
                                    onChange={(e) => handleInputChange('volume', parseFloat(e.target.value))}
                                    className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-deepcal-light text-sm"
                                />
                            </div>
                        </div>
                        <div className="mt-4">
                            <label htmlFor="cargoType" className="block text-xs font-mono text-slate-300 mb-1 uppercase tracking-wider">Cargo Type</label>
                            <select 
                                id="cargoType"
                                className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-deepcal-light text-sm"
                                value={formData.cargoType}
                                onChange={(e) => handleInputChange('cargoType', e.target.value)}
                            >
                                <option>Emergency Health Kits</option>
                                <option>Pharmaceuticals</option>
                                <option>Laboratory Equipment</option>
                                <option>Cold Chain Supplies</option>
                            </select>
                        </div>
                    </div>

                    {/* Priority Weighting (Visual Only) */}
                    <div>
                        <h3 className="font-medium mb-3 flex items-center text-slate-200">
                            <i className="fas fa-balance-scale mr-2 text-purple-400" aria-hidden="true"></i>
                            Symbolic Priority Weighting
                        </h3>
                        <div className="space-y-3 bg-slate-900/50 p-3 rounded-lg border border-slate-700/50" aria-hidden="true">
                            <div>
                                <div className="flex justify-between mb-1 text-xs">
                                    <span className="text-slate-300">Time Criticality</span>
                                    <span className="text-purple-300 font-mono">68%</span>
                                </div>
                                <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                                    <div className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 w-[68%] shadow-[0_0_10px_rgba(34,211,238,0.5)]"></div>
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between mb-1 text-xs">
                                    <span className="text-slate-300">Cost Sensitivity</span>
                                    <span className="text-green-300 font-mono">45%</span>
                                </div>
                                <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                                    <div className="h-full bg-gradient-to-r from-green-400 to-emerald-500 w-[45%] shadow-[0_0_10px_rgba(52,211,153,0.5)]"></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Forwarders Selection */}
                    <fieldset>
                        <legend className="font-medium mb-3 flex items-center text-slate-200 w-full">
                            <i className="fas fa-truck-loading mr-2 text-amber-400" aria-hidden="true"></i>
                            Freight Forwarders & Pricing
                        </legend>
                        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                            {AVAILABLE_FORWARDERS.map(forwarder => (
                                <div key={forwarder.id} className="bg-slate-900/60 p-4 rounded-lg border border-slate-700 hover:border-deepcal-light/50 transition-colors">
                                    <label className="flex items-center mb-3 cursor-pointer group">
                                        <input
                                            type="checkbox"
                                            className="w-4 h-4 rounded border-slate-600 text-deepcal-light focus:ring-deepcal-light bg-slate-800 focus:ring-offset-slate-900"
                                            checked={formData.forwarders.includes(forwarder.name)}
                                            onChange={() => handleForwarderToggle(forwarder.name)}
                                        />
                                        <span className="ml-3 font-medium text-sm text-slate-200 group-hover:text-white transition-colors">{forwarder.name}</span>
                                    </label>
                                    <div className="grid grid-cols-2 gap-3 pl-7">
                                        <div>
                                            <label htmlFor={`${forwarder.id}_price`} className="block text-[10px] text-slate-400 mb-1 uppercase">Price (USD)</label>
                                            <input
                                                id={`${forwarder.id}_price`}
                                                type="number"
                                                value={formData[`${forwarder.id}_price`] || forwarder.defaultPrice}
                                                onChange={(e) => handleForwarderPriceChange(forwarder.id, 'price', e.target.value)}
                                                className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-deepcal-light focus:ring-1 focus:ring-deepcal-light"
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor={`${forwarder.id}_days`} className="block text-[10px] text-slate-400 mb-1 uppercase">Days</label>
                                            <input
                                                id={`${forwarder.id}_days`}
                                                type="number"
                                                value={formData[`${forwarder.id}_days`] || forwarder.defaultDays}
                                                onChange={(e) => handleForwarderPriceChange(forwarder.id, 'days', e.target.value)}
                                                className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-deepcal-light focus:ring-1 focus:ring-deepcal-light"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </fieldset>

                    <button
                        onClick={() => onCalculate(formData)}
                        className="w-full mt-4 bg-gradient-to-r from-deepcal-dark to-deepcal-purple hover:from-deepcal-purple hover:to-deepcal-light text-white font-semibold py-3 px-4 rounded-lg transition-all transform hover:scale-[1.02] shadow-[0_0_20px_rgba(126,34,206,0.5)] flex items-center justify-center group relative overflow-hidden focus:outline-none focus:ring-4 focus:ring-purple-500/50"
                    >
                         <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" aria-hidden="true"></div>
                        <div className="relative flex items-center">
                            <i className="fas fa-bolt mr-2 group-hover:text-yellow-300 transition-colors" aria-hidden="true"></i>
                            <span>Invoke the Ceremonial Oracle</span>
                        </div>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default InputPanel;