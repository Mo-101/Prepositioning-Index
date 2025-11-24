import React, { useEffect, useRef } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const Dashboard: React.FC = () => {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<any>(null);

    // Data for charts
    const resourceData = [
        { name: 'Emergency Kits', value: 35, color: '#3b82f6' },
        { name: 'Pharma', value: 25, color: '#10b981' },
        { name: 'Lab Supplies', value: 20, color: '#8b5cf6' },
        { name: 'PPE', value: 15, color: '#f59e0b' },
        { name: 'Field Support', value: 5, color: '#ef4444' },
    ];

    const regionData = [
        { name: 'East Africa', days: 4.2 },
        { name: 'Southern Africa', days: 8.5 },
        { name: 'West Africa', days: 12.8 },
        { name: 'Central Africa', days: 10.3 },
        { name: 'Indian Ocean', days: 7.2 },
    ];

    useEffect(() => {
        if (!mapRef.current || mapInstanceRef.current) return;

        // @ts-ignore
        if (typeof window.L !== 'undefined') {
            // @ts-ignore
            const L = window.L;
            
            // Initialize map with a dark theme style
            const map = L.map(mapRef.current).setView([0, 25], 3);
            mapInstanceRef.current = map;
            
            // Using CartoDB Dark Matter tiles for the dark theme
            L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
                subdomains: 'abcd',
                maxZoom: 19
            }).addTo(map);

            const nairobi = [1.2404475, 36.990054];
            
            // Add custom styled marker
            const circleIcon = L.divIcon({
                className: 'custom-div-icon',
                html: "<div style='background-color:#a855f7; width: 12px; height: 12px; border-radius: 50%; box-shadow: 0 0 10px #a855f7; border: 2px solid white;'></div>",
                iconSize: [12, 12],
                iconAnchor: [6, 6]
            });

            L.marker(nairobi, { icon: circleIcon }).addTo(map).bindPopup("<b>Nairobi Hub</b><br>Primary Origin").openPopup();

            const destinations = [
                { name: "Zimbabwe", coords: [-17.80, 31.08] },
                { name: "Zambia", coords: [15.41, 28.31] },
                { name: "Madagascar", coords: [-14.71, 47.50] },
                { name: "Comoros", coords: [11.72, 43.24] },
                { name: "South Sudan", coords: [7.86, 29.69] }
            ];

            destinations.forEach((dest: any) => {
                const destMarker = L.divIcon({
                    className: 'custom-div-icon',
                    html: "<div style='background-color:#3b82f6; width: 8px; height: 8px; border-radius: 50%; box-shadow: 0 0 5px #3b82f6;'></div>",
                    iconSize: [8, 8],
                    iconAnchor: [4, 4]
                });
                
                L.marker(dest.coords, { icon: destMarker }).addTo(map).bindPopup(dest.name);
                
                // Draw arc (simple line for now)
                L.polyline([nairobi, dest.coords], {
                    color: '#a855f7',
                    weight: 1,
                    opacity: 0.5,
                    dashArray: '5, 10'
                }).addTo(map);
            });
        }
    }, []);

    return (
        <div className="w-full px-6 lg:px-10 pb-12 animate-[fadeIn_0.5s_ease-out] max-w-full">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {[
                    { title: 'Total Shipments', value: '87', icon: 'fa-truck-loading', color: 'text-blue-400', bg: 'bg-blue-500/10', trend: '+32%', trendUp: true },
                    { title: 'Active Shipments', value: '15', icon: 'fa-shipping-fast', color: 'text-orange-400', bg: 'bg-orange-500/10', trend: '5 Urgent', trendUp: null },
                    { title: 'Avg. Delivery', value: '9.4d', icon: 'fa-stopwatch', color: 'text-purple-400', bg: 'bg-purple-500/10', trend: '-12%', trendUp: false },
                    { title: 'Accuracy', value: '96.2%', icon: 'fa-bullseye', color: 'text-green-400', bg: 'bg-green-500/10', trend: 'AI Optimized', trendUp: true }
                ].map((stat, idx) => (
                    <div key={idx} className="bg-slate-900/60 border border-purple-500/20 rounded-xl p-6 shadow-[0_0_15px_rgba(126,34,206,0.1)] backdrop-blur-sm hover:-translate-y-1 transition-transform duration-300">
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="text-slate-400 text-sm">{stat.title}</p>
                                <p className="text-3xl font-bold text-white mt-1">{stat.value}</p>
                            </div>
                            <div className={`w-12 h-12 rounded-full ${stat.bg} flex items-center justify-center`}>
                                <i className={`fas ${stat.icon} ${stat.color} text-xl`}></i>
                            </div>
                        </div>
                        <div className="mt-4 flex items-center text-xs">
                            {stat.trendUp === true && <span className="text-green-400 mr-2"><i className="fas fa-arrow-up"></i> {stat.trend}</span>}
                            {stat.trendUp === false && <span className="text-green-400 mr-2"><i className="fas fa-arrow-down"></i> {stat.trend}</span>}
                            {stat.trendUp === null && <span className="text-blue-400 mr-2"><i className="fas fa-clock"></i> {stat.trend}</span>}
                            <span className="text-slate-500">vs last month</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Map & Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* Map */}
                <div className="lg:col-span-2 bg-slate-900/60 border border-purple-500/20 rounded-xl p-6 shadow-lg backdrop-blur-sm flex flex-col">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-semibold text-white flex items-center">
                            <i className="fas fa-globe-africa mr-2 text-deepcal-light"></i>
                            Live Global Tracking
                        </h2>
                        <div className="flex space-x-2">
                             <span className="flex h-2 w-2 relative">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                            </span>
                            <span className="text-xs text-green-400 font-mono">LIVE FEED</span>
                        </div>
                    </div>
                    <div id="map" ref={mapRef} className="flex-1 min-h-[400px] w-full rounded-lg overflow-hidden border border-slate-700/50"></div>
                </div>

                {/* Status & Distribution */}
                <div className="flex flex-col space-y-6">
                    {/* Status Bars */}
                    <div className="bg-slate-900/60 border border-purple-500/20 rounded-xl p-6 shadow-lg backdrop-blur-sm">
                        <h2 className="text-lg font-semibold text-white mb-4">Delivery Status</h2>
                        <div className="space-y-4">
                            {[
                                { label: 'Delivered', count: 72, total: 87, color: 'bg-emerald-500' },
                                { label: 'In Transit', count: 12, total: 87, color: 'bg-amber-500' },
                                { label: 'Pending', count: 3, total: 87, color: 'bg-purple-500' }
                            ].map((status) => (
                                <div key={status.label}>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-slate-300">{status.label}</span>
                                        <span className="font-bold text-white">{status.count}</span>
                                    </div>
                                    <div className="w-full bg-slate-800 rounded-full h-2">
                                        <div className={`h-2 rounded-full ${status.color}`} style={{ width: `${(status.count / status.total) * 100}%` }}></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Donut Chart */}
                    <div className="bg-slate-900/60 border border-purple-500/20 rounded-xl p-6 shadow-lg backdrop-blur-sm flex-1">
                        <h2 className="text-lg font-semibold text-white mb-2">Resource Allocation</h2>
                        <div className="h-[200px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={resourceData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={50}
                                        outerRadius={70}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {resourceData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                                        ))}
                                    </Pie>
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: '#1e293b', borderColor: '#7e22ce', color: '#f8fafc', borderRadius: '8px' }}
                                        itemStyle={{ color: '#e2e8f0' }}
                                    />
                                    <Legend iconSize={8} wrapperStyle={{ fontSize: '12px', color: '#94a3b8' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Row: AI & Table */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* AI Insight Panel (Converted to React/DeepCAL Theme) */}
                <div className="lg:col-span-3 bg-gradient-to-r from-blue-900/40 to-deepcal-purple/40 border border-purple-500/30 rounded-xl p-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <i className="fas fa-brain text-9xl text-white"></i>
                    </div>
                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
                        <div>
                            <div className="flex items-center space-x-3 mb-2">
                                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center animate-pulse">
                                    <i className="fas fa-robot text-deepcal-light"></i>
                                </div>
                                <h2 className="text-xl font-bold text-white">DeepCAL AI Insights</h2>
                            </div>
                            <p className="text-blue-200 text-sm">Real-time logistics intelligence for optimal resource deployment</p>
                        </div>
                        <button className="mt-4 md:mt-0 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white text-sm font-semibold transition flex items-center">
                            Generate Report <i className="fas fa-arrow-right ml-2"></i>
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
                        {[
                            { label: 'Prediction Accuracy', value: '94.6%', icon: 'fa-chart-line', change: '+2.3%', good: true },
                            { label: 'Risk Prediction', value: 'Medium', icon: 'fa-exclamation-triangle', desc: '12 delayed' },
                            { label: 'Cost Optimization', value: '$24,500', icon: 'fa-dollar-sign', desc: 'Est. Savings' }
                        ].map((insight, i) => (
                            <div key={i} className="bg-black/20 rounded-lg p-4 border border-white/5 backdrop-blur-sm">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="text-slate-300 text-sm font-medium">{insight.label}</h3>
                                    <i className={`fas ${insight.icon} text-deepcal-light opacity-70`}></i>
                                </div>
                                <p className="text-2xl font-bold text-white">{insight.value}</p>
                                <div className="mt-2 text-xs text-slate-400">
                                    {insight.good && <span className="text-green-400 mr-1"><i className="fas fa-arrow-up"></i> {insight.change}</span>}
                                    {insight.desc}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Table Section */}
                <div className="lg:col-span-2 bg-slate-900/60 border border-purple-500/20 rounded-xl p-6 shadow-lg backdrop-blur-sm">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-lg font-semibold text-white">Recent Emergency Shipments</h2>
                        <div className="relative">
                            <input type="text" placeholder="Search ref..." className="bg-slate-800 border border-slate-600 text-white text-sm rounded-lg focus:ring-deepcal-light focus:border-deepcal-light block pl-9 p-2 w-40" />
                            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                <i className="fas fa-search text-slate-500 text-xs"></i>
                            </div>
                        </div>
                    </div>
                    
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-slate-400">
                            <thead className="text-xs text-slate-300 uppercase bg-slate-800/50">
                                <tr>
                                    <th className="px-4 py-3">Ref</th>
                                    <th className="px-4 py-3">Origin</th>
                                    <th className="px-4 py-3">Dest</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3">Mode</th>
                                </tr>
                            </thead>
                            <tbody>
                                {[
                                    { ref: 'SR_24-001', orig: 'Kenya', dest: 'Zimbabwe', status: 'Delivered', mode: 'Air', sCol: 'text-green-400', bg: 'bg-green-900/20' },
                                    { ref: 'SR_24-002', orig: 'Kenya', dest: 'Zambia', status: 'Delivered', mode: 'Air', sCol: 'text-green-400', bg: 'bg-green-900/20' },
                                    { ref: 'SR_24-005', orig: 'Kenya', dest: 'Zimbabwe', status: 'Transit', mode: 'Sea', sCol: 'text-amber-400', bg: 'bg-amber-900/20' },
                                    { ref: 'SR_24-008', orig: 'Kenya', dest: 'Madagascar', status: 'Delivered', mode: 'Air', sCol: 'text-green-400', bg: 'bg-green-900/20' },
                                    { ref: 'SR_24-047', orig: 'Kenya', dest: 'Chad', status: 'Transit', mode: 'Air', sCol: 'text-amber-400', bg: 'bg-amber-900/20' },
                                ].map((row, i) => (
                                    <tr key={i} className="border-b border-slate-700/50 hover:bg-slate-800/50">
                                        <td className="px-4 py-3 font-mono text-purple-300">{row.ref}</td>
                                        <td className="px-4 py-3">{row.orig}</td>
                                        <td className="px-4 py-3">{row.dest}</td>
                                        <td className="px-4 py-3">
                                            <span className={`${row.bg} ${row.sCol} text-xs font-medium px-2 py-0.5 rounded border border-transparent`}>{row.status}</span>
                                        </td>
                                        <td className="px-4 py-3 flex items-center">
                                            <i className={`fas ${row.mode === 'Air' ? 'fa-plane' : 'fa-ship'} mr-2 opacity-70`}></i>
                                            {row.mode}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Regional Chart */}
                <div className="bg-slate-900/60 border border-purple-500/20 rounded-xl p-6 shadow-lg backdrop-blur-sm">
                    <h2 className="text-lg font-semibold text-white mb-4">Regional Lag</h2>
                    <div className="h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={regionData} layout="vertical">
                                <XAxis type="number" stroke="#94a3b8" fontSize={10} hide />
                                <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={11} width={80} />
                                <Tooltip 
                                    cursor={{fill: 'rgba(255,255,255,0.05)'}}
                                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#7e22ce', color: '#f8fafc' }}
                                />
                                <Bar dataKey="days" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Dashboard;
